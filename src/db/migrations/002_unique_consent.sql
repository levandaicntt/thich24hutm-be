BEGIN;

-- Giữ lại 1 record/user (id lớn nhất = consent mới nhất)
DELETE FROM zalo_user_consents
WHERE id NOT IN (
  SELECT MAX(id) FROM zalo_user_consents GROUP BY zalo_user_id
);

-- Mỗi user chỉ giữ 1 dòng consent (upsert)
CREATE UNIQUE INDEX IF NOT EXISTS idx_consents_zalo_id_unique
  ON zalo_user_consents(zalo_user_id);

COMMIT;
