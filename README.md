# soulscape_submit_form

Minimal Cloudflare Worker that receives a form and writes to Lark Bitable.

## Files
- `src/index.ts`: Worker code (supports json / form-urlencoded / multipart)
- `wrangler.toml`: minimal config

## Required secrets
- `LARK_APP_ID`
- `LARK_APP_SECRET`
- `BITABLE_APP_TOKEN`
- `BITABLE_TABLE_ID`
- `ALLOW_ORIGIN` (optional)
- `LARK_UPLOAD_PARENT_TYPE` (optional, defaults to `bitable`)
- `LARK_UPLOAD_PARENT_NODE` (optional, defaults to `BITABLE_APP_TOKEN`)

## Example
POST to `https://<your>.workers.dev/submit`.
