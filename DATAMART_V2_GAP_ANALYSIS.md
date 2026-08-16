# NIOUSPARK V2 — DATAMART API GAP ANALYSIS

**Scope reviewed:** `DATAMART_API_REFERENCE.md` (full DataMart V2 docs) vs. Niouspark `src/` implementation (13 Datamart-related files).

**Critical finding — Wallet Deposit/Top-Up:** The DataMart developer API exposes **NO wallet deposit/top-up endpoint**. There is no `POST /topup`, `/deposit`, or `/fund` anywhere in the documented API. Wallet funding happens **only** on the DataMart website via Paystack checkout — that is a consumer-site flow, **not** a developer API. Niouspark's "admin wallet" is a **local Firestore ledger** (`users.datamat_wallet_balance`), which is *separate* from the real Datamart wallet that funds `gateway:"wallet"` purchases. This is an accounting mismatch to resolve (see #1).

---

## Capability-by-Capability Analysis

### 1. Wallet deposit / top-up
| | |
|---|---|
| Endpoint | **NONE exists in developer API** |
| Method | — |
| Auth | — |
| Request fields | — |
| Response fields | — |
| Niouspark support | ❌ No Datamart-based top-up. `src/app/api/admin-wallet-purchase/route.ts:31` reads/debits local `datamat_wallet_balance` (Firestore). `src/app/api/datamart-purchase/route.ts` debits the *real* Datamart wallet. Two separate wallets — no reconciliation. |
| Files | `src/app/api/admin-wallet-purchase/route.ts`, `src/app/api/datamart-purchase/route.ts`, `src/app/admin/wallet/page.tsx`, `src/components/admin-wallet-dashboard.tsx` |
| Implement in V2? | **No API to implement.** Keep manual Datamart-site top-up. Resolve local-vs-remote wallet ledger mismatch (product decision). |
| Priority | P2 (product decision; blocked upstream) |
| Security | Local wallet field is untrusted bookkeeping — must never be the gate for `gateway:"wallet"` purchases; Datamart enforces the real balance server-side. |

### 2. Wallet balance
| | |
|---|---|
| Endpoint | `GET /api/developer/balance` |
| Method | GET |
| Auth | `X-API-Key` |
| Request fields | none |
| Response fields | `data.balance` (GHS), `data.currency`, `data.user{id,name,email}`, `data.timestamp`, `rateLimit` |
| Niouspark support | ✅ **Supported.** `fetchWalletBalance()` in `src/lib/datamart.ts:246`; routes `/api/admin/get-balance` and `/api/admin/wallet-balance` (both admin-role gated). |
| Files | `src/lib/datamart.ts:246`, `src/app/api/admin/get-balance/route.ts`, `src/app/api/admin/wallet-balance/route.ts`, `src/components/admin-wallet-dashboard.tsx` |
| Implement in V2? | Yes — enhance: surface `rateLimit`/timestamp; add balance caching + low-balance alert. |
| Priority | P0 (already works) → P1 enhancements |
| Security | Admin-only routes correctly gated via `verifyIdToken` + `role==='admin'`. Keep server-side only. |

### 3. Withdrawal
| | |
|---|---|
| Endpoint | `POST /api/developer/v1/withdrawals`, `GET .../:reference`, `GET .../`, `GET .../meta/limits` |
| Method | POST / GET |
| Auth | `X-API-Key`, `X-Idempotency-Key`, `X-Signature` (HMAC-SHA256 of `{ts}.{method}.{path}.{body}`), `X-Timestamp` (ms, ±5 min) |
| Request fields | `amount` (min 10, max `singleTxnLimit`), `phoneNumber`, `network` (MTN/TELECEL/AIRTELTIGO + aliases), `recipientName?`, `clientRef?` |
| Response fields | `reference` (`RSW-...`), `status`, `amount`, `fee`, `feePercent`, `totalCharged`, `recipient{phone,network,name}`, `provider`, `balanceBefore/After`, `createdAt` |
| Niouspark support | ❌ **Not supported** (no HMAC, no withdrawal route, no signing secret env var). |
| Files | None |
| Implement in V2? | **Yes** — admin withdrawal to MoMo; polling loop (webhooks not yet shipped for withdrawals v1). |
| Priority | P1 |
| Security | **High:** signing secret shown once; HMAC over exact raw body; 5 bad signatures/10 min → auto-disable; IP allow-list (incl. IPv6); idempotency prevents double-charge; never retry with new idempotency key after timeout. |

### 4. Single purchase
| | |
|---|---|
| Endpoint | `POST /api/developer/purchase` |
| Method | POST |
| Auth | `X-API-Key`, `Content-Type`, `X-Idempotency-Key` (recommended → **required soon**) |
| Request fields | `phoneNumber`, `network` (YELLO/TELECEL/AT_PREMIUM), `capacity`, `gateway` (`wallet`), `ref?` |
| Response fields | `purchaseId`, `orderReference` (`GN-...`), `transactionReference`, `network`, `capacity`, `price`, `balanceBefore`, `balanceAfter`, `orderStatus`, `processingMethod`, `rateLimit` |
| Niouspark support | ⚠️ **Partially.** `purchaseBundle()` in `src/lib/datamart-api.ts:78`. **Gaps:** ① no `X-Idempotency-Key` ② no `ref` ③ response typed as `remainingBalance` but API returns `balanceAfter` ④ maps "insufficient balance" to HTTP 402, docs show `400` + message `"Insufficient wallet balance"` ⑤ purchase treated as synchronous `completed` — no reconciliation. |
| Files | `src/lib/datamart-api.ts:78`, `src/app/api/datamart-purchase/route.ts`, `src/components/bundle-card.tsx`, `src/lib/datamart.ts:197` (`deliverDataBundle` — sends `capacity:"5GB"` but API expects `"5"`, a latent delivery bug) |
| Implement in V2? | **Yes — fix (P0)** before idempotency becomes mandatory; align field names; correct error mapping. |
| Priority | P0 |
| Security | API key server-only; add idempotency to make retries safe (prevents double-charge on timeout retries). |

### 5. Bulk purchase
| | |
|---|---|
| Endpoint | `POST /api/developer/bulk-purchase` |
| Method | POST |
| Auth | `X-API-Key`, `X-Idempotency-Key` (one per batch) |
| Request fields | `orders[]` up to 50: `{phoneNumber, network, capacity, ref?}` |
| Response fields | `summary{total,successful,failed,invalid,totalCharged,remainingBalance}`, `results[]` (per-order `status:"queued"`, `orderReference`, balances), `validationErrors[]` |
| Niouspark support | ❌ **Not supported.** |
| Files | None |
| Implement in V2? | **Yes** — admin bulk top-up tool. |
| Priority | P1 |
| Security | Batch idempotency key; validate per-order `ref` prefix if ref-rule set. |

### 6. Order status tracking
| | |
|---|---|
| Endpoint | `GET /api/developer/order-status/:reference` |
| Method | GET |
| Auth | `X-API-Key` |
| Request fields | path param `reference` |
| Response fields | `orderId`, `reference`, `phoneNumber`, `network`, `capacity`, `price`, `orderStatus` (`pending/waiting/processing/completed/failed/refunded`), `processingMethod`, `createdAt`, `updatedAt` |
| Niouspark support | ❌ **Not supported.** No order-status call, no status enum in code (local statuses are `completed/pending/failed/...` but lack `waiting`, `refunded`). |
| Files | None |
| Implement in V2? | **Yes** — admin order lookup + scheduled reconciliation of in-flight orders. |
| Priority | P1 |
| Security | Reference-scoped; treat `refunded` as money-back signal for local ledger sync. |

### 7. Order/result checking (verify number)
| | |
|---|---|
| Endpoint | `POST /api/developer/verify-number`, `POST /api/developer/verify-number/bulk` |
| Method | POST |
| Auth | `X-API-Key` |
| Request fields | `phoneNumber`; bulk: `numbers[]` (string or object) |
| Response fields | `summary{total,accepted,rejected}`, `results[]` (`number`, `normalized`, `accepted`, `reason`); limits 100/req, 10 req/min, real check 2/min → `429 RATE_LIMIT_EXCEEDED` + `retryAfter` |
| Niouspark support | ❌ **Not supported.** Phone validation is regex-only (bundle-card). |
| Files | None |
| Implement in V2? | **Yes** — pre-purchase validation to avoid `waiting`/failed deliveries. |
| Priority | P2 |
| Security | Throttle carefully — server-side only, never expose to public unauthenticated use (credentialless phone-enumeration risk). |

### 8. Delivery / result callbacks
| | |
|---|---|
| Endpoint | DataMart pushes to your webhook URL on order events |
| Method | POST (inbound) |
| Auth | `X-DataMart-Signature` (HMAC-SHA256 of raw JSON body), `X-DataMart-Event`, `Content-Type` |
| Request fields | `event`, `timestamp`, `data{orderId, orderReference, transactionId, phone, network, capacity, price, status, createdAt, updatedAt}` |
| Response fields | 2xx ack |
| Niouspark support | ❌ **Not supported.** Only Paystack webhooks exist (`/api/paystack-webhook`). Admin purchases are never confirmed asynchronously. |
| Files | `src/app/api/paystack-webhook/route.ts` (pattern to mirror) |
| Implement in V2? | **Yes (P0)** — the single biggest reliability gap: async `completed/failed/refunded` events must update Firestore. |
| Priority | P0 |
| Security | Verify `X-DataMart-Signature` before trusting payload; reject without 200 on failure. |

### 9. Webhooks
| | |
|---|---|
| Endpoints | `GET /webhook/status`, `POST /webhook/configure`, `POST /webhook/test`, `PUT /webhook/toggle`, `DELETE /webhook` |
| Method | GET/POST/PUT/DELETE |
| Auth | `X-API-Key` |
| Request fields | configure: `{url, events{orderCreated,orderProcessing,orderWaiting,orderCompleted,orderFailed,orderRefunded}}` |
| Response fields | configure → `{data:{secret}}` (**shown once**); status → `configured,url,events,isActive,failureCount,lastDelivery,stats,deliveryLog[]` |
| Niouspark support | ❌ **Not configured.** No Datamart webhook URL/secret in env. |
| Files | None |
| Implement in V2? | **Yes** — configure events on deploy; store secret (secret-manager / env); expose admin status UI. |
| Priority | P1 (P0 together with #8) |
| Security | Defaults: `order.refunded` OFF — enable it to catch refunds; re-config needed if secret lost. |

### 10. Webhook signature verification
| | |
|---|---|
| Endpoint | n/a (inbound verification) |
| Method | n/a |
| Auth | `X-DataMart-Signature` = HMAC-SHA256(`JSON.stringify(body)`, webhook secret) |
| Request fields | raw body |
| Response fields | 401 if mismatch |
| Niouspark support | ❌ **Not supported** (Paystack SHA-512 verification exists — reusable pattern at `src/app/api/paystack-webhook/route.ts:18-26`). |
| Files | `src/app/api/paystack-webhook/route.ts` |
| Implement in V2? | **Yes** — new `/api/datamart-webhook` route with timing-safe compare. |
| Priority | P0 (blocks #8/#9) |
| Security | Verify signature BEFORE any DB write; never trust `X-DataMart-Event` alone. |

### 11. Transaction history
| | |
|---|---|
| Endpoint | `GET /api/developer/transactions?page=&limit=` (+ `GET /purchase-history/:userId`) |
| Method | GET |
| Auth | `X-API-Key` |
| Request fields | `page`, `limit` |
| Response fields | `transactions[]{type, amount, status, reference, gateway, createdAt}`, `pagination{currentPage,totalPages,totalItems}` |
| Niouspark support | ✅ **Supported.** `getTransactions()` in `src/lib/datamart-api.ts:140`; admin route `/api/admin/datamart-transactions` (merges Datamart + local Firestore). |
| Files | `src/lib/datamart-api.ts:140`, `src/app/api/admin/datamart-transactions/route.ts`, `src/components/datamart-transactions-dashboard.tsx` |
| Implement in V2? | Yes — align `DatamartTransaction` type with real field names; add pagination controls + `purchase-history`. |
| Priority | P1 |
| Security | Admin-only; Datamart txids stored in Firestore (`datamartTransactionRef`) for audit trail. |

### 12. Refund handling
| | |
|---|---|
| Endpoint | Event-driven (`order.refunded` webhook; `refunded` order/withdrawal status) |
| Method | n/a |
| Auth | `X-DataMart-Signature` |
| Request fields | webhook payload |
| Response fields | n/a |
| Niouspark support | ❌ **Not handled.** Local status enum (`src/lib/datamart.ts:30`) has no `refunded`; no refund reversal logic, no `wallet_transactions` credit-back. |
| Files | `src/lib/datamart.ts:30`, `src/app/api/admin-wallet-purchase/route.ts` |
| Implement in V2? | **Yes** — on `order.refunded`, credit local ledger + notify admin + log. |
| Priority | P1 |
| Security | Refund events are high-value forgery targets — must pass signature verification. |

### 13. WAEC/BECE result-card purchasing
| | |
|---|---|
| Endpoints | `/api/checkers/products`, `/api/checkers/purchase`, `/api/checkers/bulk-purchase`, `/api/checkers/order-status/:reference`, `/api/checkers/purchase-history`, `/api/checkers/balance`, `/api/checkers/validate-reference` |
| Method | GET/POST |
| Auth | `X-API-Key` (same key/wallet as data API) |
| Request fields | purchase: `checkerType` (WAEC/BECE), `phoneNumber`, `ref?`, `webhookUrl?`, `skipSms?`; bulk: `quantity` (1–20) |
| Response fields | `serialNumber`, `pin` (**returned once**), `reference` (`CHKW...`), `smsNotification{sent,message}`, balances; `products[]{name,price,inStock,stockCount}` |
| Niouspark support | ❌ **Not supported** — entirely new product line. |
| Files | None |
| Implement in V2? | **Yes** — new storefront offering (result-checker pins); must persist serial/PIN immediately. |
| Priority | P2 (revenue opportunity; P1 if result cards are a business priority) |
| Security | Serial/PIN are one-time secrets — store encrypted, never log, deliver securely (SMS/email/account). |

### 14. API rate-limit information
| | |
|---|---|
| Endpoint | In every response: `rateLimit{limit,remaining,resetInSeconds}` + `X-RateLimit-*` headers |
| Method | n/a |
| Auth | n/a |
| Request fields | n/a |
| Response fields | `rateLimit`, headers |
| Niouspark support | ❌ **Not captured.** Axios clients ignore rate-limit headers; no backoff logic. |
| Files | `src/lib/datamart-api.ts`, `src/lib/datamart.ts` |
| Implement in V2? | Yes — surface in responses + client-side throttle/backoff (esp. purchases 150/min, balance 120/min). |
| Priority | P2 |
| Security | Avoid burst-triggering `429`; alert on limits. |

### 15. HMAC authentication / signing
| | |
|---|---|
| Endpoint | Required for withdrawals (`X-Signature` + `X-Timestamp`); also available as second-secret `X-API-Secret` + ref-rule on key |
| Method | n/a |
| Auth | HMAC-SHA256 hex of `{timestamp}.{method}.{path}.{rawBody}`; `X-Timestamp` ms epoch ±5 min |
| Request fields | signing payload |
| Response fields | n/a |
| Niouspark support | ❌ **Not implemented.** No crypto signing, no `X-API-Secret`, no timestamp handling. |
| Files | None |
| Implement in V2? | Yes — required for #3 (withdrawals); optionally harden keys with second secret + ref prefix. |
| Priority | P1 (with #3) |
| Security | Sign exact raw bytes (no re-serialization); sign all `*` headers; ±5 min window; auto-disable after 5 fails. |

### 16. Idempotency support
| | |
|---|---|
| Endpoint | `X-Idempotency-Key` on `/purchase`, `/bulk-purchase`, withdrawals |
| Method | n/a |
| Auth | Header |
| Request fields | UUID per logical request |
| Response fields | 24h replay → original response; concurrent → `409 REQUEST_IN_PROGRESS` |
| Niouspark support | ❌ **Not used anywhere.** Every `/purchase` call is a fresh, un-retryable request; a timeout+retry today risks double-charging. |
| Files | `src/lib/datamart-api.ts:78`, `src/lib/datamart.ts:197` |
| Implement in V2? | **Yes — P0** (becomes mandatory on `/purchase`). |
| Priority | P0 |
| Security | Prevents duplicate charges; generate server-side UUID, persist key↔transaction mapping in Firestore. |

### 17. Other newly introduced capabilities
| Endpoint | Method | Niouspark | V2? | Priority |
|---|---|---|---|---|
| `POST /api/developer/generate-api-key` | POST | ❌ | Self-service key mgmt for ops | P2 |
| `GET /api/developer/usage/stats` + `/usage/history` | GET | ❌ | Ops dashboard (spend/requests) | P2 |
| `POST /api/developer/claim-referral-bonus` | POST | ❌ | Low value | P2 |
| `GET /api/developer/purchase-history/:userId` | GET | ❌ | Detailed records w/ balance tracking | P2 |
| `GET /api/developer/delivery-tracker` + widget `/widgets/delivery-tracker.js` | GET | ❌ | Live "track your order" page / admin monitor | P2 |
| `GET /data-packages?network=` | GET | ✅ (both `datamart.ts` + `datamart-api.ts`) | Already implemented | — |
| `GET /api/checkers/*` (validate-reference, purchase-history, balance) | GET/POST | ❌ | With #13 | P2 |

---

## Recommended Implementation Roadmap

### Phase 0 — Correctness & safety fixes (P0) — *do first, small scope*
1. **Idempotency on purchases** (`src/lib/datamart-api.ts`, `src/app/api/datamart-purchase/route.ts`): generate `X-Idempotency-Key` (UUID) server-side, persist key↔`transactionRef` in Firestore; handle `409 REQUEST_IN_PROGRESS`.
2. **Fix response mapping**: `remainingBalance` → `balanceAfter`; correct error handling for `400` "Insufficient wallet balance" (not 402); add `ref` support.
3. **Fix `deliverDataBundle` capacity payload** (`src/lib/datamart.ts:197`): send `capacity: "5"`, not `"5GB"`.
4. **Datamart webhook receiver** (`/api/datamart-webhook`): HMAC-SHA256 verification of `JSON.stringify(body)` + `order.completed/failed/refunded` → update Firestore transaction status (mirror the proven Paystack pattern).

### Phase 1 — Core V2 (P1)
5. **Webhook configuration lifecycle**: `configure` on deploy (enable all 6 events incl. `order.refunded`), store secret in env/secret-manager, admin status UI, test/toggle/delete endpoints.
6. **Order-status + reconciliation**: `GET /order-status/:reference` admin route; periodic job to resolve in-flight orders; local status enum gains `waiting`, `refunded`.
7. **Bulk purchase** for admins: `/bulk-purchase` with batch idempotency + per-order `ref` prefix.
8. **Withdrawal API**: HMAC signing helper (crypto), `X-Timestamp` window, `meta/limits` pre-check, create + poll-by-reference loop (5–10s → 30s → 15 min), `WITHDRAWAL_*` error mapping, admin-only route.

### Phase 2 — Enhancements (P2)
9. **Result checkers** (WAEC/BECE): products → purchase → secure serial/PIN storage + delivery.
10. **Verify-number** pre-checks; **usage stats/history** ops dashboard; **rate-limit surfacing** + backoff; **delivery-tracker widget** on an order-tracking page; `generate-api-key` self-service; `purchase-history`.
11. **Wallet top-up decision**: no Datamart deposit API exists — reconcile the local `datamat_wallet_balance` ledger with real Datamart balance (or drop the local ledger), and confirm with Datamart whether a deposit endpoint is on their roadmap.

### Security summary
- Keep `DATAMART_API_KEY` server-side only (verified: it is `process.env`-only, never in client bundles).
- Add `X-API-Secret` second-secret + ref-prefix rule to the production key.
- All webhook writes gated by HMAC signature; withdrawal ops gated by admin role + HMAC + timestamp window.
- Never store/log checker serials/PINs or webhook secrets in plaintext.
