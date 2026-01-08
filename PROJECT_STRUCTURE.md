# بنية المشروع

```
rbac-system/
│
├── prisma/
│   ├── migrations/          # Prisma migrations
│   │   └── .gitkeep
│   └── schema.prisma        # Database schema
│
├── src/
│   ├── backend/
│   │   ├── controllers/     # Request handlers
│   │   │   ├── authController.ts
│   │   │   ├── auditLogController.ts
│   │   │   ├── permissionController.ts
│   │   │   ├── roleController.ts
│   │   │   └── userController.ts
│   │   │
│   │   ├── middleware/      # Express middleware
│   │   │   ├── auth.ts      # JWT authentication & authorization
│   │   │   └── auditLog.ts  # Audit logging middleware
│   │   │
│   │   ├── routes/          # API routes
│   │   │   ├── authRoutes.ts
│   │   │   ├── auditLogRoutes.ts
│   │   │   ├── permissionRoutes.ts
│   │   │   ├── roleRoutes.ts
│   │   │   └── userRoutes.ts
│   │   │
│   │   ├── prisma/
│   │   │   └── seed.ts      # Database seeding
│   │   │
│   │   └── server.ts        # Express server setup
│   │
│   └── frontend/
│       ├── components/      # Reusable React components
│       │   ├── Navbar.tsx
│       │   └── Navbar.css
│       │
│       ├── pages/           # Page components
│       │   ├── AccessDenied.tsx
│       │   ├── AccessDenied.css
│       │   ├── AuditLogs.tsx
│       │   ├── Dashboard.tsx
│       │   ├── Dashboard.css
│       │   ├── Login.tsx
│       │   ├── Login.css
│       │   ├── Permissions.tsx
│       │   ├── Permissions.css
│       │   ├── Roles.tsx
│       │   ├── Roles.css
│       │   └── Users.tsx
│       │
│       ├── types/           # TypeScript type definitions
│       │   └── index.ts
│       │
│       ├── utils/           # Utility functions
│       │   ├── api.ts       # API client
│       │   └── auth.ts      # Auth utilities
│       │
│       ├── App.tsx          # Main app component
│       ├── App.css          # Global styles
│       └── main.tsx         # Entry point
│
├── .env                     # Environment variables
├── .env.example             # Environment variables template
├── .gitignore               # Git ignore rules
├── index.html               # HTML template
├── package.json             # NPM dependencies & scripts
├── tsconfig.json            # TypeScript config (frontend)
├── tsconfig.backend.json    # TypeScript config (backend)
├── vite.config.ts           # Vite configuration
│
├── README.md                # Main documentation
├── SETUP_GUIDE.md           # Setup instructions
├── API_DOCUMENTATION.md     # API endpoints reference
├── PERMISSIONS_GUIDE.md     # RBAC guide
└── PROJECT_STRUCTURE.md     # This file
```

## الملفات الرئيسية

### Backend

| الملف | الوصف |
|-------|-------|
| `prisma/schema.prisma` | تعريف نموذج قاعدة البيانات |
| `src/backend/server.ts` | نقطة دخول الخادم |
| `src/backend/middleware/auth.ts` | المصادقة والتحقق من الصلاحيات |
| `src/backend/middleware/auditLog.ts` | تسجيل التدقيق |
| `src/backend/controllers/*` | معالجات الطلبات |
| `src/backend/routes/*` | تعريف مسارات API |

### Frontend

| الملف | الوصف |
|-------|-------|
| `src/frontend/main.tsx` | نقطة دخول التطبيق |
| `src/frontend/App.tsx` | المكون الرئيسي والتوجيه |
| `src/frontend/utils/api.ts` | عميل API |
| `src/frontend/utils/auth.ts` | دوال المصادقة |
| `src/frontend/types/index.ts` | تعريفات الأنواع |
| `src/frontend/pages/*` | صفحات التطبيق |
| `src/frontend/components/*` | مكونات قابلة لإعادة الاستخدام |

### Configuration

| الملف | الوصف |
|-------|-------|
| `package.json` | تبعيات NPM وأوامر البناء |
| `tsconfig.json` | إعدادات TypeScript للواجهة |
| `tsconfig.backend.json` | إعدادات TypeScript للخادم |
| `vite.config.ts` | إعدادات Vite |
| `.env` | متغيرات البيئة |

## التدفق العام

### Backend Request Flow

```
Client Request
    ↓
Express Server (server.ts)
    ↓
Authentication Middleware (auth.ts)
    ↓
Authorization Middleware (authorize)
    ↓
Audit Log Middleware (auditLog.ts)
    ↓
Controller (e.g., userController.ts)
    ↓
Prisma Client → Database
    ↓
Response to Client
```

### Frontend Component Flow

```
main.tsx
    ↓
App.tsx (Router)
    ↓
Protected Route Check
    ↓
Navbar Component
    ↓
Page Component (e.g., Dashboard.tsx)
    ↓
API Call (utils/api.ts)
    ↓
Backend API
```

## الصفحات المتاحة

| المسار | الصفحة | الصلاحية المطلوبة |
|--------|--------|-------------------|
| `/login` | تسجيل الدخول | - |
| `/` | لوحة التحكم | مصادقة |
| `/users` | إدارة المستخدمين | `users:READ` |
| `/roles` | إدارة الأدوار | `roles:READ` |
| `/permissions` | الصلاحيات | `permissions:READ` |
| `/audit-logs` | سجل التدقيق | `audit_logs:READ` |
| `/access-denied` | الوصول مرفوض | مصادقة |

## API Endpoints

### Authentication
- `POST /api/auth/login`
- `POST /api/auth/register`
- `GET /api/auth/me`

### Users
- `GET /api/users`
- `GET /api/users/:id`
- `POST /api/users`
- `PUT /api/users/:id`
- `DELETE /api/users/:id`
- `POST /api/users/assign-role`
- `POST /api/users/revoke-role`

### Roles
- `GET /api/roles`
- `GET /api/roles/:id`
- `POST /api/roles`
- `PUT /api/roles/:id`
- `DELETE /api/roles/:id`

### Permissions
- `GET /api/permissions`
- `GET /api/permissions/:id`

### Audit Logs
- `GET /api/audit-logs`
- `GET /api/audit-logs/:id`
- `GET /api/audit-logs/stats`

## الأوامر المتاحة

```bash
# Development
npm run dev:backend          # تشغيل Backend
npm run dev:frontend         # تشغيل Frontend

# Database
npm run prisma:generate      # توليد Prisma Client
npm run prisma:migrate       # تشغيل Migrations
npm run prisma:studio        # فتح Prisma Studio
npm run seed                 # إدخال البيانات الأولية

# Build
npm run build:backend        # بناء Backend
npm run build:frontend       # بناء Frontend
npm run build               # بناء كامل المشروع

# Production
npm start                    # تشغيل في الإنتاج
```

## نماذج قاعدة البيانات

### User
- id, email, username, password
- firstName, lastName
- isActive, createdAt, updatedAt

### Role
- id, name, description
- isActive, isSystem
- createdAt, updatedAt

### Permission
- id, name, resource, action
- description
- createdAt, updatedAt

### UserRole (Many-to-Many)
- id, userId, roleId
- assignedAt, assignedBy

### RolePermission (Many-to-Many)
- id, roleId, permissionId
- createdAt

### AuditLog
- id, userId, action, resource
- resourceId, oldValues, newValues
- timestamp, ipAddress, userAgent

## التقنيات المستخدمة

### Backend
- Node.js + Express.js
- TypeScript
- Prisma ORM
- PostgreSQL
- JWT (jsonwebtoken)
- bcryptjs

### Frontend
- React 18
- TypeScript
- React Router DOM
- Vite
- CSS Modules

## الميزات الأمنية

- ✅ تشفير كلمات المرور (bcrypt)
- ✅ JWT Tokens للمصادقة
- ✅ التحقق من الصلاحيات على مستوى Middleware
- ✅ سجل تدقيق شامل
- ✅ حماية الأدوار النظامية
- ✅ منع حذف البيانات المرتبطة
- ✅ رسائل خطأ واضحة
- ✅ التحقق من المدخلات
