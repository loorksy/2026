import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../utils/api';
import './ManualTransfers.css';

interface ManualTransfer {
  id: string;
  period: string;
  amount: number;
  currency: string;
  transferDate: string;
  transferMethod: string;
  status: string;
  trustedPerson: {
    id: string;
    fullName: string;
  };
  transferRecords?: any[];
}

const ManualTransfers: React.FC = () => {
  const navigate = useNavigate();
  const [transfers, setTransfers] = useState<ManualTransfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string | undefined>(undefined);

  useEffect(() => {
    fetchTransfers();
  }, [filterStatus]);

  const fetchTransfers = async () => {
    try {
      setLoading(true);
      const params = filterStatus ? { status: filterStatus } : {};
      const response = await api.getManualTransfers(params);
      setTransfers(response.data);
    } catch (error: any) {
      alert(error.message || 'حدث خطأ أثناء جلب التحويلات');
    } finally {
      setLoading(false);
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

  const getStatusCounts = () => {
    return {
      all: transfers.length,
      pending: transfers.filter(t => t.status === 'PENDING').length,
      completed: transfers.filter(t => t.status === 'COMPLETED').length,
      verified: transfers.filter(t => t.status === 'VERIFIED').length
    };
  };

  const counts = getStatusCounts();

  if (loading) {
    return <div className="loading">جاري التحميل...</div>;
  }

  return (
    <div className="manual-transfers-page">
      <div className="page-header">
        <h1>التحويلات اليدوية</h1>
        <button
          className="btn btn-primary"
          onClick={() => navigate('/manual-transfers/new')}
        >
          + إنشاء تحويل جديد
        </button>
      </div>

      <div className="stats-cards">
        <div className="stat-card">
          <div className="stat-label">إجمالي التحويلات</div>
          <div className="stat-value">{counts.all}</div>
        </div>
        <div className="stat-card pending">
          <div className="stat-label">قيد الانتظار</div>
          <div className="stat-value">{counts.pending}</div>
        </div>
        <div className="stat-card completed">
          <div className="stat-label">مكتملة</div>
          <div className="stat-value">{counts.completed}</div>
        </div>
        <div className="stat-card verified">
          <div className="stat-label">تم التحقق</div>
          <div className="stat-value">{counts.verified}</div>
        </div>
      </div>

      <div className="filters">
        <button
          className={`filter-btn ${filterStatus === undefined ? 'active' : ''}`}
          onClick={() => setFilterStatus(undefined)}
        >
          الكل
        </button>
        <button
          className={`filter-btn ${filterStatus === 'PENDING' ? 'active' : ''}`}
          onClick={() => setFilterStatus('PENDING')}
        >
          قيد الانتظار
        </button>
        <button
          className={`filter-btn ${filterStatus === 'COMPLETED' ? 'active' : ''}`}
          onClick={() => setFilterStatus('COMPLETED')}
        >
          مكتملة
        </button>
        <button
          className={`filter-btn ${filterStatus === 'VERIFIED' ? 'active' : ''}`}
          onClick={() => setFilterStatus('VERIFIED')}
        >
          تم التحقق
        </button>
      </div>

      <div className="transfers-table">
        {transfers.length > 0 ? (
          <table>
            <thead>
              <tr>
                <th>الفترة</th>
                <th>الموثوق</th>
                <th>المبلغ</th>
                <th>تاريخ التحويل</th>
                <th>طريقة التحويل</th>
                <th>السجلات</th>
                <th>الحالة</th>
                <th>الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {transfers.map((transfer) => (
                <tr
                  key={transfer.id}
                  onClick={() => navigate(`/manual-transfers/${transfer.id}`)}
                  className="clickable-row"
                >
                  <td className="period-cell">{transfer.period}</td>
                  <td>{transfer.trustedPerson.fullName}</td>
                  <td className="amount-cell">
                    {formatCurrency(transfer.amount)} {transfer.currency}
                  </td>
                  <td>{formatDate(transfer.transferDate)}</td>
                  <td>{getMethodLabel(transfer.transferMethod)}</td>
                  <td className="records-count">
                    {transfer.transferRecords?.length || 0} سجل
                  </td>
                  <td>
                    <span className={`status-badge status-${transfer.status.toLowerCase()}`}>
                      {getStatusLabel(transfer.status)}
                    </span>
                  </td>
                  <td className="actions-cell">
                    <button
                      className="btn btn-small btn-info"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/manual-transfers/${transfer.id}`);
                      }}
                    >
                      التفاصيل
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="empty-state">
            <p>لا توجد تحويلات</p>
            <button
              className="btn btn-primary"
              onClick={() => navigate('/manual-transfers/new')}
            >
              إنشاء تحويل جديد
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManualTransfers;
