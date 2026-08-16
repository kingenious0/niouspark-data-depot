import crypto from "crypto";
import {
  canTransitionDatamartStatus,
  type DatamartOrderStatus,
} from "@/lib/datamart-util";

/**
 * DataMart webhook verification + event processing.
 *
 * `X-DataMart-Signature` = HMAC-SHA256(JSON.stringify(body)) hex, keyed with
 * the webhook secret. Verification MUST happen before any Firestore access.
 * Processing is a pure function over an injected context so it is unit-testable.
 */

export interface DatamartWebhookData {
  orderId?: string;
  orderReference?: string;
  transactionId?: string;
  phone?: string;
  network?: string;
  capacity?: number | string;
  price?: number;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface DatamartWebhookEvent {
  event: string;
  timestamp: string;
  data: DatamartWebhookData;
}

export const WEBHOOK_EVENT_TO_STATUS: Record<string, DatamartOrderStatus> = {
  "order.created": "pending",
  "order.waiting": "waiting",
  "order.processing": "processing",
  "order.completed": "completed",
  "order.failed": "failed",
  "order.refunded": "refunded",
};

/**
 * Constant-time verification of the DataMart webhook signature.
 * Returns false for a missing secret or signature — never throws.
 */
export function verifyDatamartSignature(
  rawBody: string,
  secret: string | undefined,
  signature: string | null | undefined
): boolean {
  if (!secret || !signature) {
    return false;
  }
  const expected = crypto
    .createHmac("sha256", secret)
    .update(rawBody, "utf8")
    .digest("hex");
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(signature, "utf8");
  if (a.length !== b.length) {
    return false;
  }
  return crypto.timingSafeEqual(a, b);
}

/** A stored transaction that DataMart webhooks/status checks may match. */
export interface TransactionRecord {
  id: string;
  status?: string;
  datamartOrderReference?: string;
  datamartPurchaseId?: string;
  datamartTransactionRef?: string;
  datamartOrderStatus?: string;
  datamartUpdatedAt?: string;
  datamartLastEvent?: string;
}

export interface WebhookContext {
  /**
   * Find the local transaction for a webhook event.
   * Matched ONLY by DataMart identifiers — never by phone number.
   */
  findTransaction: (event: DatamartWebhookEvent) => Promise<TransactionRecord | null>;
  /** Persist the status patch. Caller adds `updatedAt`. */
  updateTransaction: (
    id: string,
    patch: Record<string, unknown>
  ) => Promise<void>;
}

export type WebhookProcessResult =
  | { processed: true; status: DatamartOrderStatus; reason: string }
  | { processed: false; reason: string };

/**
 * Map a verified webhook event to the local transaction model and persist it.
 * Idempotent: a duplicate/older event for an already-applied state is skipped.
 * Terminal local states never regress.
 */
export async function processDatamartWebhookEvent(
  event: DatamartWebhookEvent,
  ctx: WebhookContext
): Promise<WebhookProcessResult> {
  const status = WEBHOOK_EVENT_TO_STATUS[event.event];
  if (!status) {
    return { processed: false, reason: "unknown_event" };
  }

  const transaction = await ctx.findTransaction(event);
  if (!transaction) {
    return { processed: false, reason: "unmatched_transaction" };
  }

  const currentStatus = transaction.datamartOrderStatus || transaction.status;
  if (!canTransitionDatamartStatus(currentStatus, status)) {
    return { processed: false, reason: "terminal_state" };
  }

  // Dedupe: the same event already recorded with an equal-or-newer timestamp.
  if (
    transaction.datamartLastEvent === event.event &&
    transaction.datamartUpdatedAt &&
    event.data.updatedAt &&
    new Date(event.data.updatedAt).getTime() <=
      new Date(transaction.datamartUpdatedAt).getTime()
  ) {
    return { processed: false, reason: "duplicate_event" };
  }

  await ctx.updateTransaction(transaction.id, {
    status,
    datamartOrderStatus: status,
    datamartStatusSource: "webhook",
    datamartLastEvent: event.event,
    datamartUpdatedAt: event.data.updatedAt || event.timestamp || null,
    datamartOrderId: event.data.orderId ?? null,
    datamartPhone: event.data.phone ?? null,
    datamartNetwork: event.data.network ?? null,
    datamartCapacity: event.data.capacity ?? null,
    datamartPrice: event.data.price ?? null,
  });

  return { processed: true, status, reason: status };
}
