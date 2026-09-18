import { create } from "zustand";

interface UserState {
  language: string;
  isAdmin: boolean;
  setLanguage: (language: string) => void;
  setIsAdmin: (isAdmin: boolean) => void;
}

export const useUserStore = create<UserState>((set) => ({
  language: "en",
  isAdmin: false,
  setLanguage: (language: string) => set({ language }),
  setIsAdmin: (isAdmin: boolean) => set({ isAdmin }),
}));
