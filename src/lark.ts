import type { Env } from "./env";

type TokenCache = { token: string; expiresAtMs: number };
let cachedTenantToken: TokenCache | null = null;

export async function getTenantAccessToken(env: Env): Promise<string> {
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

export async function createBitableRecord(
  env: Env,
  tenantToken: string,
  tableId: string,
  fields: Record<string, any>,
) {
  const url = `https://open.larksuite.com/open-apis/bitable/v1/apps/${encodeURIComponent(
    env.BITABLE_APP_TOKEN,
  )}/tables/${encodeURIComponent(tableId)}/records`;

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

export async function uploadDriveFile(
  env: Env,
  tenantToken: string,
  file: File,
): Promise<{ file_token: string; name: string }> {
  const parentType = env.LARK_UPLOAD_PARENT_TYPE ?? "bitable";
  const parentNode = env.LARK_UPLOAD_PARENT_NODE ?? env.BITABLE_APP_TOKEN;
  const buildForm = () => {
    const form = new FormData();
    form.append("file_name", file.name);
    form.append("parent_type", parentType);
    form.append("parent_node", parentNode);
    form.append("size", String(file.size));
    form.append("file", file);
    return form;
  };

  const primaryBase = env.LARK_DRIVE_BASE_URL ?? "https://open.larksuite.com";

  const attemptUpload = async (baseUrl: string) => {
    console.log("Uploading to Lark Drive", {
      baseUrl,
      parentType,
      parentNode,
      fileName: file.name,
      fileSize: file.size,
    });
    const resp = await fetch(`${baseUrl}/open-apis/drive/v1/files/upload_all`, {
      method: "POST",
      headers: { Authorization: `Bearer ${tenantToken}` },
      body: buildForm(),
    });

    const contentType = resp.headers.get("content-type") ?? "";
    let data: any = null;
    let rawText: string | null = null;
    try {
      if (contentType.includes("application/json")) {
        data = (await resp.json()) as any;
      } else {
        rawText = await resp.text();
        try {
          data = JSON.parse(rawText);
        } catch {
          // Keep raw text for logging.
        }
      }
    } catch (err) {
      rawText = rawText ?? (await resp.text().catch(() => null));
      console.log("Lark upload parse error", { http: resp.status, err, rawText });
    }
    if (!resp.ok || data?.code !== 0) {
      console.log("Lark upload failed", {
        http: resp.status,
        body: data ?? rawText,
        contentType,
        baseUrl,
      });
    }
    return { resp, data };
  };

  const { resp, data } = await attemptUpload(primaryBase);

  const fileToken =
    data?.data?.file_token ?? data?.data?.file?.token ?? data?.data?.token ?? data?.data?.file_token;
  if (!resp.ok || data?.code !== 0 || !fileToken) {
    throw new Error(`Upload file failed: http=${resp.status} body=${JSON.stringify(data)}`);
  }

  return { file_token: fileToken, name: file.name };
}
