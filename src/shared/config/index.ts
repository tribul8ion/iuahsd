export const API_URL = import.meta.env.VITE_API_URL ?? "/api";

export const QUERY_STALE_TIME = 1000 * 60 * 5;

// ВРЕМЕННО: демо-предпросмотр без Telegram-сессии и бэкенда.
// Включается в dev-режиме через VITE_PREVIEW=1 или ?preview=1 в URL.
export const PREVIEW_MODE =
  import.meta.env.DEV &&
  (import.meta.env.VITE_PREVIEW === "1" ||
    (typeof window !== "undefined" &&
      new URLSearchParams(window.location.search).has("preview")));
