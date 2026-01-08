import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../utils/api';
import './TrustedPersonDetail.css';

interface TrustedPerson {
  id: string;
  fullName: string;
  address: string;
  whatsappNumber: string;
  salaryType: string;
  baseSalary: number;
  salaryPeriod?: string;
  bankAccount?: string;
  isActive: boolean;
  createdAt: string;
  manualTransfers?: Transfer[];
}

interface Transfer {
  id: string;
  period: string;
  amount: number;
  currency: string;
  transferDate: string;
  transferMethod: string;
  status: string;
}

const TrustedPersonDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [person, setPerson] = useState<TrustedPerson | null>(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState<any>({});

  useEffect(() => {
    if (id) {
      fetchPersonDetail();
    }
  }, [id]);

  const fetchPersonDetail = async () => {
    try {
      setLoading(true);
      const response = await api.getTrustedPersonById(id!);
      setPerson(response.data);
      setFormData({
        fullName: response.data.fullName,
        address: response.data.address,
        whatsappNumber: response.data.whatsappNumber,
        salaryType: response.data.salaryType,
        baseSalary: response.data.baseSalary,
        salaryPeriod: response.data.salaryPeriod || '',
        bankAccount: response.data.bankAccount || ''
      });
    } catch (error: any) {
      alert(error.message || 'حدث خطأ أثناء جلب التفاصيل');
      navigate('/trusted-persons');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.updateTrustedPerson(id!, {
        ...formData,
        baseSalary: parseFloat(formData.baseSalary)
      });
      alert('تم تحديث البيانات بنجاح');
      setEditMode(false);
      fetchPersonDetail();
    } catch (error: any) {
      alert(error.message || 'حدث خطأ أثناء التحديث');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-IQ').format(amount);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('ar-IQ', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      PENDING: 'قيد الانتظار',
      COMPLETED: 'مكتمل',
      VERIFIED: 'تم التحقق'
    };
    return labels[status] || status;
  };

  const getMethodLabel = (method: string) => {
    const labels: Record<string, string> = {
      MANUAL_CASH: 'نقدي يدوي',
      BANK_TRANSFER: 'تحويل بنكي',
      CHECK: 'شيك'
    };
    return labels[method] || method;
  };

  if (loading) {
    return <div className="loading">جاري التحميل...</div>;
  }

  if (!person) {
    return <div className="error">لم يتم العثور على الموثوق</div>;
  }

  return (
    <div className="trusted-person-detail">
      <div className="detail-header">
        <button className="back-btn" onClick={() => navigate('/trusted-persons')}>
          ← العودة
        </button>
        <div className="header-actions">
          {!editMode && (
            <button className="btn btn-primary" onClick={() => setEditMode(true)}>
              تعديل البيانات
            </button>
          )}
          <button
            className="btn btn-success"
            onClick={() => navigate(`/manual-transfers/new?trustedPersonId=${id}`)}
          >
            إنشاء تحويل جديد
          </button>
        </div>
      </div>

      {editMode ? (
        <div className="edit-form">
          <h2>تعديل بيانات الموثوق</h2>
          <form onSubmit={handleUpdate}>
            <div className="form-row">
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
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>رقم الواتساب *</label>
                <input
                  type="text"
                  value={formData.whatsappNumber}
                  onChange={(e) => setFormData({ ...formData, whatsappNumber: e.target.value })}
                  required
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
            </div>
            <div className="form-row">
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
                />
              </div>
            </div>
            <div className="form-group">
              <label>رقم الحساب البنكي</label>
              <input
                type="text"
                value={formData.bankAccount}
                onChange={(e) => setFormData({ ...formData, bankAccount: e.target.value })}
              />
            </div>
            <div className="form-actions">
              <button type="submit" className="btn btn-primary">
                حفظ التغييرات
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setEditMode(false)}
              >
                إلغاء
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="person-info-card">
          <div className="info-header">
            <h2>{person.fullName}</h2>
            <span className={`status-badge ${person.isActive ? 'active' : 'inactive'}`}>
              {person.isActive ? 'نشط' : 'غير نشط'}
            </span>
          </div>
          <div className="info-grid">
            <div className="info-item">
              <span className="label">العنوان</span>
              <span className="value">{person.address}</span>
            </div>
            <div className="info-item">
              <span className="label">رقم الواتساب</span>
              <span className="value">{person.whatsappNumber}</span>
            </div>
            <div className="info-item">
              <span className="label">نوع الراتب</span>
              <span className="value">
                {person.salaryType === 'MONTHLY' ? 'شهري' : 'نصف شهري'}
              </span>
            </div>
            <div className="info-item">
              <span className="label">الراتب الأساسي</span>
              <span className="value highlight">{formatCurrency(person.baseSalary)} IQD</span>
            </div>
            {person.salaryPeriod && (
              <div className="info-item">
                <span className="label">فترة الراتب</span>
                <span className="value">{person.salaryPeriod}</span>
              </div>
            )}
            {person.bankAccount && (
              <div className="info-item">
                <span className="label">الحساب البنكي</span>
                <span className="value">{person.bankAccount}</span>
              </div>
            )}
            <div className="info-item">
              <span className="label">تاريخ الإضافة</span>
              <span className="value">{formatDate(person.createdAt)}</span>
            </div>
          </div>
        </div>
      )}

      <div className="transfers-section">
        <h3>آخر التحويلات</h3>
        {person.manualTransfers && person.manualTransfers.length > 0 ? (
          <div className="transfers-list">
            {person.manualTransfers.map((transfer) => (
              <div
                key={transfer.id}
                className="transfer-item"
                onClick={() => navigate(`/manual-transfers/${transfer.id}`)}
              >
                <div className="transfer-info">
                  <span className="transfer-period">{transfer.period}</span>
                  <span className="transfer-amount">
                    {formatCurrency(transfer.amount)} {transfer.currency}
                  </span>
                </div>
                <div className="transfer-meta">
                  <span className="transfer-date">{formatDate(transfer.transferDate)}</span>
                  <span className="transfer-method">{getMethodLabel(transfer.transferMethod)}</span>
                  <span className={`transfer-status status-${transfer.status.toLowerCase()}`}>
                    {getStatusLabel(transfer.status)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <p>لا توجد تحويلات لهذا الموثوق</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TrustedPersonDetail;
