// Admin API Service
const API_BASE = 'https://www.upki.ai/api/admin';
const ADMIN_KEY = 'upki2024admin';

export interface VideoJob {
  id: string;
  user_id: string | null;
  status: string;
  created_at: string;
  completed_at?: string;
  topic?: string;
  video_url?: string;
  duration?: number;
  error_message?: string;
}

export interface VideoStats {
  total: number;
  completed: number;
  failed: number;
  pending: number;
}

export interface UserStats {
  email: string;
  videoCount: number;
  completedCount: number;
  failedCount: number;
  lastActive: string;
  source?: 'video_jobs' | 'legacy' | 'both';
}

export interface AuthUser {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
  email_confirmed_at: string | null;
  provider: string;
}

export interface AuthUserStats {
  total: number;
  emailConfirmed: number;
  googleProvider: number;
  emailProvider: number;
  recentSignIns: number;
}

export interface DailyStats {
  date: string;
  videos: number;
}

// Analytics interfaces
export interface AnalyticsMetrics {
  users: number;
  sessions: number;
  pageviews: number;
  avgSessionDuration: number;
}

export interface AnalyticsData {
  configured: boolean;
  realtime: {
    activeUsers: number;
  };
  today: AnalyticsMetrics;
  last7Days: AnalyticsMetrics;
  last30Days: AnalyticsMetrics;
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

export interface AdminData {
  videoJobs: VideoJob[];
  legacyJobs: VideoJob[];
  videoStats: VideoStats;
  legacyStats: VideoStats;
  userStats: UserStats[];
  dailyStats: DailyStats[];
  authUsers: AuthUser[];
  authUserStats: AuthUserStats;
}

export async function fetchAdminData(): Promise<AdminData> {
  const response = await fetch(`${API_BASE}/data`, {
    method: 'GET',
    headers: {
      'x-admin-key': ADMIN_KEY,
    },
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.status}`);
  }

  const result = await response.json();
  if (!result.success) {
    throw new Error(result.error || 'Failed to fetch data');
  }

  return {
    videoJobs: result.data.videoJobs || [],
    legacyJobs: result.data.legacyJobs || [],
    videoStats: result.data.videoStats || { total: 0, completed: 0, failed: 0, pending: 0 },
    legacyStats: result.data.legacyStats || { total: 0, completed: 0, failed: 0, pending: 0 },
    userStats: result.data.userStats || [],
    dailyStats: result.data.dailyStats || [],
    authUsers: result.data.authUsers || [],
    authUserStats: result.data.authUserStats || {
      total: 0,
      emailConfirmed: 0,
      googleProvider: 0,
      emailProvider: 0,
      recentSignIns: 0,
    },
  };
}

export async function fetchAnalytics(): Promise<AnalyticsData | null> {
  try {
    const response = await fetch(`${API_BASE}/analytics`, {
      method: 'GET',
      headers: {
        'x-admin-key': ADMIN_KEY,
      },
    });

    if (!response.ok) {
      console.error('Analytics API error:', response.status);
      return null;
    }

    const result = await response.json();
    if (!result.success) {
      console.log('Analytics not configured:', result.error);
      return { configured: false } as AnalyticsData;
    }

    return {
      configured: true,
      ...result.data,
    };
  } catch (error) {
    console.error('Failed to fetch analytics:', error);
    return null;
  }
}
