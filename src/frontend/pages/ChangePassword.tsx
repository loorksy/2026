import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import './ChangePassword.css';

const ChangePassword = () => {
  const { changePassword, error, clearError } = useAuth();
  
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
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

  const validateForm = () => {
    if (!formData.currentPassword) {
      setLocalError('كلمة المرور الحالية مطلوبة');
      return false;
    }

    if (!formData.newPassword) {
      setLocalError('كلمة المرور الجديدة مطلوبة');
      return false;
    }

    if (formData.newPassword.length < 8) {
      setLocalError('كلمة المرور الجديدة يجب أن تكون 8 أحرف على الأقل');
      return false;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setLocalError('كلمتا المرور الجديدة غير متطابقتين');
      return false;
    }

    if (formData.currentPassword === formData.newPassword) {
      setLocalError('كلمة المرور الجديدة يجب أن تكون مختلفة عن كلمة المرور الحالية');
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
      await changePassword({
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
        confirmPassword: formData.confirmPassword
      });
      setSuccess(true);
      setFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (err: any) {
      setLocalError(err.message || 'حدث خطأ أثناء تغيير كلمة المرور');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="change-password-page">
      <div className="page-header">
        <h1>تغيير كلمة المرور</h1>
        <p>تغيير كلمة المرور الخاصة بحسابك</p>
      </div>

      <div className="change-password-card">
        {(localError || error) && (
          <div className="alert alert-danger">
            {localError || error}
          </div>
        )}

        {success && (
          <div className="alert alert-success">
            تم تغيير كلمة المرور بنجاح. تم إنهاء جميع الجلسات الأخرى لأسباب أمنية.
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">كلمة المرور الحالية *</label>
            <input
              type="password"
              name="currentPassword"
              className="form-input"
              value={formData.currentPassword}
              onChange={handleChange}
              placeholder="أدخل كلمة المرور الحالية"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">كلمة المرور الجديدة *</label>
            <input
              type="password"
              name="newPassword"
              className="form-input"
              value={formData.newPassword}
              onChange={handleChange}
              placeholder="أدخل كلمة المرور الجديدة"
              required
            />
            <small className="form-hint">كلمة المرور يجب أن تكون 8 أحرف على الأقل</small>
          </div>

          <div className="form-group">
            <label className="form-label">تأكيد كلمة المرور الجديدة *</label>
            <input
              type="password"
              name="confirmPassword"
              className="form-input"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="أعد إدخال كلمة المرور الجديدة"
              required
            />
          </div>

          <div className="password-requirements">
            <h4>متطلبات كلمة المرور:</h4>
            <ul>
              <li className={formData.newPassword.length >= 8 ? 'met' : ''}>
                8 أحرف على الأقل
              </li>
              <li className={formData.newPassword === formData.confirmPassword && formData.confirmPassword ? 'met' : ''}>
                كلمتا المرور متطابقتان
              </li>
              <li className={formData.newPassword !== formData.currentPassword && formData.newPassword ? 'met' : ''}>
                مختلفة عن كلمة المرور الحالية
              </li>
            </ul>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? 'جاري التغيير...' : 'تغيير كلمة المرور'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChangePassword;
