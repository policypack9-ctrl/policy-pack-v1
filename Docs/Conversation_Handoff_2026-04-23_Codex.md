# PolicyPack Handoff (For New Chat Continuation)

Date: 2026-04-23  
Owner: Ahmed Ali / PolicyPack  
Workspace: `C:\Users\ElBayyaa\Desktop\PolicyPack`

## 1) الهدف من الملف
الملف ده يوثق نقطة التوقف الحالية + خطوات استرجاع التشغيل بسرعة في أي محادثة جديدة، بحيث نكمل بدون فقدان سياق.

---

## 2) اللي تم إنجازه

### A) Outreach Email (Founder mailbox)
- تم تجهيز نظام إرسال منفصل عن support داخل الكود:
  - `src/lib/outreach/index.ts`
- تم تجهيز فحص SMTP:
  - `GET /api/health/outreach-notifications`
- تم تجهيز إرسال preview:
  - `POST /api/admin/outreach/preview`
- تم تجهيز test send في بيئة التطوير:
  - `POST /api/dev/send-test-email` مع `type: "outreach"`
- الـ sender الحالي للتسويق مبني على متغيرات `OUTREACH_SMTP_*`.

### B) Google Sheets integration
- تم تجهيز سكربت مباشر للتعامل مع الشيت:
  - `scripts/google-sheets.mjs`
- أوامر جاهزة:
  - `npm run sheets:list`
  - `npm run sheets:get -- "Company Name"`
  - `npm run sheets:set -- "Company Name" "Column Header" "Value"`
- الشيت المستهدف:
  - `GOOGLE_SHEETS_SPREADSHEET_ID=19X7R8OlHlJW14CeKVeTCoXY5Nwwt9cR_3HToHGn0TaA`

### C) LinkedIn publishing automation
- OAuth + حفظ الاتصال موجود:
  - `src/lib/linkedin.ts`
  - `src/lib/linkedin-settings.ts` (يحفظ token في `app_settings` على Supabase)
- صفحات/Routes الإدارة:
  - `GET /admin/linkedin`
  - `GET /api/admin/linkedin/connect`
  - `GET /api/admin/linkedin/callback`
  - `GET /api/admin/linkedin/status`
  - `POST /api/admin/linkedin/publish` (نشر text post)
- واجهة النشر:
  - `src/app/admin/linkedin/publish-form.tsx`

---

## 3) نقطة الوقوف الحالية

1. LinkedIn OAuth متوصل بنجاح من صفحة الإدارة (`/admin/linkedin`).
2. النشر الحالي يعمل على **الحساب الشخصي** المتوصل (مش صفحة الشركة تلقائيًا).
3. الشغل التجاري (outreach + leads) شغال على batches:
   - Batch 02/03/04/05 موجودين في `Docs/*.tsv`.
4. آخر طلب تشغيلي كان: متابعة الإرسال من Batch 05 (أول 3).

---

## 4) الملفات المرجعية الأساسية

- الخطة:  
  - `Docs/Marketing_GTM_30_Day_Plan_2026-04-17_Codex.md`
- قوالب الرسائل:  
  - `Docs/Outreach_Template_01_2026-04-18_Codex.md`
- ليدز:  
  - `Docs/Prospects_Batch_02_2026-04-18_Codex.tsv`
  - `Docs/Prospects_Batch_03_2026-04-21_Codex.tsv`
  - `Docs/Prospects_Batch_04_2026-04-21_Codex.tsv`
  - `Docs/Prospects_Batch_05_2026-04-22_Codex.tsv`
- LinkedIn post content/media:  
  - `Docs/LinkedIn_Post_02_2026-04-20_Codex.md`

---

## 5) ازاي ترجّع الوصول بسرعة في أي محادثة جديدة

## A) وصول الإيميل (Outreach SMTP)
تأكد إن القيم دي موجودة في Vercel (All Environments) أو `.env.local`:

- `OUTREACH_SMTP_PROVIDER`
- `OUTREACH_SMTP_HOST`
- `OUTREACH_SMTP_PORT`
- `OUTREACH_SMTP_SECURE`
- `OUTREACH_SMTP_USER`
- `OUTREACH_SMTP_PASS`
- `OUTREACH_SMTP_FROM`
- `OUTREACH_SMTP_REPLY_TO`

اختبار الصحة:
```powershell
Invoke-RestMethod -Method GET `
  -Uri "https://policypack.org/api/health/outreach-notifications" `
  -Headers @{ "x-healthcheck-secret" = "<HEALTHCHECK_SECRET>" }
```

---

## 9) Pre-Windows-Reinstall Checklist (Mandatory)

Before installing a new Windows copy, confirm:

1. GitHub sync is complete:
   - `git status -sb` has no pending local commits.
   - `git ls-remote origin refs/heads/main` has latest local hash.
2. Backup all secrets outside this repo:
   - Vercel env vars (especially `OUTREACH_SMTP_*`, `LINKEDIN_*`, `HEALTHCHECK_SECRET`)
   - `.secrets/google-sheets-service-account.json`
   - mailbox passwords used for `support@policypack.org` and `founder@policypack.org`
3. Keep this handoff file:
   - `Docs/Conversation_Handoff_2026-04-23_Codex.md`
4. Keep active lead files:
   - `Docs/Prospects_Batch_02_2026-04-18_Codex.tsv`
   - `Docs/Prospects_Batch_03_2026-04-21_Codex.tsv`
   - `Docs/Prospects_Batch_04_2026-04-21_Codex.tsv`
   - `Docs/Prospects_Batch_05_2026-04-22_Codex.tsv`

---

## 10) End-of-Session Protocol (Persistent Rule)

At the end of every session, assistant must:

1. Summarize today:
   - emails sent
   - LinkedIn actions done
   - sheet updates
   - pending replies
2. Ask this exact next-step question:
   - `نكمّل إيه في الجلسة الجاية: Batch جديد، ولا مراجعة الردود، ولا Follow-up؟`

This should be applied in every new chat after reading this file.

---

## 11) LinkedIn Auto Message Classification

If sender is "The LinkedIn Team" and message is onboarding tips:

- Type: System onboarding message (not lead, not sales opportunity).
- Action:
  1. No business reply.
  2. Ignore or archive.
  3. Do not add to leads sheet.

اختبار preview:
```powershell
Invoke-RestMethod -Method POST `
  -Uri "https://policypack.org/api/admin/outreach/preview" `
  -Headers @{ "Content-Type"="application/json"; "x-healthcheck-secret"="<HEALTHCHECK_SECRET>" } `
  -Body '{"email":"a.a.pay2017@gmail.com"}'
```

## B) وصول Google Sheet
لازم 3 عناصر:
1. ملف service account موجود محليًا:  
   - `.secrets/google-sheets-service-account.json`
2. الشيت معمول له Share على:
   - `policypack-sheets-bot@policypack-sheets.iam.gserviceaccount.com`
3. envs:
   - `GOOGLE_SHEETS_SPREADSHEET_ID`
   - `GOOGLE_SHEETS_SHEET_NAME`
   - `GOOGLE_SHEETS_SERVICE_ACCOUNT_KEY_FILE`

اختبار:
```powershell
npm run sheets:list
```

## C) وصول LinkedIn
لازم envs:
- `LINKEDIN_CLIENT_ID`
- `LINKEDIN_CLIENT_SECRET`
- `LINKEDIN_REDIRECT_URI=https://policypack.org/api/admin/linkedin/callback`

لازم في LinkedIn Developer App:
- Product مضاف: `Share on LinkedIn`
- Redirect URI نفس اللي فوق
- Scopes تتضمن `w_member_social` + OpenID scopes

خطوات الربط:
1. افتح `https://policypack.org/admin/linkedin`
2. اضغط `Connect LinkedIn profile`
3. وافق على الصلاحيات
4. ارجع لنفس الصفحة وتأكد الحالة `Connected: Yes`

---

## 6) التشغيل اليومي السريع (Runbook)

1. راجع الردود القديمة من batches السابقة.
2. حدّث الشيت (`Replied?`, `Call booked?`, `Next action`).
3. ابعت دفعة صغيرة جديدة (3-6 إيميلات) فقط.
4. انشر بوست LinkedIn واحد يوميًا (text أو text+image يدوي).
5. سجل أي نتيجة في الشيت فورًا.

---

## 7) ملاحظات أمان مهمة

1. لا تضع كلمات مرور أو secrets داخل chat نصًا.
2. أي secret ظهر في screenshot أو اتسرب:
   - يتعمل له rotate فورًا.
3. حافظ على:
   - `.secrets/` خارج git
   - `.env.local` خارج git

---

## 8) Prompt جاهز للمحادثة الجديدة

انسخ الرسالة دي في أي شات جديد:

```text
اقرأ الملف:
Docs/Conversation_Handoff_2026-04-23_Codex.md

ثم نفّذ مباشرة:
1) فحص وصول الشيت
2) فحص Outreach SMTP health
3) فحص LinkedIn status
4) تحديث نقطة الوقوف الحالية
5) تجهيز وإرسال أول دفعة اليوم
```
