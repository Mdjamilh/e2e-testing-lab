import { delay, http, passthrough } from "msw";
import { setupWorker } from "msw/browser";
import { handleApiRequest } from "./api";

/** Real networks are not instant; a little jitter keeps the UI honest about loading states. */
function latencyFor(pathname: string): number {
  if (pathname === "/api/products") return 150 + Math.random() * 350;
  return 200;
}

export const worker = setupWorker(
  http.all("/api/*", async ({ request }) => {
    await delay(latencyFor(new URL(request.url).pathname));
    return (await handleApiRequest(request)) ?? passthrough();
  }),
);
