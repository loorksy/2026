import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../utils/api';
import { TrustedPerson } from '../types';
import './TrustedPersons.css';

const TrustedPersons: React.FC = () => {
  const navigate = useNavigate();
  const [trustedPersons, setTrustedPersons] = useState<TrustedPerson[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [filterActive, setFilterActive] = useState<boolean | undefined>(undefined);
  const [formData, setFormData] = useState({
    fullName: '',
    address: '',
    whatsappNumber: '',
    salaryType: 'MONTHLY',
    baseSalary: '',
    salaryPeriod: '',
    bankAccount: ''
  });

  useEffect(() => {
    fetchTrustedPersons();
  }, [filterActive]);

  const fetchTrustedPersons = async () => {
    try {
      setLoading(true);
      const params = filterActive !== undefined ? { isActive: filterActive } : {};
      const response = await api.getTrustedPersons(params);
      setTrustedPersons(response.data);
    } catch (error: any) {
      alert(error.message || 'حدث خطأ أثناء جلب الموثوقيين');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createTrustedPerson({
        ...formData,
        baseSalary: parseFloat(formData.baseSalary)
      });
      alert('تم إنشاء الشخص الموثوق بنجاح');
      setShowModal(false);
      resetForm();
      fetchTrustedPersons();
    } catch (error: any) {
      alert(error.message || 'حدث خطأ أثناء إنشاء الشخص الموثوق');
    }
  };

  const toggleStatus = async (id: string) => {
    try {
      await api.toggleTrustedPersonStatus(id);
      fetchTrustedPersons();
    } catch (error: any) {
      alert(error.message || 'حدث خطأ أثناء تغيير الحالة');
    }
  };

  const deletePerson = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الشخص الموثوق؟')) return;
    try {
      await api.deleteTrustedPerson(id);
      alert('تم حذف الشخص الموثوق بنجاح');
      fetchTrustedPersons();
    } catch (error: any) {
      alert(error.message || 'حدث خطأ أثناء حذف الشخص الموثوق');
    }
  };

  const resetForm = () => {
    setFormData({
      fullName: '',
      address: '',
      whatsappNumber: '',
      salaryType: 'MONTHLY',
      baseSalary: '',
      salaryPeriod: '',
      bankAccount: ''
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-IQ').format(amount);
  };

  if (loading) {
    return <div className="loading">جاري التحميل...</div>;
  }

  return (
    <div className="trusted-persons-page">
      <div className="page-header">
        <h1>إدارة الموثوقيين</h1>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          + إضافة موثوق جديد
        </button>
      </div>

      <div className="filters">
        <button
          className={`filter-btn ${filterActive === undefined ? 'active' : ''}`}
          onClick={() => setFilterActive(undefined)}
        >
          الكل ({trustedPersons.length})
        </button>
        <button
          className={`filter-btn ${filterActive === true ? 'active' : ''}`}
          onClick={() => setFilterActive(true)}
        >
          النشطين
        </button>
        <button
          className={`filter-btn ${filterActive === false ? 'active' : ''}`}
          onClick={() => setFilterActive(false)}
        >
          غير النشطين
        </button>
      </div>

      <div className="trusted-persons-grid">
        {trustedPersons.map((person) => (
          <div key={person.id} className={`person-card ${!person.isActive ? 'inactive' : ''}`}>
            <div className="card-header">
              <h3>{person.fullName}</h3>
              <span className={`status-badge ${person.isActive ? 'active' : 'inactive'}`}>
                {person.isActive ? 'نشط' : 'غير نشط'}
              </span>
            </div>
            <div className="card-body">
              <div className="info-row">
                <span className="label">العنوان:</span>
                <span className="value">{person.address}</span>
              </div>
              <div className="info-row">
                <span className="label">واتساب:</span>
                <span className="value">{person.whatsappNumber}</span>
              </div>
              <div className="info-row">
                <span className="label">نوع الراتب:</span>
                <span className="value">
                  {person.salaryType === 'MONTHLY' ? 'شهري' : 'نصف شهري'}
                </span>
              </div>
              <div className="info-row">
                <span className="label">الراتب الأساسي:</span>
                <span className="value highlight">{formatCurrency(person.baseSalary)} IQD</span>
              </div>
              {person.bankAccount && (
                <div className="info-row">
                  <span className="label">الحساب البنكي:</span>
                  <span className="value">{person.bankAccount}</span>
                </div>
              )}
            </div>
            <div className="card-actions">
              <button
                className="btn btn-small btn-info"
                onClick={() => navigate(`/trusted-persons/${person.id}`)}
              >
                التفاصيل
              </button>
              <button
                className="btn btn-small btn-secondary"
                onClick={() => toggleStatus(person.id)}
              >
                {person.isActive ? 'تعطيل' : 'تفعيل'}
              </button>
              <button
                className="btn btn-small btn-danger"
                onClick={() => deletePerson(person.id)}
              >
                حذف
              </button>
            </div>
          </div>
        ))}
      </div>

      {trustedPersons.length === 0 && (
        <div className="empty-state">
          <p>لا يوجد موثوقين حالياً</p>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            إضافة موثوق جديد
          </button>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>إضافة موثوق جديد</h2>
              <button className="close-btn" onClick={() => setShowModal(false)}>
                ×
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>الاسم الكامل *</label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>العنوان *</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>رقم الواتساب *</label>
                <input
                  type="text"
                  value={formData.whatsappNumber}
                  onChange={(e) => setFormData({ ...formData, whatsappNumber: e.target.value })}
                  required
                  placeholder="+964XXXXXXXXXX"
                />
              </div>
              <div className="form-group">
                <label>نوع الراتب *</label>
                <select
                  value={formData.salaryType}
                  onChange={(e) => setFormData({ ...formData, salaryType: e.target.value })}
                  required
                >
                  <option value="MONTHLY">شهري</option>
                  <option value="BIWEEKLY">نصف شهري</option>
                </select>
              </div>
              <div className="form-group">
                <label>الراتب الأساسي (IQD) *</label>
                <input
                  type="number"
                  value={formData.baseSalary}
                  onChange={(e) => setFormData({ ...formData, baseSalary: e.target.value })}
                  required
                  min="0"
                  step="0.01"
                />
              </div>
              <div className="form-group">
                <label>فترة الراتب</label>
                <input
                  type="text"
                  value={formData.salaryPeriod}
                  onChange={(e) => setFormData({ ...formData, salaryPeriod: e.target.value })}
                  placeholder="مثال: اليوم 25 من كل شهر"
                />
              </div>
              <div className="form-group">
                <label>رقم الحساب البنكي</label>
                <input
                  type="text"
                  value={formData.bankAccount}
                  onChange={(e) => setFormData({ ...formData, bankAccount: e.target.value })}
                />
              </div>
              <div className="modal-actions">
                <button type="submit" className="btn btn-primary">
                  حفظ
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrustedPersons;
