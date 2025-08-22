-- Schema only
CREATE SCHEMA IF NOT EXISTS app AUTHORIZATION postgres;
SET search_path TO app, public;

-- Users
CREATE TABLE IF NOT EXISTS "user" (
  id           BIGINT PRIMARY KEY,
  info         JSONB NOT NULL DEFAULT '{}'::jsonb,
  preferences  JSONB NOT NULL DEFAULT '{}'::jsonb
);

-- Ingredients (unit + nutrition are the source of truth)
CREATE TABLE IF NOT EXISTS ingredient (
  id         BIGINT PRIMARY KEY,
  name       TEXT UNIQUE NOT NULL,
  unit       TEXT NOT NULL,                  -- e.g., grams, pieces, ml
  nutrition  JSONB NOT NULL                  -- {calories, protein, carbs, fat, fiber}
);

-- User inventory (unit implied by ingredient.unit)
CREATE TABLE IF NOT EXISTS inventory (
  user_id       BIGINT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  ingredient_id BIGINT NOT NULL REFERENCES ingredient(id) ON DELETE RESTRICT,
  quantity      NUMERIC(12,3) NOT NULL CHECK (quantity >= 0),
  PRIMARY KEY (user_id, ingredient_id)
);

-- Menus (backend-only templates; meals come from API later)
CREATE TABLE IF NOT EXISTS menu (
  id          BIGSERIAL PRIMARY KEY,
  name        TEXT UNIQUE NOT NULL,
  description TEXT,
  recipe      JSONB NOT NULL DEFAULT '{}'::jsonb -- {cooking_time, steps:[...]}
);

CREATE TABLE IF NOT EXISTS menu_ingredient (
  menu_id       BIGINT NOT NULL REFERENCES menu(id) ON DELETE CASCADE,
  ingredient_id BIGINT NOT NULL REFERENCES ingredient(id) ON DELETE RESTRICT,
  quantity      NUMERIC(12,3) NOT NULL CHECK (quantity >= 0),
  PRIMARY KEY (menu_id, ingredient_id)
);

-- Meals (instances written by your API)
CREATE TABLE IF NOT EXISTS meal (
  id             BIGSERIAL PRIMARY KEY,
  user_id        BIGINT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  date           DATE NOT NULL,
  type           TEXT NOT NULL,                -- breakfast/lunch/dinner/snack
  info           JSONB NOT NULL DEFAULT '{}'::jsonb,
  source_menu_id BIGINT NULL REFERENCES menu(id) ON DELETE SET NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_meal_user_date_type
  ON meal(user_id, date, type);

CREATE TABLE IF NOT EXISTS meal_ingredient (
  meal_id       BIGINT NOT NULL REFERENCES meal(id) ON DELETE CASCADE,
  ingredient_id BIGINT NOT NULL REFERENCES ingredient(id) ON DELETE RESTRICT,
  quantity      NUMERIC(12,3) NOT NULL CHECK (quantity >= 0),
  PRIMARY KEY (meal_id, ingredient_id)
);

-- Views (no duplicate column names)
CREATE OR REPLACE VIEW v_user_inventory AS
SELECT
  u.id   AS user_id,
  i.id   AS ingredient_id,
  i.name AS ingredient_name,
  inv.quantity,
  i.unit
FROM "user" u
JOIN inventory inv ON inv.user_id = u.id
JOIN ingredient i  ON i.id = inv.ingredient_id
ORDER BY u.id, i.id;

CREATE OR REPLACE VIEW v_menu_detail AS
SELECT
  mn.id   AS menu_id,
  mn.name AS menu_name,
  mn.description,
  mn.recipe,
  i.id    AS ingredient_id,
  i.name  AS ingredient_name,
  mi.quantity,
  i.unit
FROM menu mn
JOIN menu_ingredient mi ON mi.menu_id = mn.id
JOIN ingredient i       ON i.id = mi.ingredient_id
ORDER BY mn.name, i.id;

CREATE OR REPLACE VIEW v_meal_detail AS
SELECT
  m.id  AS meal_id,
  m.user_id,
  m.date,
  m.type,
  m.info,
  i.id  AS ingredient_id,
  i.name AS ingredient_name,
  mi.quantity,
  i.unit,
  m.source_menu_id
FROM meal m
JOIN meal_ingredient mi ON mi.meal_id = m.id
JOIN ingredient i       ON i.id = mi.ingredient_id
ORDER BY m.date, m.type, i.id;