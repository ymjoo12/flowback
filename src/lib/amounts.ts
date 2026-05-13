import { AppError } from "./errors";

const AMOUNT_PATTERN = /^(0|[1-9]\d*)(\.\d{1,6})?$/;
const EPSILON = 0.000001;

export interface ParsedAmount {
  value: number;
  text: string;
}

export function parsePositiveAmount(raw: unknown, label: string, max: number): ParsedAmount {
  const amount = parseAmount(raw, label, max);
  if (amount.value <= 0) {
    throw new AppError(`${label} must be greater than 0`, 400);
  }
  return amount;
}

export function parseNonNegativeAmount(raw: unknown, label: string, max: number): ParsedAmount {
  return parseAmount(raw, label, max);
}

export function assertBalancedRefund(total: number, keep: number, refund: number): void {
  if (refund > total + EPSILON) {
    throw new AppError("refundXrp cannot exceed the order total", 400);
  }
  if (Math.abs(total - keep - refund) > EPSILON) {
    throw new AppError("keepXrp plus refundXrp must equal the order total", 400);
  }
}

function parseAmount(raw: unknown, label: string, max: number): ParsedAmount {
  if (typeof raw !== "string") {
    throw new AppError(`${label} must be a decimal string`, 400);
  }
  const text = raw.trim();
  if (text.startsWith("-")) {
    throw new AppError(`${label} must be between 0 and ${max}`, 400);
  }
  if (!AMOUNT_PATTERN.test(text)) {
    throw new AppError(`${label} must use up to 6 decimal places`, 400);
  }
  const value = Number(text);
  if (!Number.isFinite(value) || value < 0 || value > max) {
    throw new AppError(`${label} must be between 0 and ${max}`, 400);
  }
  return { value, text };
}
