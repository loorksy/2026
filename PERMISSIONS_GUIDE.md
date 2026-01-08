# دليل الصلاحيات والأدوار

## فهم نظام RBAC

### المكونات الأساسية

```
User (المستخدم)
  ↓ has many
UserRole (ربط المستخدم بالأدوار)
  ↓ references
Role (الدور)
  ↓ has many
RolePermission (ربط الدور بالصلاحيات)
  ↓ references
Permission (الصلاحية)
```

---

## الموارد (Resources)

الموارد هي الكيانات التي يمكن التحكم في الوصول إليها:

- `users` - المستخدمين
- `roles` - الأدوار
- `permissions` - الصلاحيات
- `salaries` - الرواتب
- `charges` - المبالغ/الديون
- `reports` - التقارير
- `audit_logs` - سجل التدقيق
- `dashboard` - لوحة التحكم

---

## الإجراءات (Actions)

لكل مورد، يمكن تحديد الإجراءات التالية:

- `CREATE` - إنشاء
- `READ` - قراءة/عرض
- `UPDATE` - تحديث
- `DELETE` - حذف

---

## الأدوار النظامية

### 1. Admin (المسؤول)

**الوصف:** الوصول الكامل لجميع أقسام النظام

**الصلاحيات:**
```
✅ users: CREATE, READ, UPDATE, DELETE
✅ roles: CREATE, READ, UPDATE, DELETE
✅ permissions: CREATE, READ, UPDATE, DELETE
✅ salaries: CREATE, READ, UPDATE, DELETE
✅ charges: CREATE, READ, UPDATE, DELETE
✅ reports: CREATE, READ, UPDATE, DELETE
✅ audit_logs: CREATE, READ, UPDATE, DELETE
✅ dashboard: CREATE, READ, UPDATE, DELETE
```

**حالات الاستخدام:**
- إدارة المستخدمين والأدوار
- تعيين الصلاحيات
- مراجعة سجل التدقيق
- حذف البيانات الحساسة

---

### 2. Accountant (المحاسب)

**الوصف:** إدارة الجوانب المالية بدون صلاحية الحذف

**الصلاحيات:**
```
✅ salaries: CREATE, READ, UPDATE
❌ salaries: DELETE
✅ charges: CREATE, READ, UPDATE
❌ charges: DELETE
✅ reports: READ
✅ dashboard: READ
✅ audit_logs: READ
```

**حالات الاستخدام:**
- تسجيل الرواتب والمصروفات
- تحديث أسعار الصرف
- عرض التقارير المالية
- لا يمكن حذف العمليات (للأمان المالي)

---

### 3. Manager (المدير)

**الوصف:** عرض جميع البيانات بدون صلاحية التعديل

**الصلاحيات:**
```
✅ users: READ
✅ roles: READ
✅ permissions: READ
✅ salaries: READ
✅ charges: READ
✅ reports: READ
✅ audit_logs: READ
✅ dashboard: READ
❌ جميع إجراءات CREATE, UPDATE, DELETE
```

**حالات الاستخدام:**
- مراجعة جميع البيانات
- إنشاء التقارير
- مراقبة الأداء
- لا يمكن تعديل أو حذف

---

### 4. Viewer (المشاهد)

**الوصف:** عرض محدود للبيانات

**الصلاحيات:**
```
✅ dashboard: READ
✅ reports: READ
✅ salaries: READ (محدود)
✅ charges: READ (محدود)
❌ كل شيء آخر
```

**حالات الاستخدام:**
- عرض لوحة التحكم
- عرض التقارير الأساسية
- لا يمكن الوصول للبيانات الحساسة

---

## إنشاء أدوار مخصصة

### مثال: دور "Editor"

```json
{
  "name": "Editor",
  "description": "محرر المحتوى",
  "permissions": [
    "reports:CREATE",
    "reports:READ",
    "reports:UPDATE",
    "dashboard:READ"
  ]
}
```

### مثال: دور "Auditor"

```json
{
  "name": "Auditor",
  "description": "مدقق مالي",
  "permissions": [
    "audit_logs:READ",
    "reports:READ",
    "salaries:READ",
    "charges:READ"
  ]
}
```

---

## سيناريوهات عملية

### السيناريو 1: موظف محاسبة جديد

```bash
# 1. إنشاء حساب المستخدم
POST /api/users
{
  "email": "accountant2@company.com",
  "username": "accountant2",
  "password": "SecurePassword123",
  "firstName": "أحمد",
  "lastName": "المحاسب"
}

# 2. إسناد دور Accountant
POST /api/users/assign-role
{
  "userId": "new_user_id",
  "roleId": "accountant_role_id"
}
```

### السيناريو 2: مدير فرع جديد

يحتاج المدير إلى:
- عرض جميع البيانات
- إضافة مستخدمين جدد فقط

```bash
# 1. إنشاء دور مخصص
POST /api/roles
{
  "name": "Branch Manager",
  "description": "مدير فرع",
  "permissionIds": [
    "users:CREATE",
    "users:READ",
    "salaries:READ",
    "charges:READ",
    "reports:READ",
    "dashboard:READ"
  ]
}

# 2. إسناد الدور للمدير
POST /api/users/assign-role
{
  "userId": "manager_user_id",
  "roleId": "branch_manager_role_id"
}
```

### السيناريو 3: إلغاء وصول مستخدم

```bash
# 1. تعطيل الحساب (لا يحذف البيانات)
PUT /api/users/:id
{
  "isActive": false
}

# أو

# 2. إلغاء جميع الأدوار
POST /api/users/revoke-role
{
  "userId": "user_id",
  "roleId": "role_id"
}
```

---

## التحقق من الصلاحيات

### في Backend (Middleware)

```typescript
// التحقق من صلاحية محددة
router.post('/users',
  authenticate,
  authorize('users', 'CREATE'),
  createUser
);

// التحقق من دور محدد
router.get('/admin-panel',
  authenticate,
  checkRole('Admin'),
  getAdminPanel
);
```

### في Frontend (React)

```typescript
// التحقق من صلاحية
if (hasPermission('users', 'DELETE')) {
  // عرض زر الحذف
}

// التحقق من دور
if (hasRole('Admin')) {
  // عرض قسم المسؤول
}

// إخفاء قسم كامل
{hasPermission('users', 'READ') && (
  <Link to="/users">المستخدمين</Link>
)}
```

---

## أفضل الممارسات

### 1. مبدأ الحد الأدنى من الصلاحيات
امنح المستخدمين فقط الصلاحيات التي يحتاجونها لأداء عملهم.

### 2. استخدام الأدوار بدلاً من الصلاحيات المباشرة
قم بإنشاء أدوار تجمع صلاحيات متعلقة، بدلاً من إسناد صلاحيات فردية.

### 3. مراجعة الصلاحيات بانتظام
راجع صلاحيات المستخدمين بشكل دوري وقم بتحديثها حسب الحاجة.

### 4. استخدام سجل التدقيق
راقب سجل التدقيق لاكتشاف محاولات الوصول غير المصرح بها.

### 5. لا تحذف الأدوار النظامية
الأدوار الأربعة الأساسية محمية ولا يمكن حذفها أو تغيير أسمائها.

### 6. اختبر الصلاحيات
قبل منح دور لمستخدم، اختبره للتأكد من أنه يمنح الصلاحيات المطلوبة فقط.

---

## استكشاف المشاكل

### مشكلة: المستخدم لا يستطيع الوصول لصفحة معينة

**الحل:**
1. تحقق من أن المستخدم لديه دور مسند
2. تحقق من أن الدور يحتوي على الصلاحية المطلوبة
3. راجع سجل التدقيق لمحاولات الوصول المرفوضة

### مشكلة: لا يمكن حذف دور

**الحل:**
1. تحقق من أن الدور ليس نظامياً (isSystem: false)
2. تحقق من عدم وجود مستخدمين مرتبطين بالدور
3. قم بنقل المستخدمين لدور آخر أولاً

### مشكلة: صلاحيات غير متوقعة

**الحل:**
1. تحقق من جميع الأدوار المسندة للمستخدم
2. الصلاحيات تُجمع من جميع الأدوار
3. استخدم `/api/auth/me` لرؤية جميع الصلاحيات الفعلية

---

## الخلاصة

نظام RBAC يوفر:
- ✅ تحكم دقيق في الوصول
- ✅ مرونة في تعريف الأدوار
- ✅ سهولة في الإدارة
- ✅ تتبع كامل للعمليات
- ✅ أمان عالي
