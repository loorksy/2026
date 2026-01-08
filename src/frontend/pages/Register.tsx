import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Auth.css';

const Register = () => {
  const navigate = useNavigate();
  const { register, error, clearError } = useAuth();
  
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: ''
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
    if (!formData.email || !formData.username || !formData.password) {
      setLocalError('جميع الحقول المطلوبة يجب تعبئتها');
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setLocalError('كلمتا المرور غير متطابقتين');
      return false;
    }

    if (formData.password.length < 8) {
      setLocalError('كلمة المرور يجب أن تكون 8 أحرف على الأقل');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setLocalError('البريد الإلكتروني غير صحيح');
      return false;
    }

    if (formData.username.length < 3) {
      setLocalError('اسم المستخدم يجب أن يكون 3 أحرف على الأقل');
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
      await register({
        email: formData.email,
        username: formData.username,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName
      });
      
      setSuccess(true);
    } catch (err: any) {
      setLocalError(err.message || 'حدث خطأ أثناء إنشاء الحساب');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <div className="auth-header">
            <h1>تم إنشاء الحساب</h1>
            <p>تم إنشاء حسابك بنجاح. يمكنك الآن تسجيل الدخول.</p>
          </div>
          <div className="auth-success">
            <div className="success-icon">✓</div>
            <p>تم إرسال رابط التحقق إلى بريدك الإلكتروني</p>
          </div>
          <button
            className="btn btn-primary btn-block"
            onClick={() => navigate('/login')}
          >
            تسجيل الدخول
          </button>
          <div className="auth-footer">
            <p>
              لديك حساب بالفعل؟ <Link to="/login">تسجيل الدخول</Link>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <h1>إنشاء حساب جديد</h1>
          <p>أدخل بياناتك لإنشاء حساب جديد</p>
        </div>

        {(localError || error) && (
          <div className="alert alert-danger">
            {localError || error}
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
            <label className="form-label">البريد الإلكتروني *</label>
            <input
              type="email"
              name="email"
              className="form-input"
              value={formData.email}
              onChange={handleChange}
              placeholder="example@domain.com"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">اسم المستخدم *</label>
            <input
              type="text"
              name="username"
              className="form-input"
              value={formData.username}
              onChange={handleChange}
              placeholder="اسم المستخدم"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">كلمة المرور *</label>
            <input
              type="password"
              name="password"
              className="form-input"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              required
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
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={loading}
          >
            {loading ? 'جاري إنشاء الحساب...' : 'إنشاء حساب'}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            لديك حساب بالفعل؟ <Link to="/login">تسجيل الدخول</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
