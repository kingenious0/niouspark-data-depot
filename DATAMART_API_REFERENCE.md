# Datamart Developer API v2 — Full API Reference

Complete reference extracted from the Datamart Developer Portal docs (Turbopack bundle served at `https://api.datamartgh.shop`).

- **Base URL:** `https://api.datamartgh.shop/api/developer`
- **Checkers base:** `https://api.datamartgh.shop/api/checkers` (NOT under `/api/developer`)
- **Withdrawal base:** `https://api.datamartgh.shop/api/developer/v1/withdrawals`
- **Widget script:** `https://api.datamartgh.shop/widgets/delivery-tracker.js`
- **Support:** Phone/WhatsApp `0596922026`, `support@datamartgh.shop`, WhatsApp community: `https://chat.whatsapp.com/HfHCT72jm2Z1B14fsJjuhT`

---

## 1. Getting Started

1. Generate an API key via `POST /api/developer/generate-api-key` (auth via `x-auth-token` / `Authorization: Bearer`; OTP possible).
2. Add `X-API-Key` to every request.
3. Test with the API Simulator (makes **real** requests — wallet is charged).

---

## 2. Authentication

Headers: `X-API-Key` (required), `Content-Type: application/json`.

Per-key API rules:
- **Reference rule** — every `ref` must start with a secret prefix (e.g. `sam-`).
- **Second secret** — `X-API-Secret` header.
- **Limits** — max GB per order + max daily spend.

Auth errors:
| HTTP | Code | Meaning |
|---|---|---|
| 403 | `API_RULE_VIOLATION` | Deliberately vague message |
| 403 | `API_IP_NOT_ALLOWED` | IP not in allow-list |
| 503 | `AUTH_BACKEND_UNAVAILABLE` | Retryable — not a bad key |

IP allow-list note: must include your server's **IPv6** address if it has one — most servers reach Datamart over IPv6 by preference.

### Rate limits
- General API: **200 req/min**
- Purchases: **150 req/min**
- Balance checks: **120 req/min**

Every response includes `rateLimit: { limit, remaining, resetInSeconds }`. When `limit` is `null` the key is UNLIMITED. Headers `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset` are also set.

### Idempotency (applies to purchases & withdrawals)
- `X-Idempotency-Key`: fresh UUID per logical request.
- Same key within **24h** returns the original response — safe to retry on timeout/5xx.
- Concurrent request with same key → `409 REQUEST_IN_PROGRESS`.
- Recommended on `/purchase` today; **will become required**.

---

## 3. Verify Number

### `POST /verify-number`
Body: `{ "phoneNumber": "0244100459" }`
- Does NOT place an order or charge.
- Pre-checks MTN new-beneficiary freeze (stops orders landing in `waiting`).

### `POST /verify-number/bulk`
- `numbers` may be strings or `{number}` / `{_beneficiary_number}` objects.
- Normalized to 10-digit local (`233244100459` → `0244100459`).
- Response: `{ status, summary: { total, accepted, rejected }, results: [{ number, normalized, accepted, reason }] }`
- Rejected example: `"The beneficiary phone number 0559233850 is not allowed."`

Limits: max **100/request**, **10 req/min/key**.
- More than 100 → `400`
- Unrecognized item → `normalized: null, reason: "invalid_number"`
- Real checks capped at **2 checks/min** → `429 RATE_LIMIT_EXCEEDED` with `retryAfter`

---

## 4. Purchase Data

### `POST /purchase`
Headers: `X-API-Key` (yes), `Content-Type` (yes), `X-Idempotency-Key` (recommended).

Request:
```json
{
  "phoneNumber": "0551234567",
  "network": "YELLO",
  "capacity": "5",
  "gateway": "wallet",
  "ref": "sam-001"
}
```

| Field | Values |
|---|---|
| `network` | `YELLO` \| `TELECEL` \| `AT_PREMIUM` |
| `gateway` | `wallet` |
| `ref` | optional; required + must match prefix if a ref-rule is set |

Success response:
```json
{
  "status": "success",
  "message": "...",
  "data": {
    "purchaseId": "60f1e5b3e6b39812345678",
    "orderReference": "GN-AB12CD34",
    "transactionReference": "TRX-a1b2c3d4-...",
    "network": "YELLO",
    "capacity": 5,
    "price": 23.00,
    "balanceBefore": 200.00,
    "balanceAfter": 177.00,
    "orderStatus": "completed",
    "processingMethod": "standard"
  },
  "rateLimit": { "limit": 150, "remaining": 147, "resetInSeconds": 45 }
}
```

Insufficient-balance error:
```json
{
  "status": "error",
  "message": "Insufficient wallet balance",
  "currentBalance": 10.00,
  "requiredAmount": 23.00
}
```

---

## 5. Bulk Purchase

### `POST /bulk-purchase`
Up to **50 orders**; one `X-Idempotency-Key` for the whole batch.

Request:
```json
{
  "orders": [
    { "phoneNumber": "0551234567", "network": "YELLO", "capacity": "5", "ref": "MY-001" },
    { "phoneNumber": "0201234567", "network": "TELECEL", "capacity": "10", "ref": "MY-002" },
    { "phoneNumber": "0271234567", "network": "AT_PREMIUM", "capacity": "2" }
  ]
}
```

Response:
```json
{
  "status": "success",
  "data": {
    "summary": { "total": 3, "successful": 3, "failed": 0, "invalid": 0, "totalCharged": 42.50, "remainingBalance": 177.00 },
    "results": [
      {
        "index": 0, "ref": "MY-001", "phoneNumber": "0551234567", "network": "YELLO",
        "capacity": "5", "price": 23.00, "status": "queued",
        "purchaseId": "...", "orderReference": "GN-AB12CD34",
        "transactionReference": "TRX-...", "balanceBefore": 200.00, "balanceAfter": 177.00
      }
    ],
    "validationErrors": []
  }
}
```

---

## 6. Order Status

### `GET /order-status/:reference`
`:reference` = the `orderReference` (e.g. `GN-AB12CD34`).

Response:
```json
{
  "status": "success",
  "data": {
    "orderId": "60f1e5b3e6b39812345678",
    "reference": "GN-AB12CD34",
    "phoneNumber": "0551234567",
    "network": "YELLO",
    "capacity": 5,
    "price": 23.00,
    "orderStatus": "completed",
    "processingMethod": "standard",
    "createdAt": "2024-01-15T10:28:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

### Order status values
| Status | Meaning |
|---|---|
| `pending` | New order placed |
| `waiting` | Delivery delayed — order is in recovery and will still be delivered |
| `processing` | Order being processed |
| `completed` | Data delivered |
| `failed` | Order failed |
| `refunded` | Order refunded |

---

## 7. Delivery Tracker

### `GET /delivery-tracker`
Poll every **10–30 seconds**. Widget embed is the recommended alternative.

Response:
```json
{
  "status": "success",
  "data": {
    "message": "Delivery scanner is actively checking orders...",
    "scanner": { "active": true, "waiting": false, "waitSeconds": 0 },
    "stats": { "checked": 45, "delivered": 38, "partial": 3, "pending": 4, "failed": 0 },
    "lastDelivered": {
      "trackingId": "1557392",
      "summary": "Tracking #1557392 - placed at Apr 03, 10:03 AM, delivered at Apr 03, 11:51 AM"
    },
    "checkingNow": { "summary": "Checking now: Batch #1557079" },
    "yourOrders": {
      "inCurrentBatch": [
        { "phone": "055****567", "network": "YELLO", "capacity": 5, "deliveryStatus": "Sent" }
      ],
      "inLastDeliveredBatch": []
    }
  }
}
```

- `deliveryStatus`: documented value is `"Sent"`.
- Scanner states: **Active** (green, "Scanner is checking deliveries"), **Waiting** (yellow, "Paused between checks"), **Idle** (gray, "Scanner is not running").
- Tip: combine with webhooks — tracker for live display, webhooks for instant per-order notifications.

---

## 8. Data Packages

### `GET /data-packages?network=YELLO`
Query param `network` optional; values `YELLO` | `TELECEL` | `AT_PREMIUM`.

Response:
```json
{
  "status": "success",
  "pricingTier": "reseller",
  "data": {
    "YELLO": [
      { "capacity": 1, "mb": 1024, "network": "YELLO", "price": 4.00 },
      { "capacity": 2, "mb": 2048, "network": "YELLO", "price": 9.00 },
      { "capacity": 5, "mb": 5120, "network": "YELLO", "price": 23.00 }
    ],
    "TELECEL": [],
    "AT_PREMIUM": []
  }
}
```

---

## 9. Balance

### `GET /balance`
```json
{
  "status": "success",
  "data": {
    "balance": 192.50,
    "currency": "GHS",
    "user": { "id": "60f1e5b3e6b39812345678", "name": "John Doe", "email": "john@example.com" },
    "timestamp": "2024-01-15T12:00:00.000Z"
  }
}
```

---

## 10. Result Checkers (WAEC & BECE)

Base: `https://api.datamartgh.shop/api/checkers`. Same `X-API-Key`, same wallet, same key rules apply.

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/checkers/products` | Types, price, live stock |
| POST | `/api/checkers/purchase` | Buy one card |
| POST | `/api/checkers/bulk-purchase` | Buy up to 20 of one type |
| GET | `/api/checkers/order-status/:reference` | Re-read a purchase |
| GET | `/api/checkers/purchase-history` | Paginated history |
| GET | `/api/checkers/balance` | Wallet balance |
| POST | `/api/checkers/validate-reference` | Check a ref is unused |

### `GET /api/checkers/products`
```json
{
  "status": "success",
  "data": [
    { "id": "65f4a3d9c9e77c001c8e4567", "name": "WAEC", "description": "WAEC result checker card", "price": 15.7, "inStock": true, "stockCount": 342 },
    { "id": "65f4a3d9c9e77c001c8e4568", "name": "BECE", "description": "BECE result checker card", "price": 15.7, "inStock": false, "stockCount": 0 }
  ]
}
```
Always check `inStock` before selling — when `stockCount` hits 0, purchases fail with `400` until restocked.

### `POST /api/checkers/purchase`
Body:
```json
{
  "checkerType": "WAEC",
  "phoneNumber": "0241234567",
  "ref": "sam-001",
  "webhookUrl": "https://your-app.com/webhook",
  "skipSms": false
}
```

| Field | Required | Notes |
|---|---|---|
| `checkerType` | yes | `WAEC` or `BECE` |
| `phoneNumber` | yes | Where the SMS goes |
| `ref` | optional* | Must be unique; *required + match prefix if a ref-rule is set |
| `webhookUrl` | optional | Receives `checker.purchase.completed` |
| `skipSms` | optional | `true` to suppress SMS and deliver the card yourself (default `false`) |

Response **201**:
```json
{
  "status": "success",
  "message": "Result checker purchased successfully",
  "data": {
    "purchaseId": "65f4a3d9c9e77c001c8e4569",
    "reference": "CHKW17345678900001",
    "checkerType": "WAEC",
    "serialNumber": "WEC2024ABC123",
    "pin": "1234567890",
    "phoneNumber": "0241234567",
    "price": 15.7,
    "balanceBefore": 100.00,
    "balanceAfter": 84.30,
    "transactionId": "65f4a3d9c9e77c001c8e456a",
    "createdAt": "2026-03-15T14:30:00.000Z",
    "smsNotification": { "sent": true, "message": "SMS sent successfully" }
  }
}
```
⚠️ **Store the serial and PIN — they are returned once** (re-readable via order-status). If `skipSms: true` and you drop the response, the buyer never gets their card.

### `POST /api/checkers/bulk-purchase`
One type + `quantity` (1–20). No `orders` array.
```json
{
  "checkerType": "WAEC",
  "phoneNumber": "0241234567",
  "quantity": 5,
  "ref": "sam-batch-001",
  "webhookUrl": "https://your-app.com/webhook",
  "skipSms": false
}
```
Response **201**: `data` has `checkerType`, `quantity`, `pricePerCard`, `totalCost`, `phoneNumber`, `balanceBefore`, `balanceAfter`, `cards[]` (one entry per card: `purchaseId`, `reference`, `checkerType`, `serialNumber`, `pin`, `price`, `createdAt`), `smsNotification`.

- **One batch at a time** — a second bulk call while one is running → `429`.
- **All or nothing** — if it fails partway, nothing is charged and no cards issued.
- One SMS for the batch, not one per card (unless `skipSms: true`).

### `GET /api/checkers/order-status/:reference`
Re-reads a purchase including serial + PIN. Scoped to your own account — another user's reference → `404`.
```json
{
  "status": "success",
  "data": {
    "purchaseId": "65f4a3d9c9e77c001c8e4569",
    "reference": "CHKW17345678900001",
    "checkerType": "WAEC",
    "serialNumber": "WEC2024ABC123",
    "pin": "1234567890",
    "price": 15.7,
    "orderStatus": "completed",
    "paymentMethod": "wallet",
    "createdAt": "2026-03-15T14:30:00.000Z",
    "updatedAt": "2026-03-15T14:30:02.000Z",
    "transaction": { "id": "...", "balanceBefore": 100.00, "balanceAfter": 84.30, "status": "completed" }
  }
}
```

### `GET /api/checkers/purchase-history`
Query: `?page=1` (default 1), `&limit=20` (default 20), `&checkerType=WAEC`, `&startDate=2026-03-01`, `&endDate=2026-03-31` (inclusive).
Returns completed purchases only, newest first.
```json
{
  "status": "success",
  "data": {
    "purchases": [
      { "purchaseId": "...", "reference": "CHKW17345678900001", "checkerType": "WAEC", "serialNumber": "WEC2024ABC123", "pin": "1234567890", "transaction": { "balanceBefore": 100.00, "balanceAfter": 84.30 } }
    ],
    "pagination": { "currentPage": 1, "totalPages": 5, "totalItems": 92, "hasNextPage": true, "hasPrevPage": false }
  }
}
```

### `GET /api/checkers/balance`
```json
{ "status": "success", "data": { "walletBalance": 121.50, "currency": "GHS" } }
```

### `POST /api/checkers/validate-reference`
```json
// Request
{ "reference": "sam-001" }
// Response
{ "status": "success", "data": { "reference": "sam-001", "exists": false, "available": true } }
```
Checks uniqueness only — does not tell you whether the ref satisfies a key API rule.

### Checkers error responses
| HTTP | Meaning |
|---|---|
| 400 | Missing/invalid fields, out of stock, duplicate `ref`, insufficient balance, or `quantity` outside 1–20 |
| 403 | Account disabled |
| 404 | Reference not found on your account, or product does not exist |
| 429 | A bulk purchase is already running for your account |
| 500 | Nothing was charged — safe to retry |

Plus auth errors: `403 API_RULE_VIOLATION`, `403 API_IP_NOT_ALLOWED`, `503 AUTH_BACKEND_UNAVAILABLE`.

---

## 11. Withdrawal API

Base: `https://api.datamartgh.shop/api/developer/v1/withdrawals`. Admin-gated — disabled by default on every API key. Requires a **signing secret** (shown once) and configured limits.

| Operation | Method + Path |
|---|---|
| Create | `POST /api/developer/v1/withdrawals` |
| Get by reference | `GET /api/developer/v1/withdrawals/:reference` |
| List | `GET /api/developer/v1/withdrawals?status=&page=&limit=` |
| Meta / limits | `GET /api/developer/v1/withdrawals/meta/limits` |

### Headers
| Header | Required | Description |
|---|---|---|
| `X-API-Key` | yes | Your DataMart API key |
| `X-Idempotency-Key` | yes | Unique per request; 24h replay returns original response |
| `X-Signature` | yes* | HMAC-SHA256 hex digest of `{ts}.{method}.{path}.{body}` |
| `X-Timestamp` | yes* | Millisecond epoch; within 5 minutes of server time |
| `Content-Type` | yes | `application/json` |

\* Required when HMAC is enforced on your key (default: yes).

### HMAC signing
Payload = `{timestamp}.{method}.{path}.{rawBody}` (e.g. `1744849000000.POST./api/developer/v1/withdrawals.{raw}`). Sign the EXACT bytes you POST — if the HTTP library re-serializes the body, the signature won't match.

Node.js:
```js
const payload = `${ts}.POST.${path}.${rawBody}`;
const sig = crypto.createHmac('sha256', SIGNING_SECRET).update(payload).digest('hex');
```
Python:
```python
hmac.new(SIGNING_SECRET.encode(), payload.encode(), hashlib.sha256).hexdigest()
```

- Requests >5 min off server time → `INVALID_TIMESTAMP`.
- **5 invalid signatures in a 10-minute window → withdrawal access auto-disabled** (re-enable via support).

### Create — request body
```json
{
  "amount": 50.00,
  "phoneNumber": "0541234567",
  "network": "MTN",
  "recipientName": "Kwame Mensah",
  "clientRef": "your-internal-ref-12345"
}
```

| Field | Notes |
|---|---|
| `amount` | GHS. Recipient receives exactly this. Min 10, max = your `singleTxnLimit`. |
| `phoneNumber` | 10-digit GH number (`0541234567`); `233` prefix also accepted. |
| `network` | `MTN` / `TELECEL` / `AIRTELTIGO`. Aliases: `VOD`, `VODAFONE` → TELECEL; `AIR`, `AT`, `ATL`, `TIGO` → AIRTELTIGO. |
| `recipientName` | optional; shown on payout if provider supports it |
| `clientRef` | optional; your own reference stored alongside ours |

### Success response (200)
```json
{
  "status": "success",
  "data": {
    "reference": "RSW-1744849000-A1B2C3D4",
    "clientRef": "your-internal-ref-12345",
    "status": "processing",
    "amount": 50,
    "fee": 1,
    "feePercent": 2,
    "totalCharged": 51,
    "recipient": { "phone": "0541234567", "network": "MTN", "name": "Kwame Mensah" },
    "provider": "paystack",
    "balanceBefore": 520.5,
    "balanceAfter": 469.5,
    "createdAt": "2026-04-17T10:30:00Z"
  }
}
```

### Status lifecycle
`pending` → `processing` → `completed` OR `failed` → `refunded`

### `GET /:reference`
Returns the same shape as create. If still `processing`, polls the provider fresh before responding.

### List
`GET /api/developer/v1/withdrawals?status=completed&page=1&limit=20`
Params: `status` (optional), `date` (YYYY-MM-DD shortcut), `from`/`to` (YYYY-MM-DD or ISO timestamp), `page`, `limit` (max 100).
```json
{
  "status": "success",
  "data": {
    "withdrawals": [],
    "summary": { "count": 12, "totalAmount": 1840.00, "completedCount": 11, "completedAmount": 1700.00 },
    "filters": { "status": "completed", "from": "2026-05-01T00:00:00.000Z", "to": "2026-05-01T23:59:59.999Z" },
    "pagination": { "page": 1, "limit": 20, "total": 12, "pages": 1 }
  }
}
```

### Meta / limits
```json
{
  "status": "success",
  "data": {
    "walletBalance": 520.5,
    "feePercent": 2,
    "singleTxnLimit": 1000,
    "dailyLimit": 10000,
    "todayWithdrawn": 340,
    "todayRemaining": 9660,
    "totalWithdrawn": 12840,
    "hmacRequired": true
  }
}
```

### Withdrawal error codes
| HTTP | Code | Meaning |
|---|---|---|
| 400 | `MISSING_IDEMPOTENCY_KEY` | Header omitted |
| 400 | `AMOUNT_TOO_SMALL` | Below GHS 10 |
| 400 | `AMOUNT_EXCEEDS_LIMIT` | Above your `singleTxnLimit` |
| 400 | `INVALID_PHONE` | Not a valid 10-digit GH number |
| 400 | `INVALID_NETWORK` | Not one of MTN/TELECEL/AIRTELTIGO |
| 400 | `NETWORK_MISMATCH` | Phone prefix doesn't match supplied network |
| 400 | `INSUFFICIENT_BALANCE` | Wallet < `amount + fee` |
| 400 | `DAILY_LIMIT_REACHED` | Daily cap would be exceeded |
| 401 | `INVALID_SIGNATURE` | HMAC mismatch |
| 401 | `INVALID_TIMESTAMP` | Outside 5-minute window |
| 403 | `WITHDRAWAL_NOT_ENABLED` | Admin hasn't enabled withdrawals on your key |
| 403 | `IP_NOT_ALLOWED` | Your IP not in the allowlist |
| 429 | `RATE_LIMIT_EXCEEDED` | >30 requests/min |
| 502 | `PROVIDER_FAILED` | Provider rejected; **wallet already refunded** |

### Default limits
- Min single withdrawal: **GHS 10**
- Max single withdrawal: **GHS 1,000** (admin-configurable up to 50,000)
- Daily total: **GHS 10,000** (admin-configurable)
- Fee: **2% on top** (admin-configurable)
- Rate limit: **30 requests/minute**

### Polling guidance (v1 — webhooks NOT implemented for withdrawals yet)
1. Immediately after creation (catches fast-provider `completed`).
2. Every 5–10 s for the first 2 minutes.
3. Every 30 s until terminal status or 15 minutes.
4. Stuck at 15 min → contact support with the `reference`. **Never retry with a new idempotency key — it will double-charge.**

---

## 12. Transactions

### `GET /transactions?page=1&limit=20`
```json
{
  "status": "success",
  "data": {
    "transactions": [
      {
        "type": "purchase",
        "amount": 23.00,
        "status": "completed",
        "reference": "TRX-a1b2c3d4-...",
        "gateway": "wallet",
        "createdAt": "2024-01-15T12:00:00.000Z"
      }
    ],
    "pagination": { "currentPage": 1, "totalPages": 5, "totalItems": 92 }
  }
}
```

Related:
- `GET /purchase-history/:userId?page=1&limit=20` — detailed purchase records with balance tracking.
- `POST /claim-referral-bonus` — claim pending referral bonuses.

---

## 13. Usage Stats

### `GET /usage/stats`
Header: `X-API-Key`. No documented response template; UI reads:
- `totalRequests` ("Total Requests")
- `successfulRequests` ("Successful")
- `failedRequests` ("Failed")
- `totalSpent` ("Total Spent", rendered as `GHS x.xx`)

### `GET /usage/history?page=1&limit=20`
Get detailed API call history with pagination. (No response template in docs.)

---

## 14. Webhooks

Base: `https://api.datamartgh.shop/api/developer`

| Operation | Method + Path | Body/Notes |
|---|---|---|
| Status | `GET /webhook/status` | `X-API-Key` |
| Configure | `POST /webhook/configure` | `{ url, events: { orderCreated, orderProcessing, orderWaiting, orderCompleted, orderFailed, orderRefunded } }` |
| Test | `POST /webhook/test` | no body |
| Delete | `DELETE /webhook` | confirm dialog |
| Toggle | `PUT /webhook/toggle` | `{ isActive: true }` — re-enables, resets failure count |

### Webhook secret
Configure response exposes `data.secret` — shown **once** ("Save your webhook secret! It won't be shown again."). If lost, delete and reconfigure to get a new one.

### Events
Default on: `orderCreated`, `orderProcessing`, `orderWaiting`, `orderCompleted`, `orderFailed`. **Default off: `orderRefunded`.**

| Event | Meaning |
|---|---|
| `order.created` | New order placed |
| `order.processing` | Order being processed |
| `order.waiting` | Delivery delayed — order is in recovery and will still be delivered |
| `order.completed` | Data delivered |
| `order.failed` | Order failed |
| `order.refunded` | Order refunded |

### Payload
```json
{
  "event": "order.completed",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "data": {
    "orderId": "60f1e5b3e6b39812345678",
    "orderReference": "GN-AB12CD34",
    "transactionId": "TRX-a1b2c3d4-...",
    "phone": "0551234567",
    "network": "YELLO",
    "capacity": 5,
    "price": 20.50,
    "status": "completed",
    "createdAt": "2024-01-15T10:28:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

### Headers
```
X-DataMart-Signature: <HMAC-SHA256 signature>
X-DataMart-Event: order.completed
Content-Type: application/json
```

### Signature verification (Node.js)
```js
const sig = req.headers['x-datamart-signature'];
const expected = crypto.createHmac('sha256', YOUR_SECRET)
  .update(JSON.stringify(req.body))
  .digest('hex');
if (sig !== expected) return res.status(401).json({ error: 'Invalid' });
const { event, data } = req.body;
console.log(event, data.orderReference, data.status);
res.json({ received: true });
```
`X-DataMart-Signature` = `HMAC-SHA256(JSON.stringify(body))` hex, keyed with the webhook secret.

### Status response fields (`GET /webhook/status` → `data`)
`configured`, `url`, `events`, `isActive` ("Active"/"Inactive"), `failureCount` ("N consecutive fails"), `lastDelivery` (`status`, `error`, `responseCode`, `timestamp`), `stats` (`totalDeliveries`, `successCount`, `failureCount`), `deliveryLog[]` (`timestamp`, `status` "success"/"FAIL", `event`, `responseCode`, `orderReference`, `error`).

---

## 15. Widget (Delivery Tracker)

Embed:
```html
<script src="https://api.datamartgh.shop/widgets/delivery-tracker.js"
        data-api-key="YOUR_API_KEY" data-theme="dark"></script>
```

| Attribute | Default | Description |
|---|---|---|
| `data-api-key` | required | Your DataMart API key |
| `data-theme` | `dark` | `dark` or `light` |
| `data-position` | `bottom-right` | `bottom-right` \| `bottom-left` \| `top-right` \| `top-left` |
| `data-poll` | `15` | Refresh interval in seconds (min 5) |
| `data-container` | — | ID of a div to embed inline (no floating button) |

Floating mode:
```html
<script src="https://api.datamartgh.shop/widgets/delivery-tracker.js" data-api-key="YOUR_KEY" data-theme="dark" data-position="bottom-right"></script>
```
Inline mode:
```html
<div id="tracker"></div>
<script src="https://api.datamartgh.shop/widgets/delivery-tracker.js" data-api-key="YOUR_KEY" data-theme="light" data-container="tracker"></script>
```
Widget polls every 15 seconds automatically.

---

## 16. Code Samples

### Node.js / Next.js
```js
const axios = require('axios');
const { randomUUID } = require('crypto');

const datamart = axios.create({
  baseURL: 'https://api.datamartgh.shop/api/developer',
  headers: { 'X-API-Key': process.env.DATAMART_API_KEY }
});

// Purchase data - retry-safe via X-Idempotency-Key
const { data } = await datamart.post('/purchase', {
  phoneNumber: '0551234567',
  network: 'YELLO',
  capacity: '5',
  gateway: 'wallet'
}, {
  headers: { 'X-Idempotency-Key': randomUUID() }
});

console.log(data.data.orderReference); // GN-AB12CD34

// Check status
const status = await datamart.get(`/order-status/${data.data.orderReference}`);
console.log(status.data.data.orderStatus); // completed

// Bulk purchase (up to 50 orders) - one key for the whole batch
const bulk = await datamart.post('/bulk-purchase', {
  orders: [
    { phoneNumber: '0551234567', network: 'YELLO', capacity: '5', ref: 'MY-001' },
    { phoneNumber: '0201234567', network: 'TELECEL', capacity: '10', ref: 'MY-002' },
    { phoneNumber: '0271234567', network: 'AT_PREMIUM', capacity: '2' }
  ]
}, {
  headers: { 'X-Idempotency-Key': randomUUID() }
});

console.log(bulk.data.data.summary);
// { total: 3, successful: 3, failed: 0, totalCharged: 42.50 }
bulk.data.data.results.forEach(r =>
  console.log(`${r.ref}: ${r.status} - ${r.orderReference}`)
);
```

### Python
```python
import requests, uuid

API_KEY = "your_api_key_here"
BASE = "https://api.datamartgh.shop/api/developer"
headers = { "X-API-Key": API_KEY, "Content-Type": "application/json" }

# Purchase data - retry-safe via X-Idempotency-Key
res = requests.post(f"{BASE}/purchase", json={
    "phoneNumber": "0551234567",
    "network": "YELLO",
    "capacity": "5",
    "gateway": "wallet"
}, headers={ **headers, "X-Idempotency-Key": str(uuid.uuid4()) })

order = res.json()["data"]
print(f"Order: {order['orderReference']}, Status: {order['orderStatus']}")

# Check status
status = requests.get(f"{BASE}/order-status/{order['orderReference']}", headers=headers)
print(status.json()["data"]["orderStatus"])

# Bulk purchase (up to 50 orders) - one key for the whole batch
bulk = requests.post(f"{BASE}/bulk-purchase", json={
    "orders": [
        {"phoneNumber": "0551234567", "network": "YELLO", "capacity": "5", "ref": "MY-001"},
        {"phoneNumber": "0201234567", "network": "TELECEL", "capacity": "10", "ref": "MY-002"},
        {"phoneNumber": "0271234567", "network": "AT_PREMIUM", "capacity": "2"}
    ]
}, headers={ **headers, "X-Idempotency-Key": str(uuid.uuid4()) })

summary = bulk.json()["data"]["summary"]
print(f"Processed: {summary['successful']}/{summary['total']}, Charged: {summary['totalCharged']}")
for r in bulk.json()["data"]["results"]:
    print(f"  {r.get('ref', '-')}: {r['status']}")
```

### Checkers quick-start
```js
fetch('https://api.datamartgh.shop/api/checkers/purchase', {
  method: 'POST',
  headers: { 'X-API-Key': API_KEY, 'Content-Type': 'application/json' },
  body: JSON.stringify({
    checkerType: 'WAEC',
    phoneNumber: '0241234567',
    ref: 'sam-' + Date.now(),
    skipSms: true
  })
}).then(r => r.json()).then(body => {
  const { serialNumber, pin, reference } = body.data;
});
```

---

## 17. Networks & Capacity Reference

- **Networks:** `YELLO` = MTN (YELLO), `TELECEL` = Telecel, `AT_PREMIUM` = AirtelTigo.
- **Capacities:** 1 / 2 / 5 / 10 / 15 / 20 / 25 / 50 GB.
- Example pricing (reseller tier): capacity 1 = 1024 MB = GHS 4.00, capacity 2 = 2048 MB = GHS 9.00, capacity 5 = 5120 MB = GHS 23.00.
