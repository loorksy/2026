import { useEffect, useState } from 'react';
import { api } from '../utils/api';
import { User } from '../types';
import { hasPermission } from '../utils/auth';

const Users = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await api.getUsers();
      if (response.success) {
        setUsers(response.data);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا المستخدم؟')) return;

    try {
      const response = await api.deleteUser(id);
      if (response.success) {
        fetchUsers();
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
    <div className="users-page">
      <div className="container">
        <div className="card">
          <div className="card-header">
            <h1 className="card-title">إدارة المستخدمين</h1>
          </div>

          {error && <div className="alert alert-danger">{error}</div>}

          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>اسم المستخدم</th>
                  <th>البريد الإلكتروني</th>
                  <th>الاسم الكامل</th>
                  <th>الأدوار</th>
                  <th>الحالة</th>
                  <th>تاريخ الإنشاء</th>
                  <th>الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td>{user.username}</td>
                    <td>{user.email}</td>
                    <td>
                      {user.firstName || user.lastName
                        ? `${user.firstName || ''} ${user.lastName || ''}`
                        : '-'}
                    </td>
                    <td>
                      <div className="flex gap-1">
                        {user.roles?.map((role) => (
                          <span key={role.id} className="badge badge-info">
                            {role.name}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          user.isActive ? 'badge-success' : 'badge-danger'
                        }`}
                      >
                        {user.isActive ? 'نشط' : 'غير نشط'}
                      </span>
                    </td>
                    <td>
                      {user.createdAt
                        ? new Date(user.createdAt).toLocaleDateString('ar')
                        : '-'}
                    </td>
                    <td>
                      {hasPermission('users', 'DELETE') && (
                        <button
                          onClick={() => handleDelete(user.id)}
                          className="btn btn-sm btn-danger"
                        >
                          حذف
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Users;
