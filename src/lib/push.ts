import webpush from "web-push";
import { prisma } from "@/lib/prisma";

const PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
const CONTACT = process.env.ADMIN_EMAIL || "ingeniero.apinzon@gmail.com";

let configured = false;
function configure() {
  if (configured) return true;
  if (!PUBLIC_KEY || !PRIVATE_KEY) return false;
  webpush.setVapidDetails(`mailto:${CONTACT}`, PUBLIC_KEY, PRIVATE_KEY);
  configured = true;
  return true;
}

/**
 * Fan a notification out to every registered device.
 *
 * Endpoints die silently when the browser is uninstalled or the permission is
 * revoked; the push service answers 404/410 and we drop the row so the table
 * does not fill with dead subscriptions.
 */
export async function notifyOwner(payload: {
  title: string;
  body: string;
  url?: string;
}) {
  if (!configure()) {
    console.warn("Push not configured — missing VAPID keys, skipping.");
    return { sent: 0, removed: 0 };
  }

  const subs = await prisma.pushSubscription.findMany();
  let sent = 0;
  let removed = 0;

  await Promise.all(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: s.endpoint,
            keys: { p256dh: s.p256dh, auth: s.auth },
          },
          JSON.stringify(payload),
        );
        sent++;
      } catch (err: unknown) {
        const code = (err as { statusCode?: number })?.statusCode;
        if (code === 404 || code === 410) {
          await prisma.pushSubscription.delete({ where: { id: s.id } }).catch(() => {});
          removed++;
        } else {
          console.error("Push send failed:", err);
        }
      }
    }),
  );

  return { sent, removed };
}
