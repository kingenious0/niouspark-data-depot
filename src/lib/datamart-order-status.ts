import { datamartAPI } from "@/lib/datamart-api";
import { DatamartError } from "@/lib/datamart-errors";
import {
  canTransitionDatamartStatus,
  isTerminalDatamartStatus,
} from "@/lib/datamart-util";

/**
 * Order-status client + reconciliation.
 *
 * Webhooks are the PRIMARY status source; the order-status API is the
 * SECONDARY fallback. Reconciliation is read-only — it may only query the
 * order-status endpoint, never create a second purchase. It is idempotent and
 * never lets a stale response regress a terminal local state.
 */

export interface OrderStatusResult {
  source: "webhook" | "api" | "local";
  orderStatus: string;
  updatedAt?: string;
  phoneNumber?: string;
  network?: string;
  capacity?: number | string;
  price?: number;
  processingMethod?: string;
  createdAt?: string;
}

/**
 * Query the DataMart order-status endpoint (server-side).
 * `reference` is the DataMart orderReference (e.g. GN-AB12CD34).
 */
export async function getDatamartOrderStatus(reference: string): Promise<OrderStatusResult> {
  const response = await datamartAPI.getOrderStatus(reference);
  if (response.status !== "success" || !response.data) {
    throw new DatamartError(
      "UNKNOWN",
      500,
      "DataMart returned an unexpected order-status response"
    );
  }
  const d = response.data;
  return {
    source: "api",
    orderStatus: d.orderStatus,
    updatedAt: d.updatedAt,
    phoneNumber: d.phoneNumber,
    network: d.network,
    capacity: d.capacity,
    price: d.price,
    processingMethod: d.processingMethod,
    createdAt: d.createdAt,
  };
}

export interface ReconcileTarget {
  id: string;
  status?: string;
  datamartOrderReference?: string;
  datamartOrderStatus?: string;
  datamartUpdatedAt?: string;
}

export type ReconcileResult =
  | { reconciled: true; status: string }
  | { reconciled: false; reason: string };

/**
 * Reconcile one local transaction against the DataMart order-status API.
 * Never regresses terminal states; ignores API results older than the last
 * known webhook update.
 */
export async function reconcileTransactionOrderStatus(
  tx: ReconcileTarget,
  fetchStatus: (reference: string) => Promise<OrderStatusResult>,
  update: (id: string, patch: Record<string, unknown>) => Promise<void>
): Promise<ReconcileResult> {
  const reference = tx.datamartOrderReference;
  if (!reference) {
    return { reconciled: false, reason: "no_reference" };
  }

  const currentStatus = tx.datamartOrderStatus || tx.status;
  if (currentStatus && isTerminalDatamartStatus(currentStatus)) {
    return { reconciled: false, reason: "terminal" };
  }

  const result = await fetchStatus(reference);

  if (!canTransitionDatamartStatus(currentStatus, result.orderStatus)) {
    return { reconciled: false, reason: "stale" };
  }

  // Only apply when the API result is at least as fresh as what we hold.
  const existingTs = tx.datamartUpdatedAt ? new Date(tx.datamartUpdatedAt).getTime() : 0;
  const incomingTs = result.updatedAt ? new Date(result.updatedAt).getTime() : Date.now();
  if (existingTs > incomingTs) {
    return { reconciled: false, reason: "stale" };
  }

  await update(tx.id, {
    status: result.orderStatus,
    datamartOrderStatus: result.orderStatus,
    datamartStatusSource: "api",
    datamartUpdatedAt: result.updatedAt || null,
  });

  return { reconciled: true, status: result.orderStatus };
}

/** DataMart order statuses a customer may see in the tracking UI. */
export function isTerminalOrderStatus(status: string): boolean {
  return isTerminalDatamartStatus(status);
}
