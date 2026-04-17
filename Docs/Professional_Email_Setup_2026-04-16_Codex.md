# إعداد البريد الاحترافي لـ PolicyPack

الهدف هو أن يرسل التطبيق الرسائل الموجهة للمستخدم من:

- `support@policypack.org`

وليس من:

- أي حساب Gmail شخصي
- أي mailbox لا يطابق الدومين `policypack.org`

## ما الذي تم تجهيزه داخل التطبيق

- التطبيق يرفض إرسال welcome emails وpayment emails وpromo-ended emails إذا كان `SMTP_FROM` لا يطابق `support@policypack.org`.
- healthcheck البريد صار يعرض السبب بوضوح إذا كان المرسل غير صحيح أو إذا كان المزود غير احترافي.
- المثال الافتراضي في `.env.example` أصبح مبنيًا على `support@policypack.org`.

## المطلوب خارجيًا

1. إنشاء mailbox حقيقي:
   `support@policypack.org`

2. ربطه مع مزود بريد احترافي يدعم SMTP.

أمثلة مناسبة:
- Resend
- Postmark
- SendGrid
- Mailgun
- Microsoft 365
- Zoho Mail

3. ضبط DNS للدومين `policypack.org`:
- SPF
- DKIM
- DMARC

## القيم المطلوبة في `.env.local`

```env
SMTP_PROVIDER="smtp"
SMTP_HOST="smtp.your-mail-provider.com"
SMTP_PORT="465"
SMTP_SECURE="true"
SMTP_USER="support@policypack.org"
SMTP_PASS="your-real-smtp-password"
SMTP_FROM="PolicyPack Support <support@policypack.org>"
SMTP_REPLY_TO="support@policypack.org"
```

إذا كان المزود يقدم host مختلفًا أو port مختلفًا، استخدم قيمه الرسمية بدل المثال.

## كيف تتأكد أن الإعداد صحيح

بعد ضبط القيم، شغّل:

```bash
curl -H "x-healthcheck-secret: YOUR_SECRET" http://localhost:3000/api/health/notifications
```

المتوقع:

```json
{
  "success": true,
  "status": "ok"
}
```

إذا رجع:

- `unconfigured`
  فهذا يعني أن `SMTP_HOST` أو `SMTP_USER` أو `SMTP_PASS` ناقص.

- `error`
  فهذا يعني عادة أحد الأمور التالية:
  - ما زلت تستخدم Gmail
  - `SMTP_FROM` لا يطابق `support@policypack.org`
  - الاتصال بـ SMTP فشل

## ملاحظات مهمة

- Paddle سيظل يرسل رسائل الاشتراك/الإيصال الإلزامية الخاصة به. هذا ليس تحت تحكم التطبيق.
- التطبيق فقط يضمن أن الرسائل التي يرسلها هو نفسه لا تخرج من Gmail أو من sender غير `support@policypack.org`.
- لا تستخدم `reply-to` فقط لحل المشكلة. المهم هو `from` الفعلي وسمعة الدومين وSPF/DKIM/DMARC.
