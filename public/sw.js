// Service worker for owner notifications.
// Registered from the studio; only handles push and notification clicks.

self.addEventListener("push", (event) => {
  let data = { title: "Aluh", body: "New activity", url: "/studio/appointments" };
  try {
    if (event.data) data = { ...data, ...event.data.json() };
  } catch {
    // payload was not JSON — keep the defaults
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: "/favicon.ico",
      badge: "/favicon.ico",
      tag: data.tag || "aluh-notification",
      data: { url: data.url },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/studio/appointments";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      // Focus an already-open studio tab instead of piling up new ones
      for (const client of list) {
        if (client.url.includes("/studio") && "focus" in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      return self.clients.openWindow(url);
    }),
  );
});
