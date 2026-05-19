## Зорилго

Суралцагч EJU шалгалтын бүртгэлийн **сүүлийн алхам** болгож QPay2-оор төлбөр төлдөг болгох. Төлбөр амжилттай төлөгдсөний дараа л бүртгэл `PENDING_PAYMENT` → `PENDING` (admin-ийн review-д орох) болж батлагдана.

## Урсгал (Flow)

```text
Student fills application form
        ↓
POST /api/student/application
  → status = PENDING_PAYMENT
  → payment_status = UNPAID
        ↓
POST /api/student/application/{id}/payment/qpay
  → Java backend calls QPay2 API
  → creates invoice, returns qr_image + deeplinks + invoice_id
        ↓
Student scans QR / opens bank app → pays
        ↓
QPay2 callback → POST /api/public/qpay/callback?application_id=...
  → Java verifies via QPay2 /payment/check
  → on PAID: application.payment_status = PAID,
              application.status = PENDING (admin review)
        ↓
Frontend polls GET /api/student/application/{id}
  → sees payment_status=PAID → success screen
        ↓
Admin approves/rejects as before
```

## Backend (Java Spring Boot)

### 1. Шинэ enum утга
`Application.Status`-д **`PENDING_PAYMENT`** нэмнэ (шинэ default). Хуучин `PENDING` нь "төлбөр төлсөн, админ хүлээгдэж буй" утгатай үлдэнэ.

### 2. QPay2 интеграц — шинэ багц `com.eju.auth.payment`
- `QPayProperties` — `@ConfigurationProperties("qpay")`: `baseUrl`, `username`, `password`, `invoiceCode`, `callbackUrl`.
- `QPayClient` (Spring `RestClient`):
  - `POST /v2/auth/token` (Basic auth) → access/refresh token cache (in-memory, expire-aware)
  - `POST /v2/invoice` → invoice үүсгэх
  - `GET  /v2/payment/check` → төлбөрийн статус шалгах
- `PaymentController` (`/api/student/application/{id}/payment`):
  - `POST /qpay` — invoice үүсгэж QR + deeplink буцаана. Хэрэв тухайн application-д урьд нь invoice үүсгэсэн бол cache-аас буцаана.
  - `GET  /qpay/status` — QPay2 руу шалгаад locally update хийгээд статус буцаана.
- `PublicQPayCallbackController` (`/api/public/qpay/callback`) — QPay2 callback, query param `application_id`, body-оор ирсэн `payment_id`-г `/payment/check`-ээр баталгаажуулна (signature биш, source-of-truth дахин дуудах).
- `Payment` entity: `id, applicationId, invoiceId, qpayInvoiceId, amount, status (NEW/PAID/FAILED), createdAt, paidAt`.

### 3. Бизнес логик
`StudentApplicationController.create(...)` — шинэ бүртгэл үүсэхэд `status=PENDING_PAYMENT`, suudal **ESEN nuugdahgui** (одоо APPROVE дээр л суудал хасагдаж байна — өөрчлөхгүй).
Callback PAID болоход: `payment_status=PAID`, `status=PENDING` (хэрэв PENDING_PAYMENT байсан бол).

### 4. Тохиргоо
`application.properties`:
```
qpay.base-url=https://merchant.qpay.mn/v2
qpay.username=${QPAY_USERNAME:}
qpay.password=${QPAY_PASSWORD:}
qpay.invoice-code=${QPAY_INVOICE_CODE:}
qpay.callback-url=${QPAY_CALLBACK_URL:}
eju.exam.fee=70000
```
Секретүүдийг `backend/.env`-д хадгална (sandbox: QPay2 өгсөн test credentials).

## Frontend

### Шинэ хуудас / step
`src/routes/student.application.tsx` — submit хийсний дараа автоматаар **Payment step** руу шилжинэ (хуудас доторх wizard эсвэл шинэ `student.payment.$id.tsx` route).

### Шинэ файлууд
- `src/routes/student.payment.$id.tsx` — QR код, deeplink товчнууд (Khan, Most, Social Pay г.м.), 3 сек тутамд `apiGet("/api/student/application/{id}/payment/qpay/status")` poll, PAID болсон үед success card + "Бүртгэл хүлээгдэж буй" badge харуулна.
- `src/lib/api.ts`-д шинэ helper-уудыг ашиглахад нэмэлт юу ч хэрэггүй (apiGet/apiPost-оо ашиглана).

### UI текст (MN/EN)
- `pending_payment` → "Төлбөр хүлээгдэж буй" / "Awaiting payment"
- `StatusBadge`-д шинэ төлөв нэмнэ.

### Admin
`admin.applications.tsx`-ийн status filter-д `PENDING_PAYMENT` сонголт нэмнэ. Admin зөвхөн `payment_status=PAID` буюу `status=PENDING` дээр approve хийх боломжтой (бусад дээр товч disabled).

## QPay2 credentials (хэрэгтэй)

Хэрэглэгчээс дараах 3 нууцыг `add_secret`-ээр асуух шаардлагатай:
- `QPAY_USERNAME`
- `QPAY_PASSWORD`
- `QPAY_INVOICE_CODE`

`QPAY_CALLBACK_URL` нь app-ийн public URL дээр тулгуурлана (жишээ: `https://<your-domain>/api/public/qpay/callback`). Backend Spring Boot 8080 дээр ажилладаг тул prod дээр reverse-proxy / tunnel хэрэгтэй — энэ нь deployment-ийн асуудал, тусад нь зохицуулна.

## Алхамууд (хэрэгжүүлэх дараалал)

1. `add_secret` × 3 — QPAY_USERNAME, QPAY_PASSWORD, QPAY_INVOICE_CODE.
2. Java: `Application.Status`-д `PENDING_PAYMENT` enum нэмж, `StudentApplicationController.create`-ийг шинэчилнэ.
3. Java: `payment` багц (Properties, Client, Controller, PublicCallback, Payment entity + repo).
4. `application.properties` + `BootstrapAdminRunner`-той ижил pattern-аар тохируулна.
5. Frontend: `student.payment.$id.tsx` route, application submit-ийн дараах redirect, polling, success screen.
6. Frontend: `StatusBadge` + `i18n` + admin filter шинэчлэлт.
7. Гарын авлагаар туршина: register → application submit → QR code → sandbox payment → PAID status → admin approve.

## Тэмдэглэл

- QPay2-ийн callback нь зөвхөн нэмэлт сигнал (real-time UX). Source-of-truth нь frontend polling + `/payment/check` server-side дуудалт. Тиймээс callback URL public хүрэхгүй (localhost) ч бай хэвийн ажиллана — polling дээр тулгуурлана.
- Төлбөр нэг application-д нэг л идэвхтэй invoice (хэрэв `NEW` invoice байгаа бол дахин үүсгэлгүй кэшээс буцаана; expire болсон үед шинээр үүснэ).
- Хэрэглэгчийн өгсөн `qpay2`-ыг QPay v2 REST API-аар хэрэгжүүлнэ (merchant.qpay.mn/v2).

Зөвшөөрвөл credentials асуугаад code-чилж эхэлнэ.
