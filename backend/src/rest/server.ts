import { handlers } from "./handlers.js";

const PORT = parseInt(process.env.PORT || "3001", 10);

function addCorsHeaders(response: Response): Response {
  response.headers.set("Access-Control-Allow-Origin", "*");
  response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  response.headers.set("Access-Control-Allow-Headers", "Content-Type");
  return response;
}

type RouteMatch = {
  handler: (req: Request, params: Record<string, string>) => Response | Promise<Response>;
  params: Record<string, string>;
} | null;

function matchRoute(method: string, pathname: string): RouteMatch {
  for (const [routeKey, handler] of Object.entries(handlers)) {
    const [routeMethod, routePattern] = routeKey.split(" ");
    if (routeMethod !== method) continue;

    const routeParts = routePattern.split("/");
    const pathParts = pathname.split("/");

    if (routeParts.length !== pathParts.length) continue;

    const params: Record<string, string> = {};
    let match = true;

    for (let i = 0; i < routeParts.length; i++) {
      if (routeParts[i].startsWith(":")) {
        params[routeParts[i].slice(1)] = pathParts[i];
      } else if (routeParts[i] !== pathParts[i]) {
        match = false;
        break;
      }
    }

    if (match) return { handler, params };
  }

  return null;
}

export function startRestServer() {
  const server = Bun.serve({
    port: PORT,
    fetch(req) {
      const url = new URL(req.url);

      // CORS preflight
      if (req.method === "OPTIONS") {
        return addCorsHeaders(new Response(null, { status: 204 }));
      }

      const route = matchRoute(req.method, url.pathname);
      if (route) {
        const response = route.handler(req, route.params);
        if (response instanceof Promise) {
          return response.then(addCorsHeaders);
        }
        return addCorsHeaders(response);
      }

      return addCorsHeaders(
        new Response(JSON.stringify({ error: "Not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        })
      );
    },
  });

  console.log(`[rest] Conduit REST API running on http://localhost:${server.port}`);
  return server;
}
