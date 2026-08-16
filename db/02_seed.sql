-- ARCHIVE 233 — seed data
-- Categories, size options, delivery zones, and one admin account.
-- Idempotent: safe to re-run, existing rows are left untouched.

INSERT INTO categories (name, slug, size_group, position) VALUES
  ('Jackets',  'jackets',  'APPAREL',  1),
  ('Shirts',   'shirts',   'APPAREL',  2),
  ('Denim',    'denim',    'WAIST',    3),
  ('Pants',    'pants',    'WAIST',    4),
  ('Footwear', 'footwear', 'FOOTWEAR', 5)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO size_options (size_group, label, position) VALUES
  ('APPAREL', 'S', 1),
  ('APPAREL', 'M', 2),
  ('APPAREL', 'L', 3),
  ('APPAREL', 'XL', 4),
  ('WAIST', '28X30', 1),
  ('WAIST', '30X30', 2),
  ('WAIST', '30X32', 3),
  ('WAIST', '32X30', 4),
  ('WAIST', '32X32', 5),
  ('WAIST', '34X30', 6),
  ('WAIST', '34X32', 7),
  ('WAIST', '36X32', 8),
  ('WAIST', '38X32', 9),
  ('FOOTWEAR', 'US 8', 1),
  ('FOOTWEAR', 'US 9', 2),
  ('FOOTWEAR', 'US 10', 3),
  ('FOOTWEAR', 'US 11', 4),
  ('ONE_SIZE', 'One size', 1)
ON CONFLICT (size_group, label) DO NOTHING;

INSERT INTO delivery_zones (name, fee_pesewas, active, position) VALUES
  ('Accra Central', 2000, true, 1),
  ('East Legon',     3000, true, 2),
  ('Tema',           4000, true, 3),
  ('Madina',         3000, true, 4),
  ('Kumasi',         6000, true, 5)
ON CONFLICT (name) DO NOTHING;

-- Admin login: admin@archive233.test — password shared with the project owner
-- out-of-band (see chat), never committed here or anywhere else.
INSERT INTO users (email, password_hash, full_name, phone, role) VALUES
  ('admin@archive233.test', '$2a$10$rjy/Y4yRmieeLCcOajxZWuJhnGrltqUuLetMhH/aeul1Mws2tzba.', 'Archive 233 Admin', '020 000 0000', 'ADMIN')
ON CONFLICT (email) DO NOTHING;
