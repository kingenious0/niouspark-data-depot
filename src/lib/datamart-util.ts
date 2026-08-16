/**
 * Pure DataMart helpers with no Firebase/network dependencies — safe to import
 * from both server (API routes) and client (components) code.
 */

/**
 * DataMart expects `capacity` as a plain GB number (e.g. "5", "10") — never a
 * suffixed display string ("5GB"). This normalises any accepted input shape to
 * the numeric string DataMart expects, leaving display values untouched.
 */
export function normalizeCapacity(capacity: string | number): string {
  const raw = String(capacity ?? '').trim();
  if (!raw) {
    return raw;
  }
  const match = raw.match(/(\d+(?:\.\d+)?)/);
  if (!match) {
    return raw;
  }
  return match[1];
}

/**
 * Mask a phone number for safe display, e.g. "+233552345678" -> "055*******".
 * Returns the original input when it can't be masked.
 */
export function maskPhone(phone?: string | null): string {
  const raw = (phone ?? '').trim();
  if (!raw) {
    return '';
  }
  const digits = raw.replace(/\D/g, '');
  if (digits.length < 7) {
    return raw;
  }
  const last4 = digits.slice(-4);
  const prefix = digits.slice(0, 3);
  return `${prefix}******${last4}`;
}

/** DataMart order statuses (also the local transaction statuses). */
export const DATAMART_ORDER_STATUSES = [
  'pending',
  'waiting',
  'processing',
  'completed',
  'failed',
  'refunded',
] as const;

export type DatamartOrderStatus = (typeof DATAMART_ORDER_STATUSES)[number];

const TERMINAL_STATUSES: ReadonlySet<DatamartOrderStatus> = new Set([
  'completed',
  'failed',
  'refunded',
]);

export function isTerminalDatamartStatus(status: string): boolean {
  return TERMINAL_STATUSES.has(status as DatamartOrderStatus);
}

/**
 * Whether moving from `current` to `next` is a safe forward transition.
 * Terminal states never regress.
 */
export function canTransitionDatamartStatus(
  current: string | undefined,
  next: string
): boolean {
  if (!current) {
    return true;
  }
  if (isTerminalDatamartStatus(current)) {
    return current === next;
  }
  return true;
}
