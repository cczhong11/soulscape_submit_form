# soulscape_submit_form

Minimal Cloudflare Worker that receives a form and writes to Lark Bitable.

## Files
- `src/index.ts`: Worker code (supports json / form-urlencoded / multipart)
- `src/records.ts`: field mapping for Applications/Visionary/Mentor tables
- `wrangler.toml`: minimal config
- `web/index.html`: static intake UI posting to the Worker
- `schema.md`: generated table schema snapshot

## Required variables
- `LARK_APP_ID`
- `LARK_APP_SECRET`
- `BITABLE_APP_TOKEN`
- `APPLICATIONS_TABLE_ID`
- `VISIONARY_TABLE_ID`
- `MENTOR_TABLE_ID`
- `ALLOW_ORIGIN` (optional)
- `LARK_UPLOAD_PARENT_TYPE` (optional, defaults to `bitable`)
- `LARK_UPLOAD_PARENT_NODE` (optional, defaults to `BITABLE_APP_TOKEN`)
- `LARK_DRIVE_BASE_URL` (optional, defaults to `https://open.larksuite.com`)
- `MENTOR_TOOLS_TABLE_ID` (optional, used by `scripts/get_bitable_fields.py`)

## Environment
- Local development uses `.dev.vars`.
- Non-sensitive values can live in `wrangler.toml` under `[vars]`.
- Sensitive values should be stored via `wrangler secret put`.

Example:
```bash
npx wrangler secret put LARK_APP_SECRET
npx wrangler secret put BITABLE_APP_TOKEN
```

## Schema refresh
```bash
python3 scripts/get_bitable_fields.py --vars .dev.vars
```

## Usage
POST to `https://<your>.workers.dev/submit`.


If you add an environment in `wrangler.toml` (e.g. `[env.dev]`), use:
```bash
npx wrangler deploy --env dev
```


# web deployment 

npx wrangler pages deploy web --project-name soulscape-form

Note: `web/index.html` posts to a hardcoded `endpoint` URL. Update it when the Worker URL changes.
