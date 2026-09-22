BEGIN;

ALTER TABLE miniapp_users
  ADD COLUMN IF NOT EXISTS oa_user_id TEXT NULL;

CREATE INDEX IF NOT EXISTS idx_zalo_users_oa_user_id
  ON miniapp_users(oa_user_id);

COMMIT;
