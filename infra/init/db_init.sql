-- Schema
CREATE SCHEMA IF NOT EXISTS app AUTHORIZATION postgres;
SET search_path TO app, public;

-- Users
CREATE TABLE IF NOT EXISTS "user" (
  id            BIGINT PRIMARY KEY,
  info          JSONB NOT NULL DEFAULT '{}'::jsonb,
  preferences   JSONB NOT NULL DEFAULT '{}'::jsonb
);

-- Ingredients master data
CREATE TABLE IF NOT EXISTS ingredient (
  id          BIGINT PRIMARY KEY,
  name        TEXT UNIQUE NOT NULL,
  unit        TEXT NOT NULL,              -- e.g., grams, pieces
  nutrition   JSONB NOT NULL              -- {calories, protein, carbs, fat, fiber}
);

-- User inventory (references ingredients)
CREATE TABLE IF NOT EXISTS inventory (
  user_id       BIGINT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  ingredient_id BIGINT NOT NULL REFERENCES ingredient(id) ON DELETE RESTRICT,
  quantity      NUMERIC(12,3) NOT NULL,
  unit          TEXT NOT NULL,
  PRIMARY KEY (user_id, ingredient_id)
);

-- Meals eaten by users
CREATE TABLE IF NOT EXISTS meal (
  id        BIGSERIAL PRIMARY KEY,
  user_id   BIGINT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  date      DATE NOT NULL,
  type      TEXT NOT NULL,                -- e.g., breakfast/lunch/dinner/snack
  info      JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_meal_user_date_type
  ON meal(user_id, date, type);

-- Ingredients used per meal
CREATE TABLE IF NOT EXISTS meal_ingredient (
  meal_id       BIGINT NOT NULL REFERENCES meal(id) ON DELETE CASCADE,
  ingredient_id BIGINT NOT NULL REFERENCES ingredient(id) ON DELETE RESTRICT,
  quantity      NUMERIC(12,3) NOT NULL,
  PRIMARY KEY (meal_id, ingredient_id)
);

-- Menus (templates)
CREATE TABLE IF NOT EXISTS menu (
  id          BIGSERIAL PRIMARY KEY,
  name        TEXT UNIQUE NOT NULL,
  description TEXT,
  recipe      JSONB NOT NULL DEFAULT '{}'::jsonb   -- {cooking_time, steps:[{preparation_time, preparation_type, description}]}
);

CREATE TABLE IF NOT EXISTS menu_ingredient (
  menu_id       BIGINT NOT NULL REFERENCES menu(id) ON DELETE CASCADE,
  ingredient_id BIGINT NOT NULL REFERENCES ingredient(id) ON DELETE RESTRICT,
  quantity      NUMERIC(12,3) NOT NULL,
  PRIMARY KEY (menu_id, ingredient_id)
);

---------------------------------------------------------------------
-- Seed EXACT demo data
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

-- Inventory for user 1
INSERT INTO inventory (user_id, ingredient_id, quantity, unit) VALUES
  (1, 1, 2, 'grams'),   -- oatmeal
  (1, 2, 5, 'pieces')   -- banana
ON CONFLICT (user_id, ingredient_id) DO NOTHING;

-- Meal for user 1 on 2024-06-01 (breakfast)
-- info: { name, description, people }
WITH m AS (
  INSERT INTO meal (user_id, date, type, info)
  VALUES (1, DATE '2024-06-01', 'breakfast',
          jsonb_build_object(
            'name','Oatmeal with Banana',
            'description','A healthy breakfast option',
            'people',1
          ))
  ON CONFLICT (user_id, date, type) DO NOTHING
  RETURNING id
)
-- ensure we get the meal id on re-runs too
, m2 AS (
  SELECT id FROM m
  UNION ALL
  SELECT id FROM meal WHERE user_id = 1 AND date = DATE '2024-06-01' AND type = 'breakfast'
)
INSERT INTO meal_ingredient (meal_id, ingredient_id, quantity)
SELECT m2.id, x.ingredient_id, x.qty
FROM m2
JOIN (VALUES
  (1, 40.0::numeric),   -- oatmeal 40
  (2, 1.0::numeric)     -- banana 1
) AS x(ingredient_id, qty) ON TRUE
ON CONFLICT (meal_id, ingredient_id) DO NOTHING;

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
  (1, 40.0::numeric),  -- oatmeal 40
  (2, 1.0::numeric)    -- banana 1
) AS t(ingredient_id, qty) ON TRUE
ON CONFLICT (menu_id, ingredient_id) DO NOTHING;

---------------------------------------------------------------------
-- Convenience views for quick checks
---------------------------------------------------------------------
CREATE OR REPLACE VIEW v_user_inventory AS
SELECT u.id AS user_id, i.name AS ingredient, inv.quantity, inv.unit
FROM "user" u
JOIN inventory inv ON inv.user_id = u.id
JOIN ingredient i ON i.id = inv.ingredient_id
ORDER BY u.id, i.name;

CREATE OR REPLACE VIEW v_meal_detail AS
SELECT m.id AS meal_id, m.user_id, m.date, m.type, m.info,
       i.name AS ingredient, mi.quantity
FROM meal m
JOIN meal_ingredient mi ON mi.meal_id = m.id
JOIN ingredient i ON i.id = mi.ingredient_id
ORDER BY m.date, m.type, i.name;

CREATE OR REPLACE VIEW v_menu_detail AS
SELECT mn.id AS menu_id, mn.name, mn.description, mn.recipe,
       i.name AS ingredient, mi.quantity
FROM menu mn
JOIN menu_ingredient mi ON mi.menu_id = mn.id
JOIN ingredient i ON i.id = mi.ingredient_id
ORDER BY mn.name, i.name;