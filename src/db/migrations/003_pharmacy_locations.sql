BEGIN;

CREATE TABLE IF NOT EXISTS pharmacy_locations (
  id                 SERIAL PRIMARY KEY,
  kiotviet_branch_id BIGINT UNIQUE NOT NULL,
  branch_name        TEXT,
  address            TEXT,
  latitude           DOUBLE PRECISION NOT NULL,
  longitude          DOUBLE PRECISION NOT NULL,
  is_active          BOOLEAN NOT NULL DEFAULT TRUE,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT chk_pharmacy_locations_latitude
    CHECK (latitude BETWEEN -90 AND 90),

  CONSTRAINT chk_pharmacy_locations_longitude
    CHECK (longitude BETWEEN -180 AND 180)
);

CREATE INDEX IF NOT EXISTS idx_pharmacy_locations_active
  ON pharmacy_locations(is_active);

CREATE TABLE IF NOT EXISTS first_follow_locations (
  id           SERIAL PRIMARY KEY,
  zalo_user_id TEXT UNIQUE NOT NULL,
  latitude     DOUBLE PRECISION NOT NULL,
  longitude    DOUBLE PRECISION NOT NULL,
  accuracy     DOUBLE PRECISION,
  captured_at  TIMESTAMPTZ NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT chk_first_follow_locations_latitude
    CHECK (latitude BETWEEN -90 AND 90),

  CONSTRAINT chk_first_follow_locations_longitude
    CHECK (longitude BETWEEN -180 AND 180)
);

COMMIT;