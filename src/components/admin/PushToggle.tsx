"use client";

import { useEffect, useState } from "react";
import { Bell, BellOff, BellRing } from "lucide-react";

const VAPID = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

/** VAPID keys travel as base64url; the Push API wants raw bytes. */
function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

type State = "unsupported" | "denied" | "off" | "on" | "working";

export function PushToggle() {
  const [state, setState] = useState<State>("off");
  const [hint, setHint] = useState<string | null>(null);

  useEffect(() => {
    const supported =
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      "PushManager" in window &&
      !!VAPID;

    if (!supported) {
      setState("unsupported");
      // iOS only exposes push once the site is installed to the home screen
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      const standalone = window.matchMedia?.("(display-mode: standalone)")?.matches;
      if (isIOS && !standalone) {
        setHint("On iPhone: open in Safari, tap Share → Add to Home Screen, then enable it from there.");
      } else if (!VAPID) {
        setHint("Missing VAPID key — notifications are not configured on this deployment.");
      }
      return;
    }

    if (Notification.permission === "denied") {
      setState("denied");
      setHint("Notifications are blocked for this site in your browser settings.");
      return;
    }

    navigator.serviceWorker
      .register("/sw.js")
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => setState(sub ? "on" : "off"))
      .catch(() => setState("off"));
  }, []);

  const enable = async () => {
    setState("working");
    setHint(null);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setState("denied");
        setHint("You declined notifications. Allow them in your browser settings to turn this on.");
        return;
      }

      const reg = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID!),
      });

      const res = await fetch("/api/studio/push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...sub.toJSON(), label: navigator.userAgent.slice(0, 80) }),
      });
      if (!res.ok) throw new Error();
      setState("on");
    } catch {
      setState("off");
      setHint("Could not enable notifications. Try again.");
    }
  };

  const disable = async () => {
    setState("working");
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      const sub = await reg?.pushManager.getSubscription();
      if (sub) {
        await fetch("/api/studio/push", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
        await sub.unsubscribe();
      }
      setState("off");
    } catch {
      setState("on");
    }
  };

  const base =
    "flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-colors";

  if (state === "unsupported" || state === "denied") {
    return (
      <div>
        <span className={base} style={{ color: "var(--admin-muted)" }}>
          <BellOff className="h-4 w-4" />
          Notifications unavailable
        </span>
        {hint && (
          <p className="text-xs mt-1 max-w-xs" style={{ color: "var(--admin-muted)" }}>
            {hint}
          </p>
        )}
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={state === "on" ? disable : enable}
        disabled={state === "working"}
        className={`${base} cursor-pointer disabled:opacity-40`}
        style={
          state === "on"
            ? { backgroundColor: "#dcfce7", color: "#166534" }
            : { border: "1px solid var(--admin-border)", color: "var(--admin-text)" }
        }
      >
        {state === "on" ? <BellRing className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
        {state === "working"
          ? "Working..."
          : state === "on"
            ? "Notifications on"
            : "Turn on notifications"}
      </button>
      {hint && (
        <p className="text-xs mt-1 max-w-xs" style={{ color: "var(--admin-muted)" }}>
          {hint}
        </p>
      )}
    </div>
  );
}
