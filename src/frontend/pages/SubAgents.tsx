import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../utils/api';
import { SubAgent } from '../types';
import './ListPage.css';

const SubAgents: React.FC = () => {
  const navigate = useNavigate();
  const [subAgents, setSubAgents] = useState<SubAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSubAgent, setEditingSubAgent] = useState<SubAgent | null>(null);
  const [filterActive, setFilterActive] = useState<boolean | undefined>(undefined);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    roomId: '',
    activationCode: '',
    whatsappNumber: '',
    commissionRate: '',
    agencyName: '',
    numberOfUsers: '',
    notes: ''
  });

  useEffect(() => {
    fetchSubAgents();
  }, [filterActive, searchTerm]);

  const fetchSubAgents = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (filterActive !== undefined) params.isActive = filterActive;
      if (searchTerm) params.search = searchTerm;
      const response = await api.getSubAgents(params);
      setSubAgents(response.data);
    } catch (error: any) {
      alert(error.message || 'حدث خطأ أثناء جلب الوكلاء الفرعيين');
    } finally {
      setLoading(false);
    }
  };

  const generateActivationCode = () => {
    const code = Math.random().toString(36).substring(2, 10).toUpperCase();
    setFormData({ ...formData, activationCode: code });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = {
        roomId: formData.roomId,
        activationCode: formData.activationCode,
        whatsappNumber: formData.whatsappNumber,
        commissionRate: parseFloat(formData.commissionRate),
        agencyName: formData.agencyName,
        numberOfUsers: parseInt(formData.numberOfUsers) || 0,
        notes: formData.notes
      };

      if (editingSubAgent) {
        await api.updateSubAgent(editingSubAgent.id, data);
        alert('تم تحديث الوكيل الفرعي بنجاح');
      } else {
        await api.createSubAgent(data);
        alert('تم إنشاء الوكيل الفرعي بنجاح');
      }
      setShowModal(false);
      resetForm();
      fetchSubAgents();
    } catch (error: any) {
      alert(error.message || 'حدث خطأ أثناء حفظ الوكيل الفرعي');
    }
  };

  const handleEdit = (subAgent: SubAgent) => {
    setEditingSubAgent(subAgent);
    setFormData({
      roomId: subAgent.roomId,
      activationCode: subAgent.activationCode,
      whatsappNumber: subAgent.whatsappNumber,
      commissionRate: subAgent.commissionRate.toString(),
      agencyName: subAgent.agencyName,
      numberOfUsers: subAgent.numberOfUsers.toString(),
      notes: subAgent.notes || ''
    });
    setShowModal(true);
  };

  const toggleStatus = async (id: string) => {
    try {
      await api.toggleSubAgentStatus(id);
      fetchSubAgents();
    } catch (error: any) {
      alert(error.message || 'حدث خطأ أثناء تغيير الحالة');
    }
  };

  const regenerateCode = async (id: string) => {
    if (!confirm('هل أنت متأكد من إعادة توليد رمز التفعيل؟')) return;
    try {
      const response = await api.regenerateSubAgentCode(id);
      alert(`رمز التفعيل الجديد: ${response.data.activationCode}`);
      fetchSubAgents();
    } catch (error: any) {
      alert(error.message || 'حدث خطأ أثناء إعادة التوليد');
    }
  };

  const deleteSubAgent = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الوكيل الفرعي؟')) return;
    try {
      await api.deleteSubAgent(id);
      alert('تم حذف الوكيل الفرعي بنجاح');
      fetchSubAgents();
    } catch (error: any) {
      alert(error.message || 'حدث خطأ أثناء حذف الوكيل الفرعي');
    }
  };

  const resetForm = () => {
    setEditingSubAgent(null);
    setFormData({
      roomId: '',
      activationCode: '',
      whatsappNumber: '',
      commissionRate: '',
      agencyName: '',
      numberOfUsers: '',
      notes: ''
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-IQ').format(amount);
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
        <h1>إدارة الوكلاء الفرعيين</h1>
        <button className="btn btn-primary" onClick={() => { resetForm(); generateActivationCode(); setShowModal(true); }}>
          + إضافة وكيل فرعي جديد
        </button>
      </div>

      <div className="filters-bar">
        <div className="search-box">
          <input
            type="text"
            placeholder="بحث بالاسم أو رقم الغرفة..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-buttons">
          <button
            className={`filter-btn ${filterActive === undefined ? 'active' : ''}`}
            onClick={() => setFilterActive(undefined)}
          >
            الكل ({subAgents.length})
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
        {subAgents.map((subAgent) => (
          <div key={subAgent.id} className={`data-card ${!subAgent.isActive ? 'inactive' : ''}`}>
            <div className="card-header">
              <h3>{subAgent.agencyName}</h3>
              <span className={`status-badge ${subAgent.isActive ? 'active' : 'inactive'}`}>
                {subAgent.isActive ? 'نشط' : 'غير نشط'}
              </span>
            </div>
            <div className="card-body">
              <div className="info-row">
                <span className="label">رقم الغرفة:</span>
                <span className="value">{subAgent.roomId}</span>
              </div>
              <div className="info-row">
                <span className="label">رمز التفعيل:</span>
                <span className="value code">{subAgent.activationCode}</span>
              </div>
              <div className="info-row">
                <span className="label">رقم الواتساب:</span>
                <span className="value">{subAgent.whatsappNumber}</span>
              </div>
              <div className="info-row">
                <span className="label">نسبة العمولة:</span>
                <span className="value highlight">{subAgent.commissionRate}%</span>
              </div>
              <div className="info-row">
                <span className="label">عدد المستخدمين:</span>
                <span className="value">{subAgent.numberOfUsers}</span>
              </div>
              <div className="info-row">
                <span className="label">إجمالي المبلغ:</span>
                <span className="value highlight">{formatCurrency(subAgent.totalAgencyAmount)} IQD</span>
              </div>
              <div className="info-row">
                <span className="label">تاريخ الإنشاء:</span>
                <span className="value">{formatDate(subAgent.createdAt)}</span>
              </div>
            </div>
            <div className="card-actions">
              <button className="btn btn-small btn-info" onClick={() => navigate(`/sub-agents/${subAgent.id}`)}>
                التفاصيل
              </button>
              <button className="btn btn-small btn-secondary" onClick={() => handleEdit(subAgent)}>
                تعديل
              </button>
              <button className="btn btn-small btn-warning" onClick={() => regenerateCode(subAgent.id)}>
                إعادة التوليد
              </button>
              <button className="btn btn-small btn-danger" onClick={() => deleteSubAgent(subAgent.id)}>
                حذف
              </button>
            </div>
          </div>
        ))}
      </div>

      {subAgents.length === 0 && (
        <div className="empty-state">
          <p>لا يوجد وكلاء فرعيين حالياً</p>
          <button className="btn btn-primary" onClick={() => { resetForm(); generateActivationCode(); setShowModal(true); }}>
            إضافة وكيل فرعي جديد
          </button>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingSubAgent ? 'تعديل الوكيل الفرعي' : 'إضافة وكيل فرعي جديد'}</h2>
              <button className="close-btn" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>رقم الغرفة *</label>
                <input
                  type="text"
                  value={formData.roomId}
                  onChange={(e) => setFormData({ ...formData, roomId: e.target.value })}
                  required
                  disabled={!!editingSubAgent}
                />
              </div>
              <div className="form-group">
                <label>رمز التفعيل *</label>
                <div className="input-with-button">
                  <input
                    type="text"
                    value={formData.activationCode}
                    onChange={(e) => setFormData({ ...formData, activationCode: e.target.value })}
                    required
                  />
                  {!editingSubAgent && (
                    <button type="button" className="btn btn-small btn-secondary" onClick={generateActivationCode}>
                      توليد
                    </button>
                  )}
                </div>
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
                <label>نسبة العمولة (%) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={formData.commissionRate}
                  onChange={(e) => setFormData({ ...formData, commissionRate: e.target.value })}
                  required
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

export default SubAgents;
