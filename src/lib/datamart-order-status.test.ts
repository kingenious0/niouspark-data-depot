import { describe, it, expect, vi, beforeEach } from "vitest";

const { getOrderStatusMock } = vi.hoisted(() => ({
  getOrderStatusMock: vi.fn(),
}));

vi.mock("@/lib/datamart-api", () => ({
  datamartAPI: { getOrderStatus: getOrderStatusMock },
}));

import {
  getDatamartOrderStatus,
  reconcileTransactionOrderStatus,
  type OrderStatusResult,
} from "@/lib/datamart-order-status";
import { DatamartError } from "@/lib/datamart-errors";

const apiResult = (overrides: Partial<OrderStatusResult> = {}): OrderStatusResult => ({
  source: "api",
  orderStatus: "processing",
  updatedAt: "2026-08-16T10:00:00.000Z",
  phoneNumber: "0551234567",
  network: "YELLO",
  capacity: 5,
  price: 10,
  processingMethod: "api",
  createdAt: "2026-08-16T09:00:00.000Z",
  ...overrides,
});

const update = vi.fn(async () => {});

beforeEach(() => {
  vi.clearAllMocks();
});

describe("getDatamartOrderStatus", () => {
  it("returns a source='api' result on success", async () => {
    getOrderStatusMock.mockResolvedValue({
      status: "success",
      data: {
        orderId: "o1",
        reference: "GN-AB12CD34",
        phoneNumber: "0551234567",
        network: "YELLO",
        capacity: 5,
        price: 10,
        orderStatus: "completed",
        processingMethod: "api",
        createdAt: "2026-08-16T09:00:00.000Z",
        updatedAt: "2026-08-16T10:00:00.000Z",
      },
    });

    const result = await getDatamartOrderStatus("GN-AB12CD34");
    expect(result.source).toBe("api");
    expect(result.orderStatus).toBe("completed");
    expect(getOrderStatusMock).toHaveBeenCalledWith("GN-AB12CD34");
  });

  it("throws DatamartError on a 404", async () => {
    getOrderStatusMock.mockRejectedValue(
      new DatamartError("INVALID_REQUEST", 404, "Order not found")
    );
    await expect(getDatamartOrderStatus("GN-MISSING")).rejects.toMatchObject({
      code: "INVALID_REQUEST",
      httpStatus: 404,
    });
  });

  it("throws DatamartError when the response shape is unexpected", async () => {
    getOrderStatusMock.mockResolvedValue({ status: "success", data: null });
    await expect(getDatamartOrderStatus("GN-X")).rejects.toMatchObject({
      code: "UNKNOWN",
    });
  });
});

describe("reconcileTransactionOrderStatus", () => {
  it("skips transactions without a DataMart order reference", async () => {
    const result = await reconcileTransactionOrderStatus(
      { id: "tx1", status: "delivering" },
      vi.fn(),
      update
    );
    expect(result).toEqual({ reconciled: false, reason: "no_reference" });
  });

  it("skips terminal local states", async () => {
    const result = await reconcileTransactionOrderStatus(
      { id: "tx1", status: "completed", datamartOrderStatus: "completed", datamartOrderReference: "GN-1" },
      vi.fn(),
      update
    );
    expect(result).toEqual({ reconciled: false, reason: "terminal" });
  });

  it("applies a newer API status to a non-terminal transaction", async () => {
    const result = await reconcileTransactionOrderStatus(
      {
        id: "tx1",
        status: "delivering",
        datamartOrderReference: "GN-AB12CD34",
        datamartUpdatedAt: "2026-08-16T09:00:00.000Z",
      },
      async () => apiResult({ orderStatus: "processing" }),
      update
    );
    expect(result).toEqual({ reconciled: true, status: "processing" });
    expect(update).toHaveBeenCalledWith(
      "tx1",
      expect.objectContaining({
        status: "processing",
        datamartOrderStatus: "processing",
        datamartStatusSource: "api",
      })
    );
  });

  it("skips a stale API response that is older than the stored webhook update", async () => {
    const result = await reconcileTransactionOrderStatus(
      {
        id: "tx1",
        status: "processing",
        datamartOrderStatus: "processing",
        datamartOrderReference: "GN-AB12CD34",
        datamartUpdatedAt: "2026-08-16T12:00:00.000Z",
      },
      async () => apiResult({ orderStatus: "processing", updatedAt: "2026-08-16T10:00:00.000Z" }),
      update
    );
    expect(result).toEqual({ reconciled: false, reason: "stale" });
    expect(update).not.toHaveBeenCalled();
  });

  it("skips an API result for a terminal local state", async () => {
    const result = await reconcileTransactionOrderStatus(
      {
        id: "tx1",
        status: "failed",
        datamartOrderStatus: "failed",
        datamartOrderReference: "GN-AB12CD34",
      },
      async () => apiResult({ orderStatus: "completed" }),
      update
    );
    expect(result).toEqual({ reconciled: false, reason: "terminal" });
    expect(update).not.toHaveBeenCalled();
  });

  it("propagates provider failures so the caller can surface them", async () => {
    await expect(
      reconcileTransactionOrderStatus(
        {
          id: "tx1",
          status: "delivering",
          datamartOrderReference: "GN-AB12CD34",
        },
        async () => {
          throw new DatamartError("DATAMART_UNAVAILABLE", 503, "down");
        },
        update
      )
    ).rejects.toMatchObject({ code: "DATAMART_UNAVAILABLE" });
  });
});
