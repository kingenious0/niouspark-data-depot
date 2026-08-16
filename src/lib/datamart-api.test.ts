import { describe, it, expect, vi, beforeEach } from "vitest";

const { postMock, getMock } = vi.hoisted(() => ({
  postMock: vi.fn(),
  getMock: vi.fn(),
}));

vi.mock("axios", () => ({
  default: {
    post: postMock,
    get: getMock,
  },
}));

import { datamartAPI, DatamartAPIService } from "@/lib/datamart-api";

const successData = {
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
};

function axiosError(status: number, body: any): any {
  const err: any = new Error("Request failed");
  err.response = { status, data: body };
  return err;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("DatamartAPIService.purchaseBundle", () => {
  it("sends the normalized capacity in the payload", async () => {
    postMock.mockResolvedValue({
      data: { status: "success", data: successData },
    });
    await datamartAPI.purchaseBundle({
      phoneNumber: "0551234567",
      network: "YELLO",
      capacity: "5GB",
      gateway: "wallet",
    });
    const [url, payload] = postMock.mock.calls[0];
    expect(url).toContain("/purchase");
    expect(payload.capacity).toBe("5");
  });

  it("sends the X-Idempotency-Key header when provided", async () => {
    postMock.mockResolvedValue({ data: { status: "success", data: successData } });
    const key = "uuid-1234";
    await datamartAPI.purchaseBundle(
      { phoneNumber: "0551234567", network: "YELLO", capacity: "5", gateway: "wallet" },
      key
    );
    const [, , config] = postMock.mock.calls[0];
    expect(config.headers["X-Idempotency-Key"]).toBe(key);
  });

  it("omits the idempotency header when no key is passed", async () => {
    postMock.mockResolvedValue({ data: { status: "success", data: successData } });
    await datamartAPI.purchaseBundle({
      phoneNumber: "0551234567",
      network: "YELLO",
      capacity: "5",
      gateway: "wallet",
    });
    const [, , config] = postMock.mock.calls[0];
    expect(config.headers["X-Idempotency-Key"]).toBeUndefined();
  });

  it("maps a 400 insufficient-balance response to INSUFFICIENT_BALANCE", async () => {
    postMock.mockRejectedValue(
      axiosError(400, { message: "Insufficient wallet balance" })
    );
    await expect(
      datamartAPI.purchaseBundle({
        phoneNumber: "0551234567",
        network: "YELLO",
        capacity: "5",
        gateway: "wallet",
      })
    ).rejects.toMatchObject({ code: "INSUFFICIENT_BALANCE" });
  });

  it("maps a 401 to INVALID_API_KEY and a 429 to RATE_LIMITED", async () => {
    postMock.mockRejectedValue(axiosError(401, { message: "Invalid API key" }));
    await expect(
      datamartAPI.purchaseBundle({
        phoneNumber: "0551234567",
        network: "YELLO",
        capacity: "5",
        gateway: "wallet",
      })
    ).rejects.toMatchObject({ code: "INVALID_API_KEY" });

    postMock.mockRejectedValue(axiosError(429, { message: "rate limited" }));
    await expect(
      datamartAPI.purchaseBundle({
        phoneNumber: "0551234567",
        network: "YELLO",
        capacity: "5",
        gateway: "wallet",
      })
    ).rejects.toMatchObject({ code: "RATE_LIMITED" });
  });

  it("maps a timeout (no response) to TIMEOUT", async () => {
    postMock.mockRejectedValue(new Error("timeout of 20000ms exceeded"));
    await expect(
      datamartAPI.purchaseBundle({
        phoneNumber: "0551234567",
        network: "YELLO",
        capacity: "5",
        gateway: "wallet",
      })
    ).rejects.toMatchObject({ code: "TIMEOUT" });
  });

  it("returns rate-limit metadata on success", async () => {
    postMock.mockResolvedValue({
      data: {
        status: "success",
        data: successData,
        rateLimit: { limit: 100, remaining: 99, resetInSeconds: 5 },
      },
    });
    const response = await datamartAPI.purchaseBundle({
      phoneNumber: "0551234567",
      network: "YELLO",
      capacity: "5",
      gateway: "wallet",
    });
    expect(response.rateLimit?.remaining).toBe(99);
    expect(response.data.balanceAfter).toBe(90);
  });
});

describe("DatamartAPIService.getOrderStatus", () => {
  it("fetches the order status by reference and encodes the path segment", async () => {
    getMock.mockResolvedValue({
      data: {
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
      },
    });
    const response = await datamartAPI.getOrderStatus("GN-AB12CD34");
    expect(getMock).toHaveBeenCalledWith(
      "https://api.datamartgh.shop/api/developer/order-status/GN-AB12CD34",
      expect.any(Object)
    );
    expect(response.data.orderStatus).toBe("completed");
  });

  it("throws DatamartError on 404", async () => {
    getMock.mockRejectedValue(axiosError(404, { message: "Order not found" }));
    await expect(datamartAPI.getOrderStatus("GN-X")).rejects.toMatchObject({
      httpStatus: 404,
    });
  });
});

describe("DatamartAPIService helpers", () => {
  it("normalizes network identifiers", () => {
    expect(DatamartAPIService.getNetworkIdentifier("MTN")).toBe("YELLO");
    expect(DatamartAPIService.getNetworkIdentifier("AirtelTigo")).toBe("AT_PREMIUM");
    expect(DatamartAPIService.getNetworkIdentifier("Telecel")).toBe("TELECEL");
  });

  it("strips the +233 prefix from phone numbers", () => {
    expect(DatamartAPIService.formatPhoneNumber("+233551234567")).toBe("0551234567");
  });

  it("isConfigured reflects the API key", () => {
    const svc = new DatamartAPIService();
    expect(typeof svc.isConfigured()).toBe("boolean");
  });
});
