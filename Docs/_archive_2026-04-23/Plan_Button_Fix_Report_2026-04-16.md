# تقرير إصلاح مشكلة أزرار اختيار الباقات

تاريخ التقرير: 2026-04-16

## نطاق الفحص

تم تحليل سلوك زرّي:

- `Choose Starter`
- `Choose Premium`

ضمن المسار المشترك لاختيار الباقات في مشروع `PolicyPack`، مع تتبع التدفق من الواجهة إلى `API` ثم العودة إلى الواجهة.

## التحقق من ملفات البيئة

تم التحقق من وجود الملفين المطلوبين:

- `C:\Users\ElBayyaa\Desktop\PolicyPack\.env.example`: موجود
- `C:\Users\ElBayyaa\Desktop\PolicyPack\.env.local`: موجود

ملاحظة تشغيلية:
- الملفان موجودان، لذلك سبب العطل ليس غياب ملفات البيئة نفسها.
- تدفق الدفع يعتمد على متغيرات `Paddle` و`Auth` و`Supabase` داخل هذه الملفات، لكن الخلل الأساسي الذي تم إصلاحه كان خللًا برمجيًا في الواجهة وليس غياب ملف env.

## سبب العطل

### السبب الجذري
المشكلة كانت في مكوّن [generation-result.tsx](file:///C:/Users/ElBayyaa/Desktop/PolicyPack/src/components/onboarding/generation-result.tsx).

عند الضغط على `Starter` أو `Premium` داخل `PlanSelectionDialog`:

1. يتم استدعاء `POST /api/checkout/paddle`
2. هذا المسار قد يعيد أحد الاحتمالات التالية:
   - `checkoutUrl`
   - `transactionId`
   - `premiumUnlocked`
3. المكوّن كان يتعامل فقط مع:
   - `checkoutUrl`
   - `premiumUnlocked`
4. لكنه كان **يتجاهل `transactionId` بالكامل**

النتيجة:
- يعود الطلب بنجاح من الشبكة
- لا يحدث انتقال
- لا يفتح `Paddle`
- لا تتغير الواجهة بشكل يوضح التقدم
- فيظهر للمستخدم أن الزر لا يعمل

## تحليل الواجهة والـ API

### الواجهة المشتركة
الأزرار نفسها داخل [plan-selection-dialog.tsx](file:///C:/Users/ElBayyaa/Desktop/PolicyPack/src/components/billing/plan-selection-dialog.tsx) كانت سليمة:

- زر `Starter` يستدعي `onSelectPlan("starter")`
- زر `Premium` يستدعي `onSelectPlan("premium")`

إذًا الخلل لم يكن في عنصر الزر أو حدث `onClick` نفسه.

### مسار `API`
مسار [route.ts](file:///C:/Users/ElBayyaa/Desktop/PolicyPack/src/app/api/checkout/paddle/route.ts) صحيح منطقيًا، لأنه قد يعيد:

- `transactionId` عندما يتم تجهيز معاملة Paddle بنجاح
- `checkoutUrl` عندما يتوفر رابط مباشر
- `premiumUnlocked` عند التحقق المباشر من معاملة مكتملة

بالتالي الـ API كان يعمل وفق تصميم أوسع من التصميم الذي استوعبه مكوّن `generation-result`.

### مقارنة مع المسارات السليمة داخل المشروع
في كل من:

- [onboarding-wizard.tsx](file:///C:/Users/ElBayyaa/Desktop/PolicyPack/src/components/onboarding/onboarding-wizard.tsx)
- [compliance-dashboard.tsx](file:///C:/Users/ElBayyaa/Desktop/PolicyPack/src/components/dashboard/compliance-dashboard.tsx)

كان الكود يتعامل مع `transactionId` فعليًا عبر:

- فتح `Paddle Overlay`
- أو تمرير المعاملة للتحقق والمتابعة

أما [generation-result.tsx](file:///C:/Users/ElBayyaa/Desktop/PolicyPack/src/components/onboarding/generation-result.tsx) فلم يكن يفعل ذلك، وهنا ظهر التعارض السلوكي.

## فحص Console وNetwork

## Network
التحليل البرمجي يوضح أن النقر كان يصل إلى:

- `POST /api/checkout/paddle`

وكان من الممكن أن يعود بنجاح مع `transactionId`.

هذه ليست مشكلة انقطاع شبكة، بل مشكلة **عدم استكمال التعامل مع الاستجابة** في الواجهة.

## Console
لا يوجد في الكود الحالي ما يضمن ظهور خطأ واضح في `Console` عند هذه الحالة، لأن:

- الاستجابة قد تكون `200 OK`
- ولا يتم رمي استثناء
- لكن الفرع الخاص بـ `transactionId` غير موجود

لذلك السلوك الظاهري هو:
- لا يوجد خطأ واضح للمستخدم
- ولا يحدث انتقال أو تفعيل

وهذا يفسر وصف "الزر لا يستجيب".

## الإصلاح المنفذ

تم تعديل [generation-result.tsx](file:///C:/Users/ElBayyaa/Desktop/PolicyPack/src/components/onboarding/generation-result.tsx) ليعالج `transactionId` العائد من `API`.

### السلوك الجديد
إذا أعاد `POST /api/checkout/paddle` قيمة `transactionId`:

- يتم توجيه المستخدم إلى:

```text
/dashboard?_ptxn=<transactionId>
```

وهذا يسلّم التدفق إلى صفحة `dashboard` التي تحتوي أصلًا على منطق:

- فتح `Paddle Overlay`
- أو التحقق من المعاملة
- أو استكمال تفعيل الباقة

## لماذا هذا الإصلاح صحيح؟

لأنه:

- لا يكرر منطق الدفع الموجود مسبقًا
- يعيد استخدام المسار السليم الموجود في `dashboard`
- يوحّد طريقة التعامل مع `Paddle`
- يمنع حالة "نجاح صامت" بدون نتيجة مرئية

## الاختبارات المضافة

تمت إضافة اختبارين:

### 1. اختبار ربط أزرار الخطة
الملف:

- [plan-selection-dialog.test.tsx](file:///C:/Users/ElBayyaa/Desktop/PolicyPack/src/components/billing/plan-selection-dialog.test.tsx)

ويؤكد أن:

- `Choose Starter` يستدعي `onSelectPlan("starter")`
- `Choose Premium` يستدعي `onSelectPlan("premium")`

### 2. اختبار تفعيل المسار بعد استجابة `transactionId`
الملف:

- [generation-result.test.tsx](file:///C:/Users/ElBayyaa/Desktop/PolicyPack/src/components/onboarding/generation-result.test.tsx)

ويؤكد أن:

- النقر على اختيار الباقة يرسل الطلب إلى `/api/checkout/paddle`
- إذا رجعت الاستجابة بـ `transactionId`
- يتم التوجيه إلى:

```text
/dashboard?_ptxn=txn_123
```

## نتائج التحقق بعد الإصلاح

تم تشغيل:

```bash
npm run test -- src/components/billing/plan-selection-dialog.test.tsx src/components/onboarding/generation-result.test.tsx
npm run test
npm run lint
```

### النتائج
- الاختبارات الموجهة: ناجحة
- الاختبارات الكاملة: `31/31` ناجحة
- `lint`: ناجح

## الملفات المعدلة

- [generation-result.tsx](file:///C:/Users/ElBayyaa/Desktop/PolicyPack/src/components/onboarding/generation-result.tsx)
- [plan-selection-dialog.test.tsx](file:///C:/Users/ElBayyaa/Desktop/PolicyPack/src/components/billing/plan-selection-dialog.test.tsx)
- [generation-result.test.tsx](file:///C:/Users/ElBayyaa/Desktop/PolicyPack/src/components/onboarding/generation-result.test.tsx)

## الخلاصة

سبب العطل لم يكن في شكل الزرين أو حدث النقر، بل في أن صفحة `generation-result` كانت ترسل الطلب بنجاح ثم تهمل نوعًا مهمًا من الاستجابة وهو `transactionId`.

بعد الإصلاح:

- أصبح الضغط على `Starter` و`Premium` يواصل التدفق بشكل صحيح
- يتم تسليم المعاملة إلى `dashboard`
- أصبحت هناك اختبارات تمنع رجوع هذا الخلل مستقبلًا
