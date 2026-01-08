import { useEffect, useState } from 'react';
import { api } from '../utils/api';
import './Reports.css';

type ReportType = 'payroll' | 'shipping' | 'profits' | 'credits' | 'companies' | 'exchange-diffs';

const Reports = () => {
  const [activeReport, setActiveReport] = useState<ReportType>('payroll');
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    status: '',
    trustedPersonId: ''
  });

  useEffect(() => {
    fetchReport();
  }, [activeReport, filters]);

  const fetchReport = async () => {
    setLoading(true);
    try {
      let response;
      switch (activeReport) {
        case 'payroll':
          response = await api.getPayrollReport(filters);
          break;
        case 'shipping':
          response = await api.getShippingReport(filters);
          break;
        case 'profits':
          response = await api.getProfitsReport(filters);
          break;
        case 'credits':
          response = await api.getCreditsReport();
          break;
        case 'companies':
          response = await api.getCompaniesReport();
          break;
        case 'exchange-diffs':
          response = await api.getExchangeDiffsReport();
          break;
      }
      if (response?.success) {
        setReportData(response.data);
      }
    } catch (error) {
      console.error('Error fetching report:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = (format: 'pdf' | 'excel' | 'csv') => {
    // Simple CSV export implementation
    if (!reportData) return;

    let csvContent = "data:text/csv;charset=utf-8,";
    
    if (activeReport === 'shipping' && reportData.shipments) {
      csvContent += "Tracking Number,Origin,Destination,Weight,Cost,Price,Status,Date\n";
      reportData.shipments.forEach((s: any) => {
        csvContent += `${s.trackingNumber},${s.origin},${s.destination},${s.weight},${s.cost},${s.price},${s.status},${s.shipmentDate}\n`;
      });
    } else if (activeReport === 'payroll' && reportData.transfers) {
      csvContent += "ID,Trusted Person,Period,Amount,Currency,Date,Status\n";
      reportData.transfers.forEach((t: any) => {
        csvContent += `${t.id},${t.trustedPerson.fullName},${t.period},${t.amount},${t.currency},${t.transferDate},${t.status}\n`;
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${activeReport}-report.csv`);
    document.body.appendChild(link);
    link.click();
  };

  const renderReportContent = () => {
    if (loading) return <div className="loading-spinner">جاري التحميل...</div>;
    if (!reportData) return <div>لا توجد بيانات</div>;

    switch (activeReport) {
      case 'payroll':
        return (
          <div className="report-table-container">
            <div className="summary-cards">
              <div className="summary-card">
                <div className="label">إجمالي المبلغ</div>
                <div className="value">{reportData.summary.totalAmount}</div>
              </div>
              <div className="summary-card">
                <div className="label">عدد التحويلات</div>
                <div className="value">{reportData.summary.totalTransfers}</div>
              </div>
              <div className="summary-card">
                <div className="label">إجمالي السجلات</div>
                <div className="value">{reportData.summary.totalRecords}</div>
              </div>
            </div>
            <table className="report-table">
              <thead>
                <tr>
                  <th>الشخص الموثوق</th>
                  <th>الفترة</th>
                  <th>المبلغ</th>
                  <th>العملة</th>
                  <th>التاريخ</th>
                  <th>الحالة</th>
                </tr>
              </thead>
              <tbody>
                {reportData.transfers.map((t: any) => (
                  <tr key={t.id}>
                    <td>{t.trustedPerson.fullName}</td>
                    <td>{t.period}</td>
                    <td>{t.amount}</td>
                    <td>{t.currency}</td>
                    <td>{new Date(t.transferDate).toLocaleDateString('ar')}</td>
                    <td>{t.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      case 'shipping':
        return (
          <div className="report-table-container">
            <div className="summary-cards">
              <div className="summary-card">
                <div className="label">إجمالي الشحنات</div>
                <div className="value">{reportData.summary.totalShipments}</div>
              </div>
              <div className="summary-card">
                <div className="label">إجمالي الوزن</div>
                <div className="value">{reportData.summary.totalWeight} كغم</div>
              </div>
              <div className="summary-card">
                <div className="label">إجمالي الأرباح</div>
                <div className="value">{reportData.summary.totalProfit}</div>
              </div>
            </div>
            <table className="report-table">
              <thead>
                <tr>
                  <th>رقم التتبع</th>
                  <th>المرسل</th>
                  <th>المستلم</th>
                  <th>المنشأ</th>
                  <th>الوجهة</th>
                  <th>الوزن</th>
                  <th>السعر</th>
                  <th>الحالة</th>
                </tr>
              </thead>
              <tbody>
                {reportData.shipments.map((s: any) => (
                  <tr key={s.id}>
                    <td>{s.trackingNumber}</td>
                    <td>{s.sender.name}</td>
                    <td>{s.receiver.name}</td>
                    <td>{s.origin}</td>
                    <td>{s.destination}</td>
                    <td>{s.weight}</td>
                    <td>{s.price}</td>
                    <td>{s.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      case 'profits':
        return (
          <div className="report-table-container">
             <div className="summary-cards">
              <div className="summary-card">
                <div className="label">إجمالي الأرباح</div>
                <div className="value">{reportData.totalProfit}</div>
              </div>
            </div>
            <div className="charts-container">
              {/* Simple CSS-based bar chart representation */}
              <div className="bar-chart">
                {reportData.monthlyProfits.map((m: any) => (
                  <div key={m.month} className="bar-group">
                    <div 
                      className="bar" 
                      style={{ height: `${(m.profit / reportData.totalProfit) * 200}px` }}
                      title={`Profit: ${m.profit}`}
                    ></div>
                    <div className="bar-label">{m.month}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      case 'credits':
        return (
          <div className="report-table-container">
            <table className="report-table">
              <thead>
                <tr>
                  <th>رقم الاعتماد</th>
                  <th>البنك</th>
                  <th>المبلغ</th>
                  <th>العملة</th>
                  <th>تاريخ الفتح</th>
                  <th>تاريخ الانتهاء</th>
                  <th>الحالة</th>
                </tr>
              </thead>
              <tbody>
                {reportData.credits.map((c: any) => (
                  <tr key={c.id}>
                    <td>{c.creditNumber}</td>
                    <td>{c.bankName}</td>
                    <td>{c.amount}</td>
                    <td>{c.currency}</td>
                    <td>{new Date(c.openDate).toLocaleDateString('ar')}</td>
                    <td>{new Date(c.expiryDate).toLocaleDateString('ar')}</td>
                    <td>{c.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      case 'companies':
        return (
          <div className="report-table-container">
            <table className="report-table">
              <thead>
                <tr>
                  <th>اسم الشركة</th>
                  <th>النوع</th>
                  <th>الشخص المسؤول</th>
                  <th>الهاتف</th>
                  <th>عدد الشحنات المرسلة</th>
                  <th>عدد الشحنات المستلمة</th>
                </tr>
              </thead>
              <tbody>
                {reportData.map((c: any) => (
                  <tr key={c.id}>
                    <td>{c.name}</td>
                    <td>{c.type}</td>
                    <td>{c.contactPerson}</td>
                    <td>{c.phone}</td>
                    <td>{c._count.sentShipments}</td>
                    <td>{c._count.receivedShipments}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      case 'exchange-diffs':
        return (
          <div className="report-table-container">
            <table className="report-table">
              <thead>
                <tr>
                  <th>من عملة</th>
                  <th>إلى عملة</th>
                  <th>السعر</th>
                  <th>التاريخ</th>
                </tr>
              </thead>
              <tbody>
                {reportData.map((e: any) => (
                  <tr key={e.id}>
                    <td>{e.fromCurrency}</td>
                    <td>{e.toCurrency}</td>
                    <td>{e.rate}</td>
                    <td>{new Date(e.date).toLocaleString('ar')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      default:
        return <div>تقرير تحت الإنشاء</div>;
    }
  };

  return (
    <div className="reports-page">
      <div className="container">
        <div className="reports-header">
          <h1>نظام التقارير الشامل</h1>
          <div className="export-buttons">
            <button onClick={() => handleExport('csv')} className="btn btn-secondary">تصدير CSV</button>
            <button disabled className="btn btn-secondary">تصدير Excel</button>
            <button disabled className="btn btn-secondary">تصدير PDF</button>
          </div>
        </div>

        <div className="reports-tabs">
          <button 
            className={`tab ${activeReport === 'payroll' ? 'active' : ''}`}
            onClick={() => setActiveReport('payroll')}
          >تقارير الرواتب</button>
          <button 
            className={`tab ${activeReport === 'shipping' ? 'active' : ''}`}
            onClick={() => setActiveReport('shipping')}
          >تقارير الشحن</button>
          <button 
            className={`tab ${activeReport === 'profits' ? 'active' : ''}`}
            onClick={() => setActiveReport('profits')}
          >تقارير الأرباح</button>
          <button 
            className={`tab ${activeReport === 'credits' ? 'active' : ''}`}
            onClick={() => setActiveReport('credits')}
          >تقارير الاعتمادات</button>
          <button 
            className={`tab ${activeReport === 'companies' ? 'active' : ''}`}
            onClick={() => setActiveReport('companies')}
          >تقارير الشركات</button>
          <button 
            className={`tab ${activeReport === 'exchange-diffs' ? 'active' : ''}`}
            onClick={() => setActiveReport('exchange-diffs')}
          >فروقات الصرف</button>
        </div>

        <div className="report-filters">
          <div className="filter-group">
            <label>من تاريخ</label>
            <input 
              type="date" 
              value={filters.startDate} 
              onChange={(e) => setFilters({...filters, startDate: e.target.value})}
            />
          </div>
          <div className="filter-group">
            <label>إلى تاريخ</label>
            <input 
              type="date" 
              value={filters.endDate} 
              onChange={(e) => setFilters({...filters, endDate: e.target.value})}
            />
          </div>
        </div>

        <div className="report-content">
          {renderReportContent()}
        </div>
      </div>
    </div>
  );
};

export default Reports;
