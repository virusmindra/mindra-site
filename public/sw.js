/* public/sw.js */

self.addEventListener("push", (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {}

  const title = payload.title || "Mindra";

  // url может быть либо payload.url, либо payload.data.url
  const url =
    payload.url ||
    (payload.data && typeof payload.data === "object" ? payload.data.url : null) ||
    "/en/chat";

  const options = {
    body: payload.body || "",
    icon: payload.icon || "/icons/icon-192.png",
    badge: payload.badge || "/icons/badge-72.png",
    tag: payload.tag || undefined,
    renotify: Boolean(payload.renotify),
    data: {
      url,
      ...((payload.data && typeof payload.data === "object") ? payload.data : {}),
    },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const data = event.notification.data || {};
  const url = data.url || "/en/chat";

  event.waitUntil((async () => {
    const all = await clients.matchAll({ type: "window", includeUncontrolled: true });

    for (const c of all) {
      // если есть вкладка — фокус + навигация
      if ("focus" in c) {
        await c.focus();
        if ("navigate" in c) await c.navigate(url);
        return;
      }
    }

    // иначе открыть новую
    await clients.openWindow(url);
  })());
});
