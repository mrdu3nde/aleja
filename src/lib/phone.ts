/**
 * Phone numbers arrive in whatever shape the client typed them:
 * "17472401036", "7472401036", "+1 (747) 240-1036", "747-240-1036".
 * These are all the same number, so raw string comparison never matches.
 *
 * We keep the last 10 digits as the comparison key — that drops the US country
 * code while staying stable for numbers typed with or without it.
 */
export function normalizePhone(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const digits = raw.replace(/\D/g, "");
  if (digits.length < 7) return null; // too short to be a real number
  return digits.slice(-10);
}

/** Do two phone numbers refer to the same line, ignoring formatting? */
export function samePhone(a: string | null | undefined, b: string | null | undefined): boolean {
  const na = normalizePhone(a);
  const nb = normalizePhone(b);
  return na !== null && na === nb;
}

/** "(747) 240-1036" for 10-digit US numbers; otherwise returned untouched. */
export function formatPhone(raw: string | null | undefined): string {
  if (!raw) return "—";
  const n = normalizePhone(raw);
  if (!n || n.length !== 10) return raw;
  return `(${n.slice(0, 3)}) ${n.slice(3, 6)}-${n.slice(6)}`;
}
