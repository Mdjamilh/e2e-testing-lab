import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";

/**
 * "msw" (the default) answers /api requests in the browser with Mock Service
 * Worker, so the deployed site is fully static. "network" sends them over HTTP
 * to the Vite server's copy of the same mock API; the Playwright suite builds
 * with that mode so `page.route` can see and rewrite every request.
 */
const apiMode = import.meta.env.VITE_API_MODE === "network" ? "network" : "msw";

async function startMockApi() {
  if (apiMode !== "msw") return;
  const { worker } = await import("./mocks/browser");
  await worker.start({ onUnhandledRequest: "bypass", quiet: true });
}

startMockApi().then(() => {
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
});
