# thich24hutm-be

Backend API cho Zalo Mini App **Nhà thuốc Thích 24h** — thu thập consent/link số điện thoại người dùng.

## Tech stack

- Node.js + Express
- PostgreSQL (shared database `thich24h_notify`, chạy qua Thich24hNotify / Alembic)
- Zalo Open API (verify access token, decode phone/location token)

## Local dev

```bash
cp .env.example .env   # điền DATABASE_URL, ZALO_APP_SECRET
npm install
npm run dev            # start server (port 3001)
```

> Schema của `thich24h_notify` được quản lý bởi Alembic bên Thich24hNotify.
> **KHÔNG chạy `npm run migrate` / `npm run seed`** vào DB shared này. Các file
> migration/seed để làm tài liệu tham chiếu schema, không tự động chạy (Dockerfile
> & Render dùng `npm start`).

## Env vars

| Var                         | Bắt buộc | Mô tả                                                        |
| --------------------------- | -------- | ------------------------------------------------------------ |
| `DATABASE_URL`              | yes      | PostgreSQL connection string tới shared DB `thich24h_notify` |
| `ZALO_APP_ID`               | yes      | Zalo Mini App ID                                             |
| `ZALO_APP_SECRET`           | yes      | Zalo App Secret (chỉ dùng ở backend)                         |
| `CORS_ORIGIN`               | no       | FE origin được phép                                          |
| `MAX_STORE_DISTANCE_METERS` | no       | ngưỡng match nhà thuốc gần nhất (mét), default 50            |
| `PORT`                      | no       | default 3001                                                 |

## API

Tất cả response đều theo envelope: `{ error: 0, message: "Successful", data: {...} }`. Các endpoint yêu cầu `Authorization: Bearer <zalo_access_token>`.

- `POST /api/v1/miniapp/phone` — body `{ phone_token }` → decode phone, upsert `miniapp_users`; đồng thời ingest event vào `utm_events` (khi đã có OA mapping) cho Thich24hNotify
- `POST /api/v1/miniapp/consents` — body `{ location_token?, network_type?, oa_followed?, device_info?, consented_at, user_id_by_app?, oa_user_id? }` → decode location, insert consent; nếu `oa_followed` và GPS hợp lệ → insert `first_follow_locations` (snapshot **bất biến**, `ON CONFLICT DO NOTHING`). Identity `user_id_by_app` lấy từ access token (`req.zaloUserId`); nếu client gửi `user_id_by_app` khác → chỉ log cảnh báo, vẫn dùng giá trị server. `oa_user_id` là **mapping client claim** (lưu `COALESCE` kiểu fill-only: NULL → value, có sẵn thì không ghi đè), **chưa xác thực qua OA API** nên không coi tương đương với `user_id_by_app`. Khi `oa_followed === true` và `miniapp_users.oa_user_id` có sẵn → đồng bộ `zalo_users.is_follow = TRUE` và ghi `followed_at = consented_at` (không overwrite `phone`/`status`; chỉ refresh `followed_at` khi flip false→true, giữ invariant follow-streak/voucher window của Thich24hNotify). `oa_followed=false`/thiếu field → **không** sync `is_follow=false` (thiếu bằng chứng bỏ quan tâm).
- `POST /api/v1/miniapp/location/match` — tính nhà thuốc active gần nhất từ snapshot `first_follow_locations` bằng Haversine; nếu `distance <= MAX_STORE_DISTANCE_METERS` → `matched=true` và persist vào `miniapp_users` (matched_pharmacy_id, matched_at, match_distance_meters, customer_matched=true). `accuracy > 50m` → `matched=false` nhưng vẫn trả nhà thuốc gần nhất + `accuracy_meters`. Không fallback sang `zalo_user_consents.location`
- `GET /health` — health check

UTM event: khi share phone ở `/phone` và có OA mapping, BE ghi thẳng vào bảng
`utm_events` (idempotent theo `event_id`, bỏ event cũ hơn `MAX(occurred_at)`) và
upsert phone vào `zalo_users(zalo_oa_user_id)` của Thich24hNotify — **cùng một DB
`thich24h_notify`**, không còn push webhook.

Lưu ý Zalo: GPS trả về dạng **string** — backend normalize về number trước khi lưu (`normalizeCoordinates`); nếu không parse được → coi như invalid GPS → không match.

## Deploy (Render)

Repo có sẵn `render.yaml` (Blueprint). Trong Render Dashboard:

1. New → **Blueprint** → connect GitHub repo
2. Set env vars không có giá trị mặc định:
   - `DATABASE_URL`, `ZALO_APP_ID`, `ZALO_APP_SECRET`, `CORS_ORIGIN`
3. Deploy. Service dùng `npm start` (schema do Alembic của Thich24hNotify quản lý).

Chạy Docker compose tương tự: `backend` trỏ `DATABASE_URL` tới
`host.docker.internal:5432/thich24h_notify` (không tự chạy migration).

## DB schema (shared `thich24h_notify`)

- `miniapp_users` — identity/linking (zalo_user_id, phone, phone_linked, customer_matched, oa_user_id — mapping claimed từ client, chưa xác thực OA API) + match (matched_pharmacy_id FK→pharmacy_locations ON DELETE SET NULL, matched_at, match_distance_meters)
- `zalo_user_consents` — consent/session data (location, network_type, oa_followed, device_info)
- `pharmacy_locations` — nhà thuốc (kiotviet_branch_id, latitude, longitude, is_active)
- `first_follow_locations` — snapshot GPS lần đầu (unikey zalo_user_id, bất biến)
- `utm_events` — audit event UTM (idempotent theo event_id, phục vụ reconciling của Thich24hNotify)
- `zalo_users` — bảng của Thich24hNotify (zalo_oa_user_id, status, is_follow, followed_at, phone) — BE ghi phone khi ingest UTM (không đặt `followed_at`); khi `/consents` báo `oa_followed=true` và có `oa_user_id` → BE sync `is_follow=TRUE` + `followed_at=consented_at` (không đụng phone/status; `followed_at` chỉ refresh khi flip false→true, theo invariant của Thich24hNotify).
