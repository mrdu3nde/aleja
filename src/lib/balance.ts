/**
 * The money story of one appointment, computed in a single place so the detail
 * page, the API and anything added later can never disagree.
 *
 * The deposit only counts once it has actually been received — an unpaid
 * deposit is a promise, not money in hand.
 */
export type BalanceInput = {
  servicePrice?: unknown;
  depositRequired?: boolean;
  depositAmount?: unknown;
  depositStatus?: string | null;
  payments?: Array<{ amount: unknown }>;
};

export type Balance = {
  /** Total price of the service, 0 when it has not been set yet. */
  total: number;
  /** Deposit already in hand. */
  depositPaid: number;
  /** Everything collected after the deposit. */
  paid: number;
  /** Deposit + later payments. */
  collected: number;
  /** What the client still owes. Never negative. */
  remaining: number;
  /** Overpaid amount, if any — worth surfacing rather than hiding. */
  change: number;
  /** True once the total is set and fully covered. */
  settled: boolean;
  /** A price is needed before a balance means anything. */
  hasPrice: boolean;
};

const num = (v: unknown): number => {
  const n = Number(v ?? 0);
  return Number.isFinite(n) ? n : 0;
};

export function computeBalance(apt: BalanceInput): Balance {
  const total = num(apt.servicePrice);
  const depositPaid =
    apt.depositRequired !== false && apt.depositStatus === "received"
      ? num(apt.depositAmount)
      : 0;
  const paid = (apt.payments ?? []).reduce((sum, p) => sum + num(p.amount), 0);
  const collected = depositPaid + paid;

  const hasPrice = total > 0;
  const diff = total - collected;

  return {
    total,
    depositPaid,
    paid,
    collected,
    remaining: hasPrice && diff > 0 ? round(diff) : 0,
    change: hasPrice && diff < 0 ? round(-diff) : 0,
    settled: hasPrice && diff <= 0,
    hasPrice,
  };
}

/** Money should not carry floating point noise into the UI. */
function round(n: number) {
  return Math.round(n * 100) / 100;
}
