# تحقق من البيئة والإعدادات 🔍

## الملفات المطلوبة

✅ **.env.local** - ملف الإعدادات المحلي (git-ignored)
✅ **.env.development** - ملف البيئة للتطوير (مرفق مع المشروع)
✅ **.env.example** - قالب مرجعي (مرفق مع المشروع)

---

## ما يجب أن يكون في `.env.local`

```env
# رابط API الأساسي
VITE_API_BASE_URL=http://localhost:5000/api

# مفتاح Gemini API
GEMINI_API_KEY=your_key_here

# إعدادات البيئة
VITE_APP_ENV=development
VITE_APP_MODE=development
APP_URL=http://localhost:3000
```

---

## خطوات الإعداد

### الطريقة 1️⃣: النسخ من القالب

```bash
cp .env.example .env.local
```

ثم عدّل `.env.local` وأضف البيانات الخاصة بك

### الطريقة 2️⃣: الإنشاء اليدوي

1. أنشئ ملف `‎.env.local` في جذر المشروع
2. أضف المتغيرات أعلاه
3. احفظ الملف

---

## التحقق من الإعدادات

### 1️⃣ تشغيل المشروع

```bash
npm install
npm run dev
```

### 2️⃣ افتح المتصفح

```
http://localhost:3000
```

### 3️⃣ تحقق من Console 🖥️

- إذا شاهدت: ✅ "API fetch failed, using mock data" = استخدام بيانات وهمية (طبيعي إذا لم تكن الخادم يعمل)
- إذا شاهدت: ✅ "Products loaded" = الاتصال ناجح!

---

## الأوضاع المختلفة

### 🚀 Mode 1: بدون خادم (mock data)

```env
VITE_API_BASE_URL=
GEMINI_API_KEY=your_key_here
```

تطبيق متكامل بدون الحاجة لخادم backend

---

### 🔌 Mode 2: مع خادم محلي

```env
VITE_API_BASE_URL=http://localhost:5000/api
GEMINI_API_KEY=your_key_here
```

تأكد من تشغيل الخادم على المنفذ 5000

---

### 🌐 Mode 3: مع خادم بعيد (Production)

```env
VITE_API_BASE_URL=https://api.yourdomain.com
GEMINI_API_KEY=your_prod_key_here
```

---

## مفاتيح العرض والإنتاج

| المفتاح             | الوصف               | مثال                          |
| ------------------- | ------------------- | ----------------------------- |
| `VITE_API_BASE_URL` | رابط خادم API       | `http://localhost:5000/api`   |
| `GEMINI_API_KEY`    | مفتاح Google Gemini | `abc123...`                   |
| `VITE_APP_ENV`      | نوع البيئة          | `development` أو `production` |
| `VITE_APP_MODE`     | وضع التطبيق         | `development`                 |
| `APP_URL`           | رابط التطبيق        | `http://localhost:3000`       |

---

## الملفات المهمة

- 📄 **`.env.local`** - إعداداتك الشخصية (لا تشاركها)
- 📄 **`.env.development`** - إعدادات التطوير (مشترك)
- 📄 **`.env.example`** - القالب المرجعي (مشترك)
- 📄 **`ENVIRONMENT_SETUP.md`** - دليل مفصل

---

## استكشاف الأخطاء

### ❌ "No API URL configured"

- تحقق من وجود `.env.local` أو `.env.development`
- أعد تشغيل `npm run dev`

### ❌ API لا يرد

- تحقق من أن `VITE_API_BASE_URL` صحيح
- تأكد من تشغيل خادمك
- التطبيق سيستخدم mock data تلقائياً

### ❌ تغييرات البيئة لم تطبق

- أعد تشغيل `npm run dev`
- مسح cache المتصفح (Ctrl+Shift+Del)

---

## 🎯 الخطوة التالية

بعد الإعداد:

1. ✅ تشغيل `npm run dev`
2. ✅ الدخول لـ `http://localhost:3000`
3. ✅ الاستمتاع بالتطبيق! 🚀
