import { useEffect, useState } from 'react';
import { api } from '../utils/api';
import { AuditLog } from '../types';

const AuditLogs = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchLogs();
  }, [page]);

  const fetchLogs = async () => {
    try {
      const response = await api.getAuditLogs({ page, limit: 20 });
      if (response.success) {
        setLogs(response.data.logs);
        setTotalPages(response.data.pagination.totalPages);
      }
    } catch (err: any) {
      setError(err.message);
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
    <div className="audit-logs-page">
      <div className="container">
        <div className="card">
          <div className="card-header">
            <h1 className="card-title">سجل التدقيق</h1>
          </div>

          {error && <div className="alert alert-danger">{error}</div>}

          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>المستخدم</th>
                  <th>الإجراء</th>
                  <th>المورد</th>
                  <th>التاريخ</th>
                  <th>عنوان IP</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id}>
                    <td>{log.user?.username || 'نظام'}</td>
                    <td>
                      <span className={`badge badge-${getActionColor(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td>{log.resource}</td>
                    <td>{new Date(log.timestamp).toLocaleString('ar')}</td>
                    <td>{log.ipAddress || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="pagination">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="btn btn-secondary btn-sm"
              >
                السابق
              </button>
              <span className="pagination-info">
                صفحة {page} من {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="btn btn-secondary btn-sm"
              >
                التالي
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const getActionColor = (action: string) => {
  const colors: Record<string, string> = {
    CREATED: 'success',
    UPDATED: 'info',
    DELETED: 'danger',
    ASSIGNED_ROLE: 'warning',
    REVOKED_ROLE: 'warning'
  };
  return colors[action] || 'secondary';
};

export default AuditLogs;
