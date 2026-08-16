import { describe, it, expect, vi } from "vitest";
import {
  verifyDatamartSignature,
  processDatamartWebhookEvent,
  type DatamartWebhookEvent,
  type TransactionRecord,
} from "@/lib/datamart-webhook";
import crypto from "crypto";

function sign(rawBody: string, secret: string): string {
  return crypto.createHmac("sha256", secret).update(rawBody, "utf8").digest("hex");
}

function makeEvent(overrides: Partial<DatamartWebhookEvent> = {}): DatamartWebhookEvent {
  return {
    event: "order.processing",
    timestamp: "2026-08-16T10:00:00.000Z",
    data: {
      orderId: "ord_1",
      orderReference: "GN-AB12CD34",
      transactionId: "txn_1",
      phone: "0551234567",
      network: "YELLO",
      capacity: 5,
      price: 10,
      status: "processing",
      createdAt: "2026-08-16T09:59:00.000Z",
      updatedAt: "2026-08-16T10:00:00.000Z",
    },
    ...overrides,
  };
}

const ctxFor = (record: TransactionRecord | null) => ({
  findTransaction: vi.fn(async () => record),
  updateTransaction: vi.fn(async () => {}),
});

describe("verifyDatamartSignature", () => {
  const secret = "supersecret";
  const body = JSON.stringify(makeEvent());

  it("accepts a correct HMAC signature", () => {
    expect(verifyDatamartSignature(body, secret, sign(body, secret))).toBe(true);
  });

  it("rejects a tampered body", () => {
    const tampered = JSON.stringify({ ...makeEvent(), timestamp: "2026-08-16T10:00:01Z" });
    expect(verifyDatamartSignature(tampered, secret, sign(body, secret))).toBe(false);
  });

  it("rejects a wrong secret", () => {
    expect(verifyDatamartSignature(body, secret, sign(body, "wrong"))).toBe(false);
  });

  it("rejects a missing signature", () => {
    expect(verifyDatamartSignature(body, secret, null)).toBe(false);
    expect(verifyDatamartSignature(body, secret, undefined)).toBe(false);
  });

  it("rejects when the server secret is missing", () => {
    expect(verifyDatamartSignature(body, undefined, sign(body, secret))).toBe(false);
  });
});

describe("processDatamartWebhookEvent", () => {
  it.each([
    ["order.created", "pending"],
    ["order.waiting", "waiting"],
    ["order.processing", "processing"],
    ["order.completed", "completed"],
    ["order.failed", "failed"],
    ["order.refunded", "refunded"],
  ])("maps event '%s' to status '%s'", async (event, status) => {
    const record: TransactionRecord = { id: "tx1", status: "delivering" };
    const ctx = ctxFor(record);
    const result = await processDatamartWebhookEvent(makeEvent({ event }), ctx);

    expect(result).toEqual({ processed: true, status, reason: status });
    expect(ctx.updateTransaction).toHaveBeenCalledWith(
      "tx1",
      expect.objectContaining({
        status,
        datamartOrderStatus: status,
        datamartStatusSource: "webhook",
        datamartLastEvent: event,
      })
    );
  });

  it("ignores an unknown event type", async () => {
    const ctx = ctxFor({ id: "tx1" });
    const result = await processDatamartWebhookEvent(makeEvent({ event: "order.nonsense" }), ctx);
    expect(result).toEqual({ processed: false, reason: "unknown_event" });
    expect(ctx.updateTransaction).not.toHaveBeenCalled();
  });

  it("acknowledges-but-skips an unmatched transaction (no fabricated records)", async () => {
    const ctx = ctxFor(null);
    const result = await processDatamartWebhookEvent(makeEvent(), ctx);
    expect(result).toEqual({ processed: false, reason: "unmatched_transaction" });
    expect(ctx.updateTransaction).not.toHaveBeenCalled();
  });

  it("never regresses a terminal state", async () => {
    const record: TransactionRecord = {
      id: "tx1",
      status: "completed",
      datamartOrderStatus: "completed",
    };
    const ctx = ctxFor(record);
    const result = await processDatamartWebhookEvent(makeEvent({ event: "order.processing" }), ctx);
    expect(result).toEqual({ processed: false, reason: "terminal_state" });
    expect(ctx.updateTransaction).not.toHaveBeenCalled();
  });

  it("does not regress failed -> completed either", async () => {
    const record: TransactionRecord = {
      id: "tx1",
      status: "delivery_failed",
      datamartOrderStatus: "failed",
    };
    const ctx = ctxFor(record);
    const result = await processDatamartWebhookEvent(makeEvent({ event: "order.completed" }), ctx);
    expect(result).toEqual({ processed: false, reason: "terminal_state" });
  });

  it("skips a duplicate of the last-applied event with an older/equal timestamp", async () => {
    const record: TransactionRecord = {
      id: "tx1",
      status: "processing",
      datamartOrderStatus: "processing",
      datamartLastEvent: "order.processing",
      datamartUpdatedAt: "2026-08-16T10:00:00.000Z",
    };
    const ctx = ctxFor(record);
    const result = await processDatamartWebhookEvent(
      makeEvent({ event: "order.processing", data: { ...makeEvent().data, updatedAt: "2026-08-16T10:00:00.000Z" } }),
      ctx
    );
    expect(result).toEqual({ processed: false, reason: "duplicate_event" });
    expect(ctx.updateTransaction).not.toHaveBeenCalled();
  });

  it("applies the same event again when it is newer than the stored one", async () => {
    const record: TransactionRecord = {
      id: "tx1",
      status: "processing",
      datamartOrderStatus: "processing",
      datamartLastEvent: "order.processing",
      datamartUpdatedAt: "2026-08-16T09:00:00.000Z",
    };
    const ctx = ctxFor(record);
    const result = await processDatamartWebhookEvent(makeEvent(), ctx);
    expect(result.processed).toBe(true);
    expect(ctx.updateTransaction).toHaveBeenCalledTimes(1);
  });

  it("falls back to the local status when no DataMart status is stored", async () => {
    const record: TransactionRecord = { id: "tx1", status: "delivering" };
    const ctx = ctxFor(record);
    const result = await processDatamartWebhookEvent(makeEvent({ event: "order.completed" }), ctx);
    expect(result).toEqual({ processed: true, status: "completed", reason: "completed" });
  });
});
