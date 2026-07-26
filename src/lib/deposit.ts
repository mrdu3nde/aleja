export const depositConfig = {
  amount: Number(process.env.NEXT_PUBLIC_DEPOSIT_AMOUNT ?? "20"),
  zelleName: process.env.NEXT_PUBLIC_ZELLE_NAME ?? "Alejandra",
  zellePhone: process.env.NEXT_PUBLIC_ZELLE_PHONE ?? "+1 (747) 250-0852",
};

/**
 * Amounts offered when booking by hand, so the deposit can match the service.
 * Website bookings keep the standard NEXT_PUBLIC_DEPOSIT_AMOUNT instead.
 * Edit this list to change what the dropdown offers.
 */
export const DEPOSIT_PRESETS = [20, 30, 40, 50, 75, 100, 150] as const;

/**
 * Single source of truth for "does this booking need a deposit".
 *
 * An amount of 0 means no deposit, exactly like unchecking it — otherwise the
 * client would be shown Zelle instructions asking her for $0, and the booking
 * would sit forever in "awaiting deposit". Normalising here means every screen
 * (list, calendar, detail, public confirm page, counters, emails) agrees,
 * because they all read `depositRequired` off the record.
 */
export function resolveDeposit(
  required: boolean | undefined,
  amount: number | undefined,
): { depositRequired: boolean; depositAmount: number | null } {
  const value = amount ?? depositConfig.amount;

  if (required === false || !Number.isFinite(value) || value <= 0) {
    return { depositRequired: false, depositAmount: null };
  }
  return { depositRequired: true, depositAmount: value };
}

export function buildReferenceCode(appointmentId: string): string {
  return `ALUH-${appointmentId.replace(/-/g, "").slice(0, 6).toUpperCase()}`;
}
