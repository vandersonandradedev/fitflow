"use client";

import { useEffect } from "react";

export function PwaServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    // Em desenvolvimento, desregistra service workers antigos para não interceptar HMR e compilações
    if (process.env.NODE_ENV === "development") {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (const registration of registrations) {
          registration.unregister();
        }
      });
      return;
    }

    navigator.serviceWorker
      .register("/sw.js")
      .catch(() => {
        // Registro silencioso em ambientes locais ou sem HTTPS
      });
  }, []);

  return null;
}
