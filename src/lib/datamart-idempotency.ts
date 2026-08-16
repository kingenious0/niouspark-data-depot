import { randomUUID } from "crypto";
import { DatamartError, isRetryableDatamartError } from "@/lib/datamart-errors";
import { normalizeCapacity } from "@/lib/datamart-util";
import type { DatamartPurchaseRequest, DatamartPurchaseResponse } from "@/lib/datamart-api";

/**
 * Idempotent purchase orchestration.
 *
 * One fresh UUID (`X-Idempotency-Key`) per LOGICAL purchase. A logical purchase
 * is fingerprinted deterministically from its inputs, so retrying the same
 * purchase reuses the same key — DataMart then returns the original response
 * (within 24h) instead of double-charging. Persistence is injected so the
 * orchestration is fully unit-testable without Firebase.
 */

export type PurchaseAttemptStatus =
  | "pending"
  | "in_progress"
  | "success"
  | "retryable"
  | "failed";

export interface PurchaseAttempt {
  id: string; // logicalPurchaseId
  idempotencyKey: string;
  status: PurchaseAttemptStatus;
  transactionId?: string;
  datamartData?: DatamartPurchaseResponse;
  error?: { code: string; message: string };
  createdAt: number;
  updatedAt: number;
}

export interface PurchaseAttemptStore {
  get(logicalPurchaseId: string): Promise<PurchaseAttempt | null>;
  /** Create-only — must reject (throw) if the id already exists. */
  create(logicalPurchaseId: string, attempt: PurchaseAttempt): Promise<void>;
  update(logicalPurchaseId: string, patch: Partial<PurchaseAttempt>): Promise<void>;
}

export type PurchaseFn = (
  request: DatamartPurchaseRequest,
  idempotencyKey: string
) => Promise<DatamartPurchaseResponse>;

export interface LogicalPurchaseParams {
  gateway: string;
  userId?: string | null;
  phoneNumber: string;
  network: string;
  capacity: string | number;
}

export type PurchaseOutcome =
  | {
      outcome: "success";
      response: DatamartPurchaseResponse;
      idempotencyKey: string;
      attempt: PurchaseAttempt;
    }
  | {
      outcome: "in_progress";
      error: DatamartError;
      idempotencyKey: string;
    }
  | {
      outcome: "retryable";
      error: DatamartError;
      idempotencyKey: string;
    }
  | {
      outcome: "failed";
      error: DatamartError;
      idempotencyKey: string;
    };

export function generateIdempotencyKey(): string {
  return randomUUID();
}

function fingerprintPhone(phone: string): string {
  return (phone ?? "").replace(/\D/g, "");
}

/**
 * Deterministic fingerprint of a logical purchase. Two requests with identical
 * inputs map to the same id, therefore to the same idempotency key.
 */
export function createLogicalPurchaseId(params: LogicalPurchaseParams): string {
  const gateway = params.gateway || "wallet";
  const user = params.userId || "anon";
  const phone = fingerprintPhone(params.phoneNumber) || "?";
  const network = params.network || "?";
  const capacity = normalizeCapacity(params.capacity) || "?";
  return `${gateway}:${user}:${phone}:${network}:${capacity}`;
}

function toAttemptError(error: DatamartError) {
  return { code: error.code, message: error.message };
}

/**
 * Execute a DataMart purchase with idempotency guarantees:
 *
 * - First attempt for a logical purchase: mint a fresh key and persist it.
 * - Retry of the same logical purchase: REUSE the stored key (never mint a new
 *   one) — retryable states (timeout/5xx) are exactly the documented safe-to-
 *   retry cases.
 * - Concurrent same-key request already in flight → `in_progress` (HTTP 409).
 * - Stored success is replayed so a post-success retry never double-charges.
 */
export async function executePurchaseWithIdempotency(
  store: PurchaseAttemptStore,
  purchaseFn: PurchaseFn,
  params: LogicalPurchaseParams,
  request: DatamartPurchaseRequest
): Promise<PurchaseOutcome> {
  const id = createLogicalPurchaseId(params);
  const now = Date.now();

  let attempt = await store.get(id);

  if (attempt && attempt.status === "success" && attempt.datamartData) {
    return {
      outcome: "success",
      response: attempt.datamartData,
      idempotencyKey: attempt.idempotencyKey,
      attempt,
    };
  }

  if (attempt && attempt.status === "in_progress") {
    return {
      outcome: "in_progress",
      error: new DatamartError(
        "REQUEST_IN_PROGRESS",
        409,
        "A purchase for this number is already being processed"
      ),
      idempotencyKey: attempt.idempotencyKey,
    };
  }

  const idempotencyKey = attempt?.idempotencyKey ?? generateIdempotencyKey();

  if (!attempt) {
    const fresh: PurchaseAttempt = {
      id,
      idempotencyKey,
      status: "in_progress",
      createdAt: now,
      updatedAt: now,
    };
    try {
      await store.create(id, fresh);
    } catch {
      // Lost the create race — another request created it first.
      const winner = await store.get(id);
      if (winner) {
        if (winner.status === "in_progress") {
          return {
            outcome: "in_progress",
            error: new DatamartError(
              "REQUEST_IN_PROGRESS",
              409,
              "A purchase for this number is already being processed"
            ),
            idempotencyKey: winner.idempotencyKey,
          };
        }
        return executePurchaseWithIdempotency(store, purchaseFn, params, request);
      }
    }
  } else if (attempt.status === "retryable" || attempt.status === "failed") {
    // Retrying a previously accepted-but-uncertain purchase: reuse the key.
    await store.update(id, { status: "in_progress", updatedAt: Date.now() });
  }

  try {
    const response = await purchaseFn(request, idempotencyKey);
    await store.update(id, {
      status: "success",
      datamartData: response,
      updatedAt: Date.now(),
    });
    return { outcome: "success", response, idempotencyKey, attempt: { ...(await store.get(id))! } };
  } catch (error) {
    if (error instanceof DatamartError) {
      if (error.code === "REQUEST_IN_PROGRESS") {
        return { outcome: "in_progress", error, idempotencyKey };
      }
      if (isRetryableDatamartError(error)) {
        await store.update(id, { status: "retryable", error: toAttemptError(error), updatedAt: Date.now() });
        return { outcome: "retryable", error, idempotencyKey };
      }
      await store.update(id, { status: "failed", error: toAttemptError(error), updatedAt: Date.now() });
      return { outcome: "failed", error, idempotencyKey };
    }
    throw error;
  }
}
