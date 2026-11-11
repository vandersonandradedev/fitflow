// FitFlow PWA Service Worker — Offline Support & Web Push
const CACHE_NAME = "fitflow-pwa-v2";
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

// Intercepta requisições de forma segura: Network First para navegações e assets
self.addEventListener("fetch", (event) => {
  // Ignora requisições não-GET
  if (event.request.method !== "GET") {
    return;
  }

  const url = new URL(event.request.url);

  // Ignora requisições de origens externas ou extensões de navegador
  if (url.origin !== self.location.origin) {
    return;
  }

  // Ignora rotas de API, Server Actions, auth, HMR (desenvolvimento) e otimizador de imagens
  if (
    url.pathname.startsWith("/api/") ||
    url.pathname.includes("/_next/webpack-hmr") ||
    url.pathname.includes("/_next/image")
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
          (url.pathname.startsWith("/icons/") ||
            url.pathname.startsWith("/_next/static/"))
        ) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch((error) => {
        // Em caso de falha de rede real (offline), busca no cache
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // Para páginas HTML navegadas offline, retorna fallback se existir
          if (
            event.request.mode === "navigate" ||
            event.request.headers.get("accept")?.includes("text/html")
          ) {
            return caches.match("/student/today").then((todayCached) => {
              return todayCached || caches.match("/");
            });
          }
          // Rejeita normalmente sem fabricar resposta 503 artificial
          return Promise.reject(error);
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
