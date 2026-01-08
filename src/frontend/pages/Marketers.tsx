import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../utils/api';
import { Marketer, MarketerStats } from '../types';
import './ListPage.css';

const Marketers: React.FC = () => {
  const navigate = useNavigate();
  const [marketers, setMarketers] = useState<Marketer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingMarketer, setEditingMarketer] = useState<Marketer | null>(null);
  const [filterActive, setFilterActive] = useState<boolean | undefined>(undefined);
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState<MarketerStats | null>(null);
  const [marketingMethods, setMarketingMethods] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    fullName: '',
    numberOfPeople: '',
    marketingMethods: [] as string[],
    marketingSalary: '',
    profitPerCustomer: ''
  });

  const allMarketingMethods = ['facebook', 'instagram', 'whatsapp', 'other'];

  useEffect(() => {
    fetchMarketers();
    fetchStats();
    fetchMarketingMethods();
  }, [filterActive, searchTerm]);

  const fetchMarketers = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (filterActive !== undefined) params.isActive = filterActive;
      if (searchTerm) params.search = searchTerm;
      const response = await api.getMarketers(params);
      setMarketers(response.data);
    } catch (error: any) {
      alert(error.message || 'حدث خطأ أثناء جلب المسوقين');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.getMarketerStats();
      setStats(response.data);
    } catch (error: any) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const fetchMarketingMethods = async () => {
    try {
      const response = await api.getMarketingMethods();
      setMarketingMethods(response.data);
    } catch (error: any) {
      console.error('Failed to fetch marketing methods:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = {
        fullName: formData.fullName,
        numberOfPeople: parseInt(formData.numberOfPeople) || 0,
        marketingMethods: formData.marketingMethods,
        marketingSalary: parseFloat(formData.marketingSalary) || 0,
        profitPerCustomer: parseFloat(formData.profitPerCustomer) || 0
      };

      if (editingMarketer) {
        await api.updateMarketer(editingMarketer.id, data);
        alert('تم تحديث المسوق بنجاح');
      } else {
        await api.createMarketer(data);
        alert('تم إنشاء المسوق بنجاح');
      }
      setShowModal(false);
      resetForm();
      fetchMarketers();
      fetchStats();
    } catch (error: any) {
      alert(error.message || 'حدث خطأ أثناء حفظ المسوق');
    }
  };

  const handleEdit = (marketer: Marketer) => {
    setEditingMarketer(marketer);
    setFormData({
      fullName: marketer.fullName,
      numberOfPeople: marketer.numberOfPeople.toString(),
      marketingMethods: marketer.marketingMethods || [],
      marketingSalary: marketer.marketingSalary.toString(),
      profitPerCustomer: marketer.profitPerCustomer.toString()
    });
    setShowModal(true);
  };

  const toggleStatus = async (id: string) => {
    try {
      await api.toggleMarketerStatus(id);
      fetchMarketers();
    } catch (error: any) {
      alert(error.message || 'حدث خطأ أثناء تغيير الحالة');
    }
  };

  const deleteMarketer = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا المسوق؟')) return;
    try {
      await api.deleteMarketer(id);
      alert('تم حذف المسوق بنجاح');
      fetchMarketers();
      fetchStats();
    } catch (error: any) {
      alert(error.message || 'حدث خطأ أثناء حذف المسوق');
    }
  };

  const resetForm = () => {
    setEditingMarketer(null);
    setFormData({
      fullName: '',
      numberOfPeople: '',
      marketingMethods: [],
      marketingSalary: '',
      profitPerCustomer: ''
    });
  };

  const handleMethodChange = (method: string) => {
    const newMethods = formData.marketingMethods.includes(method)
      ? formData.marketingMethods.filter(m => m !== method)
      : [...formData.marketingMethods, method];
    setFormData({ ...formData, marketingMethods: newMethods });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-IQ').format(amount);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('ar-IQ');
  };

  const getMethodLabel = (method: string) => {
    const labels: Record<string, string> = {
      facebook: 'فيسبوك',
      instagram: 'إنستغرام',
      whatsapp: 'واتساب',
      other: 'أخرى'
    };
    return labels[method] || method;
  };

  if (loading) {
    return <div className="loading">جاري التحميل...</div>;
  }

  return (
    <div className="list-page">
      <div className="page-header">
        <h1>إدارة المسوقين</h1>
        <button className="btn btn-primary" onClick={() => { resetForm(); setShowModal(true); }}>
          + إضافة مسوق جديد
        </button>
      </div>

      {stats && (
        <div className="stats-bar">
          <div className="stat-item">
            <span className="stat-label">عدد المسوقين</span>
            <span className="stat-value">{stats.totalMarketers}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">إجمالي العملاء</span>
            <span className="stat-value">{stats.totalPeople}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">إجمالي الرواتب</span>
            <span className="stat-value">{formatCurrency(stats.totalMarketingSalary)} IQD</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">إجمالي الأرباح</span>
            <span className="stat-value">{formatCurrency(stats.totalProfit)} IQD</span>
          </div>
        </div>
      )}

      <div className="filters-bar">
        <div className="search-box">
          <input
            type="text"
            placeholder="بحث بالاسم..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-buttons">
          <button
            className={`filter-btn ${filterActive === undefined ? 'active' : ''}`}
            onClick={() => setFilterActive(undefined)}
          >
            الكل ({marketers.length})
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
        {marketers.map((marketer) => (
          <div key={marketer.id} className={`data-card ${!marketer.isActive ? 'inactive' : ''}`}>
            <div className="card-header">
              <h3>{marketer.fullName}</h3>
              <span className={`status-badge ${marketer.isActive ? 'active' : 'inactive'}`}>
                {marketer.isActive ? 'نشط' : 'غير نشط'}
              </span>
            </div>
            <div className="card-body">
              <div className="info-row">
                <span className="label">عدد العملاء:</span>
                <span className="value">{marketer.numberOfPeople}</span>
              </div>
              <div className="info-row">
                <span className="label">طرق التسويق:</span>
                <span className="value">
                  {marketer.marketingMethods && marketer.marketingMethods.length > 0
                    ? marketer.marketingMethods.map(m => getMethodLabel(m)).join(', ')
                    : '-'}
                </span>
              </div>
              <div className="info-row">
                <span className="label">راتب التسويق:</span>
                <span className="value highlight">{formatCurrency(marketer.marketingSalary)} IQD</span>
              </div>
              <div className="info-row">
                <span className="label">الربح لكل عميل:</span>
                <span className="value">{formatCurrency(marketer.profitPerCustomer)} IQD</span>
              </div>
              <div className="info-row">
                <span className="label">الربح الإجمالي:</span>
                <span className="value highlight">
                  {formatCurrency(marketer.numberOfPeople * marketer.profitPerCustomer)} IQD
                </span>
              </div>
              <div className="info-row">
                <span className="label">تاريخ الإنشاء:</span>
                <span className="value">{formatDate(marketer.createdAt)}</span>
              </div>
            </div>
            <div className="card-actions">
              <button className="btn btn-small btn-info" onClick={() => navigate(`/marketers/${marketer.id}`)}>
                التفاصيل
              </button>
              <button className="btn btn-small btn-secondary" onClick={() => handleEdit(marketer)}>
                تعديل
              </button>
              <button className="btn btn-small btn-warning" onClick={() => toggleStatus(marketer.id)}>
                {marketer.isActive ? 'تعطيل' : 'تفعيل'}
              </button>
              <button className="btn btn-small btn-danger" onClick={() => deleteMarketer(marketer.id)}>
                حذف
              </button>
            </div>
          </div>
        ))}
      </div>

      {marketers.length === 0 && (
        <div className="empty-state">
          <p>لا يوجد مسوقين حالياً</p>
          <button className="btn btn-primary" onClick={() => { resetForm(); setShowModal(true); }}>
            إضافة مسوق جديد
          </button>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingMarketer ? 'تعديل المسوق' : 'إضافة مسوق جديد'}</h2>
              <button className="close-btn" onClick={() => setShowModal(false)}>×</button>
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
                <label>عدد العملاء</label>
                <input
                  type="number"
                  min="0"
                  value={formData.numberOfPeople}
                  onChange={(e) => setFormData({ ...formData, numberOfPeople: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>طرق التسويق</label>
                <div className="checkbox-group">
                  {allMarketingMethods.map((method) => (
                    <label key={method} className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={formData.marketingMethods.includes(method)}
                        onChange={() => handleMethodChange(method)}
                      />
                      {getMethodLabel(method)}
                    </label>
                  ))}
                </div>
              </div>
              <div className="form-group">
                <label>راتب التسويق (IQD)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.marketingSalary}
                  onChange={(e) => setFormData({ ...formData, marketingSalary: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>الربح لكل عميل (IQD)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.profitPerCustomer}
                  onChange={(e) => setFormData({ ...formData, profitPerCustomer: e.target.value })}
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

export default Marketers;
