import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => (m.default ?? m) as ServerEntry,
    );
  }
  return serverEntryPromise;
}

// h3 swallows in-handler throws into a normal 500 Response with body
// {"unhandled":true,"message":"HTTPError"} — try/catch alone never fires for those.
async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!isH3SwallowedErrorBody(body)) return response;

  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

function isH3SwallowedErrorBody(body: string): boolean {
  try {
    const payload = JSON.parse(body) as { unhandled?: unknown; message?: unknown };
    return payload.unhandled === true && payload.message === "HTTPError";
  } catch {
    return false;
  }
}

// Secure Server Proxy for Sarvam AI (shields API key from browser bundles)
async function handleSarvamProxy(request: Request, env: unknown): Promise<Response> {
  const url = new URL(request.url);
  const targetPath = url.pathname.replace(/^\/api\/sarvam/, "");

  // Resolve private server key from environment
  const serverKey =
    (typeof env === "object" && env !== null && "SARVAM_API_KEY" in env
      ? (env as { SARVAM_API_KEY?: string }).SARVAM_API_KEY
      : undefined) ||
    process.env.SARVAM_API_KEY ||
    process.env.VITE_SARVAM_API_KEY;

  if (!serverKey) {
    return new Response(JSON.stringify({ error: "Server Sarvam API key not configured" }), {
      status: 503,
      headers: { "content-type": "application/json" },
    });
  }

  const sarvamTargetUrl = `https://api.sarvam.ai${targetPath}`;

  try {
    const isFormData = request.headers.get("content-type")?.includes("multipart/form-data");
    const headers: Record<string, string> = {
      "api-subscription-key": serverKey,
    };
    if (!isFormData) {
      headers["content-type"] = request.headers.get("content-type") || "application/json";
    }

    const res = await fetch(sarvamTargetUrl, {
      method: request.method,
      headers,
      body: request.method !== "GET" && request.method !== "HEAD" ? await request.arrayBuffer() : undefined,
    });

    const responseHeaders = new Headers(res.headers);
    responseHeaders.set("cache-control", "no-store");

    return new Response(res.body, {
      status: res.status,
      headers: responseHeaders,
    });
  } catch (err: unknown) {
    return new Response(JSON.stringify({ error: (err as Error)?.message || "Proxy connection error" }), {
      status: 502,
      headers: { "content-type": "application/json" },
    });
  }
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    const url = new URL(request.url);

    // Intercept /api/sarvam/* calls securely
    if (url.pathname.startsWith("/api/sarvam")) {
      return await handleSarvamProxy(request, env);
    }

    try {
      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      return await normalizeCatastrophicSsrResponse(response);
    } catch (error) {
      console.error(error);
      return new Response(renderErrorPage(), {
        status: 500,
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }
  },
};
