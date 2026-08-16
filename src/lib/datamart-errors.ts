/**
 * DataMart API error taxonomy and mapping.
 *
 * Every DataMart API failure is normalised into a `DatamartError` with a stable
 * `code`. Routes map these codes to HTTP responses. No secret material is ever
 * included in customer-facing messages — only `safeMessage` is safe to return.
 */

export type DatamartErrorCode =
  | "INVALID_API_KEY" // 401 — bad/unknown key
  | "EXPIRED_API_KEY" // 401 — key revoked/expired
  | "UNAUTHORIZED" // 401 — generic
  | "FORBIDDEN" // 403 — API_RULE_VIOLATION (deliberately vague upstream)
  | "IP_NOT_ALLOWED" // 403 — API_IP_NOT_ALLOWED
  | "INSUFFICIENT_BALANCE" // 400 — "Insufficient wallet balance"
  | "INVALID_BUNDLE" // 400 — capacity/product not offered
  | "INVALID_PHONE" // 400 — malformed phone number
  | "INVALID_NETWORK" // 400 — unknown network
  | "INVALID_REQUEST" // 400 — generic validation
  | "RATE_LIMITED" // 429
  | "REQUEST_IN_PROGRESS" // 409 — concurrent same idempotency key
  | "TIMEOUT" // network timeout — safe to retry with the same key
  | "DATAMART_UNAVAILABLE" // 5xx/503 — safe to retry with the same key
  | "UNKNOWN";

export interface DatamartErrorDetails {
  currentBalance?: number;
  requiredAmount?: number;
  retryAfter?: number;
  rateLimit?: { limit: number | null; remaining: number; resetInSeconds: number } | null;
  originalMessage?: string;
}

export class DatamartError extends Error {
  readonly code: DatamartErrorCode;
  readonly httpStatus: number;
  readonly details: DatamartErrorDetails;

  constructor(
    code: DatamartErrorCode,
    httpStatus: number,
    message: string,
    details: DatamartErrorDetails = {}
  ) {
    super(message);
    this.name = "DatamartError";
    this.code = code;
    this.httpStatus = httpStatus;
    this.details = details;
  }
}

const RETRYABLE_CODES: ReadonlySet<DatamartErrorCode> = new Set<DatamartErrorCode>([
  "TIMEOUT",
  "DATAMART_UNAVAILABLE",
]);

/**
 * Whether retrying the exact same logical purchase (same idempotency key) is safe.
 * Timeouts and 5xx are the documented safe-to-retry cases for `/purchase`.
 */
export function isRetryableDatamartError(error: unknown): boolean {
  return error instanceof DatamartError && RETRYABLE_CODES.has(error.code);
}

/**
 * Customer-facing message. Never echoes upstream messages verbatim and never
 * contains keys/secrets. Diagnostics go in server logs via `originalMessage`.
 */
export function safeDatamartMessage(error: unknown): string {
  if (!(error instanceof DatamartError)) {
    return "Unable to process your request. Please try again.";
  }
  switch (error.code) {
    case "INVALID_API_KEY":
    case "EXPIRED_API_KEY":
    case "UNAUTHORIZED":
      return "DataMart API configuration error. Please contact support.";
    case "FORBIDDEN":
      return "This DataMart account is restricted. Please contact support.";
    case "IP_NOT_ALLOWED":
      return "Server IP is not allowed by the DataMart API key. Please contact support.";
    case "INSUFFICIENT_BALANCE":
      return "Insufficient wallet balance";
    case "INVALID_BUNDLE":
      return "This bundle is not currently available.";
    case "INVALID_PHONE":
      return "Invalid phone number. Please check and try again.";
    case "INVALID_NETWORK":
      return "Invalid network selected. Please try again.";
    case "INVALID_REQUEST":
      return "Invalid request. Please check your details and try again.";
    case "RATE_LIMITED":
      return "The network is busy. Please try again in a moment.";
    case "REQUEST_IN_PROGRESS":
      return "A purchase for this number is already being processed.";
    case "TIMEOUT":
      return "The network took too long to respond. Your purchase may still go through — check your order status before retrying.";
    case "DATAMART_UNAVAILABLE":
      return "The data provider is temporarily unavailable. Please try again shortly.";
    case "UNKNOWN":
    default:
      return "Unable to process your request. Please try again.";
  }
}

const HTTP_TO_CODE: Record<number, DatamartErrorCode> = {
  400: "INVALID_REQUEST",
  401: "UNAUTHORIZED",
  403: "FORBIDDEN",
  409: "REQUEST_IN_PROGRESS",
  429: "RATE_LIMITED",
  500: "DATAMART_UNAVAILABLE",
  502: "DATAMART_UNAVAILABLE",
  503: "DATAMART_UNAVAILABLE",
};

/**
 * Build a `DatamartError` from an upstream axios-style failure.
 * `status` may be undefined for network-level failures (timeout, DNS, refused).
 */
export function mapDatamartHttpError(
  status: number | undefined,
  body: any,
  fallbackMessage: string
): DatamartError {
  if (!status) {
    return new DatamartError("TIMEOUT", 0, "Request to DataMart timed out or failed", {
      originalMessage: fallbackMessage,
    });
  }

  const upstreamMessage: string = typeof body?.message === "string" ? body.message : "";
  const code = HTTP_TO_CODE[status] ?? "UNKNOWN";

  // 400 with "Insufficient wallet balance" (current or legacy "Insufficient
  // Datamart wallet balance" wording) is a specific, common business error.
  if (
    status === 400 &&
    /insufficient .*balance/i.test(upstreamMessage)
  ) {
    return new DatamartError("INSUFFICIENT_BALANCE", 400, upstreamMessage, {
      currentBalance: body?.currentBalance,
      requiredAmount: body?.requiredAmount,
      originalMessage: upstreamMessage,
    });
  }

  if (status === 400 && /bundle|package|capacity|product/i.test(upstreamMessage)) {
    return new DatamartError("INVALID_BUNDLE", 400, upstreamMessage, {
      originalMessage: upstreamMessage,
    });
  }

  if (status === 400 && /phone|number/i.test(upstreamMessage)) {
    return new DatamartError("INVALID_PHONE", 400, upstreamMessage, {
      originalMessage: upstreamMessage,
    });
  }

  if (status === 400 && /network/i.test(upstreamMessage)) {
    return new DatamartError("INVALID_NETWORK", 400, upstreamMessage, {
      originalMessage: upstreamMessage,
    });
  }

  if (status === 401 && /invalid|expired/i.test(upstreamMessage)) {
    return new DatamartError("INVALID_API_KEY", 401, upstreamMessage, {
      originalMessage: upstreamMessage,
    });
  }

  if (status === 401) {
    return new DatamartError("EXPIRED_API_KEY", 401, upstreamMessage, {
      originalMessage: upstreamMessage,
    });
  }

  if (status === 403 && /IP_NOT_ALLOWED|ip not allowed/i.test(upstreamMessage)) {
    return new DatamartError("IP_NOT_ALLOWED", 403, upstreamMessage, {
      originalMessage: upstreamMessage,
    });
  }

  if (status === 403) {
    return new DatamartError("FORBIDDEN", 403, upstreamMessage, {
      originalMessage: upstreamMessage,
    });
  }

  if (status === 409) {
    return new DatamartError("REQUEST_IN_PROGRESS", 409, upstreamMessage, {
      originalMessage: upstreamMessage,
    });
  }

  if (status === 429) {
    return new DatamartError("RATE_LIMITED", 429, upstreamMessage, {
      retryAfter: typeof body?.retryAfter === "number" ? body.retryAfter : undefined,
      originalMessage: upstreamMessage,
    });
  }

  return new DatamartError(code, status, upstreamMessage || fallbackMessage, {
    originalMessage: upstreamMessage || fallbackMessage,
  });
}

/**
 * HTTP status a route should return for a given `DatamartError`.
 * INSUFFICIENT_BALANCE must be 400 — never 402.
 */
export function httpStatusForDatamartError(error: unknown): number {
  if (error instanceof DatamartError) {
    return error.httpStatus || 500;
  }
  return 500;
}
