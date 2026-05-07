// howu service worker — Phase 1 會接上 Web Push 與 offline cache。
// 目前僅做 install / activate / fetch 占位,讓瀏覽器把站台識別為 PWA-capable。

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));
self.addEventListener("fetch", () => {});

// Web Push handler 預留(Phase 1 接上)。
self.addEventListener("push", (event) => {
  if (!event.data) return;
  let payload = { title: "howu", body: "" };
  try {
    payload = event.data.json();
  } catch {
    payload.body = event.data.text();
  }
  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
    }),
  );
});
