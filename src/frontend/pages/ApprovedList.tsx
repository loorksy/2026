import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../utils/api';
import { Approved } from '../types';
import './ListPage.css';

const ApprovedList: React.FC = () => {
  const navigate = useNavigate();
  const [approved, setApproved] = useState<Approved[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingApproved, setEditingApproved] = useState<Approved | null>(null);
  const [filterActive, setFilterActive] = useState<boolean | undefined>(undefined);
  const [searchTerm, setSearchTerm] = useState('');
  const [countries, setCountries] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    approvedName: '',
    whatsappNumber: '',
    amount: '',
    approvalDate: '',
    numberOfUsers: '',
    countries: [] as string[],
    address: '',
    notes: ''
  });

  useEffect(() => {
    fetchApproved();
    fetchCountries();
  }, [filterActive, searchTerm]);

  const fetchApproved = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (filterActive !== undefined) params.isActive = filterActive;
      if (searchTerm) params.search = searchTerm;
      const response = await api.getApproved(params);
      setApproved(response.data);
    } catch (error: any) {
      alert(error.message || 'حدث خطأ أثناء جلب المعتمدين');
    } finally {
      setLoading(false);
    }
  };

  const fetchCountries = async () => {
    try {
      const response = await api.getApprovedCountries();
      setCountries(response.data);
    } catch (error: any) {
      console.error('Failed to fetch countries:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = {
        approvedName: formData.approvedName,
        whatsappNumber: formData.whatsappNumber,
        amount: parseFloat(formData.amount),
        approvalDate: formData.approvalDate || undefined,
        numberOfUsers: parseInt(formData.numberOfUsers) || 0,
        countries: formData.countries,
        address: formData.address,
        notes: formData.notes
      };

      if (editingApproved) {
        await api.updateApproved(editingApproved.id, data);
        alert('تم تحديث المعتمد بنجاح');
      } else {
        await api.createApproved(data);
        alert('تم إنشاء المعتمد بنجاح');
      }
      setShowModal(false);
      resetForm();
      fetchApproved();
    } catch (error: any) {
      alert(error.message || 'حدث خطأ أثناء حفظ المعتمد');
    }
  };

  const handleEdit = (item: Approved) => {
    setEditingApproved(item);
    setFormData({
      approvedName: item.approvedName,
      whatsappNumber: item.whatsappNumber,
      amount: item.amount.toString(),
      approvalDate: item.approvalDate ? item.approvalDate.split('T')[0] : '',
      numberOfUsers: item.numberOfUsers.toString(),
      countries: item.countries || [],
      address: item.address || '',
      notes: item.notes || ''
    });
    setShowModal(true);
  };

  const toggleStatus = async (id: string) => {
    try {
      await api.toggleApprovedStatus(id);
      fetchApproved();
    } catch (error: any) {
      alert(error.message || 'حدث خطأ أثناء تغيير الحالة');
    }
  };

  const deleteApproved = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا المعتمد؟')) return;
    try {
      await api.deleteApproved(id);
      alert('تم حذف المعتمد بنجاح');
      fetchApproved();
    } catch (error: any) {
      alert(error.message || 'حدث خطأ أثناء حذف المعتمد');
    }
  };

  const resetForm = () => {
    setEditingApproved(null);
    setFormData({
      approvedName: '',
      whatsappNumber: '',
      amount: '',
      approvalDate: '',
      numberOfUsers: '',
      countries: [],
      address: '',
      notes: ''
    });
  };

  const handleCountryChange = (country: string) => {
    const newCountries = formData.countries.includes(country)
      ? formData.countries.filter(c => c !== country)
      : [...formData.countries, country];
    setFormData({ ...formData, countries: newCountries });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-IQ').format(amount);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('ar-IQ');
  };

  const availableCountries = ['العراق', 'ايران', 'تركيا', 'سوريا', 'لبنان', 'الأردن', 'مصر', 'الإمارات', 'السعودية'];

  if (loading) {
    return <div className="loading">جاري التحميل...</div>;
  }

  return (
    <div className="list-page">
      <div className="page-header">
        <h1>إدارة المعتمدين</h1>
        <button className="btn btn-primary" onClick={() => { resetForm(); setShowModal(true); }}>
          + إضافة معتمد جديد
        </button>
      </div>

      <div className="filters-bar">
        <div className="search-box">
          <input
            type="text"
            placeholder="بحث بالاسم أو رقم الواتساب..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-buttons">
          <button
            className={`filter-btn ${filterActive === undefined ? 'active' : ''}`}
            onClick={() => setFilterActive(undefined)}
          >
            الكل ({approved.length})
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
      </div>

      <div className="data-grid">
        {approved.map((item) => (
          <div key={item.id} className={`data-card ${!item.isActive ? 'inactive' : ''}`}>
            <div className="card-header">
              <h3>{item.approvedName}</h3>
              <span className={`status-badge ${item.isActive ? 'active' : 'inactive'}`}>
                {item.isActive ? 'نشط' : 'غير نشط'}
              </span>
            </div>
            <div className="card-body">
              <div className="info-row">
                <span className="label">رقم الواتساب:</span>
                <span className="value">{item.whatsappNumber}</span>
              </div>
              <div className="info-row">
                <span className="label">المبلغ:</span>
                <span className="value highlight">{formatCurrency(item.amount)} IQD</span>
              </div>
              <div className="info-row">
                <span className="label">تاريخ الاعتماد:</span>
                <span className="value">{item.approvalDate ? formatDate(item.approvalDate) : '-'}</span>
              </div>
              <div className="info-row">
                <span className="label">عدد المستخدمين:</span>
                <span className="value">{item.numberOfUsers}</span>
              </div>
              <div className="info-row">
                <span className="label">الدول:</span>
                <span className="value">
                  {item.countries && item.countries.length > 0 ? item.countries.join(', ') : '-'}
                </span>
              </div>
              {item.address && (
                <div className="info-row">
                  <span className="label">العنوان:</span>
                  <span className="value">{item.address}</span>
                </div>
              )}
              <div className="info-row">
                <span className="label">تاريخ الإنشاء:</span>
                <span className="value">{formatDate(item.createdAt)}</span>
              </div>
            </div>
            <div className="card-actions">
              <button className="btn btn-small btn-info" onClick={() => navigate(`/approved/${item.id}`)}>
                التفاصيل
              </button>
              <button className="btn btn-small btn-secondary" onClick={() => handleEdit(item)}>
                تعديل
              </button>
              <button className="btn btn-small btn-warning" onClick={() => toggleStatus(item.id)}>
                {item.isActive ? 'تعطيل' : 'تفعيل'}
              </button>
              <button className="btn btn-small btn-danger" onClick={() => deleteApproved(item.id)}>
                حذف
              </button>
            </div>
          </div>
        ))}
      </div>

      {approved.length === 0 && (
        <div className="empty-state">
          <p>لا يوجد معتمدين حالياً</p>
          <button className="btn btn-primary" onClick={() => { resetForm(); setShowModal(true); }}>
            إضافة معتمد جديد
          </button>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingApproved ? 'تعديل المعتمد' : 'إضافة معتمد جديد'}</h2>
              <button className="close-btn" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>اسم المعتمد *</label>
                <input
                  type="text"
                  value={formData.approvedName}
                  onChange={(e) => setFormData({ ...formData, approvedName: e.target.value })}
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
                <label>المبلغ (IQD) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>تاريخ الاعتماد</label>
                <input
                  type="date"
                  value={formData.approvalDate}
                  onChange={(e) => setFormData({ ...formData, approvalDate: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>عدد المستخدمين</label>
                <input
                  type="number"
                  min="0"
                  value={formData.numberOfUsers}
                  onChange={(e) => setFormData({ ...formData, numberOfUsers: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>الدول</label>
                <div className="checkbox-group">
                  {availableCountries.map((country) => (
                    <label key={country} className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={formData.countries.includes(country)}
                        onChange={() => handleCountryChange(country)}
                      />
                      {country}
                    </label>
                  ))}
                </div>
              </div>
              <div className="form-group">
                <label>العنوان</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>ملاحظات</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="modal-actions">
                <button type="submit" className="btn btn-primary">حفظ</button>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApprovedList;
