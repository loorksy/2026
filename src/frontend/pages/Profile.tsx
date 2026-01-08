import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import './Profile.css';

const Profile = () => {
  const { user, updateProfile, error, clearError } = useAuth();
  
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || ''
  });
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    clearError();
    setLocalError('');
    setSuccess(false);
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setLocalError('');
    setSuccess(false);

    setLoading(true);

    try {
      await updateProfile({
        firstName: formData.firstName,
        lastName: formData.lastName
      });
      setSuccess(true);
    } catch (err: any) {
      setLocalError(err.message || 'حدث خطأ أثناء تحديث الملف الشخصي');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'status-active';
      case 'inactive': return 'status-inactive';
      case 'suspended': return 'status-suspended';
      default: return '';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'نشط';
      case 'inactive': return 'غير نشط';
      case 'suspended': return 'معلق';
      default: return status;
    }
  };

  const getRoleText = (role: string) => {
    switch (role) {
      case 'Admin': return 'مدير';
      case 'Accountant': return 'محاسب';
      case 'Manager': return 'مدير عام';
      case 'Viewer': return 'مشاهد';
      default: return role;
    }
  };

  const getUserTypeText = (type: string) => {
    switch (type) {
      case 'Host': return 'مضيف';
      case 'SubAgent': return 'وكيل فرعي';
      case 'Approved': return 'موافق عليه';
      case 'TrustedPerson': return 'شخص موثوق';
      case 'Supervisor': return 'مشرف';
      case 'Marketer': return 'مسوق';
      default: return type;
    }
  };

  return (
    <div className="profile-page">
      <div className="page-header">
        <h1>الملف الشخصي</h1>
        <p>إدارة معلومات حسابك الشخصية</p>
      </div>

      <div className="profile-container">
        <div className="profile-card main-info">
          <div className="card-header">
            <h2>المعلومات الشخصية</h2>
          </div>

          {(localError || error) && (
            <div className="alert alert-danger">
              {localError || error}
            </div>
          )}

          {success && (
            <div className="alert alert-success">
              تم تحديث الملف الشخصي بنجاح
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">الاسم الأول</label>
                <input
                  type="text"
                  name="firstName"
                  className="form-input"
                  value={formData.firstName}
                  onChange={handleChange}
                  placeholder="الاسم الأول"
                />
              </div>
              <div className="form-group">
                <label className="form-label">الاسم الأخير</label>
                <input
                  type="text"
                  name="lastName"
                  className="form-input"
                  value={formData.lastName}
                  onChange={handleChange}
                  placeholder="الاسم الأخير"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">البريد الإلكتروني</label>
              <input
                type="email"
                className="form-input"
                value={user?.email || ''}
                disabled
                placeholder="البريد الإلكتروني"
              />
              <small className="form-hint">لا يمكن تغيير البريد الإلكتروني</small>
            </div>

            <div className="form-group">
              <label className="form-label">اسم المستخدم</label>
              <input
                type="text"
                className="form-input"
                value={user?.username || ''}
                disabled
                placeholder="اسم المستخدم"
              />
              <small className="form-hint">لا يمكن تغيير اسم المستخدم</small>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? 'جاري الحفظ...' : 'حفظ التغييرات'}
            </button>
          </form>
        </div>

        <div className="profile-card account-info">
          <div className="card-header">
            <h2>معلومات الحساب</h2>
          </div>

          <div className="info-grid">
            <div className="info-item">
              <span className="info-label">نوع المستخدم</span>
              <span className="info-value">{getUserTypeText(user?.userType || '')}</span>
            </div>
            <div className="info-item">
              <span className="info-label">الدور</span>
              <span className="info-value">{getRoleText(user?.role || '')}</span>
            </div>
            <div className="info-item">
              <span className="info-label">حالة الحساب</span>
              <span className={`info-value status-badge ${getStatusColor(user?.status || '')}`}>
                {getStatusText(user?.status || '')}
              </span>
            </div>
            <div className="info-item">
              <span className="info-label">التحقق من البريد</span>
              <span className={`info-value status-badge ${user?.emailVerified ? 'status-active' : 'status-inactive'}`}>
                {user?.emailVerified ? 'مؤكد' : 'غير مؤكد'}
              </span>
            </div>
            <div className="info-item">
              <span className="info-label">آخر تسجيل دخول</span>
              <span className="info-value">{formatDate(user?.lastLogin)}</span>
            </div>
            <div className="info-item">
              <span className="info-label">تاريخ التسجيل</span>
              <span className="info-value">{formatDate(user?.createdAt)}</span>
            </div>
          </div>
        </div>

        <div className="profile-card security-info">
          <div className="card-header">
            <h2>الأدوار والصلاحيات</h2>
          </div>

          <div className="roles-section">
            <h3>الأدوار المخصصة</h3>
            <div className="roles-list">
              {user?.roles && user.roles.length > 0 ? (
                user.roles.map((role: any, index: number) => (
                  <div key={index} className="role-badge">
                    {getRoleText(role.name)}
                  </div>
                ))
              ) : (
                <p className="no-data">لا توجد أدوار مخصصة</p>
              )}
            </div>
          </div>

          <div className="permissions-section">
            <h3>الصلاحيات</h3>
            <div className="permissions-list">
              {user?.permissions && user.permissions.length > 0 ? (
                user.permissions.map((permission: any, index: number) => (
                  <div key={index} className="permission-item">
                    <span className="permission-resource">{permission.resource}</span>
                    <span className="permission-action">{permission.action}</span>
                  </div>
                ))
              ) : (
                <p className="no-data">لا توجد صلاحيات</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
