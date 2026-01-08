import { Link } from 'react-router-dom';
import './AccessDenied.css';

const AccessDenied = () => {
  return (
    <div className="access-denied-page">
      <div className="access-denied-card">
        <div className="access-denied-icon">🚫</div>
        <h1>الوصول مرفوض</h1>
        <p>عذراً، ليس لديك صلاحية للوصول إلى هذه الصفحة.</p>
        <p className="text-secondary">
          يرجى التواصل مع مسؤول النظام للحصول على الصلاحيات المطلوبة.
        </p>
        <Link to="/" className="btn btn-primary">
          العودة إلى الرئيسية
        </Link>
      </div>
    </div>
  );
};

export default AccessDenied;
