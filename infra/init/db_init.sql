-- Schema
CREATE SCHEMA IF NOT EXISTS app AUTHORIZATION postgres;
SET search_path TO app, public;

-- Users
CREATE TABLE IF NOT EXISTS "user" (
  id           BIGINT PRIMARY KEY,
  info         JSONB NOT NULL DEFAULT '{}'::jsonb,
  preferences  JSONB NOT NULL DEFAULT '{}'::jsonb
);

-- Ingredients (source of truth for unit + nutrition)
CREATE TABLE IF NOT EXISTS ingredient (
  id         BIGINT PRIMARY KEY,
  name       TEXT UNIQUE NOT NULL,
  unit       TEXT NOT NULL,  -- e.g., grams, pieces
  nutrition  JSONB NOT NULL  -- {calories, protein, carbs, fat, fiber}
);

-- User inventory (unit is implied by ingredient.unit)
CREATE TABLE IF NOT EXISTS inventory (
  user_id       BIGINT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  ingredient_id BIGINT NOT NULL REFERENCES ingredient(id) ON DELETE RESTRICT,
  quantity      NUMERIC(12,3) NOT NULL CHECK (quantity >= 0),
  PRIMARY KEY (user_id, ingredient_id)
);

-- Menus (backend-only templates)
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

-- Meals (instances, customized from a menu)
CREATE TABLE IF NOT EXISTS meal (
  id             BIGSERIAL PRIMARY KEY,
  user_id        BIGINT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  date           DATE NOT NULL,
  type           TEXT NOT NULL, -- breakfast/lunch/dinner/snack
  info           JSONB NOT NULL DEFAULT '{}'::jsonb, -- {name, description, people, ...}
  source_menu_id BIGINT NULL REFERENCES menu(id) ON DELETE SET NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_meal_user_date_type
  ON meal(user_id, date, type);

-- Ingredients used in a meal (unit implied by ingredient.unit)
CREATE TABLE IF NOT EXISTS meal_ingredient (
  meal_id       BIGINT NOT NULL REFERENCES meal(id) ON DELETE CASCADE,
  ingredient_id BIGINT NOT NULL REFERENCES ingredient(id) ON DELETE RESTRICT,
  quantity      NUMERIC(12,3) NOT NULL CHECK (quantity >= 0),
  PRIMARY KEY (meal_id, ingredient_id)
);

---------------------------------------------------------------------
-- Helper: generate a meal from a menu (scales by people)
---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION create_meal_from_menu(
  p_user_id BIGINT,
  p_menu_name TEXT,
  p_date DATE,
  p_type TEXT,
  p_people NUMERIC DEFAULT 1,
  p_extra_info JSONB DEFAULT '{}'::jsonb
) RETURNS BIGINT LANGUAGE plpgsql AS $$
DECLARE
  v_menu_id BIGINT;
  v_meal_id BIGINT;
  v_menu_info JSONB;
BEGIN
  SELECT id INTO v_menu_id FROM menu WHERE name = p_menu_name;
  IF v_menu_id IS NULL THEN
    RAISE EXCEPTION 'Menu "%" not found', p_menu_name;
  END IF;

  -- upsert meal shell
  INSERT INTO meal (user_id, date, type, info, source_menu_id)
  VALUES (
    p_user_id, p_date, p_type,
    jsonb_build_object('people', p_people) || p_extra_info,
    v_menu_id
  )
  ON CONFLICT (user_id, date, type) DO UPDATE
    SET info = EXCLUDED.info, source_menu_id = EXCLUDED.source_menu_id
  RETURNING id INTO v_meal_id;

  -- copy ingredients with scaling
  INSERT INTO meal_ingredient (meal_id, ingredient_id, quantity)
  SELECT v_meal_id, mi.ingredient_id, (mi.quantity * p_people)
  FROM menu_ingredient mi
  WHERE mi.menu_id = v_menu_id
  ON CONFLICT (meal_id, ingredient_id) DO UPDATE
    SET quantity = EXCLUDED.quantity;

  RETURN v_meal_id;
END $$;

---------------------------------------------------------------------
-- Seed EXACT mock data
---------------------------------------------------------------------

-- Users
INSERT INTO "user"(id, info, preferences)
VALUES (1, '{}'::jsonb, '{}'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- Ingredients
INSERT INTO ingredient (id, name, unit, nutrition) VALUES
  (1, 'oatmeal', 'grams',  '{"calories":68,"protein":2.4,"carbs":12,"fat":1.4,"fiber":1.7}'),
  (2, 'banana',  'pieces', '{"calories":89,"protein":1.1,"carbs":23,"fat":0.3,"fiber":2.6}')
ON CONFLICT (id) DO NOTHING;

-- Inventory for user 1 (links by ingredient id)
INSERT INTO inventory (user_id, ingredient_id, quantity) VALUES
  (1, 1, 40),  -- oatmeal 40 grams
  (1, 2, 5)    -- banana 5 pieces
ON CONFLICT (user_id, ingredient_id) DO UPDATE SET quantity = EXCLUDED.quantity;

-- Menu: "Healthy Start"
WITH ins AS (
  INSERT INTO menu (name, description, recipe)
  VALUES (
    'Healthy Start',
    'A nutritious breakfast menu',
    jsonb_build_object(
      'cooking_time', 10,
      'steps', jsonb_build_array(
        jsonb_build_object(
          'preparation_time', 5,
          'preparation_type', 'active',
          'description', 'Cook oatmeal with water or milk.'
        )
      )
    )
  )
  ON CONFLICT (name) DO NOTHING
  RETURNING id
),
menu_row AS (
  SELECT id FROM ins
  UNION ALL
  SELECT id FROM menu WHERE name = 'Healthy Start'
)
INSERT INTO menu_ingredient (menu_id, ingredient_id, quantity)
SELECT menu_row.id, t.ingredient_id, t.qty
FROM menu_row
JOIN (VALUES
  (1, 40.0::numeric),  -- oatmeal
  (2, 1.0::numeric)    -- banana
) AS t(ingredient_id, qty) ON TRUE
ON CONFLICT (menu_id, ingredient_id) DO UPDATE SET quantity = EXCLUDED.quantity;

-- Meal for 2024-06-01, user 1, from the menu, customized info
SELECT create_meal_from_menu(
  p_user_id := 1,
  p_menu_name := 'Healthy Start',
  p_date := DATE '2024-06-01',
  p_type := 'breakfast',
  p_people := 1,
  p_extra_info := jsonb_build_object(
    'name','Oatmeal with Banana',
    'description','A healthy breakfast option'
  )
);

---------------------------------------------------------------------
-- Convenience views
---------------------------------------------------------------------
CREATE OR REPLACE VIEW v_user_inventory AS
SELECT u.id AS user_id, i.id AS ingredient_id, i.name, inv.quantity, i.unit
FROM "user" u
JOIN inventory inv ON inv.user_id = u.id
JOIN ingredient i ON i.id = inv.ingredient_id
ORDER BY u.id, i.id;

CREATE OR REPLACE VIEW v_meal_detail AS
SELECT m.id AS meal_id, m.user_id, m.date, m.type, m.info,
       i.id AS ingredient_id, i.name, mi.quantity, i.unit,
       m.source_menu_id
FROM meal m
JOIN meal_ingredient mi ON mi.meal_id = m.id
JOIN ingredient i ON i.id = mi.ingredient_id
ORDER BY m.date, m.type, i.id;

CREATE OR REPLACE VIEW v_menu_detail AS
SELECT mn.id AS menu_id, mn.name, mn.description, mn.recipe,
       i.id AS ingredient_id, i.name, mi.quantity, i.unit
FROM menu mn
JOIN menu_ingredient mi ON mi.menu_id = mn.id
JOIN ingredient i ON i.id = mi.ingredient_id
ORDER BY mn.name, i.id;