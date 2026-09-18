import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./app";
import "./app/providers/i18n";

const root = document.getElementById("root");

if (root) {
  createRoot(root).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
}
