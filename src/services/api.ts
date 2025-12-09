// Admin API Service
// Data API still uses upki.ai (database is there)
const DATA_API_BASE = 'https://www.upki.ai/api/admin';
// Analytics API uses local endpoint (GA4 credentials are here)
const ANALYTICS_API_BASE = '/api/admin';
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

// Realtime monitoring interfaces
export interface TaskProgress {
  current_scene: number;
  total_scenes: number;
  stage: string;
  percentage: number;
}

export interface RealtimeTask {
  task_id: string;
  topic: string;
  user_id: string | null;
  status: string;
  created_at: string;
  started_at?: string;
  completed_at?: string;
  progress?: TaskProgress;
  error?: string;
}

export interface WorkerStats {
  [workerName: string]: {
    active_tasks: number;
    reserved_tasks: number;
    status: string;
  } | { error: string };
}

export interface RealtimeData {
  success: boolean;
  timestamp: string;
  data: {
    processing_tasks: RealtimeTask[];
    queued_tasks: RealtimeTask[];
    recent_submissions: RealtimeTask[];
    worker_stats: WorkerStats;
    system_stats: {
      total_tasks_in_redis: number;
      processing: number;
      queued: number;
      completed: number;
      failed: number;
    };
  };
}

// System Status interfaces
export interface VersionInfo {
  production: string;
  built: string[];
  frontend: string;
}

export interface HealthScore {
  overall: number;
  stability: number;
  scalability: number;
  reliability: number;
  resource_efficiency: number;
  high_availability: number;
}

export interface ClusterInfo {
  nodes: number;
  api_pods: number;
  worker_pods: number;
  redis_status: string;
}

export interface PerformanceMetrics {
  avg_processing_time_minutes: number;
  avg_video_duration_seconds: number;
  success_rate_percentage: number;
  last_24h_tasks: number;
}

export interface MaintenanceWindow {
  date: string;
  time_utc: string;
  impact: string;
  region: string;
}

export interface SystemStatus {
  version: VersionInfo;
  health: HealthScore;
  cluster: ClusterInfo;
  performance: PerformanceMetrics;
  maintenance_windows: MaintenanceWindow[];
  last_updated: string;
}

export async function fetchAdminData(): Promise<AdminData> {
  const response = await fetch(`${DATA_API_BASE}/data`, {
    method: 'GET',
    headers: {
      'x-admin-key': ADMIN_KEY,
    },
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.status}`);
  }

  const result = await response.json();
  console.log('API Response:', JSON.stringify(result, null, 2));
  if (!result.success) {
    throw new Error(result.error || 'Failed to fetch data');
  }

  console.log('authUserStats:', result.data.authUserStats);
  console.log('authUsers count:', result.data.authUsers?.length);

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
    const response = await fetch(`${ANALYTICS_API_BASE}/analytics`, {
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

// Backend API for realtime monitoring
const BACKEND_API_BASE = 'https://api.upki.ai';

export async function fetchRealtimeData(): Promise<RealtimeData | null> {
  try {
    const response = await fetch(`${BACKEND_API_BASE}/api/v1/admin/realtime`, {
      method: 'GET',
      headers: {
        'X-Admin-API-Key': ADMIN_KEY,
      },
    });

    if (!response.ok) {
      if (response.status === 503) {
        console.log('Realtime API not configured on backend');
        return null;
      }
      console.error('Realtime API error:', response.status);
      return null;
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Failed to fetch realtime data:', error);
    return null;
  }
}

export async function fetchSystemStatus(): Promise<SystemStatus> {
  try {
    const response = await fetch(`${BACKEND_API_BASE}/api/v1/admin/system-status`, {
      method: 'GET',
      headers: {
        'X-Admin-API-Key': ADMIN_KEY,
      },
    });

    if (!response.ok) {
      // Fallback to static data if endpoint not available
      return getStaticSystemStatus();
    }

    const result = await response.json();
    return result.data;
  } catch (error) {
    console.log('Using static system status data');
    return getStaticSystemStatus();
  }
}

// Static system status based on latest known state
function getStaticSystemStatus(): SystemStatus {
  return {
    version: {
      production: 'v1.0.30',
      built: ['v1.0.31 (720p default + preStop fix)', 'v1.0.32 (Diagnostic logging)'],
      frontend: 'v1.3.x',
    },
    health: {
      overall: 72,
      stability: 75,
      scalability: 65,
      reliability: 60,
      resource_efficiency: 40,
      high_availability: 85,
    },
    cluster: {
      nodes: 4,
      api_pods: 2,
      worker_pods: 4,
      redis_status: 'Running',
    },
    performance: {
      avg_processing_time_minutes: 12.4,
      avg_video_duration_seconds: 114,
      success_rate_percentage: 92,
      last_24h_tasks: 15,
    },
    maintenance_windows: [
      {
        date: '2025-12-09',
        time_utc: '09:00-12:00',
        impact: 'Control plane CRUD operations may be delayed',
        region: 'NYC3',
      },
      {
        date: '2025-12-10',
        time_utc: '18:00-20:00',
        impact: 'Two 10-second disruption periods',
        region: 'All Regions',
      },
    ],
    last_updated: new Date().toISOString(),
  };
}
