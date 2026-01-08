import { useEffect, useState } from 'react';
import { api } from '../utils/api';
import { Permission } from '../types';

const Permissions = () => {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [groupedPermissions, setGroupedPermissions] = useState<Record<string, Permission[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPermissions();
  }, []);

  const fetchPermissions = async () => {
    try {
      const response = await api.getPermissions();
      if (response.success) {
        setPermissions(response.data.all);
        setGroupedPermissions(response.data.grouped);
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
    <div className="permissions-page">
      <div className="container">
        <div className="card">
          <div className="card-header">
            <h1 className="card-title">الصلاحيات</h1>
          </div>

          {error && <div className="alert alert-danger">{error}</div>}

          <div className="permissions-grouped">
            {Object.entries(groupedPermissions).map(([resource, perms]) => (
              <div key={resource} className="permission-group">
                <h3 className="permission-group-title">{resource}</h3>
                <div className="permission-items">
                  {perms.map((perm) => (
                    <div key={perm.id} className="permission-item">
                      <div className="permission-action">
                        <span className={`badge badge-${getActionColor(perm.action)}`}>
                          {perm.action}
                        </span>
                      </div>
                      <div className="permission-info">
                        <div className="permission-name">{perm.name}</div>
                        <div className="permission-description">
                          {perm.description}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const getActionColor = (action: string) => {
  const colors: Record<string, string> = {
    CREATE: 'success',
    READ: 'info',
    UPDATE: 'warning',
    DELETE: 'danger'
  };
  return colors[action] || 'secondary';
};

export default Permissions;
