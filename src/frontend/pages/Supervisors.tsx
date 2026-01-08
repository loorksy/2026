import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../utils/api';
import { Supervisor, SupervisorStats } from '../types';
import './ListPage.css';

const Supervisors: React.FC = () => {
  const navigate = useNavigate();
  const [supervisors, setSupervisors] = useState<Supervisor[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSupervisor, setEditingSupervisor] = useState<Supervisor | null>(null);
  const [filterActive, setFilterActive] = useState<boolean | undefined>(undefined);
  const [filterType, setFilterType] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState<SupervisorStats | null>(null);
  const [formData, setFormData] = useState({
    supervisorType: 'AGENCY',
    salary: '',
    salaryPeriod: 'MONTHLY',
    fullName: '',
    whatsappNumber: ''
  });

  useEffect(() => {
    fetchSupervisors();
    fetchStats();
  }, [filterActive, filterType, searchTerm]);

  const fetchSupervisors = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (filterActive !== undefined) params.isActive = filterActive;
      if (filterType) params.supervisorType = filterType;
      if (searchTerm) params.search = searchTerm;
      const response = await api.getSupervisors(params);
      setSupervisors(response.data);
    } catch (error: any) {
      alert(error.message || 'حدث خطأ أثناء جلب المشرفين');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.getSupervisorStats();
      setStats(response.data);
    } catch (error: any) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = {
        supervisorType: formData.supervisorType,
        salary: parseFloat(formData.salary),
        salaryPeriod: formData.salaryPeriod,
        fullName: formData.fullName,
        whatsappNumber: formData.whatsappNumber
      };

      if (editingSupervisor) {
        await api.updateSupervisor(editingSupervisor.id, data);
        alert('تم تحديث المشرف بنجاح');
      } else {
        await api.createSupervisor(data);
        alert('تم إنشاء المشرف بنجاح');
      }
      setShowModal(false);
      resetForm();
      fetchSupervisors();
      fetchStats();
    } catch (error: any) {
      alert(error.message || 'حدث خطأ أثناء حفظ المشرف');
    }
  };

  const handleEdit = (supervisor: Supervisor) => {
    setEditingSupervisor(supervisor);
    setFormData({
      supervisorType: supervisor.supervisorType,
      salary: supervisor.salary.toString(),
      salaryPeriod: supervisor.salaryPeriod,
      fullName: supervisor.fullName,
      whatsappNumber: supervisor.whatsappNumber
    });
    setShowModal(true);
  };

  const toggleStatus = async (id: string) => {
    try {
      await api.toggleSupervisorStatus(id);
      fetchSupervisors();
    } catch (error: any) {
      alert(error.message || 'حدث خطأ أثناء تغيير الحالة');
    }
  };

  const deleteSupervisor = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا المشرف؟')) return;
    try {
      await api.deleteSupervisor(id);
      alert('تم حذف المشرف بنجاح');
      fetchSupervisors();
      fetchStats();
    } catch (error: any) {
      alert(error.message || 'حدث خطأ أثناء حذف المشرف');
    }
  };

  const resetForm = () => {
    setEditingSupervisor(null);
    setFormData({
      supervisorType: 'AGENCY',
      salary: '',
      salaryPeriod: 'MONTHLY',
      fullName: '',
      whatsappNumber: ''
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-IQ').format(amount);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('ar-IQ');
  };

  const getSupervisorTypeLabel = (type: string) => {
    return type === 'AGENCY' ? 'وكيل' : 'واتساب';
  };

  if (loading) {
    return <div className="loading">جاري التحميل...</div>;
  }

  return (
    <div className="list-page">
      <div className="page-header">
        <h1>إدارة المشرفين</h1>
        <button className="btn btn-primary" onClick={() => { resetForm(); setShowModal(true); }}>
          + إضافة مشرف جديد
        </button>
      </div>

      {stats && (
        <div className="stats-bar">
          <div className="stat-item">
            <span className="stat-label">مشرفي الوكالات</span>
            <span className="stat-value">{stats.agencyCount}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">مشرفي الواتساب</span>
            <span className="stat-value">{stats.whatsappCount}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">إجمالي الرواتب</span>
            <span className="stat-value">{formatCurrency(stats.totalSalary)} IQD</span>
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
            الكل ({supervisors.length})
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
        <div className="filter-buttons">
          <button
            className={`filter-btn ${filterType === '' ? 'active' : ''}`}
            onClick={() => setFilterType('')}
          >
            الكل
          </button>
          <button
            className={`filter-btn ${filterType === 'AGENCY' ? 'active' : ''}`}
            onClick={() => setFilterType('AGENCY')}
          >
            الوكالات
          </button>
          <button
            className={`filter-btn ${filterType === 'WHATSAPP' ? 'active' : ''}`}
            onClick={() => setFilterType('WHATSAPP')}
          >
            الواتساب
          </button>
        </div>
      </div>

      <div className="data-grid">
        {supervisors.map((supervisor) => (
          <div key={supervisor.id} className={`data-card ${!supervisor.isActive ? 'inactive' : ''}`}>
            <div className="card-header">
              <h3>{supervisor.fullName}</h3>
              <span className={`status-badge ${supervisor.isActive ? 'active' : 'inactive'}`}>
                {supervisor.isActive ? 'نشط' : 'غير نشط'}
              </span>
            </div>
            <div className="card-body">
              <div className="info-row">
                <span className="label">النوع:</span>
                <span className="value">{getSupervisorTypeLabel(supervisor.supervisorType)}</span>
              </div>
              <div className="info-row">
                <span className="label">الراتب:</span>
                <span className="value highlight">{formatCurrency(supervisor.salary)} IQD</span>
              </div>
              <div className="info-row">
                <span className="label">فترة الراتب:</span>
                <span className="value">
                  {supervisor.salaryPeriod === 'MONTHLY' ? 'شهري' : 'نصف شهري'}
                </span>
              </div>
              <div className="info-row">
                <span className="label">رقم الواتساب:</span>
                <span className="value">{supervisor.whatsappNumber}</span>
              </div>
              <div className="info-row">
                <span className="label">تاريخ الإنشاء:</span>
                <span className="value">{formatDate(supervisor.createdAt)}</span>
              </div>
            </div>
            <div className="card-actions">
              <button className="btn btn-small btn-info" onClick={() => navigate(`/supervisors/${supervisor.id}`)}>
                التفاصيل
              </button>
              <button className="btn btn-small btn-secondary" onClick={() => handleEdit(supervisor)}>
                تعديل
              </button>
              <button className="btn btn-small btn-warning" onClick={() => toggleStatus(supervisor.id)}>
                {supervisor.isActive ? 'تعطيل' : 'تفعيل'}
              </button>
              <button className="btn btn-small btn-danger" onClick={() => deleteSupervisor(supervisor.id)}>
                حذف
              </button>
            </div>
          </div>
        ))}
      </div>

      {supervisors.length === 0 && (
        <div className="empty-state">
          <p>لا يوجد مشرفين حالياً</p>
          <button className="btn btn-primary" onClick={() => { resetForm(); setShowModal(true); }}>
            إضافة مشرف جديد
          </button>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingSupervisor ? 'تعديل المشرف' : 'إضافة مشرف جديد'}</h2>
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
                <label>نوع المشرف *</label>
                <select
                  value={formData.supervisorType}
                  onChange={(e) => setFormData({ ...formData, supervisorType: e.target.value })}
                  required
                >
                  <option value="AGENCY">وكيل</option>
                  <option value="WHATSAPP">واتساب</option>
                </select>
              </div>
              <div className="form-group">
                <label>الراتب (IQD) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.salary}
                  onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>فترة الراتب *</label>
                <select
                  value={formData.salaryPeriod}
                  onChange={(e) => setFormData({ ...formData, salaryPeriod: e.target.value })}
                  required
                >
                  <option value="MONTHLY">شهري</option>
                  <option value="BIWEEKLY">نصف شهري</option>
                </select>
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

export default Supervisors;
