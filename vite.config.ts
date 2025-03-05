import { defineConfig, type Connect, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import type { IncomingMessage, ServerResponse } from "node:http";
import { handleApiRequest } from "./src/mocks/api";

async function toFetchRequest(req: IncomingMessage): Promise<Request> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(chunk as Buffer);
  const body = chunks.length ? Buffer.concat(chunks) : undefined;
  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (typeof value === "string") headers.set(key, value);
    else if (Array.isArray(value)) headers.set(key, value.join(", "));
  }
  const method = req.method ?? "GET";
  return new Request(`http://${req.headers.host ?? "localhost"}${req.url ?? "/"}`, {
    method,
    headers,
    body: method === "GET" || method === "HEAD" ? undefined : body,
  });
}

const apiMiddleware: Connect.NextHandleFunction = (req, res: ServerResponse, next) => {
  if (!req.url?.startsWith("/api/")) return next();
  toFetchRequest(req)
    .then(handleApiRequest)
    .then(async (response) => {
      if (!response) return next();
      res.statusCode = response.status;
      response.headers.forEach((value, key) => res.setHeader(key, value));
      res.end(Buffer.from(await response.arrayBuffer()));
    })
    .catch(next);
};

/**
 * Serves the same mock API as the service worker, but over real HTTP from the
 * dev and preview servers. Playwright tests use this so that `page.route` and
 * the `request` fixture both see genuine network traffic.
 */
function mockApiServer(): Plugin {
  return {
    name: "mock-api-server",
    configureServer(server) {
      server.middlewares.use(apiMiddleware);
    },
    configurePreviewServer(server) {
      server.middlewares.use(apiMiddleware);
    },
  };
}

export default defineConfig({
  plugins: [react(), mockApiServer()],
});
