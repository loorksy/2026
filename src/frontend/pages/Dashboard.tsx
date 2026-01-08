import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../utils/api';
import { getUser } from '../utils/auth';
import { SupervisorStats, MarketerStats } from '../types';
import './Dashboard.css';

interface DashboardStats {
  counts: {
    users: number;
    roles: number;
    companies: number;
    shipments: number;
    credits: number;
    hosts: number;
    subAgents: number;
    approved: number;
    trustedPersons: number;
    supervisors: number;
    marketers: number;
  };
  supervisorStats?: SupervisorStats;
  marketerStats?: MarketerStats;
  totalRevenue: number;
  recentLogs: any[];
}

const Dashboard = () => {
  const user = getUser();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await api.getDashboardReportStats();
      if (response.success) {
        setStats(response.data);
      }
      
      // Fetch additional stats for new user types
      const [supervisorStats, marketerStats] = await Promise.all([
        api.getSupervisorStats().catch(() => ({ data: null })),
        api.getMarketerStats().catch(() => ({ data: null }))
      ]);

      setStats(prev => ({
        ...(prev || { counts: {}, recentLogs: [], totalRevenue: 0 }),
        supervisorStats: supervisorStats.data,
        marketerStats: marketerStats.data
      }));
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-IQ').format(amount);
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="container">
        <div className="dashboard-header">
          <h1>لوحة التحكم الشاملة</h1>
          <p>مرحباً، {user?.firstName || user?.username}</p>
        </div>

        {/* User Types Stats */}
        <div className="stats-section">
          <h2 className="section-title">إدارة المستخدمين</h2>
          <div className="stats-grid">
            <Link to="/hosts" className="stat-card stat-card-hosts">
              <div className="stat-icon">🏨</div>
              <div className="stat-content">
                <div className="stat-label">المضيفين</div>
                <div className="stat-value">{stats?.counts?.hosts || 0}</div>
              </div>
            </Link>

            <Link to="/sub-agents" className="stat-card stat-card-subagents">
              <div className="stat-icon">🤝</div>
              <div className="stat-content">
                <div className="stat-label">الوكلاء الفرعيين</div>
                <div className="stat-value">{stats?.counts?.subAgents || 0}</div>
              </div>
            </Link>

            <Link to="/approved" className="stat-card stat-card-approved">
              <div className="stat-icon">✅</div>
              <div className="stat-content">
                <div className="stat-label">المعتمدين</div>
                <div className="stat-value">{stats?.counts?.approved || 0}</div>
              </div>
            </Link>

            <Link to="/trusted-persons" className="stat-card stat-card-trusted">
              <div className="stat-icon">👤</div>
              <div className="stat-content">
                <div className="stat-label">الموثوقيين</div>
                <div className="stat-value">{stats?.counts?.trustedPersons || 0}</div>
              </div>
            </Link>

            <Link to="/supervisors" className="stat-card stat-card-supervisors">
              <div className="stat-icon">👨‍💼</div>
              <div className="stat-content">
                <div className="stat-label">المشرفين</div>
                <div className="stat-value">{stats?.counts?.supervisors || 0}</div>
                {stats?.supervisorStats && (
                  <div className="stat-subtext">
                    رواتب: {formatCurrency(stats.supervisorStats.totalSalary)} IQD
                  </div>
                )}
              </div>
            </Link>

            <Link to="/marketers" className="stat-card stat-card-marketers">
              <div className="stat-icon">📢</div>
              <div className="stat-content">
                <div className="stat-label">المسوقين</div>
                <div className="stat-value">{stats?.counts?.marketers || 0}</div>
                {stats?.marketerStats && (
                  <div className="stat-subtext">
                    رواتب: {formatCurrency(stats.marketerStats.totalMarketingSalary)} IQD
                  </div>
                )}
              </div>
            </Link>
          </div>
        </div>

        {/* General Stats */}
        <div className="stats-section">
          <h2 className="section-title">الإحصائيات العامة</h2>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon stat-icon-primary">👥</div>
              <div className="stat-content">
                <div className="stat-label">المستخدمين</div>
                <div className="stat-value">{stats?.counts?.users || 0}</div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon stat-icon-success">🚢</div>
              <div className="stat-content">
                <div className="stat-label">الشحنات</div>
                <div className="stat-value">{stats?.counts?.shipments || 0}</div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon stat-icon-info">🏢</div>
              <div className="stat-content">
                <div className="stat-label">الشركات</div>
                <div className="stat-value">{stats?.counts?.companies || 0}</div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon stat-icon-warning">💰</div>
              <div className="stat-content">
                <div className="stat-label">إجمالي الإيرادات</div>
                <div className="stat-value">{formatCurrency(stats?.totalRevenue || 0)} IQD</div>
              </div>
            </div>
          </div>
        </div>

        <div className="dashboard-content">
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">معلومات سريعة</h2>
            </div>
            <div className="quick-info">
              <div className="info-item">
                <span className="info-icon">📋</span>
                <span className="info-text">الأدوار النظامية: {stats?.counts?.roles || 0}</span>
              </div>
              <div className="info-item">
                <span className="info-icon">💳</span>
                <span className="info-text">الاعتمادات المفتوحة: {stats?.counts?.credits || 0}</span>
              </div>
              {stats?.supervisorStats && (
                <div className="info-item">
                  <span className="info-icon">👨‍💼</span>
                  <span className="info-text">
                    مشرفي وكالات: {stats.supervisorStats.agencyCount} | 
                    مشرفي واتساب: {stats.supervisorStats.whatsappCount}
                  </span>
                </div>
              )}
              {stats?.marketerStats && (
                <div className="info-item">
                  <span className="info-icon">📢</span>
                  <span className="info-text">
                    إجمالي العملاء: {stats.marketerStats.totalPeople} | 
                    إجمالي الأرباح: {formatCurrency(stats.marketerStats.totalProfit)} IQD
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h2 className="card-title">النشاطات الأخيرة</h2>
            </div>
            <div className="activities-list">
              {stats?.recentLogs && stats.recentLogs.length > 0 ? (
                stats.recentLogs.map((log: any) => (
                  <div key={log.id} className="activity-item">
                    <div className="activity-action">
                      <span className={`badge badge-${getActionColor(log.action)}`}>
                        {log.action}
                      </span>
                    </div>
                    <div className="activity-details">
                      <span className="activity-resource">{log.resource}</span>
                      <span className="activity-user">{log.user?.username}</span>
                    </div>
                    <div className="activity-time">
                      {new Date(log.timestamp).toLocaleString('ar')}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-secondary">لا توجد نشاطات</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const getActionColor = (action: string) => {
  const colors: Record<string, string> = {
    CREATE: 'success',
    UPDATE: 'info',
    DELETE: 'danger',
    CREATED: 'success',
    UPDATED: 'info',
    DELETED: 'danger',
    ASSIGNED_ROLE: 'warning',
    REVOKED_ROLE: 'warning'
  };
  return colors[action] || 'secondary';
};

export default Dashboard;
