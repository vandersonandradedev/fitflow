// FitFlow PWA Service Worker — Offline-First Engine & Web Push
const CACHE_NAME = "fitflow-pwa-v4";

const PRECACHE_ASSETS = [
  "/manifest.json",
  "/favicon.ico",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/sounds/radar.wav",
  "/student/today",
  "/~offline",
];

// Instalação: Pré-cacheia o App Shell, sons e telas principais
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      // Pré-cache com tolerância a falhas individuais
      await Promise.allSettled(
        PRECACHE_ASSETS.map((url) =>
          cache.add(url).catch((err) => {
            console.warn("[SW] Falha ao pré-cachear:", url, err);
          })
        )
      );
    })
  );
  self.skipWaiting();
});

// Ativação: Limpa versões obsoletas do cache
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

/**
 * Executa fetch com timeout para não prender o usuário em conexões 2G/3G instáveis
 */
function fetchWithTimeout(request, timeoutMs = 2500) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error("Network timeout"));
    }, timeoutMs);

    fetch(request)
      .then((response) => {
        clearTimeout(timer);
        resolve(response);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

self.addEventListener("fetch", (event) => {
  // Ignora métodos que não sejam GET (Server Actions, POST/PUT/DELETE)
  if (event.request.method !== "GET") {
    return;
  }

  const url = new URL(event.request.url);

  // Ignora chamadas de autenticação sensíveis e crons
  if (
    url.pathname.startsWith("/api/auth/") ||
    url.pathname.startsWith("/api/cron/") ||
    url.pathname.includes("/_next/webpack-hmr")
  ) {
    return;
  }

  const isSameOrigin = url.origin === self.location.origin;

  // 1. Assets Estáticos Imutáveis (_next/static, sons, ícones) -> CacheFirst
  const isStaticAsset =
    isSameOrigin &&
    (url.pathname.startsWith("/_next/static/") ||
      url.pathname.startsWith("/icons/") ||
      url.pathname.startsWith("/sounds/") ||
      url.pathname === "/favicon.ico" ||
      url.pathname === "/manifest.json");

  if (isStaticAsset) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached;
        return fetch(event.request).then((networkRes) => {
          if (networkRes && networkRes.status === 200) {
            const clone = networkRes.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return networkRes;
        });
      })
    );
    return;
  }

  // 2. Navegação de Páginas HTML (Documentos) -> NetworkFirst com fallback offline
  const isNavigation =
    event.request.mode === "navigate" ||
    (event.request.headers.get("accept") &&
      event.request.headers.get("accept").includes("text/html"));

  if (isNavigation && isSameOrigin) {
    event.respondWith(
      fetchWithTimeout(event.request, 2500)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return networkResponse;
        })
        .catch(async () => {
          // Tenta a página solicitada no cache
          const cached = await caches.match(event.request);
          if (cached) return cached;

          // Se for rota de aluno, entrega o treino de hoje em cache
          if (url.pathname.startsWith("/student")) {
            const studentToday = await caches.match("/student/today");
            if (studentToday) return studentToday;
          }

          // Fallback universal para página offline dedicada
          const offlinePage = await caches.match("/~offline");
          if (offlinePage) return offlinePage;

          return new Response("FitFlow Offline — Sem conexão à rede", {
            status: 503,
            headers: { "Content-Type": "text/plain; charset=utf-8" },
          });
        })
    );
    return;
  }

  // 3. Payloads de Navegação Interna Next.js RSC (headers RSC: 1 ou query _rsc) -> NetworkFirst
  const isRscRequest =
    isSameOrigin &&
    (event.request.headers.get("rsc") === "1" ||
      url.searchParams.has("_rsc") ||
      event.request.headers.get("next-router-prefetch"));

  if (isRscRequest) {
    event.respondWith(
      fetchWithTimeout(event.request, 2000)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return networkResponse;
        })
        .catch(async () => {
          const cached = await caches.match(event.request);
          if (cached) return cached;
          return new Response("", { status: 200, headers: { "Content-Type": "text/x-component" } });
        })
    );
    return;
  }

  // 4. Imagens e Mídias de Exercícios -> StaleWhileRevalidate
  const isImageOrMedia =
    url.pathname.startsWith("/images/") ||
    url.pathname.startsWith("/_next/image") ||
    /\.(png|jpg|jpeg|svg|webp|gif)$/i.test(url.pathname);

  if (isImageOrMedia) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        const fetchPromise = fetch(event.request)
          .then((networkRes) => {
            if (networkRes && networkRes.status === 200) {
              const clone = networkRes.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
            }
            return networkRes;
          })
          .catch(() => cached);

        return cached || fetchPromise;
      })
    );
    return;
  }
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
