import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Login.css';

const Login = () => {
  const navigate = useNavigate();
  const { login, error, clearError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setLocalError('');

    if (!email || !password) {
      setLocalError('البريد الإلكتروني وكلمة المرور مطلوبان');
      return;
    }

    setLoading(true);

    try {
      await login(email, password);
      navigate('/');
    } catch (err: any) {
      setLocalError(err.message || 'فشل تسجيل الدخول');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-header">
          <h1>نظام إدارة الأدوار والصلاحيات</h1>
          <p>تسجيل الدخول إلى حسابك</p>
        </div>

        {(localError || error) && (
          <div className="alert alert-danger">
            {localError || error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">البريد الإلكتروني</label>
            <input
              type="email"
              className="form-input"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                clearError();
                setLocalError('');
              }}
              placeholder="example@domain.com"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">كلمة المرور</label>
            <input
              type="password"
              className="form-input"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                clearError();
                setLocalError('');
              }}
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={loading}
          >
            {loading ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول'}
          </button>
        </form>

        <div className="login-links">
          <Link to="/auth/forgot-password">نسيت كلمة المرور؟</Link>
        </div>

        <div className="login-footer">
          <p>ليس لديك حساب؟ <Link to="/register">إنشاء حساب جديد</Link></p>
          <div className="demo-accounts">
            <p>حسابات تجريبية:</p>
            <ul>
              <li>Admin: admin@example.com / admin123</li>
              <li>Accountant: accountant@example.com / password123</li>
              <li>Manager: manager@example.com / password123</li>
              <li>Viewer: viewer@example.com / password123</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
