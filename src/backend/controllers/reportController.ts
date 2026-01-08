import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';

const prisma = new PrismaClient();

export const getPayrollReport = async (req: AuthRequest, res: Response) => {
  try {
    const { startDate, endDate, trustedPersonId } = req.query;

    const where: any = {};
    if (startDate || endDate) {
      where.transferDate = {};
      if (startDate) where.transferDate.gte = new Date(startDate as string);
      if (endDate) where.transferDate.lte = new Date(endDate as string);
    }
    if (trustedPersonId) {
      where.trustedPersonId = trustedPersonId;
    }

    const transfers = await prisma.manualTransfer.findMany({
      where,
      include: {
        trustedPerson: true,
        transferRecords: true
      },
      orderBy: {
        transferDate: 'desc'
      }
    });

    // Aggregations
    const totalAmount = transfers.reduce((sum, t) => sum + Number(t.amount), 0);
    const totalRecords = transfers.reduce((sum, t) => sum + t.transferRecords.length, 0);
    const byCurrency = transfers.reduce((acc: any, t) => {
      acc[t.currency] = (acc[t.currency] || 0) + Number(t.amount);
      return acc;
    }, {});

    res.json({
      success: true,
      data: {
        transfers,
        summary: {
          totalTransfers: transfers.length,
          totalAmount,
          totalRecords,
          byCurrency
        }
      }
    });
  } catch (error) {
    console.error('Payroll report error:', error);
    res.status(500).json({ success: false, message: 'حدث خطأ أثناء جلب تقرير الرواتب' });
  }
};

export const getShippingReport = async (req: AuthRequest, res: Response) => {
  try {
    const { startDate, endDate, status } = req.query;

    const where: any = {};
    if (startDate || endDate) {
      where.shipmentDate = {};
      if (startDate) where.shipmentDate.gte = new Date(startDate as string);
      if (endDate) where.shipmentDate.lte = new Date(endDate as string);
    }
    if (status) {
      where.status = status;
    }

    const shipments = await prisma.shipping.findMany({
      where,
      include: {
        sender: true,
        receiver: true
      },
      orderBy: {
        shipmentDate: 'desc'
      }
    });

    const summary = {
      totalShipments: shipments.length,
      totalWeight: shipments.reduce((sum, s) => sum + Number(s.weight), 0),
      totalCost: shipments.reduce((sum, s) => sum + Number(s.cost), 0),
      totalPrice: shipments.reduce((sum, s) => sum + Number(s.price), 0),
      totalProfit: shipments.reduce((sum, s) => sum + (Number(s.price) - Number(s.cost)), 0),
      byStatus: shipments.reduce((acc: any, s) => {
        acc[s.status] = (acc[s.status] || 0) + 1;
        return acc;
      }, {})
    };

    res.json({
      success: true,
      data: {
        shipments,
        summary
      }
    });
  } catch (error) {
    console.error('Shipping report error:', error);
    res.status(500).json({ success: false, message: 'حدث خطأ أثناء جلب تقرير الشحن' });
  }
};

export const getProfitsReport = async (req: AuthRequest, res: Response) => {
  try {
    const { startDate, endDate } = req.query;

    const where: any = {};
    if (startDate || endDate) {
      where.shipmentDate = {};
      if (startDate) where.shipmentDate.gte = new Date(startDate as string);
      if (endDate) where.shipmentDate.lte = new Date(endDate as string);
    }

    const shipments = await prisma.shipping.findMany({
      where,
      select: {
        shipmentDate: true,
        cost: true,
        price: true
      }
    });

    // Group by month
    const profitsByMonth = shipments.reduce((acc: any, s) => {
      const month = s.shipmentDate.toISOString().substring(0, 7); // YYYY-MM
      if (!acc[month]) {
        acc[month] = { month, profit: 0, revenue: 0, cost: 0 };
      }
      const profit = Number(s.price) - Number(s.cost);
      acc[month].profit += profit;
      acc[month].revenue += Number(s.price);
      acc[month].cost += Number(s.cost);
      return acc;
    }, {});

    res.json({
      success: true,
      data: {
        monthlyProfits: Object.values(profitsByMonth),
        totalProfit: shipments.reduce((sum, s) => sum + (Number(s.price) - Number(s.cost)), 0)
      }
    });
  } catch (error) {
    console.error('Profits report error:', error);
    res.status(500).json({ success: false, message: 'حدث خطأ أثناء جلب تقرير الأرباح' });
  }
};

export const getCreditsReport = async (req: AuthRequest, res: Response) => {
  try {
    const credits = await prisma.credit.findMany({
      orderBy: {
        openDate: 'desc'
      }
    });

    const summary = {
      totalCredits: credits.length,
      totalAmount: credits.reduce((sum, c) => sum + Number(c.amount), 0),
      byStatus: credits.reduce((acc: any, c) => {
        acc[c.status] = (acc[c.status] || 0) + 1;
        return acc;
      }, {})
    };

    res.json({
      success: true,
      data: {
        credits,
        summary
      }
    });
  } catch (error) {
    console.error('Credits report error:', error);
    res.status(500).json({ success: false, message: 'حدث خطأ أثناء جلب تقرير الاعتمادات' });
  }
};

export const getCompaniesReport = async (req: AuthRequest, res: Response) => {
  try {
    const companies = await prisma.company.findMany({
      include: {
        _count: {
          select: {
            sentShipments: true,
            receivedShipments: true
          }
        }
      }
    });

    res.json({
      success: true,
      data: companies
    });
  } catch (error) {
    console.error('Companies report error:', error);
    res.status(500).json({ success: false, message: 'حدث خطأ أثناء جلب تقرير الشركات' });
  }
};

export const getExchangeDiffsReport = async (req: AuthRequest, res: Response) => {
  try {
    const exchangeRates = await prisma.exchangeRate.findMany({
      orderBy: {
        date: 'desc'
      },
      take: 100
    });

    res.json({
      success: true,
      data: exchangeRates
    });
  } catch (error) {
    console.error('Exchange diffs report error:', error);
    res.status(500).json({ success: false, message: 'حدث خطأ أثناء جلب تقرير فروقات الصرف' });
  }
};

export const getDashboardStats = async (req: AuthRequest, res: Response) => {
  try {
    const [
      userCount,
      roleCount,
      shipmentCount,
      companyCount,
      creditCount,
      recentLogs,
      totalRevenue
    ] = await Promise.all([
      prisma.user.count(),
      prisma.role.count(),
      prisma.shipping.count(),
      prisma.company.count(),
      prisma.credit.count(),
      prisma.auditLog.findMany({
        take: 5,
        orderBy: { timestamp: 'desc' },
        include: { user: { select: { username: true } } }
      }),
      prisma.shipping.aggregate({
        _sum: {
          price: true
        }
      })
    ]);

    res.json({
      success: true,
      data: {
        counts: {
          users: userCount,
          roles: roleCount,
          shipments: shipmentCount,
          companies: companyCount,
          credits: creditCount
        },
        recentLogs,
        totalRevenue: totalRevenue._sum.price || 0
      }
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ success: false, message: 'حدث خطأ أثناء جلب إحصائيات لوحة التحكم' });
  }
};
