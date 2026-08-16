import { describe, it, expect, vi, beforeEach } from "vitest";
import type { NextRequest } from "next/server";

const { verifyIdTokenMock, reconcileMock, getDatamartOrderStatusMock } = vi.hoisted(() => ({
  verifyIdTokenMock: vi.fn(),
  reconcileMock: vi.fn(),
  getDatamartOrderStatusMock: vi.fn(),
}));

let dbQueryResult: any = null;

vi.mock("@/lib/firebase-admin", () => ({
  adminAuth: { verifyIdToken: verifyIdTokenMock },
  adminDb: {
    collection: () => ({
      where: () => ({
        where: () => ({
          limit: () => ({
            get: vi.fn(async () => dbQueryResult),
          }),
        }),
      }),
    }),
  },
}));

vi.mock("@/lib/datamart-order-status", () => ({
  reconcileTransactionOrderStatus: reconcileMock,
  getDatamartOrderStatus: getDatamartOrderStatusMock,
}));

import { GET } from "@/app/api/orders/[reference]/status/route";

function makeRequest(token: string | null): NextRequest {
  const headers: Record<string, string> = {};
  if (token) headers["authorization"] = `Bearer ${token}`;
  return new Request("http://localhost/api/orders/NDD-123/status", {
    headers,
  }) as unknown as NextRequest;
}

const ownOrder = {
  reference: "NDD-123",
  status: "completed",
  datamartOrderStatus: "completed",
  userId: "uid1",
  phoneNumber: "0551234567",
  network: "MTN",
  capacity: "5",
  amount: 10,
  datamartUpdatedAt: "2026-08-16T10:00:00.000Z",
};

function orderData(overrides: Record<string, unknown> = {}) {
  return { ...ownOrder, ...overrides };
}

beforeEach(() => {
  vi.clearAllMocks();
  reconcileMock.mockResolvedValue({ reconciled: false, reason: "skipped" });
});

describe("GET /api/orders/[reference]/status", () => {
  it("returns 401 without a bearer token", async () => {
    const res = await GET(makeRequest(null), { params: Promise.resolve({ reference: "NDD-123" }) });
    expect(res.status).toBe(401);
  });

  it("returns 401 for an invalid token", async () => {
    verifyIdTokenMock.mockRejectedValue(new Error("Invalid token"));
    const res = await GET(makeRequest("bad"), { params: Promise.resolve({ reference: "NDD-123" }) });
    expect(res.status).toBe(401);
  });

  it("returns 404 when no order matches the reference for this user", async () => {
    verifyIdTokenMock.mockResolvedValue({ uid: "uid1" });
    dbQueryResult = { empty: true, docs: [] };
    const res = await GET(makeRequest("valid"), { params: Promise.resolve({ reference: "NDD-999" }) });
    expect(res.status).toBe(404);
  });

  it("returns the order for its owner (unmasked by API, masked phone in response)", async () => {
    verifyIdTokenMock.mockResolvedValue({ uid: "uid1" });
    dbQueryResult = {
      empty: false,
      docs: [{ id: "tx1", data: () => orderData({ datamartUpdatedAt: "2026-08-16T10:00:00.000Z" }) }],
    };
    const res = await GET(makeRequest("valid"), { params: Promise.resolve({ reference: "NDD-123" }) });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.reference).toBe("NDD-123");
    expect(body.data.status).toBe("completed");
    expect(body.data.source).toBe("local");
    expect(body.data.phoneNumber).toBe("055******4567");
  });

  it("skips reconciliation for terminal orders", async () => {
    verifyIdTokenMock.mockResolvedValue({ uid: "uid1" });
    dbQueryResult = {
      empty: false,
      docs: [{ id: "tx1", data: () => orderData({ status: "processing", datamartOrderStatus: "processing" }) }],
    };
    const res = await GET(makeRequest("valid"), { params: Promise.resolve({ reference: "NDD-123" }) });
    expect(res.status).toBe(200);
    expect(reconcileMock).not.toHaveBeenCalled();
  });

  it("reconciles non-terminal orders with a DataMart reference", async () => {
    verifyIdTokenMock.mockResolvedValue({ uid: "uid1" });
    dbQueryResult = {
      empty: false,
      docs: [
        {
          id: "tx1",
          data: () =>
            orderData({
              status: "delivering",
              datamartOrderStatus: "processing",
              datamartOrderReference: "GN-AB12CD34",
              datamartUpdatedAt: "2026-08-16T09:00:00.000Z",
            }),
        },
      ],
    };
    reconcileMock.mockResolvedValue({ reconciled: true, status: "processing" });
    const res = await GET(makeRequest("valid"), { params: Promise.resolve({ reference: "NDD-123" }) });
    expect(res.status).toBe(200);
    expect(reconcileMock).toHaveBeenCalledTimes(1);
    const body = await res.json();
    expect(body.data.source).toBe("api");
  });
});
