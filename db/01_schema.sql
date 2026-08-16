-- ARCHIVE 233 — schema
-- PostgreSQL 16
-- Owned by this file. Hibernate runs ddl-auto=validate and never writes DDL.
--
-- Conventions:
--   UUID primary keys              -- not guessable, not enumerable
--   Money as integer pesewas       -- floats cannot represent money exactly
--   timestamptz everywhere         -- a naive timestamp is ambiguous across zones
--   NOT NULL by default            -- nullable means "null is meaningful"
--   CHECK constraints for domain rules the database itself can enforce

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ---------------------------------------------------------------------------
-- users
-- ---------------------------------------------------------------------------

CREATE TABLE users (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email             text NOT NULL UNIQUE,
  password_hash     text NOT NULL,
  full_name         text NOT NULL,
  phone             text NOT NULL,
  role              text NOT NULL DEFAULT 'CUSTOMER'
                      CHECK (role IN ('CUSTOMER','ADMIN')),
  default_address   text,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_users_email ON users(email);

-- ---------------------------------------------------------------------------
-- categories and size options
-- Size is a dropdown driven by category, never free text. Free text produces
-- 'L', 'l', 'Large', 'large' within a week and the size filter stops working.
-- ---------------------------------------------------------------------------

CREATE TABLE categories (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text NOT NULL UNIQUE,
  slug          text NOT NULL UNIQUE,
  size_group    text NOT NULL
                  CHECK (size_group IN ('APPAREL','WAIST','FOOTWEAR','ONE_SIZE')),
  position      int  NOT NULL DEFAULT 0
);

CREATE TABLE size_options (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  size_group    text NOT NULL
                  CHECK (size_group IN ('APPAREL','WAIST','FOOTWEAR','ONE_SIZE')),
  label         text NOT NULL,
  position      int  NOT NULL DEFAULT 0,
  UNIQUE (size_group, label)
);

-- ---------------------------------------------------------------------------
-- products
--
-- status is OWNER INTENT (is this listing live?), not availability.
-- Availability is derived from stock_quantity minus live holds. There is
-- deliberately no is_available column and no SOLD status.
-- ---------------------------------------------------------------------------

CREATE TABLE products (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title             text NOT NULL CHECK (char_length(title) BETWEEN 5 AND 120),
  description       text,
  category_id       uuid NOT NULL REFERENCES categories(id),
  brand             text NOT NULL,
  size_label        text NOT NULL,
  condition         text NOT NULL
                      CHECK (condition IN ('NEW_WITH_TAGS','EXCELLENT','GOOD','FAIR')),
  colour            text,
  era               text,
  flaws             text,
  sizing_notes      text,
  price_pesewas     integer NOT NULL CHECK (price_pesewas > 0),
  stock_quantity    integer NOT NULL DEFAULT 1 CHECK (stock_quantity >= 0),
  status            text NOT NULL DEFAULT 'DRAFT'
                      CHECK (status IN ('DRAFT','PUBLISHED','ARCHIVED')),
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_products_status_created  ON products(status, created_at DESC);
CREATE INDEX idx_products_category        ON products(category_id);
CREATE INDEX idx_products_brand           ON products(lower(brand));
CREATE INDEX idx_products_price           ON products(price_pesewas);
CREATE INDEX idx_products_size            ON products(size_label);

CREATE TABLE product_images (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id    uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  url           text NOT NULL,
  thumb_url     text NOT NULL,
  position      int  NOT NULL DEFAULT 0,
  created_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (product_id, position)
);

CREATE INDEX idx_product_images_product ON product_images(product_id);

-- ---------------------------------------------------------------------------
-- delivery zones
-- Flat national shipping is a foreign assumption. Accra Central is not Kumasi.
-- ---------------------------------------------------------------------------

CREATE TABLE delivery_zones (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text NOT NULL UNIQUE,
  fee_pesewas   integer NOT NULL CHECK (fee_pesewas >= 0),
  active        boolean NOT NULL DEFAULT true,
  position      int NOT NULL DEFAULT 0
);

-- ---------------------------------------------------------------------------
-- cart_items — these ARE the reservation holds
--
-- No UNIQUE on product_id: stock may exceed 1, so several users may legitimately
-- hold units of the same product at once. The guarantee is arithmetic, not
-- uniqueness — see the availability view and the checkout decrement.
--
-- Expiry is evaluated at READ time. The sweeper is hygiene, not correctness:
-- if it never runs, a lapsed row still falls out of every availability sum.
-- ---------------------------------------------------------------------------

CREATE TABLE cart_items (
  user_id       uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id    uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity      integer NOT NULL DEFAULT 1 CHECK (quantity > 0 AND quantity <= 5),
  added_at      timestamptz NOT NULL DEFAULT now(),
  expires_at    timestamptz NOT NULL,
  PRIMARY KEY (user_id, product_id)
);

CREATE INDEX idx_cart_items_product_live ON cart_items(product_id, expires_at);

-- ---------------------------------------------------------------------------
-- orders
--
-- Every delivery field is a SNAPSHOT, not a join to users. A customer who edits
-- their profile address must not silently rewrite where last month's order went.
-- An order is a historical record, not a live view.
-- ---------------------------------------------------------------------------

CREATE TABLE orders (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number          text NOT NULL UNIQUE,
  user_id               uuid NOT NULL REFERENCES users(id),
  status                text NOT NULL DEFAULT 'PENDING'
                          CHECK (status IN ('PENDING','CONFIRMED','PACKED',
                                            'OUT_FOR_DELIVERY','DELIVERED','CANCELLED')),
  delivery_name         text NOT NULL,
  delivery_phone        text NOT NULL,
  delivery_address      text NOT NULL,
  delivery_zone_name    text NOT NULL,
  delivery_fee_pesewas  integer NOT NULL CHECK (delivery_fee_pesewas >= 0),
  subtotal_pesewas      integer NOT NULL CHECK (subtotal_pesewas >= 0),
  total_pesewas         integer NOT NULL CHECK (total_pesewas >= 0),
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_orders_user            ON orders(user_id, created_at DESC);
CREATE INDEX idx_orders_status_created  ON orders(status, created_at DESC);

-- price_pesewas, product_title and image_url are snapshots for the same reason.
CREATE TABLE order_items (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id          uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id        uuid NOT NULL REFERENCES products(id),
  product_title     text NOT NULL,
  product_size      text NOT NULL,
  image_url         text,
  quantity          integer NOT NULL CHECK (quantity > 0),
  price_pesewas     integer NOT NULL CHECK (price_pesewas > 0)
);

CREATE INDEX idx_order_items_order   ON order_items(order_id);
CREATE INDEX idx_order_items_product ON order_items(product_id);

CREATE TABLE order_status_history (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id      uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  from_status   text,
  to_status     text NOT NULL,
  changed_by    uuid REFERENCES users(id),
  changed_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_order_status_history_order ON order_status_history(order_id, changed_at);

-- ---------------------------------------------------------------------------
-- payments
-- provider_reference is UNIQUE so a replayed Paystack webhook cannot insert twice.
-- ---------------------------------------------------------------------------

CREATE TABLE payments (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id              uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  method                text NOT NULL
                          CHECK (method IN ('PAYSTACK','CASH_ON_DELIVERY')),
  status                text NOT NULL DEFAULT 'PENDING'
                          CHECK (status IN ('PENDING','PAID','FAILED')),
  provider_reference    text UNIQUE,
  amount_pesewas        integer NOT NULL CHECK (amount_pesewas > 0),
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_payments_order ON payments(order_id);

-- ---------------------------------------------------------------------------
-- availability — the single definition, used everywhere
-- ---------------------------------------------------------------------------

CREATE VIEW product_availability AS
SELECT
  p.id AS product_id,
  p.stock_quantity,
  COALESCE(h.held, 0) AS held_quantity,
  p.stock_quantity - COALESCE(h.held, 0) AS available_quantity
FROM products p
LEFT JOIN (
  SELECT product_id, SUM(quantity) AS held
  FROM cart_items
  WHERE expires_at > now()
  GROUP BY product_id
) h ON h.product_id = p.id;

-- ---------------------------------------------------------------------------
-- updated_at maintenance
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION touch_updated_at() RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_touch    BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
CREATE TRIGGER trg_products_touch BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
CREATE TRIGGER trg_orders_touch   BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
CREATE TRIGGER trg_payments_touch BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

-- ---------------------------------------------------------------------------
-- REFERENCE — the two statements that carry the concurrency guarantee.
-- Do not paraphrase these in application code.
--
-- Claim a hold (10-minute window; steal only a lapsed hold):
--
--   INSERT INTO cart_items (user_id, product_id, quantity, expires_at)
--   VALUES (:uid, :pid, :qty, now() + interval '10 minutes')
--   ON CONFLICT (user_id, product_id) DO UPDATE
--     SET quantity = :qty, expires_at = now() + interval '10 minutes';
--
--   Guarded by SELECT stock_quantity FROM products WHERE id = :pid FOR UPDATE
--   inside the same transaction, compared against SUM of live holds.
--
-- Decrement stock at checkout (optimistic; zero rows affected means someone
-- else won the race — roll back and return 409):
--
--   UPDATE products
--      SET stock_quantity = stock_quantity - :qty
--    WHERE id = :pid
--      AND stock_quantity >= :qty;
-- ---------------------------------------------------------------------------
