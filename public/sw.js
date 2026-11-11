// FitFlow PWA Service Worker — Offline Support & Web Push
const CACHE_NAME = "fitflow-pwa-v3";
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

// Intercepta SOMENTE assets estáticos imutáveis (_next/static, icons, images)
// NUNCA intercepta páginas HTML, navegações, Server Actions, auth ou rotas dinâmicas
self.addEventListener("fetch", (event) => {
  // Ignora métodos que não sejam GET
  if (event.request.method !== "GET") {
    return;
  }

  const url = new URL(event.request.url);

  // Ignora origens externas
  if (url.origin !== self.location.origin) {
    return;
  }

  // NUNCA intercepta navegações, RSC, Server Actions, APIs ou páginas dinâmicas/autenticadas
  if (
    event.request.mode === "navigate" ||
    event.request.headers.get("accept")?.includes("text/html") ||
    event.request.headers.get("rsc") === "1" ||
    event.request.headers.get("next-router-prefetch") ||
    event.request.headers.get("next-action") ||
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/coach") ||
    url.pathname.startsWith("/student") ||
    url.pathname.startsWith("/login") ||
    url.pathname.startsWith("/register") ||
    url.pathname.startsWith("/invite") ||
    url.pathname.startsWith("/verify-email") ||
    url.pathname.startsWith("/forgot-password") ||
    url.pathname.startsWith("/reset-password") ||
    url.pathname.includes("/_next/webpack-hmr") ||
    url.pathname.includes("/_next/image")
  ) {
    return; // Passa direto para o navegador lidar nativamente com cookies e redirecionamentos
  }

  // Apenas faz cache de assets estáticos conhecidos
  const isStaticAsset =
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icons/") ||
    url.pathname.startsWith("/images/") ||
    url.pathname === "/favicon.ico" ||
    url.pathname === "/manifest.json";

  if (!isStaticAsset) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, clone);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          return cachedResponse || new Response(null, { status: 404 });
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
