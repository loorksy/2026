import { Link, useNavigate } from 'react-router-dom';
import { getUser, logout, hasPermission } from '../utils/auth';
import './Navbar.css';

const Navbar = () => {
  const navigate = useNavigate();
  const user = getUser();

  const handleLogout = () => {
    logout();
    navigate('/login');
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
        </div>

        <div className="navbar-user">
          {user && (
            <>
              <span className="navbar-username">
                {user.firstName || user.username}
              </span>
              <button onClick={handleLogout} className="btn btn-secondary btn-sm">
                تسجيل الخروج
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
