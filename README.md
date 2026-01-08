# نظام إدارة الأدوار والصلاحيات (RBAC System)

نظام شامل لإدارة الأدوار والصلاحيات مع تسجيل التدقيق الكامل (Audit Logging).

## المميزات

### الأدوار الرئيسية
- **Admin**: الوصول الكامل لجميع الأقسام وإدارة المستخدمين والأدوار والصلاحيات
- **Accountant**: إدارة الرواتب والعمليات المالية مع منع الحذف
- **Manager**: عرض جميع البيانات والتقارير دون تعديل البيانات الحساسة
- **Viewer**: عرض فقط - لا يمكن التعديل أو الحذف

### الميزات الأساسية
- ✅ نظام مصادقة آمن (JWT)
- ✅ إدارة الأدوار والصلاحيات
- ✅ إسناد الأدوار للمستخدمين
- ✅ سجل تدقيق شامل لجميع العمليات
- ✅ واجهة مستخدم عربية حديثة
- ✅ التحكم في الوصول بناءً على الصلاحيات
- ✅ تتبع جميع التغييرات (Old/New Values)
- ✅ رسائل خطأ واضحة عند محاولة الوصول غير المصرح

## التقنيات المستخدمة

### Backend
- Node.js + Express.js
- TypeScript
- Prisma ORM
- PostgreSQL
- JWT للمصادقة
- bcrypt لتشفير كلمات المرور

### Frontend
- React 18
- TypeScript
- React Router
- CSS Modules
- Vite

## التثبيت والتشغيل

### المتطلبات
- Node.js 18+
- PostgreSQL 14+
- npm أو yarn

### خطوات التثبيت

1. **استنساخ المشروع**
```bash
git clone <repository-url>
cd rbac-system
```

2. **تثبيت الحزم**
```bash
npm install
```

3. **إعداد قاعدة البيانات**

أنشئ قاعدة بيانات PostgreSQL:
```sql
CREATE DATABASE rbac_system;
```

انسخ ملف البيئة:
```bash
cp .env.example .env
```

عدّل `.env` وضع بيانات قاعدة البيانات:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/rbac_system?schema=public"
JWT_SECRET="your-super-secret-jwt-key"
PORT=3000
```

4. **تشغيل Migrations وإنشاء البيانات الأولية**
```bash
npm run prisma:generate
npm run prisma:migrate
npm run seed
```

5. **تشغيل المشروع**

في نافذة Terminal:
```bash
npm run dev:backend
```

في نافذة Terminal أخرى:
```bash
npm run dev:frontend
```

6. **الوصول للتطبيق**
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000/api

## الحسابات التجريبية

بعد تشغيل seed script، ستتوفر الحسابات التالية:

| الدور | البريد الإلكتروني | كلمة المرور |
|-------|-------------------|-------------|
| Admin | admin@example.com | admin123 |
| Accountant | accountant@example.com | password123 |
| Manager | manager@example.com | password123 |
| Viewer | viewer@example.com | password123 |

## البنية المعمارية

### نموذج البيانات

```
User ─┐
      ├─► UserRole ◄─┐
      │              │
      │         Role ├─► RolePermission ◄─ Permission
      │              │
      └─► AuditLog   │
```

### API Endpoints

#### Authentication
- `POST /api/auth/login` - تسجيل الدخول
- `POST /api/auth/register` - إنشاء حساب جديد
- `GET /api/auth/me` - الحصول على المستخدم الحالي

#### Users
- `GET /api/users` - قائمة المستخدمين
- `GET /api/users/:id` - تفاصيل مستخدم
- `POST /api/users` - إنشاء مستخدم
- `PUT /api/users/:id` - تحديث مستخدم
- `DELETE /api/users/:id` - حذف مستخدم
- `POST /api/users/assign-role` - إسناد دور
- `POST /api/users/revoke-role` - إلغاء دور

#### Roles
- `GET /api/roles` - قائمة الأدوار
- `GET /api/roles/:id` - تفاصيل دور
- `POST /api/roles` - إنشاء دور
- `PUT /api/roles/:id` - تحديث دور
- `DELETE /api/roles/:id` - حذف دور

#### Permissions
- `GET /api/permissions` - قائمة الصلاحيات
- `GET /api/permissions/:id` - تفاصيل صلاحية

#### Audit Logs
- `GET /api/audit-logs` - سجل التدقيق (مع pagination)
- `GET /api/audit-logs/:id` - تفاصيل سجل
- `GET /api/audit-logs/stats` - إحصائيات سجل التدقيق

## الأمان

- جميع كلمات المرور مشفرة باستخدام bcrypt
- المصادقة باستخدام JWT tokens
- التحقق من الصلاحيات على مستوى الـ middleware
- تسجيل جميع العمليات الحساسة في Audit Log
- منع حذف الأدوار النظامية
- منع حذف الأدوار المرتبطة بمستخدمين

## سجل التدقيق (Audit Log)

يتم تسجيل:
- المستخدم الذي قام بالعملية
- نوع الإجراء (إنشاء، تحديث، حذف، إسناد، إلغاء)
- المورد المستهدف
- القيم القديمة والجديدة
- التاريخ والوقت
- عنوان IP
- User Agent

## المساهمة

المساهمات مرحب بها! يرجى فتح Issue أو Pull Request.

## الترخيص

ISC License

## الدعم

للأسئلة والدعم، يرجى فتح Issue في المستودع.
