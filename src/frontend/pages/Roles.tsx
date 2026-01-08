import { useEffect, useState } from 'react';
import { api } from '../utils/api';
import { Role } from '../types';
import { hasPermission } from '../utils/auth';
import './Roles.css';

const Roles = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    try {
      const response = await api.getRoles();
      if (response.success) {
        setRoles(response.data);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا الدور؟')) return;

    try {
      const response = await api.deleteRole(id);
      if (response.success) {
        fetchRoles();
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleViewDetails = async (role: Role) => {
    try {
      const response = await api.getRoleById(role.id);
      if (response.success) {
        setSelectedRole(response.data);
        setShowModal(true);
      }
    } catch (err: any) {
      alert(err.message);
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
    <div className="roles-page">
      <div className="container">
        <div className="card">
          <div className="card-header">
            <h1 className="card-title">إدارة الأدوار</h1>
          </div>

          {error && <div className="alert alert-danger">{error}</div>}

          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>الاسم</th>
                  <th>الوصف</th>
                  <th>عدد الصلاحيات</th>
                  <th>عدد المستخدمين</th>
                  <th>الحالة</th>
                  <th>نظامي</th>
                  <th>الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {roles.map((role) => (
                  <tr key={role.id}>
                    <td>{role.name}</td>
                    <td>{role.description}</td>
                    <td>{role.permissions?.length || 0}</td>
                    <td>{role.userCount || 0}</td>
                    <td>
                      <span
                        className={`badge ${
                          role.isActive ? 'badge-success' : 'badge-danger'
                        }`}
                      >
                        {role.isActive ? 'نشط' : 'غير نشط'}
                      </span>
                    </td>
                    <td>
                      {role.isSystem ? (
                        <span className="badge badge-info">نعم</span>
                      ) : (
                        <span className="badge badge-secondary">لا</span>
                      )}
                    </td>
                    <td>
                      <div className="actions">
                        <button
                          onClick={() => handleViewDetails(role)}
                          className="btn btn-sm btn-outline"
                        >
                          عرض
                        </button>
                        {hasPermission('roles', 'DELETE') && !role.isSystem && (
                          <button
                            onClick={() => handleDelete(role.id)}
                            className="btn btn-sm btn-danger"
                          >
                            حذف
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showModal && selectedRole && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">تفاصيل الدور: {selectedRole.name}</h2>
              <button
                className="modal-close"
                onClick={() => setShowModal(false)}
              >
                ×
              </button>
            </div>

            <div className="modal-body">
              <div className="detail-item">
                <strong>الوصف:</strong> {selectedRole.description}
              </div>
              <div className="detail-item">
                <strong>الحالة:</strong>{' '}
                {selectedRole.isActive ? 'نشط' : 'غير نشط'}
              </div>
              <div className="detail-item">
                <strong>نظامي:</strong> {selectedRole.isSystem ? 'نعم' : 'لا'}
              </div>

              <h3 className="mt-3 mb-2">الصلاحيات:</h3>
              <div className="permissions-grid">
                {selectedRole.permissions?.map((permission) => (
                  <div key={permission.id} className="permission-badge">
                    {permission.resource} - {permission.action}
                  </div>
                ))}
              </div>
            </div>

            <div className="modal-footer">
              <button
                onClick={() => setShowModal(false)}
                className="btn btn-secondary"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Roles;
