// Mark module entry so the index.html rescue script knows main.tsx executed.
// Defined as the very first statement so a parse failure in any later import
// still leaves it unset and triggers the reload.
(window as unknown as { __motsditsBoot?: boolean }).__motsditsBoot = true;

import React from "react";
import ReactDOM from "react-dom/client";
import * as Sentry from "@sentry/react";
import { invoke } from "@tauri-apps/api/core";
import App from "./App";
import { CrashScreen } from "./components/CrashScreen";

// Initialize i18n
import "./i18n";

// Initialize Sentry (opt-in bug reporting only -- no automatic capture)
import { initSentry } from "./lib/sentry";
initSentry();

// Initialize model store (loads models and sets up event listeners)
import { useModelStore } from "./stores/modelStore";
useModelStore.getState().initialize();

const rootEl = document.getElementById("root") as HTMLElement;
ReactDOM.createRoot(rootEl).render(
  <React.StrictMode>
    <Sentry.ErrorBoundary
      fallback={({ error, resetError }) => (
        <CrashScreen error={error as Error} resetError={resetError} />
      )}
    >
      <App />
    </Sentry.ErrorBoundary>
  </React.StrictMode>,
);

void invoke("mark_frontend_ready").catch((error) => {
  console.warn("[motsdits] failed to mark frontend ready", error);
});

// Dev-mode rescue: WebView2 + Vite occasionally race on cold start and the
// app window stays blank with no content mounted. If after 2.5s the React
// root is still empty and we're talking to Vite's dev server, force a reload.
// Once mounted normally, this no-ops and never fires again.
if (import.meta.env.DEV) {
  setTimeout(() => {
    if (rootEl.childElementCount === 0) {
      console.warn("[motsdits] blank dev render detected -- forcing reload");
      window.location.reload();
    }
  }, 2500);
}
