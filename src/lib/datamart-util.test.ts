import { describe, it, expect } from "vitest";
import {
  normalizeCapacity,
  maskPhone,
  isTerminalDatamartStatus,
  canTransitionDatamartStatus,
  DATAMART_ORDER_STATUSES,
} from "@/lib/datamart-util";

describe("normalizeCapacity", () => {
  it("returns the plain GB number for simple numeric input", () => {
    expect(normalizeCapacity("5")).toBe("5");
    expect(normalizeCapacity(5)).toBe("5");
  });

  it("strips the GB suffix and trims whitespace", () => {
    expect(normalizeCapacity("5GB")).toBe("5");
    expect(normalizeCapacity(" 2 GB ")).toBe("2");
    expect(normalizeCapacity("1.5GB")).toBe("1.5");
  });

  it("handles empty and nullish input", () => {
    expect(normalizeCapacity("")).toBe("");
    expect(normalizeCapacity(null as any)).toBe("");
    expect(normalizeCapacity(undefined as any)).toBe("");
  });
});

describe("maskPhone", () => {
  it("masks the middle digits", () => {
    expect(maskPhone("0551234567")).toBe("055******4567");
  });

  it("returns the original input when it cannot be masked safely", () => {
    expect(maskPhone("")).toBe("");
    expect(maskPhone("12")).toBe("12");
  });
});

describe("DATAMART_ORDER_STATUSES / terminal statuses", () => {
  it("exposes the six DataMart order statuses", () => {
    expect(DATAMART_ORDER_STATUSES).toEqual([
      "pending",
      "waiting",
      "processing",
      "completed",
      "failed",
      "refunded",
    ]);
  });

  it("treats completed/failed/refunded as terminal", () => {
    for (const s of ["completed", "failed", "refunded"]) {
      expect(isTerminalDatamartStatus(s)).toBe(true);
    }
  });

  it("treats pending/waiting/processing as non-terminal", () => {
    for (const s of ["pending", "waiting", "processing"]) {
      expect(isTerminalDatamartStatus(s)).toBe(false);
    }
  });

  it("treats unknown statuses as non-terminal", () => {
    expect(isTerminalDatamartStatus("unknown")).toBe(false);
  });
});

describe("canTransitionDatamartStatus", () => {
  it("moves forward along the happy path", () => {
    expect(canTransitionDatamartStatus("pending", "waiting")).toBe(true);
    expect(canTransitionDatamartStatus("waiting", "processing")).toBe(true);
    expect(canTransitionDatamartStatus("processing", "completed")).toBe(true);
  });

  it("allows failure/refund from any non-terminal state", () => {
    expect(canTransitionDatamartStatus("processing", "failed")).toBe(true);
    expect(canTransitionDatamartStatus("pending", "refunded")).toBe(true);
  });

  it("allows a direct jump from a non-terminal state to terminal success", () => {
    // Webhooks may jump straight to completed; only terminal->terminal-ish
    // regressions are blocked.
    expect(canTransitionDatamartStatus("pending", "completed")).toBe(true);
  });

  it("never regresses terminal states", () => {
    expect(canTransitionDatamartStatus("completed", "processing")).toBe(false);
    expect(canTransitionDatamartStatus("failed", "completed")).toBe(false);
    expect(canTransitionDatamartStatus("refunded", "pending")).toBe(false);
    expect(canTransitionDatamartStatus("completed", "failed")).toBe(false);
  });

  it("allows any target when there is no current status", () => {
    expect(canTransitionDatamartStatus(undefined, "completed")).toBe(true);
    expect(canTransitionDatamartStatus("", "completed")).toBe(true);
  });
});
