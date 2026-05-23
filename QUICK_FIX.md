# ✅ حل سريع - البيانات الجديدة لا تظهر

## 🎯 المشكلة الأساسية

البيانات المحفوظة في localStorage قديمة ولا تحتوي على الحقول الجديدة

## ⚡ الحل الفوري (2 خطوات):

### ✔️ الخطوة 1: مسح البيانات

اضغط على **Reset** في Admin Panel:  
**Admin → Products Management → زر الثلاثة خطوط (Reset)**

### ✔️ الخطوة 2: تحديث البيانات

**افتح Console وأكتب:**

```javascript
localStorage.clear();
```

ثم أغلق المتصفح وافتحه مرة أخرى

---

## 📝 الحقول الجديدة التي يجب أن تظهر الآن:

### في Admin جزء "الكمية والتسعير":

- [ ] minimumOrderQty (الحد الأدنى)
- [ ] maximumOrderQty (الحد الأقصى)
- [ ] stepQty (خطوة الزيادة)

### في Admin جزء "إعدادات المنتج":

- [ ] productStatus (متوفر/غير متوفر/موقوف)
- [ ] isVisibleInStore (إظهار في المتجر)
- [ ] showWhenUnavailable (إظهار إذا غير متوفر)
- [ ] pauseSales (إيقاف البيع مؤقتاً)

### في Admin جزء "جدولة الظهور":

- [ ] enableSchedule (تفعيل الجدولة)
- [ ] scheduledStartAt و scheduledEndAt (البداية والنهاية)
- [ ] scheduleVisibilityMode (طريقة الظهور)

### في Admin جزء "إدارة المخزون":

- [ ] trackInventory (تتبع المخزون)
- [ ] stockQuantity (كمية المخزون)
- [ ] lowStockThreshold (حد التنبيه)
- [ ] hideWhenOutOfStock و showOutOfStockLabel

---

## 🔍 تحقق من أن البيانات تُحفظ:

### في Products.jsx في Console:

ستظهر رسالة:

```
✅ Products loaded: { id: "p1", name: "...", minimumOrderQty: 1, ... }
```

تأكد من وجود الحقول الجديدة مثل:

- `minimumOrderQty`
- `productStatus`
- `trackInventory`
- إلخ

---

## 💡 نصيحة مهمة:

**عند إضافة منتج جديد أو تعديل:**

1. انظر إلى قسمة **Preview** في النموذج (أسفل الشاشة)
2. تأكد من أنها تعرض الحالة الصحيحة
3. ثم احفظ

هذا سيضمن أن جميع البيانات تُحفظ بشكل صحيح.
