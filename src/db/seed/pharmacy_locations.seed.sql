-- Pharmacy location seed — GPS thực tế (điền tay 16/09/2026)
--
-- Nguồn chi nhánh: KiotViet GET /branches (35 branches)
--   branch.id         -> kiotviet_branch_id
--   branch.branchName -> branch_name
--   branch.address    -> address
--   GPS               -> latitude / longitude (nhập thủ công, không dùng geocoding API)
--
-- Trạng thái: 31/35 đã có GPS. 4 dòng chưa có GPS được comment-out chờ bổ sung:
--   248429 (Hoàng Văn Thụ), 248393 (CTY THÍCH 24H), 248407 (KHO SỈ), 248412 (KHO TIÊN SA)
-- Chi nhánh nào chưa có GPS mà vẫn cần active thì giữ comment cho tới khi điền đủ.
--
-- Cách chạy: npm run seed (hoặc execute file này qua psql).

-- ( 24H 02 ) ĐĐKD NT THÍCH 24H 02 — 400 Quang Trung
INSERT INTO pharmacy_locations (kiotviet_branch_id, branch_name, address, latitude, longitude)
VALUES (229821, '( 24H 02)ĐĐKD NT THÍCH 24H 02', '400 Quang Trung', 13.9933825, 109.0587951);

-- ( 24H 19 ) ĐĐKD NT THÍCH 24H 19 — tt Ngô Mây, huyện Phù Cát
INSERT INTO pharmacy_locations (kiotviet_branch_id, branch_name, address, latitude, longitude)
VALUES (1000000218, '( 24H 19) ĐĐKD NT THÍCH 24H 19', 'tt Ngô Mây, huyện Phù Cát', 13.997985760974275, 109.05941833324356);

-- ( An Nhơn ) ĐĐKD NT THÍCH 24H 10 — 11 Trường Chinh
INSERT INTO pharmacy_locations (kiotviet_branch_id, branch_name, address, latitude, longitude)
VALUES (233680, '( An Nhơn) ĐĐKD NT THÍCH 24H 10', '11 Trường Chinh', 13.9171025, 109.093508);

-- ( Chương Dương ) ĐĐKD NT THÍCH 24H 25 — 62 Chương Dương
INSERT INTO pharmacy_locations (kiotviet_branch_id, branch_name, address, latitude, longitude)
VALUES (248219, '( Chương dương) ĐĐKD NT THÍCH 24H 25', '62 Chương Dương', 13.753627083138669, 109.21187508834326);

-- ( Mỹ Chánh ) ĐĐKD NT THÍCH 24H 26 — Mỹ Chánh
INSERT INTO pharmacy_locations (kiotviet_branch_id, branch_name, address, latitude, longitude)
VALUES (248111, '( Mỹ chánh) ĐĐKD NT THÍCH 24H 26', 'Mỹ Chánh', 14.158444653475343, 109.12333861473255);

-- ( Phù Cát LAO ) ĐĐKD NT THÍCH 24H 20 — Hồ Đắc Duy, Quy Nhơn
INSERT INTO pharmacy_locations (kiotviet_branch_id, branch_name, address, latitude, longitude)
VALUES (121196, '( Phù cát lao) ĐĐKD NT THÍCH 24H 20', 'Hồ Đắc Duy, Quy Nhơn', 13.7983372, 109.1694806);

-- ( Phù Mỹ ) ĐĐKD NT THÍCH 24H 08 — Phù Mỹ
INSERT INTO pharmacy_locations (kiotviet_branch_id, branch_name, address, latitude, longitude)
VALUES (1000000108, '( Phù mỹ) ĐĐKD NT THÍCH 24H 08', 'Phù Mỹ', 14.1736302, 109.0507583);

-- ( Thiện Nhân ) ĐĐKD NT THÍCH 24H 07 — 39 Phạm Ngọc Thạch
INSERT INTO pharmacy_locations (kiotviet_branch_id, branch_name, address, latitude, longitude)
VALUES (120819, '( Thiện nhân) ĐĐKD NT THÍCH 24H 07', '39 Phạm Ngọc Thạch', 13.766466032681233, 109.22459413397678);

-- ( VTYT ) CTY TNHH DP VÀ TTBYT THÍCH 24H — Kiều Huyên
-- INSERT INTO pharmacy_locations (kiotviet_branch_id, branch_name, address, latitude, longitude)
-- VALUES (225482, '( VTYT)CTY TNHH DP VÀ TTBYT THÍCH 24H', 'Kiều Huyên', 13.9650233, 109.0572086);

-- ( Bình Dương ) ĐĐKD QT THÍCH 24H 01 — 188 Võ Văn Dũng
INSERT INTO pharmacy_locations (kiotviet_branch_id, branch_name, address, latitude, longitude)
VALUES (233705, '(Bình dương) ĐĐKD QT THÍCH 24H 01', '188 Võ Văn Dũng', 14.297074124028638, 109.08037082944776);

-- -- ( Cắt Liều ) CTY TNHH DP VÀ TTBYT THÍCH 24H — Quy Nhơn
-- INSERT INTO pharmacy_locations (kiotviet_branch_id, branch_name, address, latitude, longitude)
-- VALUES (235890, '(Cắt liều)CTY TNHH DP VÀ TTBYT THÍCH 24H', 'Quy Nhơn', 13.7533848, 109.2100479);

-- ( Cát Tường ) ĐĐKD QT THÍCH 24H 13 — Chợ Cát Tường
INSERT INTO pharmacy_locations (kiotviet_branch_id, branch_name, address, latitude, longitude)
VALUES (248093, '(Cát Tường) ĐĐKD QT THÍCH 24H 13', 'Chợ Cát Tường', 13.9773409, 109.1107114);

-- ( Da Liễu ) ĐĐKD NT BÌNH DÂN 2 — Số 1 Hoàng Xuân Hãn
INSERT INTO pharmacy_locations (kiotviet_branch_id, branch_name, address, latitude, longitude)
VALUES (248274, '(Da Liễu)ĐĐKD NT BÌNH DÂN 2', 'Số 1 Hoàng Xuân Hãn', 13.750664, 109.2081454);

-- ( Diêu Trì ) ĐĐKD NT THÍCH 24H 11 — Diêu Trì
INSERT INTO pharmacy_locations (kiotviet_branch_id, branch_name, address, latitude, longitude)
VALUES (233733, '(Diêu trì) ĐĐKD NT THÍCH 24H 11', 'Diêu Trì', 13.8048111, 109.1475623);

-- ( Gò Bồi ) ĐĐKD NT THÍCH 24H 24 — Gò Bồi
INSERT INTO pharmacy_locations (kiotviet_branch_id, branch_name, address, latitude, longitude)
VALUES (235875, '(Gò bồi) ĐĐKD NT THÍCH 24H 24', 'Gò Bồi', 13.8992779, 109.2042283);

-- ( Hoa Lư ) ĐĐKD NT THÍCH 24H 27 — 267 Hoa Lư
INSERT INTO pharmacy_locations (kiotviet_branch_id, branch_name, address, latitude, longitude)
VALUES (248285, '(Hoa Lư) ĐĐKD NT THÍCH 24H 27', '267 Hoa Lư', 13.78914858174612, 109.21226716472387);

-- ( Hoàng Văn Thụ ) ĐĐKD NT THÍCH 24H 29 — Tổ 2 Khu vực 2 phường Quy Nhơn Nam [CHƯA CÓ GPS]
-- INSERT INTO pharmacy_locations (kiotviet_branch_id, branch_name, address, latitude, longitude)
-- VALUES (248429, '(Hoàng Văn Thụ) ĐĐKD NT THÍCH 24H 29', 'Tổ 2 Khu vực 2 phường Quy Nhơn Nam', <latitude>, <longitude>);

-- -- ( Kho Cũ ) CTY TNHH DP VÀ TTBYT THÍCH 24H — Quy Nhơn
-- INSERT INTO pharmacy_locations (kiotviet_branch_id, branch_name, address, latitude, longitude)
-- VALUES (225389, '(Kho cũ)CTY TNHH DP VÀ TTBYT THÍCH 24H', 'Quy Nhơn', 13.7781251, 109.2236174);

-- -- ( Kho Mới ) CTY TNHH DP VÀ TTBYT THÍCH 24H — Thôn Kiều Huyên
-- INSERT INTO pharmacy_locations (kiotviet_branch_id, branch_name, address, latitude, longitude)
-- VALUES (248242, '(Kho mới)CTY TNHH DP VÀ TTBYT THÍCH 24H', 'Thôn Kiều Huyên', 13.982721177388381, 109.08435812479605);

-- ( Lê Lợi ) ĐĐKD NT THÍCH 24H 22 — Lê Lợi
INSERT INTO pharmacy_locations (kiotviet_branch_id, branch_name, address, latitude, longitude)
VALUES (235854, '(Lê lợi) ĐĐKD NT THÍCH 24H 22', 'Lê Lợi', 13.7752344, 109.2322924);

-- -- ( Lô date ) CTY TNHH DP VÀ TTBYT THÍCH 24H — Quy Nhơn
-- INSERT INTO pharmacy_locations (kiotviet_branch_id, branch_name, address, latitude, longitude)
-- VALUES (227477, '(Lô date)CTY TNHH DP VÀ TTBYT THÍCH 24H', 'Quy Nhơn', 13.7670741, 109.2251697);

-- ( Lý Thái Tổ ) ĐĐKD NT THÍCH 24H 05 — Lý Thái Tổ
INSERT INTO pharmacy_locations (kiotviet_branch_id, branch_name, address, latitude, longitude)
VALUES (1000000109, '(Lý Thái Tổ) ĐĐKD NT THÍCH 24H 05', 'Lý Thái Tổ', 13.7574841, 109.2110591);

-- -- ( Mẹ và Bé ) CTY TNHH DP VÀ TTBYT THÍCH 24H — Thôn Kiều Huyên
-- INSERT INTO pharmacy_locations (kiotviet_branch_id, branch_name, address, latitude, longitude)
-- VALUES (247933, '(Mẹ và bé)CTY TNHH DP VÀ TTBYT THÍCH 24H', 'Thôn Kiều Huyên', 13.9650233, 109.0572086);

-- ( Mỹ Hiệp ) ĐĐKD NT THÍCH 24H 06 — Mỹ Hiệp, Phù Mỹ
INSERT INTO pharmacy_locations (kiotviet_branch_id, branch_name, address, latitude, longitude)
VALUES (247956, '(Mỹ Hiệp) ĐĐKD NT THÍCH 24H 06', 'Mỹ Hiệp, Phù Mỹ', 14.1195125, 109.0447031);

-- ( Ngô Mây ) ĐĐKD NT THÍCH 24H 04 — 46 Ngô Mây
INSERT INTO pharmacy_locations (kiotviet_branch_id, branch_name, address, latitude, longitude)
VALUES (228576, '(Ngô mây) ĐĐKD NT THÍCH 24H 04', '46 Ngô Mây', 13.7624718, 109.2185424);

-- ( Nguyễn Huệ ) ĐĐKD NT THÍCH 24H 01 — 269 Nguyễn Huệ, Quy Nhơn, Bình Định
INSERT INTO pharmacy_locations (kiotviet_branch_id, branch_name, address, latitude, longitude)
VALUES (120683, '(Nguyễn Huệ) ĐĐKD NT THÍCH 24H 01', '269 Nguyễn Huệ, Quy Nhơn, Bình Định', 13.767114065117708, 109.22692296195396);

-- ( Tây Sơn ) ĐĐKD NT THÍCH 24H 28 — TỔ 7, KHU PHỐ 8, QUY NHƠN BẮC, GIA LAI
INSERT INTO pharmacy_locations (kiotviet_branch_id, branch_name, address, latitude, longitude)
VALUES (248383, '(Tây Sơn) ĐĐKD NT THÍCH 24H 28', 'TỔ 7, KHU PHỐ 8, QUY NHƠN BẮC, GIA LAI', 13.779225383876193, 109.18436371415561);

-- 24h BÌNH DÂN — 297B Nguyễn Huệ, Quy Nhơn, Bình Định
INSERT INTO pharmacy_locations (kiotviet_branch_id, branch_name, address, latitude, longitude)
VALUES (120795, '24h Bình Dân', '297B Nguyễn Huệ, Quy Nhơn, Bình Định', 13.767407466934838, 109.22744217238733);

-- 24h BÌNH ĐỊNH — Bình Định
INSERT INTO pharmacy_locations (kiotviet_branch_id, branch_name, address, latitude, longitude)
VALUES (235855, '24h Bình Định', 'Bình Định', 13.888318413285528, 109.11906300000001);

-- 24h PHÚ TÀI — Phú Tài
INSERT INTO pharmacy_locations (kiotviet_branch_id, branch_name, address, latitude, longitude)
VALUES (235248, '24h Phú Tài', 'Phú Tài', 13.7935714, 109.1480511);

-- 24h PHƯỚC SƠN — Phước Sơn, Tuy Phước, Bình Định
INSERT INTO pharmacy_locations (kiotviet_branch_id, branch_name, address, latitude, longitude)
VALUES (124714, '24h Phước Sơn', 'Phước Sơn, Tuy Phước, Bình Định', 13.85800750620409, 109.18746127055226);

-- CTY THÍCH 24H — 62 Chương Dương [CHƯA CÓ GPS]
-- INSERT INTO pharmacy_locations (kiotviet_branch_id, branch_name, address, latitude, longitude)
-- VALUES (248393, 'CTY THÍCH 24H', '62 Chương Dương', <latitude>, <longitude>);

-- KHO MARKETING — Tầng 1 - Chung cư Phú Tài Residence Đường Lê Đức Thọ
-- INSERT INTO pharmacy_locations (kiotviet_branch_id, branch_name, address, latitude, longitude)
-- VALUES (235975, 'Kho Marketing', 'Tầng 1 - Chung cư Phú Tài Residence Đường Lê Đức Thọ', 13.7536214, 109.2118991);

-- KHO SỈ — 62 Chương Dương, Quy Nhơn, Gia Lai [CHƯA CÓ GPS]
-- INSERT INTO pharmacy_locations (kiotviet_branch_id, branch_name, address, latitude, longitude)
-- VALUES (248407, 'KHO SỈ', '62 Chương Dương, Quy Nhơn, Gia Lai', <latitude>, <longitude>);

-- KHO TIÊN SA — Thôn Kiều Huyên, xã Phù Cát, tỉnh Gia Lai [CHƯA CÓ GPS]
-- INSERT INTO pharmacy_locations (kiotviet_branch_id, branch_name, address, latitude, longitude)
-- VALUES (248412, 'KHO TIÊN SA', 'Thôn Kiều Huyên, xã Phù Cát, tỉnh Gia Lai', <latitude>, <longitude>);