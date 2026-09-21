BEGIN;

CREATE TABLE IF NOT EXISTS miniapp_users (
  id               SERIAL PRIMARY KEY,
  zalo_user_id     TEXT UNIQUE NOT NULL,
  phone            TEXT,
  phone_linked     BOOLEAN DEFAULT FALSE,
  customer_matched BOOLEAN DEFAULT FALSE,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS zalo_user_consents (
  id            SERIAL PRIMARY KEY,
  zalo_user_id  TEXT NOT NULL REFERENCES miniapp_users(zalo_user_id),
  location      JSONB,
  network_type  TEXT DEFAULT 'unknown',
  oa_followed   BOOLEAN DEFAULT FALSE,
  device_info   JSONB DEFAULT '{}',
  consented_at  TIMESTAMPTZ NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_zalo_users_zalo_id ON miniapp_users(zalo_user_id);
CREATE INDEX IF NOT EXISTS idx_consents_zalo_id ON zalo_user_consents(zalo_user_id);

COMMIT;
