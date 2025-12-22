export interface Env {
  LARK_APP_ID: string;
  LARK_APP_SECRET: string;
  BITABLE_APP_TOKEN: string;
  BITABLE_TABLE_ID: string;
  ALLOW_ORIGIN?: string;
}

type TokenCache = { token: string; expiresAtMs: number };
let cachedTenantToken: TokenCache | null = null;

function corsHeaders(env: Env): HeadersInit {
  const origin = env.ALLOW_ORIGIN ?? "*";
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
  };
}

async function getTenantAccessToken(env: Env): Promise<string> {
  const now = Date.now();
  if (cachedTenantToken && cachedTenantToken.expiresAtMs > now + 60_000) {
    return cachedTenantToken.token;
  }

  const resp = await fetch(
    "https://open.larksuite.com/open-apis/auth/v3/tenant_access_token/internal",
    {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({
        app_id: env.LARK_APP_ID,
        app_secret: env.LARK_APP_SECRET,
      }),
    },
  );

  const data = (await resp.json()) as any;
  if (!resp.ok || data?.code !== 0 || !data?.tenant_access_token) {
    throw new Error(
      `Failed to get tenant_access_token: http=${resp.status} body=${JSON.stringify(data)}`,
    );
  }

  const expiresInSec = Number(data.expire ?? 7200);
  cachedTenantToken = {
    token: data.tenant_access_token,
    expiresAtMs: Date.now() + expiresInSec * 1000,
  };
  return cachedTenantToken.token;
}

async function parseIncoming(request: Request): Promise<Record<string, any>> {
  const ct = request.headers.get("content-type") || "";
  if (ct.includes("application/json")) {
    const body = (await request.json()) as any;
    return typeof body === "object" && body ? body : {};
  }

  if (ct.includes("application/x-www-form-urlencoded") || ct.includes("multipart/form-data")) {
    const fd = await request.formData();
    const obj: Record<string, any> = {};
    for (const [k, v] of fd.entries()) {
      if (typeof v === "string") obj[k] = v;
    }
    return obj;
  }

  const text = await request.text();
  return text ? { raw: text } : {};
}

async function createBitableRecord(env: Env, tenantToken: string, fields: Record<string, any>) {
  const url = `https://open.larksuite.com/open-apis/bitable/v1/apps/${encodeURIComponent(
    env.BITABLE_APP_TOKEN,
  )}/tables/${encodeURIComponent(env.BITABLE_TABLE_ID)}/records`;

  const resp = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      Authorization: `Bearer ${tenantToken}`,
    },
    body: JSON.stringify({ fields }),
  });

  const data = (await resp.json()) as any;
  if (!resp.ok || data?.code !== 0) {
    throw new Error(`Create record failed: http=${resp.status} body=${JSON.stringify(data)}`);
  }
  return data;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(env) });
    }

    const url = new URL(request.url);
    if (url.pathname !== "/submit") {
      return new Response("Not Found", { status: 404, headers: corsHeaders(env) });
    }
    if (request.method !== "POST") {
      return new Response("Method Not Allowed", { status: 405, headers: corsHeaders(env) });
    }

    try {
      const fields = await parseIncoming(request);
      if (!fields || Object.keys(fields).length === 0) {
        return new Response(JSON.stringify({ ok: false, error: "Empty payload" }), {
          status: 400,
          headers: { ...corsHeaders(env), "Content-Type": "application/json" },
        });
      }

      const token = await getTenantAccessToken(env);
      const result = await createBitableRecord(env, token, fields);

      return new Response(JSON.stringify({ ok: true, result }), {
        status: 200,
        headers: { ...corsHeaders(env), "Content-Type": "application/json" },
      });
    } catch (err: any) {
      return new Response(JSON.stringify({ ok: false, error: String(err?.message ?? err) }), {
        status: 500,
        headers: { ...corsHeaders(env), "Content-Type": "application/json" },
      });
    }
  },
};
