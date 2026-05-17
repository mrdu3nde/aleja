export const depositConfig = {
  amount: Number(process.env.NEXT_PUBLIC_DEPOSIT_AMOUNT ?? "20"),
  zelleName: process.env.NEXT_PUBLIC_ZELLE_NAME ?? "Alejandra",
  zellePhone: process.env.NEXT_PUBLIC_ZELLE_PHONE ?? "+1 (747) 250-0852",
};

export function buildReferenceCode(appointmentId: string): string {
  return `ALUH-${appointmentId.replace(/-/g, "").slice(0, 6).toUpperCase()}`;
}
