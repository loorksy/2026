# دليل الإعداد والتشغيل

## المتطلبات الأساسية

قبل البدء، تأكد من تثبيت:
- Node.js 18+ و npm
- PostgreSQL 14+
- Git

## خطوات الإعداد التفصيلية

### 1. إعداد قاعدة البيانات

```bash
# الدخول إلى PostgreSQL
psql -U postgres

# إنشاء قاعدة بيانات
CREATE DATABASE rbac_system;

# إنشاء مستخدم (اختياري)
CREATE USER rbac_user WITH ENCRYPTED PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE rbac_system TO rbac_user;

# الخروج
\q
```

### 2. إعداد ملف البيئة

```bash
# نسخ ملف البيئة النموذجي
cp .env.example .env

# تعديل الملف
nano .env
```

قم بتحديث المتغيرات التالية في `.env`:
```env
DATABASE_URL="postgresql://rbac_user:your_password@localhost:5432/rbac_system?schema=public"
JWT_SECRET="أدخل-مفتاح-سري-قوي-هنا-للإنتاج"
PORT=3000
NODE_ENV=development
```

### 3. تثبيت الحزم

```bash
npm install
```

### 4. إعداد قاعدة البيانات

```bash
# توليد Prisma Client
npm run prisma:generate

# تشغيل Migrations
npm run prisma:migrate

# إدخال البيانات الأولية (الأدوار، الصلاحيات، المستخدمين التجريبيين)
npm run seed
```

### 5. تشغيل التطبيق

#### Development Mode

في terminal أول (Backend):
```bash
npm run dev:backend
```

في terminal ثاني (Frontend):
```bash
npm run dev:frontend
```

#### Production Build

```bash
# Build
npm run build

# Start
npm start
```

## الوصول للتطبيق

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000/api
- **API Health Check**: http://localhost:3000/api/health

## الحسابات التجريبية

بعد تشغيل `npm run seed`، يمكنك تسجيل الدخول باستخدام:

### Admin (مسؤول النظام)
- **Email**: admin@example.com
- **Password**: admin123
- **الصلاحيات**: كامل الصلاحيات

### Accountant (محاسب)
- **Email**: accountant@example.com
- **Password**: password123
- **الصلاحيات**: إدارة الرواتب والمبالغ، لا يمكن الحذف

### Manager (مدير)
- **Email**: manager@example.com
- **Password**: password123
- **الصلاحيات**: عرض جميع البيانات فقط

### Viewer (مشاهد)
- **Email**: viewer@example.com
- **Password**: password123
- **الصلاحيات**: عرض محدود فقط

## استكشاف الأخطاء

### مشكلة الاتصال بقاعدة البيانات

```bash
# التحقق من تشغيل PostgreSQL
sudo systemctl status postgresql

# إعادة تشغيل PostgreSQL
sudo systemctl restart postgresql
```

### خطأ في Prisma

```bash
# حذف وإعادة توليد Prisma Client
rm -rf node_modules/.prisma
npm run prisma:generate
```

### Port مستخدم بالفعل

```bash
# البحث عن Process الذي يستخدم Port 3000
lsof -i :3000

# إيقاف Process
kill -9 <PID>
```

### إعادة تعيين قاعدة البيانات

```bash
# حذف قاعدة البيانات
psql -U postgres -c "DROP DATABASE rbac_system;"
psql -U postgres -c "CREATE DATABASE rbac_system;"

# إعادة تشغيل Migrations والـ Seed
npm run prisma:migrate
npm run seed
```

## أدوات التطوير المفيدة

### Prisma Studio
لعرض وتعديل البيانات بشكل مرئي:
```bash
npm run prisma:studio
```
سيفتح على: http://localhost:5555

### إنشاء Migration جديد
```bash
npx prisma migrate dev --name description_of_changes
```

### إعادة تعيين قاعدة البيانات
```bash
npx prisma migrate reset
```

## نصائح الأمان للإنتاج

1. **تغيير JWT_SECRET**: استخدم مفتاح قوي وعشوائي
2. **استخدام HTTPS**: تأكد من استخدام SSL/TLS
3. **تحديث DATABASE_URL**: استخدم بيانات قاعدة بيانات إنتاج آمنة
4. **تعطيل CORS**: قم بتحديد النطاقات المسموح بها فقط
5. **Rate Limiting**: أضف حد للطلبات لمنع DDoS
6. **Logging**: استخدم نظام logging احترافي
7. **Backup**: قم بعمل نسخ احتياطية دورية لقاعدة البيانات

## الدعم

للمساعدة أو الإبلاغ عن مشاكل، يرجى فتح Issue في المستودع.
