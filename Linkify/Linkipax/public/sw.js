const CACHE_NAME = "linkipax-push-v2";
const DEFAULT_ICON = "/Logo.png";
const DEFAULT_BADGE = "/favicon.ico";

self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames
            .filter((cacheName) => cacheName !== CACHE_NAME)
            .map((cacheName) => caches.delete(cacheName))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("push", (event) => {
  event.waitUntil(
    (async () => {
      let payload = {};

      try {
        payload = event.data ? event.data.json() : {};
      } catch (error) {
        payload = {
          title: "Linkipax",
          body: event.data?.text() || "You have a new notification",
        };
      }

      const nestedData = payload.data || {};
      const tag = payload.tag || nestedData.notificationId || `linkipax-${Date.now()}`;
      const url = payload.url || nestedData.url || "/notifications";
      const title = payload.title || "Linkipax";
      const body = payload.body || payload.message || "You have a new update";

      await self.registration.showNotification(title, {
        body,
        icon: payload.icon || DEFAULT_ICON,
        badge: payload.badge || DEFAULT_BADGE,
        image: payload.image,
        tag,
        renotify: true,
        requireInteraction: Boolean(payload.requireInteraction),
        vibrate: payload.vibrate || [180, 80, 180],
        data: {
          ...nestedData,
          url,
          notificationId: nestedData.notificationId || tag,
          clickTimestamp: Date.now(),
        },
        actions: payload.actions || [],
      });
    })()
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const targetUrl = new URL(
    event.notification.data?.url || "/notifications",
    self.location.origin
  );

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((windowClients) => {
        const matchingClient = windowClients.find((client) => {
          const clientUrl = new URL(client.url);
          return clientUrl.pathname === targetUrl.pathname;
        });

        if (matchingClient) {
          return matchingClient.focus().then(() => {
            matchingClient.postMessage({
              type: "NOTIFICATION_CLICK",
              notificationId: event.notification.data?.notificationId,
              url: targetUrl.pathname,
            });
          });
        }

        return clients.openWindow(targetUrl.href);
      })
  );
});
