import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getUser, logout, hasPermission } from '../utils/auth';
import { useAuth } from '../contexts/AuthContext';
import './Navbar.css';

const Navbar = () => {
  const navigate = useNavigate();
  const user = getUser();
  const { logout: authLogout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleLogout = async () => {
    await authLogout();
    navigate('/login');
  };

  const handleProfileClick = () => {
    setShowUserMenu(false);
    navigate('/profile');
  };

  const handleChangePasswordClick = () => {
    setShowUserMenu(false);
    navigate('/change-password');
  };

  const formatRole = (role: string) => {
    switch (role) {
      case 'Admin': return 'مدير';
      case 'Accountant': return 'محاسب';
      case 'Manager': return 'مدير عام';
      case 'Viewer': return 'مشاهد';
      default: return role;
    }
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-brand">
          نظام إدارة الأدوار والصلاحيات
        </Link>

        <div className="navbar-menu">
          <Link to="/" className="navbar-link">
            الرئيسية
          </Link>

          {hasPermission('users', 'READ') && (
            <Link to="/users" className="navbar-link">
              المستخدمين
            </Link>
          )}

          {hasPermission('roles', 'READ') && (
            <Link to="/roles" className="navbar-link">
              الأدوار
            </Link>
          )}

          {hasPermission('permissions', 'READ') && (
            <Link to="/permissions" className="navbar-link">
              الصلاحيات
            </Link>
          )}

          {hasPermission('audit_logs', 'READ') && (
            <Link to="/audit-logs" className="navbar-link">
              سجل التدقيق
            </Link>
          )}

          {hasPermission('trusted_persons', 'READ') && (
            <Link to="/trusted-persons" className="navbar-link">
              الموثوقيين
            </Link>
          )}

          {hasPermission('manual_transfers', 'READ') && (
            <Link to="/manual-transfers" className="navbar-link">
              التحويلات
            </Link>
          )}

          {hasPermission('reports', 'READ') && (
            <Link to="/reports" className="navbar-link">
              التقارير
            </Link>
          )}
        </div>

        <div className="navbar-user">
          {user && (
            <div className="user-menu-container">
              <button 
                className="user-menu-button"
                onClick={() => setShowUserMenu(!showUserMenu)}
              >
                <div className="user-avatar">
                  {(user.firstName || user.username).charAt(0).toUpperCase()}
                </div>
                <span className="navbar-username">
                  {user.firstName || user.username}
                </span>
                <span className="dropdown-arrow">▼</span>
              </button>

              {showUserMenu && (
                <div className="user-menu">
                  <div className="user-menu-header">
                    <div className="user-info">
                      <span className="user-name">
                        {user.firstName && user.lastName 
                          ? `${user.firstName} ${user.lastName}` 
                          : user.username}
                      </span>
                      <span className="user-email">{user.email}</span>
                    </div>
                    <div className="user-role">
                      {user.role && (
                        <span className="role-badge">{formatRole(user.role)}</span>
                      )}
                    </div>
                  </div>
                  <div className="user-menu-divider"></div>
                  <button className="user-menu-item" onClick={handleProfileClick}>
                    <span className="menu-icon">👤</span>
                    الملف الشخصي
                  </button>
                  <button className="user-menu-item" onClick={handleChangePasswordClick}>
                    <span className="menu-icon">🔒</span>
                    تغيير كلمة المرور
                  </button>
                  <div className="user-menu-divider"></div>
                  <button className="user-menu-item logout" onClick={handleLogout}>
                    <span className="menu-icon">🚪</span>
                    تسجيل الخروج
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
