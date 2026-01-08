# توثيق API

## المصادقة

جميع endpoints (ما عدا Login و Register) تتطلب JWT token في header:
```
Authorization: Bearer <token>
```

## استجابة API القياسية

```json
{
  "success": true|false,
  "message": "رسالة اختيارية",
  "data": {}
}
```

## Authentication Endpoints

### تسجيل الدخول
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "admin123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "تم تسجيل الدخول بنجاح",
  "data": {
    "token": "jwt_token_here",
    "user": {
      "id": "uuid",
      "email": "admin@example.com",
      "username": "admin",
      "roles": ["Admin"],
      "permissions": [...]
    }
  }
}
```

### تسجيل حساب جديد
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "username": "newuser",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe"
}
```

### الحصول على المستخدم الحالي
```http
GET /api/auth/me
Authorization: Bearer <token>
```

---

## Users Endpoints

### قائمة المستخدمين
```http
GET /api/users
Authorization: Bearer <token>
```

**Required Permission:** `users:READ`

### تفاصيل مستخدم
```http
GET /api/users/:id
Authorization: Bearer <token>
```

**Required Permission:** `users:READ`

### إنشاء مستخدم
```http
POST /api/users
Authorization: Bearer <token>
Content-Type: application/json

{
  "email": "newuser@example.com",
  "username": "newuser",
  "password": "password123",
  "firstName": "Jane",
  "lastName": "Smith",
  "roleIds": ["role_uuid_1", "role_uuid_2"]
}
```

**Required Permission:** `users:CREATE`

### تحديث مستخدم
```http
PUT /api/users/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "email": "updated@example.com",
  "firstName": "Updated",
  "lastName": "Name",
  "isActive": true
}
```

**Required Permission:** `users:UPDATE`

### حذف مستخدم
```http
DELETE /api/users/:id
Authorization: Bearer <token>
```

**Required Permission:** `users:DELETE`

### إسناد دور لمستخدم
```http
POST /api/users/assign-role
Authorization: Bearer <token>
Content-Type: application/json

{
  "userId": "user_uuid",
  "roleId": "role_uuid"
}
```

**Required Permission:** `users:UPDATE`

### إلغاء دور من مستخدم
```http
POST /api/users/revoke-role
Authorization: Bearer <token>
Content-Type: application/json

{
  "userId": "user_uuid",
  "roleId": "role_uuid"
}
```

**Required Permission:** `users:UPDATE`

---

## Roles Endpoints

### قائمة الأدوار
```http
GET /api/roles
Authorization: Bearer <token>
```

**Required Permission:** `roles:READ`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Admin",
      "description": "الوصول الكامل",
      "isActive": true,
      "isSystem": true,
      "userCount": 5,
      "permissions": [...]
    }
  ]
}
```

### تفاصيل دور
```http
GET /api/roles/:id
Authorization: Bearer <token>
```

**Required Permission:** `roles:READ`

### إنشاء دور
```http
POST /api/roles
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Custom Role",
  "description": "دور مخصص",
  "permissionIds": ["perm_uuid_1", "perm_uuid_2"]
}
```

**Required Permission:** `roles:CREATE`

### تحديث دور
```http
PUT /api/roles/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Updated Role",
  "description": "وصف محدث",
  "isActive": true,
  "permissionIds": ["perm_uuid_1", "perm_uuid_2"]
}
```

**Required Permission:** `roles:UPDATE`

**ملاحظة:** لا يمكن تغيير اسم الأدوار النظامية (isSystem: true)

### حذف دور
```http
DELETE /api/roles/:id
Authorization: Bearer <token>
```

**Required Permission:** `roles:DELETE`

**ملاحظات:**
- لا يمكن حذف الأدوار النظامية
- لا يمكن حذف الأدوار المرتبطة بمستخدمين

---

## Permissions Endpoints

### قائمة الصلاحيات
```http
GET /api/permissions
Authorization: Bearer <token>
```

**Required Permission:** `permissions:READ`

**Response:**
```json
{
  "success": true,
  "data": {
    "all": [...],
    "grouped": {
      "users": [
        {
          "id": "uuid",
          "name": "create_users",
          "resource": "users",
          "action": "CREATE",
          "description": "..."
        }
      ],
      "roles": [...]
    }
  }
}
```

### تفاصيل صلاحية
```http
GET /api/permissions/:id
Authorization: Bearer <token>
```

**Required Permission:** `permissions:READ`

---

## Audit Logs Endpoints

### قائمة سجلات التدقيق
```http
GET /api/audit-logs?page=1&limit=50&resource=users&action=CREATED
Authorization: Bearer <token>
```

**Query Parameters:**
- `page` (number): رقم الصفحة (default: 1)
- `limit` (number): عدد السجلات (default: 50)
- `userId` (uuid): تصفية حسب المستخدم
- `resource` (string): تصفية حسب المورد (users, roles, etc.)
- `action` (string): تصفية حسب الإجراء (CREATED, UPDATED, DELETED)
- `startDate` (ISO date): من تاريخ
- `endDate` (ISO date): إلى تاريخ

**Required Permission:** `audit_logs:READ`

**Response:**
```json
{
  "success": true,
  "data": {
    "logs": [
      {
        "id": "uuid",
        "userId": "user_uuid",
        "user": {
          "username": "admin",
          "email": "admin@example.com"
        },
        "action": "CREATED",
        "resource": "users",
        "resourceId": "resource_uuid",
        "oldValues": null,
        "newValues": {...},
        "timestamp": "2024-01-08T12:00:00Z",
        "ipAddress": "192.168.1.1",
        "userAgent": "Mozilla/5.0..."
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 150,
      "totalPages": 3
    }
  }
}
```

### تفاصيل سجل تدقيق
```http
GET /api/audit-logs/:id
Authorization: Bearer <token>
```

**Required Permission:** `audit_logs:READ`

### إحصائيات سجل التدقيق
```http
GET /api/audit-logs/stats
Authorization: Bearer <token>
```

**Required Permission:** `audit_logs:READ`

**Response:**
```json
{
  "success": true,
  "data": {
    "totalLogs": 1500,
    "byAction": {
      "CREATED": 500,
      "UPDATED": 700,
      "DELETED": 300
    },
    "byResource": {
      "users": 400,
      "roles": 200,
      "permissions": 100
    },
    "recentLogs": [...]
  }
}
```

---

## رموز الأخطاء

| Code | الوصف |
|------|-------|
| 200 | نجاح |
| 201 | تم الإنشاء بنجاح |
| 400 | طلب غير صحيح |
| 401 | غير مصرح - يتطلب تسجيل الدخول |
| 403 | ممنوع - ليس لديك صلاحية |
| 404 | غير موجود |
| 500 | خطأ في الخادم |

---

## أمثلة باستخدام cURL

### تسجيل الدخول
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}'
```

### الحصول على المستخدمين
```bash
curl http://localhost:3000/api/users \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### إنشاء دور جديد
```bash
curl -X POST http://localhost:3000/api/roles \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Editor",
    "description": "محرر المحتوى",
    "permissionIds": ["perm_id_1", "perm_id_2"]
  }'
```

---

## Webhooks (للتطوير المستقبلي)

يمكن إضافة webhooks لإرسال إشعارات عند أحداث معينة:
- إنشاء مستخدم جديد
- تغيير الصلاحيات
- محاولات الوصول المرفوضة
- العمليات الحساسة

---

## Rate Limiting (للإنتاج)

يُنصح بإضافة rate limiting للإنتاج:
- 100 طلب/دقيقة للمستخدم العادي
- 1000 طلب/دقيقة للـ Admin
- 10 محاولة تسجيل دخول/15 دقيقة
