-- Schema only
CREATE SCHEMA IF NOT EXISTS app AUTHORIZATION postgres;
SET search_path TO app, public;

-- Users
CREATE TABLE IF NOT EXISTS "user" (
  id           BIGINT PRIMARY KEY,
  name         TEXT NOT NULL,
  age          INTEGER NOT NULL,
  location     TEXT NOT NULL,
  vegan        BOOLEAN NOT NULL DEFAULT FALSE,
  vegetarian   BOOLEAN NOT NULL DEFAULT FALSE,
  gluten_free  BOOLEAN NOT NULL DEFAULT FALSE,
  lactose_free BOOLEAN NOT NULL DEFAULT FALSE,
  soy_free     BOOLEAN NOT NULL DEFAULT FALSE
);

-- Ingredients (unit + nutrition are the source of truth)
CREATE TABLE IF NOT EXISTS ingredient (
  id         BIGINT PRIMARY KEY,
  name       TEXT UNIQUE NOT NULL,
  calories   NUMERIC(8,3) NOT NULL,         -- per unit (e.g., per gram)
  protein    NUMERIC(8,3) NOT NULL,
  carbs      NUMERIC(8,3) NOT NULL,
  fat        NUMERIC(8,3) NOT NULL,
  fiber      NUMERIC(8,3) NOT NULL,
  vegetarian BOOLEAN NOT NULL DEFAULT FALSE,
  vegan      BOOLEAN NOT NULL DEFAULT FALSE,
  gluten_free BOOLEAN NOT NULL DEFAULT FALSE,
  lactose_free BOOLEAN NOT NULL DEFAULT FALSE,
  soy_free   BOOLEAN NOT NULL DEFAULT FALSE
);

-- Menus (backend-only templates; meals come from API later)
CREATE TABLE IF NOT EXISTS menu (
  id            BIGSERIAL PRIMARY KEY,
  name          TEXT UNIQUE NOT NULL,
  description   TEXT,
  cooking_time  INTEGER NOT NULL,
  recipe        JSONB NOT NULL DEFAULT '{}'::jsonb -- {{preparation_time, preparation_type, description}, ...}
);

-- Meals (instances written by your API)
CREATE TABLE IF NOT EXISTS meal (
  id            BIGSERIAL PRIMARY KEY,
  user_id       BIGINT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  date          DATE NOT NULL,
  type          TEXT NOT NULL,        
  name          TEXT NOT NULL,
  description   TEXT NOT NULL,
  people        INTEGER NOT NULL CHECK (people > 0),
  menu_id       BIGINT NULL REFERENCES menu(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS user_ingredient (
  user_id       BIGINT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  ingredient_id BIGINT NOT NULL REFERENCES ingredient(id) ON DELETE RESTRICT,
  quantity      NUMERIC(12,3) NOT NULL CHECK (quantity >= 0),
  PRIMARY KEY (user_id, ingredient_id)
);

CREATE TABLE IF NOT EXISTS menu_ingredient (
  menu_id       BIGINT NOT NULL REFERENCES menu(id) ON DELETE CASCADE,
  ingredient_id BIGINT NOT NULL REFERENCES ingredient(id) ON DELETE RESTRICT,
  quantity      NUMERIC(12,3) NOT NULL CHECK (quantity >= 0),
  PRIMARY KEY (menu_id, ingredient_id)
);

CREATE TABLE IF NOT EXISTS meal_ingredient (
  meal_id       BIGINT NOT NULL REFERENCES meal(id) ON DELETE CASCADE,
  ingredient_id BIGINT NOT NULL REFERENCES ingredient(id) ON DELETE RESTRICT,
  quantity      NUMERIC(12,3) NOT NULL CHECK (quantity >= 0),
  PRIMARY KEY (meal_id, ingredient_id)
);
