import { PrismaClient, Action } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const resources = [
  'users',
  'roles',
  'permissions',
  'salaries',
  'charges',
  'reports',
  'audit_logs',
  'dashboard',
  'trusted_persons',
  'manual_transfers',
  'transfer_records',
  'shipping',
  'companies',
  'credits',
  'exchange_rates'
];

const actions = [Action.CREATE, Action.READ, Action.UPDATE, Action.DELETE];

const rolesConfig = {
  Admin: {
    description: 'الوصول الكامل لجميع الأقسام',
    permissions: resources.flatMap(resource => 
      actions.map(action => ({ resource, action }))
    )
  },
  Accountant: {
    description: 'إدارة الرواتب والمبالغ وتسجيل العمليات المالية',
    permissions: [
      { resource: 'salaries', action: Action.CREATE },
      { resource: 'salaries', action: Action.READ },
      { resource: 'salaries', action: Action.UPDATE },
      { resource: 'charges', action: Action.CREATE },
      { resource: 'charges', action: Action.READ },
      { resource: 'charges', action: Action.UPDATE },
      { resource: 'reports', action: Action.READ },
      { resource: 'dashboard', action: Action.READ },
      { resource: 'audit_logs', action: Action.READ },
      { resource: 'trusted_persons', action: Action.CREATE },
      { resource: 'trusted_persons', action: Action.READ },
      { resource: 'trusted_persons', action: Action.UPDATE },
      { resource: 'manual_transfers', action: Action.CREATE },
      { resource: 'manual_transfers', action: Action.READ },
      { resource: 'manual_transfers', action: Action.UPDATE },
      { resource: 'transfer_records', action: Action.CREATE },
      { resource: 'transfer_records', action: Action.READ },
      { resource: 'transfer_records', action: Action.UPDATE }
    ]
  },
  Manager: {
    description: 'عرض كل البيانات وتقارير شاملة',
    permissions: resources.map(resource => ({
      resource,
      action: Action.READ
    }))
  },
  Viewer: {
    description: 'عرض فقط - لا يمكن تعديل أو حذف',
    permissions: [
      { resource: 'dashboard', action: Action.READ },
      { resource: 'reports', action: Action.READ },
      { resource: 'salaries', action: Action.READ },
      { resource: 'charges', action: Action.READ }
    ]
  }
};

async function main() {
  console.log('🌱 Starting seed...');

  console.log('📝 Creating permissions...');
  const permissions = [];
  for (const resource of resources) {
    for (const action of actions) {
      const permission = await prisma.permission.upsert({
        where: {
          resource_action: {
            resource,
            action
          }
        },
        update: {},
        create: {
          name: `${action.toLowerCase()}_${resource}`,
          resource,
          action,
          description: `${action} permission for ${resource}`
        }
      });
      permissions.push(permission);
    }
  }
  console.log(`✅ Created ${permissions.length} permissions`);

  console.log('👥 Creating roles...');
  for (const [roleName, config] of Object.entries(rolesConfig)) {
    const role = await prisma.role.upsert({
      where: { name: roleName },
      update: {
        description: config.description
      },
      create: {
        name: roleName,
        description: config.description,
        isSystem: true
      }
    });

    await prisma.rolePermission.deleteMany({
      where: { roleId: role.id }
    });

    for (const perm of config.permissions) {
      const permission = await prisma.permission.findUnique({
        where: {
          resource_action: {
            resource: perm.resource,
            action: perm.action
          }
        }
      });

      if (permission) {
        await prisma.rolePermission.create({
          data: {
            roleId: role.id,
            permissionId: permission.id
          }
        });
      }
    }

    console.log(`✅ Created role: ${roleName} with ${config.permissions.length} permissions`);
  }

  console.log('👤 Creating admin user...');
  const hashedPassword = await bcrypt.hash('admin123', 10);
  const adminRole = await prisma.role.findUnique({
    where: { name: 'Admin' }
  });

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      username: 'admin',
      password: hashedPassword,
      firstName: 'System',
      lastName: 'Administrator',
      isActive: true
    }
  });

  if (adminRole) {
    await prisma.userRole.upsert({
      where: {
        userId_roleId: {
          userId: adminUser.id,
          roleId: adminRole.id
        }
      },
      update: {},
      create: {
        userId: adminUser.id,
        roleId: adminRole.id
      }
    });
  }

  console.log('✅ Admin user created (email: admin@example.com, password: admin123)');

  console.log('👤 Creating test users...');
  const testUsers = [
    { email: 'accountant@example.com', username: 'accountant', role: 'Accountant', firstName: 'John', lastName: 'Accountant' },
    { email: 'manager@example.com', username: 'manager', role: 'Manager', firstName: 'Jane', lastName: 'Manager' },
    { email: 'viewer@example.com', username: 'viewer', role: 'Viewer', firstName: 'Bob', lastName: 'Viewer' }
  ];

  for (const testUser of testUsers) {
    const password = await bcrypt.hash('password123', 10);
    const user = await prisma.user.upsert({
      where: { email: testUser.email },
      update: {},
      create: {
        email: testUser.email,
        username: testUser.username,
        password,
        firstName: testUser.firstName,
        lastName: testUser.lastName,
        isActive: true
      }
    });

    const role = await prisma.role.findUnique({
      where: { name: testUser.role }
    });

    if (role) {
      await prisma.userRole.upsert({
        where: {
          userId_roleId: {
            userId: user.id,
            roleId: role.id
          }
        },
        update: {},
        create: {
          userId: user.id,
          roleId: role.id,
          assignedBy: adminUser.id
        }
      });
    }

    console.log(`✅ Created test user: ${testUser.email} (password: password123)`);
  }

  console.log('📦 Creating sample data for reports...');
  const company1 = await prisma.company.upsert({
    where: { name: 'شركة الأفق للتجارة' },
    update: {},
    create: {
      name: 'شركة الأفق للتجارة',
      type: 'BOTH',
      contactPerson: 'أحمد محمد',
      phone: '07701234567'
    }
  });

  const company2 = await prisma.company.upsert({
    where: { name: 'مجموعة النور للشحن' },
    update: {},
    create: {
      name: 'مجموعة النور للشحن',
      type: 'SUPPLIER',
      contactPerson: 'سارة علي',
      phone: '07801234567'
    }
  });

  await prisma.shipping.upsert({
    where: { trackingNumber: 'SHP-001' },
    update: {},
    create: {
      trackingNumber: 'SHP-001',
      senderId: company1.id,
      receiverId: company2.id,
      origin: 'Baghdad',
      destination: 'Erbil',
      weight: 10.5,
      cost: 50000,
      price: 75000,
      status: 'DELIVERED',
      shipmentDate: new Date()
    }
  });

  await prisma.credit.upsert({
    where: { creditNumber: 'LC-2024-001' },
    update: {},
    create: {
      creditNumber: 'LC-2024-001',
      bankName: 'مصرف الرافدين',
      amount: 10000,
      currency: 'USD',
      expiryDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
    }
  });

  console.log('🎉 Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
