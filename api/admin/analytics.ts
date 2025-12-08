import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Admin Analytics API Endpoint
 * Fetches Google Analytics data using the GA4 Data API
 * Endpoint: GET /api/admin/analytics
 *
 * Requires environment variables:
 * - GA_PROPERTY_ID: Google Analytics 4 property ID (numeric, e.g., "123456789")
 * - GA_CLIENT_EMAIL: Service account email
 * - GA_PRIVATE_KEY: Service account private key (with \n for newlines)
 */

const ADMIN_PASSWORD = 'upki2024admin';

// Google Analytics Data API v1 endpoint
const GA_API_URL = 'https://analyticsdata.googleapis.com/v1beta';

interface GACredentials {
  client_email: string;
  private_key: string;
}

interface AnalyticsData {
  realtime: {
    activeUsers: number;
  };
  today: {
    users: number;
    sessions: number;
    pageviews: number;
    avgSessionDuration: number;
  };
  last7Days: {
    users: number;
    sessions: number;
    pageviews: number;
    avgSessionDuration: number;
  };
  last30Days: {
    users: number;
    sessions: number;
    pageviews: number;
    avgSessionDuration: number;
  };
  topPages: Array<{
    path: string;
    pageviews: number;
    users: number;
  }>;
  topCountries: Array<{
    country: string;
    users: number;
  }>;
  dailyData: Array<{
    date: string;
    users: number;
    sessions: number;
    pageviews: number;
  }>;
}

// Create JWT for Google API authentication
async function createJWT(credentials: GACredentials): Promise<string> {
  const header = {
    alg: 'RS256',
    typ: 'JWT',
  };

  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: credentials.client_email,
    sub: credentials.client_email,
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600, // 1 hour
    scope: 'https://www.googleapis.com/auth/analytics.readonly',
  };

  const base64Header = Buffer.from(JSON.stringify(header)).toString('base64url');
  const base64Payload = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signatureInput = `${base64Header}.${base64Payload}`;

  // Import crypto for signing
  const crypto = await import('crypto');
  const sign = crypto.createSign('RSA-SHA256');
  sign.update(signatureInput);
  const signature = sign.sign(credentials.private_key, 'base64url');

  return `${signatureInput}.${signature}`;
}

// Exchange JWT for access token
async function getAccessToken(credentials: GACredentials): Promise<string> {
  const jwt = await createJWT(credentials);

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to get access token: ${error}`);
  }

  const data = await response.json();
  return data.access_token;
}

// Run a GA4 report
async function runReport(
  propertyId: string,
  accessToken: string,
  dateRange: { startDate: string; endDate: string },
  metrics: string[],
  dimensions?: string[]
): Promise<any> {
  const body: any = {
    dateRanges: [dateRange],
    metrics: metrics.map((m) => ({ name: m })),
  };

  if (dimensions && dimensions.length > 0) {
    body.dimensions = dimensions.map((d) => ({ name: d }));
  }

  const response = await fetch(
    `${GA_API_URL}/properties/${propertyId}:runReport`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`GA Report failed: ${error}`);
  }

  return response.json();
}

// Get realtime data
async function getRealtimeData(
  propertyId: string,
  accessToken: string
): Promise<number> {
  const response = await fetch(
    `${GA_API_URL}/properties/${propertyId}:runRealtimeReport`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        metrics: [{ name: 'activeUsers' }],
      }),
    }
  );

  if (!response.ok) {
    // Realtime API might not be available for all properties
    console.warn('Realtime API not available');
    return 0;
  }

  const data = await response.json();
  return parseInt(data.rows?.[0]?.metricValues?.[0]?.value || '0', 10);
}

// Parse GA report rows
function parseMetrics(report: any): { users: number; sessions: number; pageviews: number; avgSessionDuration: number } {
  if (!report.rows || report.rows.length === 0) {
    return { users: 0, sessions: 0, pageviews: 0, avgSessionDuration: 0 };
  }

  const values = report.rows[0].metricValues;
  return {
    users: parseInt(values[0]?.value || '0', 10),
    sessions: parseInt(values[1]?.value || '0', 10),
    pageviews: parseInt(values[2]?.value || '0', 10),
    avgSessionDuration: parseFloat(values[3]?.value || '0'),
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-admin-key');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  // Verify admin password
  const adminKey = req.headers['x-admin-key'];
  if (adminKey !== ADMIN_PASSWORD) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  // Check for required environment variables (trim to remove accidental trailing newlines)
  const propertyId = process.env.GA_PROPERTY_ID?.trim();
  const clientEmail = process.env.GA_CLIENT_EMAIL?.trim();
  const rawKey = process.env.GA_PRIVATE_KEY || '';

  // Handle multiple key formats:
  // 1. JSON-style escaped: \\n -> actual newline
  // 2. Already has actual newlines: leave as is
  // 3. Hybrid: has both (from pipe to env add)
  let privateKey = rawKey;
  // First, convert any literal \n to actual newlines
  if (privateKey.includes('\\n')) {
    privateKey = privateKey.replace(/\\n/g, '\n');
  }
  // Trim any extra trailing whitespace
  privateKey = privateKey.trim();
  // Ensure it ends with a newline (required for PEM format)
  if (!privateKey.endsWith('\n')) {
    privateKey = privateKey + '\n';
  }

  if (!propertyId || !clientEmail || !privateKey) {
    return res.status(200).json({
      success: false,
      error: 'Google Analytics not configured',
      configured: false,
      missingKeys: {
        propertyId: !propertyId,
        clientEmail: !clientEmail,
        privateKey: !privateKey,
      },
      instructions: {
        step1: 'Go to Google Cloud Console and create a service account',
        step2: 'Enable the Google Analytics Data API',
        step3: 'Download the service account JSON key',
        step4: 'Add the service account email as a Viewer in GA4 property',
        step5: 'Set environment variables in Vercel: GA_PROPERTY_ID, GA_CLIENT_EMAIL, GA_PRIVATE_KEY',
      },
    });
  }

  try {
    const credentials: GACredentials = {
      client_email: clientEmail,
      private_key: privateKey,
    };

    // Get access token
    const accessToken = await getAccessToken(credentials);

    // Get today's date and calculate date ranges
    const today = new Date();
    const formatDate = (d: Date) => d.toISOString().split('T')[0];

    const todayStr = formatDate(today);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Standard metrics to fetch
    const metrics = ['totalUsers', 'sessions', 'screenPageViews', 'averageSessionDuration'];

    // Run all reports in parallel
    const [
      realtimeUsers,
      todayReport,
      last7DaysReport,
      last30DaysReport,
      topPagesReport,
      topCountriesReport,
      dailyReport,
    ] = await Promise.all([
      getRealtimeData(propertyId, accessToken),
      runReport(propertyId, accessToken, { startDate: todayStr, endDate: todayStr }, metrics),
      runReport(propertyId, accessToken, { startDate: formatDate(sevenDaysAgo), endDate: todayStr }, metrics),
      runReport(propertyId, accessToken, { startDate: formatDate(thirtyDaysAgo), endDate: todayStr }, metrics),
      runReport(propertyId, accessToken, { startDate: formatDate(sevenDaysAgo), endDate: todayStr }, ['screenPageViews', 'totalUsers'], ['pagePath']),
      runReport(propertyId, accessToken, { startDate: formatDate(thirtyDaysAgo), endDate: todayStr }, ['totalUsers'], ['country']),
      runReport(propertyId, accessToken, { startDate: formatDate(thirtyDaysAgo), endDate: todayStr }, ['totalUsers', 'sessions', 'screenPageViews'], ['date']),
    ]);

    // Parse top pages
    const topPages = (topPagesReport.rows || [])
      .slice(0, 10)
      .map((row: any) => ({
        path: row.dimensionValues[0].value,
        pageviews: parseInt(row.metricValues[0].value, 10),
        users: parseInt(row.metricValues[1].value, 10),
      }));

    // Parse top countries
    const topCountries = (topCountriesReport.rows || [])
      .slice(0, 10)
      .map((row: any) => ({
        country: row.dimensionValues[0].value,
        users: parseInt(row.metricValues[0].value, 10),
      }));

    // Parse daily data
    const dailyData = (dailyReport.rows || [])
      .map((row: any) => ({
        date: row.dimensionValues[0].value, // Format: YYYYMMDD
        users: parseInt(row.metricValues[0].value, 10),
        sessions: parseInt(row.metricValues[1].value, 10),
        pageviews: parseInt(row.metricValues[2].value, 10),
      }))
      .sort((a: any, b: any) => a.date.localeCompare(b.date));

    const analyticsData: AnalyticsData = {
      realtime: {
        activeUsers: realtimeUsers,
      },
      today: parseMetrics(todayReport),
      last7Days: parseMetrics(last7DaysReport),
      last30Days: parseMetrics(last30DaysReport),
      topPages,
      topCountries,
      dailyData,
    };

    return res.status(200).json({
      success: true,
      configured: true,
      data: analyticsData,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Analytics API error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch analytics data',
    });
  }
}
