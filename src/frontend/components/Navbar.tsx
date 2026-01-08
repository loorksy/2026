import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getUser, logout, hasPermission } from '../utils/auth';
import './Navbar.css';

const Navbar = () => {
  const navigate = useNavigate();
  const user = getUser();
  const [showDropdown, setShowDropdown] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-brand">
          نظام إدارة المستخدمين
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

          <div 
            className="navbar-dropdown"
            onMouseEnter={() => setShowDropdown(true)}
            onMouseLeave={() => setShowDropdown(false)}
          >
            <span className="navbar-link dropdown-toggle">
              إدارة المستخدمين ▼
            </span>
            {showDropdown && (
              <div className="dropdown-menu">
                {hasPermission('hosts', 'READ') && (
                  <Link to="/hosts" className="dropdown-item">
                    المضيفين
                  </Link>
                )}
                {hasPermission('sub_agents', 'READ') && (
                  <Link to="/sub-agents" className="dropdown-item">
                    الوكلاء الفرعيين
                  </Link>
                )}
                {hasPermission('approved', 'READ') && (
                  <Link to="/approved" className="dropdown-item">
                    المعتمدين
                  </Link>
                )}
                {hasPermission('trusted_persons', 'READ') && (
                  <Link to="/trusted-persons" className="dropdown-item">
                    الموثوقيين
                  </Link>
                )}
                {hasPermission('supervisors', 'READ') && (
                  <Link to="/supervisors" className="dropdown-item">
                    المشرفين
                  </Link>
                )}
                {hasPermission('marketers', 'READ') && (
                  <Link to="/marketers" className="dropdown-item">
                    المسوقين
                  </Link>
                )}
              </div>
            )}
          </div>

          {hasPermission('audit_logs', 'READ') && (
            <Link to="/audit-logs" className="navbar-link">
              سجل التدقيق
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
