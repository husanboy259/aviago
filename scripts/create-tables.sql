-- ================================================================
-- DeliDrone — Complete Database Schema
-- Safe to re-run: all CREATE TABLE use IF NOT EXISTS
-- ================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ════════════════════════════════════════════════════════════
-- AUTH DATABASE  (delidrone_auth)
-- ════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS users (
  id                UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone             VARCHAR(20)  UNIQUE,
  email             VARCHAR(150) UNIQUE,
  first_name        VARCHAR(50)  NOT NULL DEFAULT '',
  last_name         VARCHAR(50)  NOT NULL DEFAULT '',
  role              VARCHAR(20)  NOT NULL DEFAULT 'customer',
  status            VARCHAR(20)  NOT NULL DEFAULT 'active',
  avatar_url        TEXT,
  fcm_token         TEXT,
  is_phone_verified BOOLEAN      NOT NULL DEFAULT FALSE,
  created_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS otps (
  id         UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone      VARCHAR(20),
  email      VARCHAR(150),
  code       VARCHAR(6)  NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used       BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_otps_email ON otps(email);
CREATE INDEX IF NOT EXISTS idx_otps_phone ON otps(phone);

CREATE TABLE IF NOT EXISTS refresh_tokens (
  id         UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT        NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked    BOOLEAN     NOT NULL DEFAULT FALSE,
  user_agent TEXT,
  ip_address VARCHAR(50),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id);

-- ════════════════════════════════════════════════════════════
-- USER DATABASE  (delidrone_users)
-- ════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS users (
  id                UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone             VARCHAR(20)  UNIQUE,
  email             VARCHAR(150) UNIQUE,
  first_name        VARCHAR(50)  NOT NULL DEFAULT '',
  last_name         VARCHAR(50)  NOT NULL DEFAULT '',
  role              VARCHAR(20)  NOT NULL DEFAULT 'customer',
  status            VARCHAR(20)  NOT NULL DEFAULT 'active',
  avatar_url        TEXT,
  fcm_token         TEXT,
  is_phone_verified BOOLEAN      NOT NULL DEFAULT FALSE,
  created_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS addresses (
  id         UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  label      VARCHAR(50)   NOT NULL,
  street     VARCHAR(200)  NOT NULL,
  city       VARCHAR(100)  NOT NULL,
  latitude   DECIMAL(10,7) NOT NULL,
  longitude  DECIMAL(10,7) NOT NULL,
  is_default BOOLEAN       NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_addresses_user_id ON addresses(user_id);

-- ════════════════════════════════════════════════════════════
-- RESTAURANT DATABASE  (delidrone_restaurants)
-- ════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS restaurants (
  id                         UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id                   UUID          NOT NULL,
  name                       VARCHAR(100)  NOT NULL,
  description                TEXT,
  logo_url                   TEXT,
  cover_url                  TEXT,
  address                    VARCHAR(200)  NOT NULL,
  latitude                   DECIMAL(10,7) NOT NULL,
  longitude                  DECIMAL(10,7) NOT NULL,
  phone                      VARCHAR(20)   NOT NULL,
  rating                     DECIMAL(3,2)  NOT NULL DEFAULT 0,
  total_orders               INTEGER       NOT NULL DEFAULT 0,
  is_open                    BOOLEAN       NOT NULL DEFAULT FALSE,
  status                     VARCHAR(30)   NOT NULL DEFAULT 'pending_approval',
  categories                 TEXT,
  delivery_fee               DECIMAL(10,2) NOT NULL DEFAULT 0,
  estimated_delivery_minutes INTEGER       NOT NULL DEFAULT 30,
  min_order_amount           DECIMAL(10,2) NOT NULL DEFAULT 0,
  created_at                 TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at                 TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_restaurants_status    ON restaurants(status);
CREATE INDEX IF NOT EXISTS idx_restaurants_latitude  ON restaurants(latitude);
CREATE INDEX IF NOT EXISTS idx_restaurants_longitude ON restaurants(longitude);

CREATE TABLE IF NOT EXISTS menu_items (
  id                  UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id       UUID          NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  name                VARCHAR(100)  NOT NULL,
  description         TEXT,
  price               DECIMAL(10,2) NOT NULL,
  image_url           TEXT,
  category            VARCHAR(50)   NOT NULL,
  is_available        BOOLEAN       NOT NULL DEFAULT TRUE,
  preparation_minutes INTEGER       NOT NULL DEFAULT 15,
  sort_order          INTEGER       NOT NULL DEFAULT 0,
  allergens           TEXT,
  created_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_menu_items_restaurant_id ON menu_items(restaurant_id);

-- ════════════════════════════════════════════════════════════
-- ORDER DATABASE  (delidrone_orders)
-- ════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS orders (
  id                    UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id           UUID          NOT NULL,
  restaurant_id         UUID          NOT NULL,
  drone_id              UUID,
  status                VARCHAR(20)   NOT NULL DEFAULT 'pending',
  payment_status        VARCHAR(20)   NOT NULL DEFAULT 'pending',
  payment_method        VARCHAR(20)   NOT NULL,
  payment_transaction_id TEXT,
  subtotal              DECIMAL(10,2) NOT NULL,
  delivery_fee          DECIMAL(10,2) NOT NULL,
  total                 DECIMAL(10,2) NOT NULL,
  delivery_address      JSONB         NOT NULL,
  estimated_delivery_at TIMESTAMPTZ,
  delivered_at          TIMESTAMPTZ,
  notes                 TEXT,
  cancellation_reason   TEXT,
  restaurant_name       VARCHAR(100)  NOT NULL,
  created_at            TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_orders_customer_id   ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_restaurant_id ON orders(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_orders_status        ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at    ON orders(created_at DESC);

CREATE TABLE IF NOT EXISTS order_items (
  id           UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id     UUID          NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id UUID          NOT NULL,
  name         VARCHAR(100)  NOT NULL,
  price        DECIMAL(10,2) NOT NULL,
  quantity     INTEGER       NOT NULL,
  image_url    TEXT
);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);

-- ════════════════════════════════════════════════════════════
-- DRONE DATABASE  (delidrone_drones)
-- ════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS drones (
  id                UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  serial_number     VARCHAR(50)   NOT NULL UNIQUE,
  model             VARCHAR(100)  NOT NULL,
  operator_id       UUID,
  status            VARCHAR(20)   NOT NULL DEFAULT 'offline',
  battery_percent   DECIMAL(5,2)  NOT NULL DEFAULT 100,
  latitude          DECIMAL(10,7),
  longitude         DECIMAL(10,7),
  altitude          DECIMAL(8,2),
  speed             DECIMAL(6,2),
  heading           DECIMAL(6,2),
  max_payload_grams INTEGER       NOT NULL,
  max_range_km      DECIMAL(6,2)  NOT NULL,
  current_order_id  UUID,
  last_seen_at      TIMESTAMPTZ,
  home_latitude     DECIMAL(10,7),
  home_longitude    DECIMAL(10,7),
  created_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_drones_status ON drones(status);

-- ════════════════════════════════════════════════════════════
-- PAYMENT DATABASE  (delidrone_payments)
-- ════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS transactions (
  id                      UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id                UUID          NOT NULL,
  user_id                 UUID          NOT NULL,
  amount                  DECIMAL(12,2) NOT NULL,
  currency                VARCHAR(3)    NOT NULL DEFAULT 'UZS',
  method                  VARCHAR(20)   NOT NULL,
  status                  VARCHAR(20)   NOT NULL DEFAULT 'pending',
  external_id             TEXT,
  external_transaction_id TEXT,
  metadata                JSONB,
  failure_reason          TEXT,
  refunded_at             TIMESTAMPTZ,
  created_at              TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_transactions_order_id ON transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id  ON transactions(user_id);
