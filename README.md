# thich24hutm-be

Backend API cho Zalo Mini App **Nhà thuốc Thích 24h** — thu thập consent/link số điện thoại người dùng.

## Tech stack

- Node.js + Express
- PostgreSQL (Supabase)
- Zalo Open API (verify access token, decode phone/location token)

## Local dev

```bash
cp .env.example .env   # điền DATABASE_URL, ZALO_APP_SECRET
npm install
npm run migrate        # chạy migration
npm run dev            # start server (port 3001)
```

## Env vars

| Var | Bắt buộc | Mô tả |
| --- | --- | --- |
| `DATABASE_URL` | yes | PostgreSQL connection string (Supabase transaction pooler) |
| `ZALO_APP_ID` | yes | Zalo Mini App ID |
| `ZALO_APP_SECRET` | yes | Zalo App Secret (chỉ dùng ở backend) |
| `CORS_ORIGIN` | no | FE origin được phép |
| `PORT` | no | default 3001 |

## API

Tất cả response đều theo envelope: `{ error: 0, message: "Successful", data: {...} }`. Các endpoint yêu cầu `Authorization: Bearer <zalo_access_token>`.

- `POST /api/v1/miniapp/phone` — body `{ phone_token }` → decode phone, upsert `zalo_users`
- `POST /api/v1/miniapp/consents` — body `{ location_token?, network_type?, oa_followed?, device_info?, consented_at }` → decode location, insert consent
- `GET /health` — health check

## Deploy (Render)

Repo có sẵn `render.yaml` (Blueprint). Trong Render Dashboard:

1. New → **Blueprint** → connect GitHub repo
2. Set env vars không có giá trị mặc định:
   - `DATABASE_URL`, `ZALO_APP_ID`, `ZALO_APP_SECRET`, `CORS_ORIGIN`
3. Deploy. Service dùng `npm run migrate && npm start`.

## DB schema

- `zalo_users` — identity/linking (zalo_user_id, phone, phone_linked, customer_matched)
- `zalo_user_consents` — consent/session data (location, network_type, oa_followed, device_info)