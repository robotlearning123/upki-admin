import { useState, useEffect, useCallback } from 'react';
import { fetchAdminData, fetchAnalytics, fetchRealtimeData } from './services/api';
import type { AdminData, VideoJob, AnalyticsData, RealtimeData } from './services/api';

const REFRESH_INTERVAL = 10000; // 10 seconds for real-time updates
const ADMIN_PASSWORD = 'upki2024admin';
const AUTH_KEY = 'upki_admin_auth';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem(AUTH_KEY) === 'true';
  });
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const [data, setData] = useState<AdminData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'videos' | 'analytics' | 'realtime'>('overview');
  const [selectedVideo, setSelectedVideo] = useState<VideoJob | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [realtime, setRealtime] = useState<RealtimeData | null>(null);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      localStorage.setItem(AUTH_KEY, 'true');
      setLoginError('');
    } else {
      setLoginError('Invalid password');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem(AUTH_KEY);
  };

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [result, analyticsResult, realtimeResult] = await Promise.all([
        fetchAdminData(),
        fetchAnalytics(),
        fetchRealtimeData(),
      ]);
      setData(result);
      setAnalytics(analyticsResult);
      setRealtime(realtimeResult);
      setLastRefresh(new Date());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Auto refresh
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(loadData, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [autoRefresh, loadData]);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatRelativeTime = (dateStr: string) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return formatDate(dateStr);
  };

  const isNewUser = (dateStr: string) => {
    if (!dateStr) return false;
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    return diffMs < 24 * 60 * 60 * 1000; // Within 24 hours
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '-';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Login Screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-600 rounded-xl flex items-center justify-center text-3xl mx-auto mb-4">
              🔐
            </div>
            <h1 className="text-2xl font-bold text-white">UPKI Admin</h1>
            <p className="text-gray-400 text-sm mt-2">Enter password to access dashboard</p>
          </div>
          <form onSubmit={handleLogin}>
            <div className="mb-4">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                autoFocus
              />
            </div>
            {loginError && (
              <p className="text-red-400 text-sm mb-4">{loginError}</p>
            )}
            <button
              type="submit"
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
            >
              Login
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (!data && loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-400">Loading admin data...</p>
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center bg-red-900/20 p-8 rounded-xl border border-red-700">
          <p className="text-red-400 text-xl mb-4">Error: {error}</p>
          <button
            onClick={loadData}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-xl">
                📊
              </div>
              <div>
                <h1 className="text-xl font-bold">UPKI Admin</h1>
                <p className="text-xs text-gray-400">Real-time Dashboard</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  className="rounded"
                />
                Auto (10s)
              </label>
              <button
                onClick={loadData}
                disabled={loading}
                className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm flex items-center gap-2"
              >
                {loading ? '...' : '🔄'} Refresh
              </button>
              <button
                onClick={handleLogout}
                className="px-3 py-1.5 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg text-sm"
              >
                Logout
              </button>
            </div>
          </div>
          {lastRefresh && (
            <p className="text-xs text-gray-500 mt-2">
              Last updated: {lastRefresh.toLocaleTimeString()}
              {loading && <span className="ml-2 text-blue-400">Refreshing...</span>}
            </p>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
          <StatCard
            icon="👤"
            label="Registered"
            value={data?.authUserStats.total || 0}
            sublabel={`${data?.authUsers?.filter(u => isNewUser(u.created_at)).length || 0} new today`}
            color="blue"
          />
          <StatCard
            icon="🎬"
            label="Total Videos"
            value={data?.videoStats.total || 0}
            color="purple"
          />
          <StatCard
            icon="✅"
            label="Completed"
            value={data?.videoStats.completed || 0}
            color="green"
          />
          <StatCard
            icon="❌"
            label="Failed"
            value={data?.videoStats.failed || 0}
            color="red"
          />
          <StatCard
            icon="⏳"
            label="Pending"
            value={data?.videoStats.pending || 0}
            color="yellow"
          />
          <StatCard
            icon="📦"
            label="Legacy"
            value={data?.legacyStats.total || 0}
            color="orange"
          />
        </div>

        {/* Success Rate */}
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-5 mb-8">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium">Success Rate</h3>
            <span className="text-2xl font-bold text-green-400">
              {data?.videoStats.total
                ? Math.round((data.videoStats.completed / data.videoStats.total) * 100)
                : 0}%
            </span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
            <div
              className="bg-green-500 h-full transition-all duration-500"
              style={{
                width: `${
                  data?.videoStats.total
                    ? (data.videoStats.completed / data.videoStats.total) * 100
                    : 0
                }%`,
              }}
            ></div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
          <div className="border-b border-gray-700 flex">
            {(['overview', 'users', 'videos', 'analytics', 'realtime'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab
                    ? 'border-blue-500 text-blue-400'
                    : 'border-transparent text-gray-400 hover:text-white'
                }`}
              >
                {tab === 'overview' && '📈 Overview'}
                {tab === 'users' && `👥 Users (${data?.authUserStats.total || 0})`}
                {tab === 'videos' && `🎬 Videos (${data?.videoStats.total || 0})`}
                {tab === 'analytics' && `📊 Analytics${analytics?.realtime ? ` (${analytics.realtime.activeUsers} live)` : ''}`}
                {tab === 'realtime' && `⚡ Realtime${realtime?.data?.system_stats ? ` (${realtime.data.system_stats.processing} active)` : ''}`}
              </button>
            ))}
          </div>

          <div className="p-6">
            {activeTab === 'overview' && data && (
              <div>
                {/* Daily Activity */}
                <h3 className="text-lg font-semibold mb-4">Last 14 Days Activity</h3>
                <div className="grid grid-cols-7 gap-2 mb-8">
                  {data.dailyStats.map((day) => (
                    <div key={day.date} className="text-center">
                      <div className="text-xs text-gray-500 mb-2">
                        {new Date(day.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short' })}
                      </div>
                      <div className={`rounded-lg p-3 ${day.videos > 0 ? 'bg-blue-600/30' : 'bg-gray-700/50'}`}>
                        <div className={`text-lg font-bold ${day.videos > 0 ? 'text-blue-400' : 'text-gray-500'}`}>
                          {day.videos}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(day.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Auth Stats */}
                <h3 className="text-lg font-semibold mb-4">Auth Statistics</h3>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="bg-green-600/20 rounded-lg p-4 border border-green-700/50">
                    <p className="text-xs text-green-400">Total Registered</p>
                    <p className="text-2xl font-bold">{data.authUserStats.total}</p>
                  </div>
                  <div className="bg-blue-600/20 rounded-lg p-4 border border-blue-700/50">
                    <p className="text-xs text-blue-400">Email Confirmed</p>
                    <p className="text-2xl font-bold">{data.authUserStats.emailConfirmed}</p>
                  </div>
                  <div className="bg-red-600/20 rounded-lg p-4 border border-red-700/50">
                    <p className="text-xs text-red-400">Google Auth</p>
                    <p className="text-2xl font-bold">{data.authUserStats.googleProvider}</p>
                  </div>
                  <div className="bg-purple-600/20 rounded-lg p-4 border border-purple-700/50">
                    <p className="text-xs text-purple-400">Email Auth</p>
                    <p className="text-2xl font-bold">{data.authUserStats.emailProvider}</p>
                  </div>
                  <div className="bg-pink-600/20 rounded-lg p-4 border border-pink-700/50">
                    <p className="text-xs text-pink-400">Active (24h)</p>
                    <p className="text-2xl font-bold">{data.authUserStats.recentSignIns}</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'users' && data && (
              <div>
                {/* Registered Users */}
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Registered Users ({data.authUsers.length})</h3>
                  <span className="text-xs text-gray-500">Sorted by newest first</span>
                </div>
                <div className="overflow-x-auto mb-8">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-700">
                        <th className="text-left py-3 px-4 text-gray-400">#</th>
                        <th className="text-left py-3 px-4 text-gray-400">Email</th>
                        <th className="text-left py-3 px-4 text-gray-400">Provider</th>
                        <th className="text-left py-3 px-4 text-gray-400">Registered</th>
                        <th className="text-left py-3 px-4 text-gray-400">Last Sign In</th>
                        <th className="text-left py-3 px-4 text-gray-400">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.authUsers.map((user, i) => (
                        <tr key={user.id} className={`border-b border-gray-700/50 hover:bg-gray-700/30 ${isNewUser(user.created_at) ? 'bg-green-900/10' : ''}`}>
                          <td className="py-3 px-4 text-gray-500">{i + 1}</td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              {user.email}
                              {isNewUser(user.created_at) && (
                                <span className="px-1.5 py-0.5 text-[10px] font-bold bg-green-500 text-white rounded">NEW</span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-0.5 rounded text-xs ${
                              user.provider === 'google' ? 'bg-red-600/20 text-red-400' : 'bg-blue-600/20 text-blue-400'
                            }`}>
                              {user.provider === 'google' ? '🔴 Google' : '📧 Email'}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex flex-col">
                              <span className={isNewUser(user.created_at) ? 'text-green-400 font-medium' : 'text-gray-400'}>{formatRelativeTime(user.created_at)}</span>
                              <span className="text-xs text-gray-500">{formatDate(user.created_at)}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-gray-400">{user.last_sign_in_at ? formatRelativeTime(user.last_sign_in_at) : '-'}</td>
                          <td className="py-3 px-4">
                            {user.email_confirmed_at ? (
                              <span className="text-green-400">✓ Confirmed</span>
                            ) : (
                              <span className="text-yellow-400">⏳ Pending</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Video Activity */}
                <h3 className="text-lg font-semibold mb-4 pt-4 border-t border-gray-700">Video Activity by User ({data.userStats.length})</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-700">
                        <th className="text-left py-3 px-4 text-gray-400">#</th>
                        <th className="text-left py-3 px-4 text-gray-400">Email</th>
                        <th className="text-left py-3 px-4 text-gray-400">Videos</th>
                        <th className="text-left py-3 px-4 text-gray-400">Completed</th>
                        <th className="text-left py-3 px-4 text-gray-400">Failed</th>
                        <th className="text-left py-3 px-4 text-gray-400">Last Active</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.userStats.map((user, i) => (
                        <tr key={user.email} className="border-b border-gray-700/50 hover:bg-gray-700/30">
                          <td className="py-3 px-4 text-gray-500">{i + 1}</td>
                          <td className="py-3 px-4">{user.email}</td>
                          <td className="py-3 px-4">{user.videoCount}</td>
                          <td className="py-3 px-4 text-green-400">{user.completedCount}</td>
                          <td className="py-3 px-4 text-red-400">{user.failedCount}</td>
                          <td className="py-3 px-4 text-gray-400">{formatDate(user.lastActive)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'videos' && data && (
              <div>
                <h3 className="text-lg font-semibold mb-4">Recent Videos ({data.videoJobs.length})</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-700">
                        <th className="text-left py-3 px-3 text-gray-400">Status</th>
                        <th className="text-left py-3 px-3 text-gray-400">User</th>
                        <th className="text-left py-3 px-3 text-gray-400">Created</th>
                        <th className="text-left py-3 px-3 text-gray-400">Duration</th>
                        <th className="text-left py-3 px-3 text-gray-400">Topic</th>
                        <th className="text-left py-3 px-3 text-gray-400">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.videoJobs.slice(0, 50).map((job) => (
                        <tr key={job.id} className="border-b border-gray-700/50 hover:bg-gray-700/30">
                          <td className="py-3 px-3">
                            <span className={`px-2 py-0.5 rounded text-xs ${
                              job.status === 'completed' ? 'bg-green-600/20 text-green-400' :
                              job.status === 'failed' ? 'bg-red-600/20 text-red-400' :
                              job.status === 'processing' ? 'bg-yellow-600/20 text-yellow-400' :
                              'bg-gray-600/20 text-gray-400'
                            }`}>
                              {job.status}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-gray-400 max-w-[120px] truncate">
                            {job.user_id || <span className="italic text-gray-600">anonymous</span>}
                          </td>
                          <td className="py-3 px-3 text-gray-400">{formatDate(job.created_at)}</td>
                          <td className="py-3 px-3 text-gray-400">{formatDuration(job.duration)}</td>
                          <td className="py-3 px-3 text-gray-300 max-w-[200px] truncate">{job.topic || '-'}</td>
                          <td className="py-3 px-3">
                            <div className="flex gap-2">
                              <button
                                onClick={() => setSelectedVideo(job)}
                                className="px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 rounded"
                              >
                                Details
                              </button>
                              {job.video_url && (
                                <a
                                  href={job.video_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-2 py-1 text-xs bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 rounded"
                                >
                                  ▶️
                                </a>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'analytics' && (
              <div>
                {!analytics ? (
                  <div className="text-center py-12 text-gray-400">
                    <p>Loading analytics...</p>
                  </div>
                ) : !analytics.configured ? (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">📊</div>
                    <h3 className="text-xl font-semibold mb-2">Google Analytics Not Configured</h3>
                    <p className="text-gray-400 mb-4">Set up GA4 credentials in Vercel to enable analytics</p>
                    <div className="text-left max-w-md mx-auto bg-gray-700/50 rounded-lg p-4 text-sm">
                      <p className="text-gray-300 mb-2">Required environment variables:</p>
                      <ul className="list-disc list-inside text-gray-400 space-y-1">
                        <li>GA_PROPERTY_ID</li>
                        <li>GA_CLIENT_EMAIL</li>
                        <li>GA_PRIVATE_KEY</li>
                      </ul>
                    </div>
                  </div>
                ) : (
                  <div>
                    {/* Realtime */}
                    <div className="flex items-center gap-4 mb-6">
                      <div className="bg-green-600/20 border border-green-600/50 rounded-xl px-6 py-4 flex items-center gap-3">
                        <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                        <div>
                          <p className="text-xs text-green-400">Active Now</p>
                          <p className="text-3xl font-bold text-green-400">{analytics.realtime?.activeUsers || 0}</p>
                        </div>
                      </div>
                    </div>

                    {/* Period Stats */}
                    <h3 className="text-lg font-semibold mb-4">Traffic Overview</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                      {[
                        { label: 'Today', data: analytics.today },
                        { label: 'Last 7 Days', data: analytics.last7Days },
                        { label: 'Last 30 Days', data: analytics.last30Days },
                      ].map(({ label, data }) => (
                        <div key={label} className="bg-gray-700/50 rounded-lg p-4">
                          <h4 className="text-sm text-gray-400 mb-3">{label}</h4>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <p className="text-2xl font-bold">{data?.users || 0}</p>
                              <p className="text-xs text-gray-500">Users</p>
                            </div>
                            <div>
                              <p className="text-2xl font-bold">{data?.sessions || 0}</p>
                              <p className="text-xs text-gray-500">Sessions</p>
                            </div>
                            <div>
                              <p className="text-2xl font-bold">{data?.pageviews || 0}</p>
                              <p className="text-xs text-gray-500">Pageviews</p>
                            </div>
                            <div>
                              <p className="text-2xl font-bold">{Math.round(data?.avgSessionDuration || 0)}s</p>
                              <p className="text-xs text-gray-500">Avg Duration</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Top Pages & Countries */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Top Pages */}
                      <div>
                        <h3 className="text-lg font-semibold mb-4">Top Pages (7 days)</h3>
                        <div className="bg-gray-700/50 rounded-lg overflow-hidden">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b border-gray-600">
                                <th className="text-left py-2 px-3 text-gray-400">Page</th>
                                <th className="text-right py-2 px-3 text-gray-400">Views</th>
                                <th className="text-right py-2 px-3 text-gray-400">Users</th>
                              </tr>
                            </thead>
                            <tbody>
                              {(analytics.topPages || []).slice(0, 8).map((page, i) => (
                                <tr key={i} className="border-b border-gray-600/50">
                                  <td className="py-2 px-3 text-gray-300 truncate max-w-[200px]" title={page.path}>{page.path}</td>
                                  <td className="py-2 px-3 text-right">{page.pageviews}</td>
                                  <td className="py-2 px-3 text-right text-gray-400">{page.users}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Top Countries */}
                      <div>
                        <h3 className="text-lg font-semibold mb-4">Top Countries (30 days)</h3>
                        <div className="bg-gray-700/50 rounded-lg overflow-hidden">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b border-gray-600">
                                <th className="text-left py-2 px-3 text-gray-400">Country</th>
                                <th className="text-right py-2 px-3 text-gray-400">Users</th>
                              </tr>
                            </thead>
                            <tbody>
                              {(analytics.topCountries || []).slice(0, 8).map((country, i) => (
                                <tr key={i} className="border-b border-gray-600/50">
                                  <td className="py-2 px-3 text-gray-300">{country.country}</td>
                                  <td className="py-2 px-3 text-right">{country.users}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'realtime' && (
              <div>
                {!realtime ? (
                  <div className="text-center py-12 text-gray-400">
                    <p>Loading realtime data...</p>
                    <p className="text-sm mt-2">Make sure backend ADMIN_API_KEY is configured</p>
                  </div>
                ) : (
                  <div>
                    {/* System Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
                      <div className="bg-yellow-600/20 rounded-lg p-4 border border-yellow-700/50">
                        <p className="text-xs text-yellow-400">Processing</p>
                        <p className="text-3xl font-bold text-yellow-400">{realtime.data.system_stats.processing}</p>
                      </div>
                      <div className="bg-blue-600/20 rounded-lg p-4 border border-blue-700/50">
                        <p className="text-xs text-blue-400">Queued</p>
                        <p className="text-3xl font-bold text-blue-400">{realtime.data.system_stats.queued}</p>
                      </div>
                      <div className="bg-green-600/20 rounded-lg p-4 border border-green-700/50">
                        <p className="text-xs text-green-400">Completed</p>
                        <p className="text-3xl font-bold text-green-400">{realtime.data.system_stats.completed}</p>
                      </div>
                      <div className="bg-red-600/20 rounded-lg p-4 border border-red-700/50">
                        <p className="text-xs text-red-400">Failed</p>
                        <p className="text-3xl font-bold text-red-400">{realtime.data.system_stats.failed}</p>
                      </div>
                      <div className="bg-gray-600/20 rounded-lg p-4 border border-gray-700/50">
                        <p className="text-xs text-gray-400">Total in Redis</p>
                        <p className="text-3xl font-bold">{realtime.data.system_stats.total_tasks_in_redis}</p>
                      </div>
                    </div>

                    {/* Processing Tasks */}
                    {realtime.data.processing_tasks.length > 0 && (
                      <div className="mb-8">
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                          <span className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse"></span>
                          Processing Now ({realtime.data.processing_tasks.length})
                        </h3>
                        <div className="bg-yellow-900/10 rounded-lg border border-yellow-700/30 overflow-hidden">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b border-yellow-700/30">
                                <th className="text-left py-2 px-3 text-yellow-400">Progress</th>
                                <th className="text-left py-2 px-3 text-yellow-400">User</th>
                                <th className="text-left py-2 px-3 text-yellow-400">Topic</th>
                                <th className="text-left py-2 px-3 text-yellow-400">Started</th>
                              </tr>
                            </thead>
                            <tbody>
                              {realtime.data.processing_tasks.map((task) => (
                                <tr key={task.task_id} className="border-b border-yellow-700/20">
                                  <td className="py-2 px-3">
                                    <div className="flex items-center gap-2">
                                      <div className="w-20 bg-gray-700 rounded-full h-2">
                                        <div
                                          className="bg-yellow-500 h-2 rounded-full transition-all"
                                          style={{ width: `${task.progress?.percentage || 0}%` }}
                                        ></div>
                                      </div>
                                      <span className="text-yellow-400 text-xs">
                                        {task.progress?.percentage?.toFixed(0) || 0}%
                                      </span>
                                    </div>
                                    {task.progress && (
                                      <p className="text-xs text-gray-500 mt-1">
                                        Scene {task.progress.current_scene + 1}/{task.progress.total_scenes} - {task.progress.stage}
                                      </p>
                                    )}
                                  </td>
                                  <td className="py-2 px-3 text-gray-400 max-w-[120px] truncate">
                                    {task.user_id || <span className="italic text-gray-600">anon</span>}
                                  </td>
                                  <td className="py-2 px-3 text-gray-300 max-w-[200px] truncate">{task.topic}</td>
                                  <td className="py-2 px-3 text-gray-400">{formatRelativeTime(task.started_at || task.created_at)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* Queued Tasks */}
                    {realtime.data.queued_tasks.length > 0 && (
                      <div className="mb-8">
                        <h3 className="text-lg font-semibold mb-4">⏳ Queued ({realtime.data.queued_tasks.length})</h3>
                        <div className="bg-blue-900/10 rounded-lg border border-blue-700/30 overflow-hidden">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b border-blue-700/30">
                                <th className="text-left py-2 px-3 text-blue-400">User</th>
                                <th className="text-left py-2 px-3 text-blue-400">Topic</th>
                                <th className="text-left py-2 px-3 text-blue-400">Submitted</th>
                              </tr>
                            </thead>
                            <tbody>
                              {realtime.data.queued_tasks.slice(0, 10).map((task) => (
                                <tr key={task.task_id} className="border-b border-blue-700/20">
                                  <td className="py-2 px-3 text-gray-400 max-w-[120px] truncate">
                                    {task.user_id || <span className="italic text-gray-600">anon</span>}
                                  </td>
                                  <td className="py-2 px-3 text-gray-300 max-w-[250px] truncate">{task.topic}</td>
                                  <td className="py-2 px-3 text-gray-400">{formatRelativeTime(task.created_at)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* Worker Stats */}
                    <div className="mb-8">
                      <h3 className="text-lg font-semibold mb-4">🔧 Workers</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {Object.entries(realtime.data.worker_stats).map(([name, stats]) => (
                          <div key={name} className="bg-gray-700/50 rounded-lg p-4">
                            <p className="text-sm text-gray-400 truncate mb-2" title={name}>{name.split('@')[1] || name}</p>
                            {'error' in stats ? (
                              <p className="text-red-400 text-sm">{stats.error}</p>
                            ) : (
                              <div className="flex gap-4">
                                <div>
                                  <p className="text-2xl font-bold text-green-400">{stats.active_tasks}</p>
                                  <p className="text-xs text-gray-500">Active</p>
                                </div>
                                <div>
                                  <p className="text-2xl font-bold text-blue-400">{stats.reserved_tasks}</p>
                                  <p className="text-xs text-gray-500">Reserved</p>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                        {Object.keys(realtime.data.worker_stats).length === 0 && (
                          <p className="text-gray-500 col-span-3">No workers connected</p>
                        )}
                      </div>
                    </div>

                    {/* Recent Submissions */}
                    <div>
                      <h3 className="text-lg font-semibold mb-4">📝 Recent Submissions</h3>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-gray-700">
                              <th className="text-left py-2 px-3 text-gray-400">Status</th>
                              <th className="text-left py-2 px-3 text-gray-400">User</th>
                              <th className="text-left py-2 px-3 text-gray-400">Topic</th>
                              <th className="text-left py-2 px-3 text-gray-400">Time</th>
                            </tr>
                          </thead>
                          <tbody>
                            {realtime.data.recent_submissions.map((task) => (
                              <tr key={task.task_id} className="border-b border-gray-700/50 hover:bg-gray-700/30">
                                <td className="py-2 px-3">
                                  <span className={`px-2 py-0.5 rounded text-xs ${
                                    task.status === 'completed' ? 'bg-green-600/20 text-green-400' :
                                    task.status === 'failed' ? 'bg-red-600/20 text-red-400' :
                                    task.status === 'processing' ? 'bg-yellow-600/20 text-yellow-400' :
                                    'bg-gray-600/20 text-gray-400'
                                  }`}>
                                    {task.status}
                                  </span>
                                </td>
                                <td className="py-2 px-3 text-gray-400 max-w-[120px] truncate">
                                  {task.user_id || <span className="italic text-gray-600">anon</span>}
                                </td>
                                <td className="py-2 px-3 text-gray-300 max-w-[250px] truncate">{task.topic}</td>
                                <td className="py-2 px-3 text-gray-400">{formatRelativeTime(task.created_at)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <p className="text-xs text-gray-500 mt-6 text-right">
                      Last updated: {realtime.timestamp ? new Date(realtime.timestamp).toLocaleTimeString() : '-'}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Video Detail Modal */}
      {selectedVideo && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => setSelectedVideo(null)}>
          <div className="bg-gray-800 rounded-xl border border-gray-700 max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex justify-between mb-4">
                <h3 className="text-lg font-semibold">Video Details</h3>
                <button onClick={() => setSelectedVideo(null)} className="text-gray-400 hover:text-white text-xl">×</button>
              </div>
              <div className="space-y-3 text-sm">
                <div><span className="text-gray-500">ID:</span> <span className="font-mono text-xs">{selectedVideo.id}</span></div>
                <div><span className="text-gray-500">Status:</span> {selectedVideo.status}</div>
                <div><span className="text-gray-500">User:</span> {selectedVideo.user_id || 'anonymous'}</div>
                <div><span className="text-gray-500">Topic:</span> {selectedVideo.topic || '-'}</div>
                <div><span className="text-gray-500">Created:</span> {formatDate(selectedVideo.created_at)}</div>
                <div><span className="text-gray-500">Duration:</span> {formatDuration(selectedVideo.duration)}</div>
                {selectedVideo.error_message && (
                  <div className="text-red-400 bg-red-900/20 p-2 rounded">{selectedVideo.error_message}</div>
                )}
                {selectedVideo.video_url && (
                  <a href={selectedVideo.video_url} target="_blank" rel="noopener noreferrer"
                    className="inline-block mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg">
                    ▶️ Watch Video
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Stat Card Component
function StatCard({ icon, label, value, sublabel, color }: {
  icon: string;
  label: string;
  value: number;
  sublabel?: string;
  color: 'blue' | 'purple' | 'green' | 'red' | 'yellow' | 'orange';
}) {
  const colorClasses = {
    blue: 'bg-blue-600/20 text-blue-400',
    purple: 'bg-purple-600/20 text-purple-400',
    green: 'bg-green-600/20 text-green-400',
    red: 'bg-red-600/20 text-red-400',
    yellow: 'bg-yellow-600/20 text-yellow-400',
    orange: 'bg-orange-600/20 text-orange-400',
  };

  return (
    <div className="bg-gray-800 rounded-xl border border-gray-700 p-4">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg ${colorClasses[color]}`}>
          {icon}
        </div>
        <div>
          <p className="text-xs text-gray-400">{label}</p>
          <p className="text-2xl font-bold">{value}</p>
          {sublabel && <p className="text-xs text-gray-500">{sublabel}</p>}
        </div>
      </div>
    </div>
  );
}

export default App;
