# thich24hutm-be

Backend API cho Zalo Mini App **Nhà thuốc Thích 24h** — thu thập consent/link số điện thoại người dùng.

## Tech stack

- Node.js + Express
- PostgreSQL (Docker, postgres:16-alpine)
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
| `DATABASE_URL` | yes | PostgreSQL connection string (local Docker, cổng 5440) |
| `ZALO_APP_ID` | yes | Zalo Mini App ID |
| `ZALO_APP_SECRET` | yes | Zalo App Secret (chỉ dùng ở backend) |
| `CORS_ORIGIN` | no | FE origin được phép |
| `MAX_STORE_DISTANCE_METERS` | no | ngưỡng match nhà thuốc gần nhất (mét), default 50 |
| `PORT` | no | default 3001 |

## API

Tất cả response đều theo envelope: `{ error: 0, message: "Successful", data: {...} }`. Các endpoint yêu cầu `Authorization: Bearer <zalo_access_token>`.

- `POST /api/v1/miniapp/phone` — body `{ phone_token }` → decode phone, upsert `zalo_users`
- `POST /api/v1/miniapp/consents` — body `{ location_token?, network_type?, oa_followed?, device_info?, consented_at }` → decode location, insert consent; nếu `oa_followed` và GPS hợp lệ → insert `first_follow_locations` (snapshot **bất biến**, `ON CONFLICT DO NOTHING`)
- `POST /api/v1/miniapp/location/match` — tính nhà thuốc active gần nhất từ snapshot `first_follow_locations` bằng Haversine; nếu `distance <= MAX_STORE_DISTANCE_METERS` → `matched=true` và persist vào `zalo_users` (matched_pharmacy_id, matched_at, match_distance_meters, customer_matched=true). `accuracy > 50m` → `matched=false` nhưng vẫn trả nhà thuốc gần nhất + `accuracy_meters`. Không fallback sang `zalo_user_consents.location`
- `GET /health` — health check

Lưu ý Zalo: GPS trả về dạng **string** — backend normalize về number trước khi lưu (`normalizeCoordinates`); nếu không parse được → coi như invalid GPS → không match.

## Deploy (Render)

Repo có sẵn `render.yaml` (Blueprint). Trong Render Dashboard:

1. New → **Blueprint** → connect GitHub repo
2. Set env vars không có giá trị mặc định:
   - `DATABASE_URL`, `ZALO_APP_ID`, `ZALO_APP_SECRET`, `CORS_ORIGIN`
3. Deploy. Service dùng `npm run migrate && npm start`.

## DB schema

- `zalo_users` — identity/linking (zalo_user_id, phone, phone_linked, customer_matched) + match (matched_pharmacy_id FK→pharmacy_locations ON DELETE SET NULL, matched_at, match_distance_meters)
- `zalo_user_consents` — consent/session data (location, network_type, oa_followed, device_info)
- `pharmacy_locations` — nhà thuốc (kiotviet_branch_id, latitude, longitude, is_active)
- `first_follow_locations` — snapshot GPS lần đầu (unikey zalo_user_id, bất biến)