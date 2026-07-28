"use client";

import { useEffect } from "react";

export function ServiceWorkerRegister(): null {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;

    let cancelled = false;

    async function register(): Promise<void> {
      try {
        if (cancelled) return;
        await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
          updateViaCache: "none",
        });
      } catch (error) {
        console.error("Service worker registration failed", error);
      }
    }

    void register();

    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
