import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../utils/api';
import { Host } from '../types';
import './ListPage.css';

const Hosts: React.FC = () => {
  const navigate = useNavigate();
  const [hosts, setHosts] = useState<Host[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingHost, setEditingHost] = useState<Host | null>(null);
  const [filterActive, setFilterActive] = useState<boolean | undefined>(undefined);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    fullName: '',
    agencyName: '',
    address: '',
    whatsappNumber: '',
    notes: ''
  });

  useEffect(() => {
    fetchHosts();
  }, [filterActive, searchTerm]);

  const fetchHosts = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (filterActive !== undefined) params.isActive = filterActive;
      if (searchTerm) params.search = searchTerm;
      const response = await api.getHosts(params);
      setHosts(response.data);
    } catch (error: any) {
      alert(error.message || 'حدث خطأ أثناء جلب المضيفين');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingHost) {
        await api.updateHost(editingHost.id, formData);
        alert('تم تحديث المضيف بنجاح');
      } else {
        await api.createHost(formData);
        alert('تم إنشاء المضيف بنجاح');
      }
      setShowModal(false);
      resetForm();
      fetchHosts();
    } catch (error: any) {
      alert(error.message || 'حدث خطأ أثناء حفظ المضيف');
    }
  };

  const handleEdit = (host: Host) => {
    setEditingHost(host);
    setFormData({
      fullName: host.fullName,
      agencyName: host.agencyName,
      address: host.address,
      whatsappNumber: host.whatsappNumber,
      notes: host.notes || ''
    });
    setShowModal(true);
  };

  const toggleStatus = async (id: string) => {
    try {
      await api.toggleHostStatus(id);
      fetchHosts();
    } catch (error: any) {
      alert(error.message || 'حدث خطأ أثناء تغيير الحالة');
    }
  };

  const deleteHost = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا المضيف؟')) return;
    try {
      await api.deleteHost(id);
      alert('تم حذف المضيف بنجاح');
      fetchHosts();
    } catch (error: any) {
      alert(error.message || 'حدث خطأ أثناء حذف المضيف');
    }
  };

  const resetForm = () => {
    setEditingHost(null);
    setFormData({
      fullName: '',
      agencyName: '',
      address: '',
      whatsappNumber: '',
      notes: ''
    });
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('ar-IQ');
  };

  if (loading) {
    return <div className="loading">جاري التحميل...</div>;
  }

  return (
    <div className="list-page">
      <div className="page-header">
        <h1>إدارة المضيفين</h1>
        <button className="btn btn-primary" onClick={() => { resetForm(); setShowModal(true); }}>
          + إضافة مضيف جديد
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
            الكل ({hosts.length})
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
        {hosts.map((host) => (
          <div key={host.id} className={`data-card ${!host.isActive ? 'inactive' : ''}`}>
            <div className="card-header">
              <h3>{host.fullName}</h3>
              <span className={`status-badge ${host.isActive ? 'active' : 'inactive'}`}>
                {host.isActive ? 'نشط' : 'غير نشط'}
              </span>
            </div>
            <div className="card-body">
              <div className="info-row">
                <span className="label">اسم الوكالة:</span>
                <span className="value">{host.agencyName}</span>
              </div>
              <div className="info-row">
                <span className="label">العنوان:</span>
                <span className="value">{host.address}</span>
              </div>
              <div className="info-row">
                <span className="label">رقم الواتساب:</span>
                <span className="value">{host.whatsappNumber}</span>
              </div>
              {host.notes && (
                <div className="info-row">
                  <span className="label">ملاحظات:</span>
                  <span className="value">{host.notes}</span>
                </div>
              )}
              <div className="info-row">
                <span className="label">تاريخ الإنشاء:</span>
                <span className="value">{formatDate(host.createdAt)}</span>
              </div>
            </div>
            <div className="card-actions">
              <button className="btn btn-small btn-info" onClick={() => navigate(`/hosts/${host.id}`)}>
                التفاصيل
              </button>
              <button className="btn btn-small btn-secondary" onClick={() => handleEdit(host)}>
                تعديل
              </button>
              <button className="btn btn-small btn-warning" onClick={() => toggleStatus(host.id)}>
                {host.isActive ? 'تعطيل' : 'تفعيل'}
              </button>
              <button className="btn btn-small btn-danger" onClick={() => deleteHost(host.id)}>
                حذف
              </button>
            </div>
          </div>
        ))}
      </div>

      {hosts.length === 0 && (
        <div className="empty-state">
          <p>لا يوجد مضيفين حالياً</p>
          <button className="btn btn-primary" onClick={() => { resetForm(); setShowModal(true); }}>
            إضافة مضيف جديد
          </button>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingHost ? 'تعديل المضيف' : 'إضافة مضيف جديد'}</h2>
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
                <label>اسم الوكالة *</label>
                <input
                  type="text"
                  value={formData.agencyName}
                  onChange={(e) => setFormData({ ...formData, agencyName: e.target.value })}
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

export default Hosts;
