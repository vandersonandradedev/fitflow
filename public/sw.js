// FitFlow PWA Service Worker — Offline Support & Web Push
const CACHE_NAME = "fitflow-pwa-v1";
const STATIC_ASSETS = [
  "/manifest.json",
  "/favicon.ico",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch(() => {});
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// Intercepta requisições: Network First para dados dinâmicos, Cache Fallback para estáticos
self.addEventListener("fetch", (event) => {
  // Ignora requisições de API, Server Actions (POST) e auth do NextAuth
  if (
    event.request.method !== "GET" ||
    event.request.url.includes("/api/") ||
    event.request.url.includes("/_next/image")
  ) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // Se a resposta for válida e for asset estático, atualiza o cache
        if (
          networkResponse &&
          networkResponse.status === 200 &&
          (event.request.url.includes("/icons/") ||
            event.request.url.includes("/_next/static/"))
        ) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        // Em caso de falha de rede (offline), busca no cache
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // Para páginas HTML navegadas offline, retorna fallback se existir
          if (event.request.headers.get("accept")?.includes("text/html")) {
            return caches.match("/student/today") || caches.match("/");
          }
          return new Response("Offline", { status: 503, statusText: "Offline" });
        });
      })
  );
});

// Listener de Notificações Web Push
self.addEventListener("push", (event) => {
  if (!event.data) return;

  try {
    const data = event.data.json();
    const title = data.title || "FitFlow";
    const options = {
      body: data.body || "Você tem uma nova notificação do FitFlow.",
      icon: data.icon || "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      data: {
        url: data.url || "/student/today",
      },
      vibrate: [100, 50, 100],
    };

    event.waitUntil(self.registration.showNotification(title, options));
  } catch {
    const text = event.data.text();
    event.waitUntil(
      self.registration.showNotification("FitFlow", {
        body: text,
        icon: "/icons/icon-192.png",
      })
    );
  }
});

// Ao clicar na notificação, abre ou foca na janela da URL de destino
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || "/student/today";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(targetUrl) && "focus" in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
