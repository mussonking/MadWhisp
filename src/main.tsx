// Mark module entry so the index.html rescue script knows main.tsx executed.
// Defined as the very first statement so a parse failure in any later import
// still leaves it unset and triggers the reload.
(window as unknown as { __motsditsBoot?: boolean }).__motsditsBoot = true;

import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

// Initialize i18n
import "./i18n";

// Initialize model store (loads models and sets up event listeners)
import { useModelStore } from "./stores/modelStore";
useModelStore.getState().initialize();

const rootEl = document.getElementById("root") as HTMLElement;
ReactDOM.createRoot(rootEl).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

// Dev-mode rescue: WebView2 + Vite occasionally race on cold start and the
// app window stays blank with no content mounted. If after 2.5s the React
// root is still empty and we're talking to Vite's dev server, force a reload.
// Once mounted normally, this no-ops and never fires again.
if (import.meta.env.DEV) {
  setTimeout(() => {
    if (rootEl.childElementCount === 0) {
      console.warn("[motsdits] blank dev render detected — forcing reload");
      window.location.reload();
    }
  }, 2500);
}
