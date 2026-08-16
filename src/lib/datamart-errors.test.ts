import { describe, it, expect } from "vitest";
import {
  DatamartError,
  mapDatamartHttpError,
  safeDatamartMessage,
  isRetryableDatamartError,
  httpStatusForDatamartError,
} from "@/lib/datamart-errors";

describe("mapDatamartHttpError", () => {
  it("maps network-level failures (no status) to TIMEOUT", () => {
    const err = mapDatamartHttpError(undefined, undefined, "timeout of 20000ms exceeded");
    expect(err.code).toBe("TIMEOUT");
    expect(err.httpStatus).toBe(0);
    expect(isRetryableDatamartError(err)).toBe(true);
  });

  it("maps 5xx to DATAMART_UNAVAILABLE (retryable)", () => {
    for (const status of [500, 502, 503]) {
      const err = mapDatamartHttpError(status, { message: "upstream exploded" }, "boom");
      expect(err.code).toBe("DATAMART_UNAVAILABLE");
      expect(isRetryableDatamartError(err)).toBe(true);
    }
  });

  it("maps 400 'Insufficient wallet balance' to INSUFFICIENT_BALANCE", () => {
    const err = mapDatamartHttpError(
      400,
      { message: "Insufficient wallet balance", currentBalance: 5, requiredAmount: 10 },
      "failed"
    );
    expect(err.code).toBe("INSUFFICIENT_BALANCE");
    expect(err.details.currentBalance).toBe(5);
  });

  it("maps legacy 400 'Insufficient Datamart wallet balance' to INSUFFICIENT_BALANCE", () => {
    const err = mapDatamartHttpError(400, { message: "Insufficient Datamart wallet balance" }, "failed");
    expect(err.code).toBe("INSUFFICIENT_BALANCE");
  });

  it("maps 400 bundle/capacity messages to INVALID_BUNDLE", () => {
    const err = mapDatamartHttpError(400, { message: "Product 5GB not available for this network" }, "failed");
    expect(err.code).toBe("INVALID_BUNDLE");
  });

  it("maps 400 phone messages to INVALID_PHONE", () => {
    const err = mapDatamartHttpError(400, { message: "Invalid phone number format" }, "failed");
    expect(err.code).toBe("INVALID_PHONE");
  });

  it("maps 400 network messages to INVALID_NETWORK", () => {
    const err = mapDatamartHttpError(400, { message: "Network not supported" }, "failed");
    expect(err.code).toBe("INVALID_NETWORK");
  });

  it("maps 401 invalid/expired to INVALID_API_KEY", () => {
    const err = mapDatamartHttpError(401, { message: "Invalid API key" }, "failed");
    expect(err.code).toBe("INVALID_API_KEY");
  });

  it("maps other 401s to EXPIRED_API_KEY", () => {
    const err = mapDatamartHttpError(401, { message: "Unauthorized" }, "failed");
    expect(err.code).toBe("EXPIRED_API_KEY");
  });

  it("maps 403 IP_NOT_ALLOWED and generic 403", () => {
    const ip = mapDatamartHttpError(403, { message: "API_IP_NOT_ALLOWED" }, "failed");
    expect(ip.code).toBe("IP_NOT_ALLOWED");
    const generic = mapDatamartHttpError(403, { message: "API_RULE_VIOLATION" }, "failed");
    expect(generic.code).toBe("FORBIDDEN");
  });

  it("maps 409 to REQUEST_IN_PROGRESS and 429 to RATE_LIMITED", () => {
    const conflict = mapDatamartHttpError(409, { message: "request in progress" }, "failed");
    expect(conflict.code).toBe("REQUEST_IN_PROGRESS");
    const limited = mapDatamartHttpError(429, { message: "rate limited", retryAfter: 3 }, "failed");
    expect(limited.code).toBe("RATE_LIMITED");
    expect(limited.details.retryAfter).toBe(3);
  });
});

describe("safeDatamartMessage", () => {
  it("returns the required string for INSUFFICIENT_BALANCE", () => {
    const err = mapDatamartHttpError(400, { message: "Insufficient wallet balance" }, "failed");
    expect(safeDatamartMessage(err)).toBe("Insufficient wallet balance");
  });

  it("never leaks upstream message for non-informational codes", () => {
    const err = mapDatamartHttpError(401, { message: "sk_secret_key_12345" }, "failed");
    const msg = safeDatamartMessage(err);
    expect(msg).not.toContain("sk_secret");
  });

  it("returns a generic message for non-DatamartError input", () => {
    expect(safeDatamartMessage(new Error("boom"))).toBe(
      "Unable to process your request. Please try again."
    );
  });
});

describe("httpStatusForDatamartError", () => {
  it("returns 400 for INSUFFICIENT_BALANCE (never 402)", () => {
    const err = mapDatamartHttpError(400, { message: "Insufficient wallet balance" }, "failed");
    expect(httpStatusForDatamartError(err)).toBe(400);
  });

  it("returns the stored httpStatus otherwise", () => {
    const err = new DatamartError("RATE_LIMITED", 429, "busy");
    expect(httpStatusForDatamartError(err)).toBe(429);
  });
});
