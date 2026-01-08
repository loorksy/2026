import { useEffect, useState } from 'react';
import { api } from '../utils/api';
import { getUser } from '../utils/auth';
import './Dashboard.css';

const Dashboard = () => {
  const user = getUser();
  const [stats, setStats] = useState<any>(null);
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
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
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
              <div className="stat-value">{stats?.totalRevenue || 0}</div>
            </div>
          </div>
        </div>

        <div className="dashboard-content">
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">إحصائيات إضافية</h2>
            </div>
            <div className="additional-stats">
              <div className="stat-item">
                <span className="stat-label">الأدوار النظامية:</span>
                <span className="stat-value">{stats?.counts?.roles || 0}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">الاعتمادات المفتوحة:</span>
                <span className="stat-value">{stats?.counts?.credits || 0}</span>
              </div>
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
