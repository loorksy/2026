import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../utils/api';
import './ManualTransferDetail.css';

interface ManualTransfer {
  id: string;
  period: string;
  amount: number;
  currency: string;
  transferDate: string;
  transferMethod: string;
  recipientInfo?: string;
  status: string;
  notes?: string;
  trustedPerson: {
    id: string;
    fullName: string;
    whatsappNumber: string;
  };
  transferRecords: TransferRecord[];
}

interface TransferRecord {
  id: string;
  employeeName: string;
  amount: number;
  salaryType: string;
  description?: string;
  confirmed: boolean;
  createdAt: string;
}

const ManualTransferDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [transfer, setTransfer] = useState<ManualTransfer | null>(null);
  const [loading, setLoading] = useState(true);
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [recordForm, setRecordForm] = useState({
    employeeName: '',
    amount: '',
    salaryType: 'SALARY',
    description: ''
  });

  useEffect(() => {
    if (id) {
      fetchTransferDetail();
    }
  }, [id]);

  const fetchTransferDetail = async () => {
    try {
      setLoading(true);
      const response = await api.getManualTransferById(id!);
      setTransfer(response.data);
    } catch (error: any) {
      alert(error.message || 'حدث خطأ أثناء جلب التفاصيل');
      navigate('/manual-transfers');
    } finally {
      setLoading(false);
    }
  };

  const handleAddRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createTransferRecord({
        manualTransferId: id!,
        employeeName: recordForm.employeeName,
        amount: parseFloat(recordForm.amount),
        salaryType: recordForm.salaryType,
        description: recordForm.description
      });
      alert('تم إضافة السجل بنجاح');
      setShowRecordModal(false);
      resetRecordForm();
      fetchTransferDetail();
    } catch (error: any) {
      alert(error.message || 'حدث خطأ أثناء إضافة السجل');
    }
  };

  const handleConfirmRecord = async (recordId: string) => {
    try {
      await api.confirmTransferRecord(recordId);
      fetchTransferDetail();
    } catch (error: any) {
      alert(error.message || 'حدث خطأ أثناء تأكيد السجل');
    }
  };

  const handleDeleteRecord = async (recordId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا السجل؟')) return;
    try {
      await api.deleteTransferRecord(recordId);
      alert('تم حذف السجل بنجاح');
      fetchTransferDetail();
    } catch (error: any) {
      alert(error.message || 'حدث خطأ أثناء حذف السجل');
    }
  };

  const handleUpdateStatus = async (newStatus: string) => {
    try {
      await api.updateTransferStatus(id!, newStatus);
      alert('تم تحديث الحالة بنجاح');
      fetchTransferDetail();
    } catch (error: any) {
      alert(error.message || 'حدث خطأ أثناء تحديث الحالة');
    }
  };

  const resetRecordForm = () => {
    setRecordForm({
      employeeName: '',
      amount: '',
      salaryType: 'SALARY',
      description: ''
    });
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

  const getSalaryTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      SALARY: 'راتب',
      ADVANCE: 'سلفة',
      OTHER: 'أخرى'
    };
    return labels[type] || type;
  };

  const calculateTotals = () => {
    if (!transfer) return { totalRecords: 0, confirmedRecords: 0, remaining: 0 };
    const totalRecords = transfer.transferRecords.reduce((sum, r) => sum + Number(r.amount), 0);
    const confirmedRecords = transfer.transferRecords
      .filter(r => r.confirmed)
      .reduce((sum, r) => sum + Number(r.amount), 0);
    const remaining = Number(transfer.amount) - totalRecords;
    return { totalRecords, confirmedRecords, remaining };
  };

  if (loading) {
    return <div className="loading">جاري التحميل...</div>;
  }

  if (!transfer) {
    return <div className="error">لم يتم العثور على التحويل</div>;
  }

  const totals = calculateTotals();

  return (
    <div className="transfer-detail-page">
      <div className="detail-header">
        <button className="back-btn" onClick={() => navigate('/manual-transfers')}>
          ← العودة
        </button>
        <div className="header-actions">
          {transfer.status === 'PENDING' && (
            <button
              className="btn btn-warning"
              onClick={() => handleUpdateStatus('COMPLETED')}
            >
              تعيين كمكتمل
            </button>
          )}
          {transfer.status === 'COMPLETED' && (
            <button
              className="btn btn-success"
              onClick={() => handleUpdateStatus('VERIFIED')}
            >
              تأكيد التحويل
            </button>
          )}
        </div>
      </div>

      <div className="transfer-info-section">
        <div className="info-card">
          <div className="card-header">
            <h2>معلومات التحويل</h2>
            <span className={`status-badge status-${transfer.status.toLowerCase()}`}>
              {getStatusLabel(transfer.status)}
            </span>
          </div>
          <div className="info-grid">
            <div className="info-item">
              <span className="label">الفترة</span>
              <span className="value">{transfer.period}</span>
            </div>
            <div className="info-item">
              <span className="label">الموثوق</span>
              <span
                className="value link"
                onClick={() => navigate(`/trusted-persons/${transfer.trustedPerson.id}`)}
              >
                {transfer.trustedPerson.fullName}
              </span>
            </div>
            <div className="info-item">
              <span className="label">المبلغ الإجمالي</span>
              <span className="value highlight">
                {formatCurrency(transfer.amount)} {transfer.currency}
              </span>
            </div>
            <div className="info-item">
              <span className="label">تاريخ التحويل</span>
              <span className="value">{formatDate(transfer.transferDate)}</span>
            </div>
            <div className="info-item">
              <span className="label">طريقة التحويل</span>
              <span className="value">{getMethodLabel(transfer.transferMethod)}</span>
            </div>
            <div className="info-item">
              <span className="label">واتساب الموثوق</span>
              <span className="value">{transfer.trustedPerson.whatsappNumber}</span>
            </div>
            {transfer.recipientInfo && (
              <div className="info-item full-width">
                <span className="label">معلومات المستلم</span>
                <span className="value">{transfer.recipientInfo}</span>
              </div>
            )}
            {transfer.notes && (
              <div className="info-item full-width">
                <span className="label">ملاحظات</span>
                <span className="value">{transfer.notes}</span>
              </div>
            )}
          </div>
        </div>

        <div className="totals-card">
          <h3>ملخص المبالغ</h3>
          <div className="totals-grid">
            <div className="total-item">
              <span className="label">إجمالي السجلات</span>
              <span className="value">{formatCurrency(totals.totalRecords)} IQD</span>
            </div>
            <div className="total-item">
              <span className="label">المؤكدة</span>
              <span className="value confirmed">{formatCurrency(totals.confirmedRecords)} IQD</span>
            </div>
            <div className="total-item">
              <span className="label">المتبقي</span>
              <span className={`value ${totals.remaining < 0 ? 'negative' : 'positive'}`}>
                {formatCurrency(Math.abs(totals.remaining))} IQD
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="records-section">
        <div className="section-header">
          <h3>سجلات التسليم ({transfer.transferRecords.length})</h3>
          {transfer.status !== 'VERIFIED' && (
            <button className="btn btn-primary" onClick={() => setShowRecordModal(true)}>
              + إضافة سجل
            </button>
          )}
        </div>

        {transfer.transferRecords.length > 0 ? (
          <div className="records-table">
            <table>
              <thead>
                <tr>
                  <th>اسم الموظف</th>
                  <th>المبلغ</th>
                  <th>النوع</th>
                  <th>الوصف</th>
                  <th>مؤكد</th>
                  <th>التاريخ</th>
                  <th>الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {transfer.transferRecords.map((record) => (
                  <tr key={record.id} className={record.confirmed ? 'confirmed-row' : ''}>
                    <td className="employee-name">{record.employeeName}</td>
                    <td className="amount">{formatCurrency(record.amount)} IQD</td>
                    <td>{getSalaryTypeLabel(record.salaryType)}</td>
                    <td>{record.description || '-'}</td>
                    <td>
                      <span className={`confirm-badge ${record.confirmed ? 'confirmed' : 'pending'}`}>
                        {record.confirmed ? '✓ مؤكد' : '○ غير مؤكد'}
                      </span>
                    </td>
                    <td>{formatDate(record.createdAt)}</td>
                    <td className="actions-cell">
                      {!record.confirmed && transfer.status !== 'VERIFIED' && (
                        <button
                          className="btn btn-small btn-success"
                          onClick={() => handleConfirmRecord(record.id)}
                        >
                          تأكيد
                        </button>
                      )}
                      {transfer.status !== 'VERIFIED' && (
                        <button
                          className="btn btn-small btn-danger"
                          onClick={() => handleDeleteRecord(record.id)}
                        >
                          حذف
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <p>لا توجد سجلات تسليم بعد</p>
            {transfer.status !== 'VERIFIED' && (
              <button className="btn btn-primary" onClick={() => setShowRecordModal(true)}>
                إضافة سجل جديد
              </button>
            )}
          </div>
        )}
      </div>

      {showRecordModal && (
        <div className="modal-overlay" onClick={() => setShowRecordModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>إضافة سجل تسليم</h2>
              <button className="close-btn" onClick={() => setShowRecordModal(false)}>
                ×
              </button>
            </div>
            <form onSubmit={handleAddRecord}>
              <div className="form-group">
                <label>اسم الموظف *</label>
                <input
                  type="text"
                  value={recordForm.employeeName}
                  onChange={(e) => setRecordForm({ ...recordForm, employeeName: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>المبلغ (IQD) *</label>
                <input
                  type="number"
                  value={recordForm.amount}
                  onChange={(e) => setRecordForm({ ...recordForm, amount: e.target.value })}
                  required
                  min="0"
                  step="0.01"
                />
              </div>
              <div className="form-group">
                <label>نوع الراتب *</label>
                <select
                  value={recordForm.salaryType}
                  onChange={(e) => setRecordForm({ ...recordForm, salaryType: e.target.value })}
                  required
                >
                  <option value="SALARY">راتب</option>
                  <option value="ADVANCE">سلفة</option>
                  <option value="OTHER">أخرى</option>
                </select>
              </div>
              <div className="form-group">
                <label>الوصف</label>
                <textarea
                  value={recordForm.description}
                  onChange={(e) => setRecordForm({ ...recordForm, description: e.target.value })}
                  rows={3}
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
                    setShowRecordModal(false);
                    resetRecordForm();
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

export default ManualTransferDetail;
