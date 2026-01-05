import type { Env } from "./env";

export function corsHeaders(env: Env): HeadersInit {
  const origin = env.ALLOW_ORIGIN ?? "*";
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
  };
}

export async function parseIncoming(request: Request): Promise<Record<string, any>> {
  const ct = request.headers.get("content-type") || "";
  if (ct.includes("application/json")) {
    const body = (await request.json()) as any;
    return typeof body === "object" && body ? body : {};
  }

  if (ct.includes("application/x-www-form-urlencoded") || ct.includes("multipart/form-data")) {
    const fd = await request.formData();
    const obj: Record<string, any> = {};
    for (const [k, v] of fd.entries()) {
      if (obj[k] === undefined) {
        obj[k] = v;
        continue;
      }
      if (Array.isArray(obj[k])) {
        obj[k].push(v);
        continue;
      }
      obj[k] = [obj[k], v];
    }
    return obj;
  }

  const text = await request.text();
  return text ? { raw: text } : {};
}

export function jsonResponse(env: Env, status: number, payload: unknown): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders(env), "Content-Type": "application/json" },
  });
}
