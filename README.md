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

## Example
POST to `https://<your>.workers.dev/submit`.
