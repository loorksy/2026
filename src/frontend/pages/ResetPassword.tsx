import { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Auth.css';

const ResetPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { resetPassword, error, clearError } = useAuth();
  
  const token = searchParams.get('token');
  
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    clearError();
    setLocalError('');
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const validateForm = () => {
    if (!token) {
      setLocalError('رابط إعادة التعيين غير صالح');
      return false;
    }

    if (!formData.password) {
      setLocalError('كلمة المرور مطلوبة');
      return false;
    }

    if (formData.password.length < 8) {
      setLocalError('كلمة المرور يجب أن تكون 8 أحرف على الأقل');
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setLocalError('كلمتا المرور غير متطابقتين');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    setLocalError('');

    try {
      await resetPassword(token!, formData.password, formData.confirmPassword);
      setSuccess(true);
    } catch (err: any) {
      setLocalError(err.message || 'حدث خطأ أثناء إعادة تعيين كلمة المرور');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <div className="auth-header">
            <h1>تم إعادة تعيين كلمة المرور</h1>
            <p>تم تغيير كلمة المرور بنجاح</p>
          </div>
          <div className="auth-success">
            <div className="success-icon">✓</div>
            <p>يمكنك الآن تسجيل الدخول بكلمة المرور الجديدة</p>
          </div>
          <button
            className="btn btn-primary btn-block"
            onClick={() => navigate('/login')}
          >
            تسجيل الدخول
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <h1>إعادة تعيين كلمة المرور</h1>
          <p>أدخل كلمة المرور الجديدة</p>
        </div>

        {(localError || error) && (
          <div className="alert alert-danger">
            {localError || error}
          </div>
        )}

        {!token && !localError && (
          <div className="alert alert-warning">
            رابط إعادة التعيين غير صالح أو منتهي. يرجى طلب رابط جديد.
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">كلمة المرور الجديدة *</label>
            <input
              type="password"
              name="password"
              className="form-input"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              required
              disabled={!token}
            />
            <small className="form-hint">كلمة المرور يجب أن تكون 8 أحرف على الأقل</small>
          </div>

          <div className="form-group">
            <label className="form-label">تأكيد كلمة المرور *</label>
            <input
              type="password"
              name="confirmPassword"
              className="form-input"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="••••••••"
              required
              disabled={!token}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={loading || !token}
          >
            {loading ? 'جاري المعالجة...' : 'إعادة تعيين كلمة المرور'}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            تذكرت كلمة المرور؟ <Link to="/login">تسجيل الدخول</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
