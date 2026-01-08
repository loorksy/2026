import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Auth.css';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const { forgotPassword, error, clearError } = useAuth();
  
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setLocalError('');

    if (!email) {
      setLocalError('البريد الإلكتروني مطلوب');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setLocalError('البريد الإلكتروني غير صحيح');
      return;
    }

    setLoading(true);

    try {
      await forgotPassword(email);
      setSuccess(true);
    } catch (err: any) {
      setLocalError(err.message || 'حدث خطأ أثناء معالجة الطلب');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <div className="auth-header">
            <h1>تم إرسال الرابط</h1>
            <p>تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني</p>
          </div>
          <div className="auth-success">
            <div className="success-icon">✓</div>
            <p>يرجى التحقق من بريدك الإلكتروني واتبع التعليمات لإعادة تعيين كلمة المرور</p>
          </div>
          <div className="auth-info">
            <p>إذا لم تجد البريد الإلكتروني، يرجى التحقق من مجلد الرسائل غير المرغوب فيها</p>
          </div>
          <button
            className="btn btn-primary btn-block"
            onClick={() => navigate('/login')}
          >
            العودة لتسجيل الدخول
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <h1>نسيت كلمة المرور</h1>
          <p>أدخل بريدك الإلكتروني لإعادة تعيين كلمة المرور</p>
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

          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={loading}
          >
            {loading ? 'جاري المعالجة...' : 'إرسال رابط إعادة التعيين'}
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

export default ForgotPassword;
