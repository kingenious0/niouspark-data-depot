import { describe, it, expect, vi } from "vitest";
import {
  createLogicalPurchaseId,
  executePurchaseWithIdempotency,
  generateIdempotencyKey,
  type PurchaseAttempt,
  type PurchaseAttemptStore,
  type LogicalPurchaseParams,
} from "@/lib/datamart-idempotency";
import { DatamartError } from "@/lib/datamart-errors";

function makeStore(seed: Record<string, PurchaseAttempt> = {}) {
  const data = new Map(Object.entries(seed));
  const store: PurchaseAttemptStore = {
    get: async (id) => data.get(id) ?? null,
    create: async (id, attempt) => {
      if (data.has(id)) throw new Error("already exists");
      data.set(id, attempt);
    },
    update: async (id, patch) => {
      const cur = data.get(id);
      if (!cur) throw new Error("missing");
      data.set(id, { ...cur, ...patch });
    },
  };
  return { store, data };
}

const params: LogicalPurchaseParams = {
  gateway: "wallet",
  userId: "u1",
  phoneNumber: "0551234567",
  network: "YELLO",
  capacity: "5GB",
};

const successResponse = (overrides: Record<string, unknown> = {}) => ({
  status: "success",
  data: {
    purchaseId: "p1",
    orderReference: "GN-AB12CD34",
    transactionReference: "TXN-123",
    network: "YELLO",
    capacity: "5",
    price: 10,
    balanceBefore: 100,
    balanceAfter: 90,
    orderStatus: "processing",
    processingMethod: "api",
    ...overrides,
  },
  rateLimit: { limit: 100, remaining: 99, resetInSeconds: 5 },
});

const purchase = (req: any, key: string) =>
  Promise.resolve(successResponse({ capacity: req.capacity, idempotencyKeyEcho: key }));

describe("createLogicalPurchaseId", () => {
  it("is deterministic for identical inputs", () => {
    expect(createLogicalPurchaseId(params)).toBe(createLogicalPurchaseId(params));
  });

  it("normalizes capacity and strips non-digits from the phone", () => {
    const a = createLogicalPurchaseId({ ...params, capacity: "5GB" });
    const b = createLogicalPurchaseId({ ...params, capacity: "5" });
    expect(a).toBe(b);
    // Two spellings of the same number produce the same logical purchase id.
    const c = createLogicalPurchaseId({ ...params, phoneNumber: "+233551234567" });
    const d = createLogicalPurchaseId({ ...params, phoneNumber: "233551234567" });
    expect(c).toBe(d);
    expect(c).toContain("233551234567");
  });

  it("differs when the logical purchase differs", () => {
    expect(createLogicalPurchaseId({ ...params, capacity: "10" })).not.toBe(
      createLogicalPurchaseId(params)
    );
  });
});

describe("generateIdempotencyKey", () => {
  it("returns a fresh UUID each call", () => {
    const a = generateIdempotencyKey();
    const b = generateIdempotencyKey();
    expect(a).not.toBe(b);
    expect(a).toMatch(/^[0-9a-f-]{36}$/i);
  });
});

describe("executePurchaseWithIdempotency", () => {
  it("mints a key, persists an attempt, and returns success with balanceAfter", async () => {
    const { store, data } = makeStore();
    const fn = vi.fn(purchase);
    const outcome = await executePurchaseWithIdempotency(store, fn, params, {} as any);

    expect(outcome.outcome).toBe("success");
    if (outcome.outcome !== "success") return;
    expect(outcome.response.data.balanceAfter).toBe(90);
    expect(outcome.idempotencyKey).toMatch(/^[0-9a-f-]{36}$/i);
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith(expect.anything(), outcome.idempotencyKey);
    expect(data.get(createLogicalPurchaseId(params))?.status).toBe("success");
  });

  it("forwards the raw request to the provider unchanged", async () => {
    const { store } = makeStore();
    const fn = vi.fn(purchase);
    await executePurchaseWithIdempotency(store, fn, params, {
      phoneNumber: "0551234567",
      network: "YELLO",
      capacity: "5GB",
      gateway: "wallet",
    });
    // Normalization of capacity happens in the API client layer (see
    // datamart-api.test.ts); the idempotency wrapper passes the request through.
    expect(fn).toHaveBeenCalledWith(
      expect.objectContaining({ capacity: "5GB" }),
      expect.any(String)
    );
  });

  it("REUSES the stored key on retry after a timeout, instead of minting a new one", async () => {
    const { store } = makeStore();
    const first = vi.fn(() => Promise.reject(new DatamartError("TIMEOUT", 0, "timed out")));
    const retry = vi.fn(purchase);

    const one = await executePurchaseWithIdempotency(store, first, params, {} as any);
    expect(one.outcome).toBe("retryable");
    if (one.outcome !== "retryable") return;

    const two = await executePurchaseWithIdempotency(store, retry, params, {} as any);
    expect(two.outcome).toBe("success");
    if (two.outcome !== "success") return;
    expect(two.idempotencyKey).toBe(one.idempotencyKey); // same key, no double charge
    expect(retry).toHaveBeenCalledWith(expect.anything(), one.idempotencyKey);
  });

  it("REUSES the stored key on retry after a 5xx provider error", async () => {
    const { store } = makeStore();
    const one = await executePurchaseWithIdempotency(
      store,
      () => Promise.reject(new DatamartError("DATAMART_UNAVAILABLE", 503, "unavailable")),
      params,
      {} as any
    );
    expect(one.outcome).toBe("retryable");
    if (one.outcome !== "retryable") return;

    const two = await executePurchaseWithIdempotency(store, purchase, params, {} as any);
    expect(two.outcome).toBe("success");
    if (two.outcome !== "success") return;
    expect(two.idempotencyKey).toBe(one.idempotencyKey);
  });

  it("returns in_progress (409) when the same purchase is already in flight", async () => {
    const { store, data } = makeStore();
    const id = createLogicalPurchaseId(params);
    data.set(id, {
      id,
      idempotencyKey: "existing-key",
      status: "in_progress",
      createdAt: 1,
      updatedAt: 1,
    });
    const fn = vi.fn(purchase);
    const outcome = await executePurchaseWithIdempotency(store, fn, params, {} as any);
    expect(outcome.outcome).toBe("in_progress");
    if (outcome.outcome !== "in_progress") return;
    expect(outcome.error.code).toBe("REQUEST_IN_PROGRESS");
    expect(outcome.idempotencyKey).toBe("existing-key");
    expect(fn).not.toHaveBeenCalled();
  });

  it("replays a stored success instead of purchasing again", async () => {
    const { store, data } = makeStore();
    const id = createLogicalPurchaseId(params);
    data.set(id, {
      id,
      idempotencyKey: "done-key",
      status: "success",
      datamartData: successResponse({ purchaseId: "original" }),
      createdAt: 1,
      updatedAt: 1,
    });
    const fn = vi.fn(purchase);
    const outcome = await executePurchaseWithIdempotency(store, fn, params, {} as any);
    expect(outcome.outcome).toBe("success");
    if (outcome.outcome !== "success") return;
    expect(outcome.response.data.purchaseId).toBe("original");
    expect(outcome.idempotencyKey).toBe("done-key");
    expect(fn).not.toHaveBeenCalled();
  });

  it("marks a non-retryable failure as failed with the same key", async () => {
    const { store } = makeStore();
    const fn = vi.fn(() =>
      Promise.reject(new DatamartError("INSUFFICIENT_BALANCE", 400, "Insufficient wallet balance"))
    );
    const outcome = await executePurchaseWithIdempotency(store, fn, params, {} as any);
    expect(outcome.outcome).toBe("failed");
    if (outcome.outcome !== "failed") return;
    expect(outcome.error.code).toBe("INSUFFICIENT_BALANCE");
    expect(outcome.idempotencyKey).toMatch(/^[0-9a-f-]{36}$/i);
  });

  it("does not create a second attempt for a logically identical purchase after failure", async () => {
    const { store, data } = makeStore();
    const id = createLogicalPurchaseId(params);
    const one = await executePurchaseWithIdempotency(
      store,
      () => Promise.reject(new DatamartError("INVALID_PHONE", 400, "bad phone")),
      params,
      {} as any
    );
    expect(one.outcome).toBe("failed");
    if (one.outcome !== "failed") return;

    const key = one.idempotencyKey;
    const two = await executePurchaseWithIdempotency(
      store,
      () => Promise.reject(new DatamartError("INVALID_PHONE", 400, "bad phone")),
      params,
      {} as any
    );
    expect(two.outcome).toBe("failed");
    if (two.outcome !== "failed") return;
    expect(two.idempotencyKey).toBe(key);
    expect(data.get(id)?.status).toBe("failed");
  });

  it("wins the create race with a single attempt when store.create succeeds", async () => {
    const { store, data } = makeStore();
    const outcome = await executePurchaseWithIdempotency(store, purchase, params, {} as any);
    expect(outcome.outcome).toBe("success");
    expect(data.size).toBe(1);
  });

  it("handles the lost-create race by falling back to the winner", async () => {
    let createCalls = 0;
    const data = new Map<string, PurchaseAttempt>();
    const store: PurchaseAttemptStore = {
      get: async (id) => data.get(id) ?? null,
      create: async (id, attempt) => {
        createCalls += 1;
        if (createCalls === 1) throw new Error("lost race");
        if (data.has(id)) throw new Error("already exists");
        data.set(id, attempt);
      },
      update: async (id, patch) => {
        data.set(id, { ...data.get(id)!, ...patch });
      },
    };
    const outcome = await executePurchaseWithIdempotency(store, purchase, params, {} as any);
    expect(outcome.outcome).toBe("success");
    if (outcome.outcome !== "success") return;
    // The winner (recursive call) created the record with its own key; the
    // overall purchase still succeeds exactly once.
    expect(outcome.response.data.purchaseId).toBe("p1");
  });

  it("re-throws unknown errors instead of swallowing them", async () => {
    const { store } = makeStore();
    await expect(
      executePurchaseWithIdempotency(
        store,
        () => Promise.reject(new Error("boom")),
        params,
        {} as any
      )
    ).rejects.toThrow("boom");
  });
});
