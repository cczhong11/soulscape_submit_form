#!/usr/bin/env python3
import argparse
import json
import os
import sys
import urllib.request
import urllib.error


def load_vars(path):
    values = {}
    try:
        with open(path, "r", encoding="utf-8") as handle:
            for raw in handle:
                line = raw.strip()
                if not line or line.startswith("#"):
                    continue
                if "=" not in line:
                    continue
                key, value = line.split("=", 1)
                values[key.strip()] = value.strip()
    except FileNotFoundError:
        return values
    return values


def request_json(url, method="GET", headers=None, payload=None):
    data = None
    if payload is not None:
        data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(url, data=data, method=method)
    if headers:
        for key, value in headers.items():
            req.add_header(key, value)
    try:
        with urllib.request.urlopen(req) as resp:
            body = resp.read()
    except urllib.error.HTTPError as err:
        body = err.read()
        message = body.decode("utf-8", errors="replace")
        raise RuntimeError(f"HTTP {err.code} for {url}: {message}") from err
    return json.loads(body)


def get_tenant_token(app_id, app_secret):
    url = "https://open.larksuite.com/open-apis/auth/v3/tenant_access_token/internal"
    payload = {"app_id": app_id, "app_secret": app_secret}
    resp = request_json(url, method="POST", headers={"Content-Type": "application/json"}, payload=payload)
    if resp.get("code") != 0:
        raise RuntimeError(f"token error: {resp}")
    return resp["tenant_access_token"]


def list_fields(app_token, table_id, tenant_token):
    fields = []
    page_token = None
    while True:
        url = (
            "https://open.larksuite.com/open-apis/bitable/v1/apps/"
            f"{app_token}/tables/{table_id}/fields?page_size=200"
        )
        if page_token:
            url += f"&page_token={page_token}"
        resp = request_json(
            url,
            headers={"Authorization": f"Bearer {tenant_token}"},
        )
        if resp.get("code") != 0:
            raise RuntimeError(f"fields error: {resp}")
        data = resp.get("data") or {}
        fields.extend(data.get("items") or [])
        if not data.get("has_more"):
            break
        page_token = data.get("page_token")
        if not page_token:
            break
    return fields


def escape_md(text):
    if text is None:
        return ""
    return str(text).replace("|", "\\|").replace("\n", " ")


def render_markdown(tables):
    lines = ["# Bitable Schema", ""]
    for table in tables:
        lines.append(f"## {table['key']} ({table['id']})")
        lines.append("")
        lines.append("| Field | Type | Field ID |")
        lines.append("| --- | --- | --- |")
        for field in table["fields"]:
            name = escape_md(field.get("field_name", ""))
            field_id = escape_md(field.get("field_id", ""))
            field_type = field.get("type")
            ui_type = field.get("ui_type")
            type_label = str(field_type)
            if ui_type is not None:
                type_label = f"{field_type} (ui_type {ui_type})"
            lines.append(f"| {name} | {escape_md(type_label)} | {field_id} |")
        lines.append("")
    return "\n".join(lines).rstrip() + "\n"


def main():
    parser = argparse.ArgumentParser(description="List Lark Bitable fields and types.")
    parser.add_argument("--vars", default=".dev.vars", help="Path to env vars file.")
    parser.add_argument("--table-id", default=None, help="Bitable table ID.")
    parser.add_argument("--app-token", default=None, help="Bitable app token.")
    parser.add_argument(
        "--table-keys",
        default="APPLICATIONS_TABLE_ID,VISIONARY_TABLE_ID,MENTOR_TABLE_ID,MENTOR_TOOLS_TABLE_ID",
        help="Comma-separated env keys for table IDs.",
    )
    parser.add_argument("--output", default="schema.md", help="Output markdown file.")
    args = parser.parse_args()

    vars_from_file = load_vars(args.vars)
    env = {**vars_from_file, **os.environ}

    app_id = env.get("LARK_APP_ID")
    app_secret = env.get("LARK_APP_SECRET")
    app_token = args.app_token or env.get("BITABLE_APP_TOKEN")
    table_id = args.table_id or env.get("BITABLE_TABLE_ID")

    missing = [name for name, value in [
        ("LARK_APP_ID", app_id),
        ("LARK_APP_SECRET", app_secret),
        ("BITABLE_APP_TOKEN", app_token),
    ] if not value]
    if missing:
        print(f"Missing required vars: {', '.join(missing)}", file=sys.stderr)
        return 2

    tenant_token = get_tenant_token(app_id, app_secret)
    if args.table_id:
        fields = list_fields(app_token, table_id, tenant_token)
        for field in fields:
            name = field.get("field_name", "")
            field_id = field.get("field_id", "")
            field_type = field.get("type")
            ui_type = field.get("ui_type")
            type_label = str(field_type)
            if ui_type is not None:
                type_label = f"{field_type} (ui_type {ui_type})"
            print(f"{name}\t{type_label}\t{field_id}")
        return 0

    table_keys = [key.strip() for key in args.table_keys.split(",") if key.strip()]
    tables = []
    missing_tables = []
    for key in table_keys:
        value = env.get(key)
        if not value:
            missing_tables.append(key)
            continue
        tables.append({"key": key, "id": value})

    if missing_tables:
        print(f"Missing table IDs for: {', '.join(missing_tables)}", file=sys.stderr)

    if not tables:
        print("No table IDs provided.", file=sys.stderr)
        return 2

    for table in tables:
        table["fields"] = list_fields(app_token, table["id"], tenant_token)

    markdown = render_markdown(tables)
    with open(args.output, "w", encoding="utf-8") as handle:
        handle.write(markdown)
    print(f"Wrote {args.output}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
