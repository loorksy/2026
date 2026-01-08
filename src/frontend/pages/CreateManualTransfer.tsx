import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../utils/api';
import './CreateManualTransfer.css';

interface TrustedPerson {
  id: string;
  fullName: string;
  address: string;
  whatsappNumber: string;
  baseSalary: number;
  isActive: boolean;
}

const CreateManualTransfer: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedPersonId = searchParams.get('trustedPersonId');

  const [trustedPersons, setTrustedPersons] = useState<TrustedPerson[]>([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    trustedPersonId: preselectedPersonId || '',
    period: '',
    amount: '',
    currency: 'IQD',
    transferDate: new Date().toISOString().split('T')[0],
    transferMethod: 'MANUAL_CASH',
    recipientInfo: '',
    notes: ''
  });

  useEffect(() => {
    fetchTrustedPersons();
  }, []);

  const fetchTrustedPersons = async () => {
    try {
      setLoading(false);
      const response = await api.getTrustedPersons({ isActive: true });
      setTrustedPersons(response.data);
      
      if (preselectedPersonId) {
        const selectedPerson = response.data.find((p: TrustedPerson) => p.id === preselectedPersonId);
        if (selectedPerson) {
          setFormData(prev => ({
            ...prev,
            amount: selectedPerson.baseSalary.toString()
          }));
        }
      }
    } catch (error: any) {
      alert(error.message || 'حدث خطأ أثناء جلب الموثوقيين');
    } finally {
      setLoading(false);
    }
  };

  const handlePersonChange = (personId: string) => {
    const person = trustedPersons.find(p => p.id === personId);
    setFormData({
      ...formData,
      trustedPersonId: personId,
      amount: person ? person.baseSalary.toString() : formData.amount
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await api.createManualTransfer({
        trustedPersonId: formData.trustedPersonId,
        period: formData.period,
        amount: parseFloat(formData.amount),
        currency: formData.currency,
        transferDate: formData.transferDate,
        transferMethod: formData.transferMethod,
        recipientInfo: formData.recipientInfo || undefined,
        notes: formData.notes || undefined
      });
      alert('تم إنشاء التحويل بنجاح');
      navigate(`/manual-transfers/${response.data.id}`);
    } catch (error: any) {
      alert(error.message || 'حدث خطأ أثناء إنشاء التحويل');
    }
  };

  const selectedPerson = trustedPersons.find(p => p.id === formData.trustedPersonId);

  if (loading) {
    return <div className="loading">جاري التحميل...</div>;
  }

  return (
    <div className="create-transfer-page">
      <div className="page-header">
        <button className="back-btn" onClick={() => navigate('/manual-transfers')}>
          ← العودة
        </button>
        <h1>إنشاء تحويل يدوي جديد</h1>
      </div>

      <div className="form-container">
        <form onSubmit={handleSubmit}>
          <div className="form-section">
            <h3>معلومات الموثوق</h3>
            <div className="form-group">
              <label>اختر الموثوق *</label>
              <select
                value={formData.trustedPersonId}
                onChange={(e) => handlePersonChange(e.target.value)}
                required
              >
                <option value="">-- اختر موثوق --</option>
                {trustedPersons.map((person) => (
                  <option key={person.id} value={person.id}>
                    {person.fullName} - {person.address}
                  </option>
                ))}
              </select>
            </div>

            {selectedPerson && (
              <div className="person-preview">
                <div className="preview-item">
                  <span className="label">الاسم:</span>
                  <span className="value">{selectedPerson.fullName}</span>
                </div>
                <div className="preview-item">
                  <span className="label">العنوان:</span>
                  <span className="value">{selectedPerson.address}</span>
                </div>
                <div className="preview-item">
                  <span className="label">واتساب:</span>
                  <span className="value">{selectedPerson.whatsappNumber}</span>
                </div>
                <div className="preview-item">
                  <span className="label">الراتب الأساسي:</span>
                  <span className="value highlight">
                    {new Intl.NumberFormat('ar-IQ').format(selectedPerson.baseSalary)} IQD
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="form-section">
            <h3>تفاصيل التحويل</h3>
            <div className="form-row">
              <div className="form-group">
                <label>الفترة *</label>
                <input
                  type="text"
                  value={formData.period}
                  onChange={(e) => setFormData({ ...formData, period: e.target.value })}
                  required
                  placeholder="مثال: يناير 2024"
                />
              </div>
              <div className="form-group">
                <label>تاريخ التحويل *</label>
                <input
                  type="date"
                  value={formData.transferDate}
                  onChange={(e) => setFormData({ ...formData, transferDate: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>المبلغ *</label>
                <input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  required
                  min="0"
                  step="0.01"
                />
              </div>
              <div className="form-group">
                <label>العملة *</label>
                <select
                  value={formData.currency}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                  required
                >
                  <option value="IQD">دينار عراقي (IQD)</option>
                  <option value="USD">دولار أمريكي (USD)</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>طريقة التحويل *</label>
              <div className="radio-group">
                <label className="radio-label">
                  <input
                    type="radio"
                    name="transferMethod"
                    value="MANUAL_CASH"
                    checked={formData.transferMethod === 'MANUAL_CASH'}
                    onChange={(e) => setFormData({ ...formData, transferMethod: e.target.value })}
                  />
                  <span>نقدي يدوي</span>
                </label>
                <label className="radio-label">
                  <input
                    type="radio"
                    name="transferMethod"
                    value="BANK_TRANSFER"
                    checked={formData.transferMethod === 'BANK_TRANSFER'}
                    onChange={(e) => setFormData({ ...formData, transferMethod: e.target.value })}
                  />
                  <span>تحويل بنكي</span>
                </label>
                <label className="radio-label">
                  <input
                    type="radio"
                    name="transferMethod"
                    value="CHECK"
                    checked={formData.transferMethod === 'CHECK'}
                    onChange={(e) => setFormData({ ...formData, transferMethod: e.target.value })}
                  />
                  <span>شيك</span>
                </label>
              </div>
            </div>

            <div className="form-group">
              <label>معلومات المستلم</label>
              <input
                type="text"
                value={formData.recipientInfo}
                onChange={(e) => setFormData({ ...formData, recipientInfo: e.target.value })}
                placeholder="اسم المستلم، رقم الهاتف، إلخ..."
              />
            </div>

            <div className="form-group">
              <label>ملاحظات</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={4}
                placeholder="أي ملاحظات إضافية..."
              />
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn btn-primary btn-large">
              إنشاء التحويل
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-large"
              onClick={() => navigate('/manual-transfers')}
            >
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateManualTransfer;
