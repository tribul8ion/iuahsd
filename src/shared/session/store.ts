import { create } from "zustand";

export type BootState =
  | "boot"
  | "consent"
  | "onboarding"
  | "unlock"
  | "ready"
  | "error";

interface SessionState {
  cryptoKey: Uint8Array | null;
  bootState: BootState;
  setCryptoKey: (cryptoKey: Uint8Array | null) => void;
  setBootState: (bootState: BootState) => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  cryptoKey: null,
  bootState: "boot",
  setCryptoKey: (cryptoKey) => set({ cryptoKey }),
  setBootState: (bootState) => set({ bootState }),
}));
