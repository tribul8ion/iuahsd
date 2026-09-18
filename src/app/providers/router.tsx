import { BrowserRouter } from "react-router-dom";
import type { ReactNode } from "react";

interface RouterProviderProps {
  children: ReactNode;
}

export function AppRouterProvider({ children }: RouterProviderProps) {
  return <BrowserRouter>{children}</BrowserRouter>;
}
