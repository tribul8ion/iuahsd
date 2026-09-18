/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_DEV_TELEGRAM_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

interface TelegramSecureStorage {
  setItem(
    key: string,
    value: string,
    callback?: (error: string | null, success?: boolean) => void
  ): void;
  getItem(
    key: string,
    callback: (error: string | null, value: string | null) => void
  ): void;
  removeItem(
    key: string,
    callback?: (error: string | null, success?: boolean) => void
  ): void;
  clear(callback?: (error: string | null, success?: boolean) => void): void;
}

interface TelegramWebApp {
  ready(): void;
  expand(): void;
  close(): void;
  colorScheme: "light" | "dark";
  initData: string;
  initDataUnsafe: Record<string, unknown>;
  isVersionAtLeast?(version: string): boolean;
  SecureStorage?: TelegramSecureStorage;
  onEvent(event: string, callback: () => void): void;
  offEvent(event: string, callback: () => void): void;
  openInvoice(url: string, callback: (status: string) => void): void;
  MainButton: {
    text: string;
    color: string;
    textColor: string;
    isVisible: boolean;
    isActive: boolean;
    show(): void;
    hide(): void;
    onClick(callback: () => void): void;
    offClick(callback: () => void): void;
    showProgress(leaveActive?: boolean): void;
    hideProgress(): void;
    setParams(params: Record<string, unknown>): void;
  };
  BackButton: {
    isVisible: boolean;
    show(): void;
    hide(): void;
    onClick(callback: () => void): void;
    offClick(callback: () => void): void;
  };
  HapticFeedback: {
    impactOccurred(style: "light" | "medium" | "heavy" | "rigid" | "soft"): void;
    notificationOccurred(type: "error" | "success" | "warning"): void;
    selectionChanged(): void;
  };
}

interface Window {
  Telegram?: {
    WebApp?: TelegramWebApp;
  };
}
