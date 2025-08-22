-- Data only
SET search_path TO app, public;

-- Base mock: user
INSERT INTO "user"(id, info, preferences)
VALUES (1, '{"name":"Demo User"}'::jsonb, '{}'::jsonb)
ON CONFLICT (id) DO UPDATE SET info = EXCLUDED.info;

-- Base mock: minimal ingredients from your original
INSERT INTO ingredient (id, name, unit, nutrition) VALUES
  (1, 'oatmeal', 'grams',  '{"calories":68,"protein":2.4,"carbs":12,"fat":1.4,"fiber":1.7}'),
  (2, 'banana',  'pieces', '{"calories":89,"protein":1.1,"carbs":23,"fat":0.3,"fiber":2.6}')
ON CONFLICT (id) DO NOTHING;

-- Extend to ≥10 ingredients (nutrition conventions noted previously)
INSERT INTO ingredient (id, name, unit, nutrition) VALUES
  (3,  'milk, 2%',          'ml',    '{"calories":42,"protein":3.4,"carbs":5.0,"fat":1.0,"fiber":0.0}'),
  (4,  'spinach',           'grams', '{"calories":23,"protein":2.9,"carbs":3.6,"fat":0.4,"fiber":2.2}'),
  (5,  'chicken breast',    'grams', '{"calories":165,"protein":31.0,"carbs":0.0,"fat":3.6,"fiber":0.0}'),
  (6,  'rice (uncooked)',   'grams', '{"calories":360,"protein":7.1,"carbs":79.0,"fat":0.6,"fiber":1.3}'),
  (7,  'olive oil',         'grams', '{"calories":884,"protein":0.0,"carbs":0.0,"fat":100.0,"fiber":0.0}'),
  (8,  'egg',               'pieces','{"calories":78,"protein":6.3,"carbs":0.6,"fat":5.3,"fiber":0.0}'),
  (9,  'broccoli',          'grams', '{"calories":34,"protein":2.8,"carbs":7.0,"fat":0.4,"fiber":2.6}'),
  (10, 'salmon',            'grams', '{"calories":208,"protein":20.0,"carbs":0.0,"fat":13.0,"fiber":0.0}'),
  (11, 'yogurt, Greek 0%',  'grams', '{"calories":59,"protein":10.0,"carbs":3.6,"fat":0.4,"fiber":0.0}'),
  (12, 'pasta (dry)',       'grams', '{"calories":371,"protein":13.0,"carbs":75.0,"fat":1.5,"fiber":3.2}'),
  (13, 'tomato',            'grams', '{"calories":18,"protein":0.9,"carbs":3.9,"fat":0.2,"fiber":1.2}')
ON CONFLICT (id) DO NOTHING;

-- Inventory (exactly three items)
INSERT INTO inventory (user_id, ingredient_id, quantity) VALUES
  (1, 1, 500),   -- oatmeal 500 g
  (1, 2, 5),     -- banana 5 pcs
  (1, 3, 1000)   -- milk 1000 ml
ON CONFLICT (user_id, ingredient_id) DO UPDATE SET quantity = EXCLUDED.quantity;

-- Menus (1 per type) + ingredients
-- Breakfast
WITH ins AS (
  INSERT INTO menu (name, description, recipe)
  VALUES (
    'Demo Breakfast',
    'Oatmeal with banana and milk',
    jsonb_build_object(
      'cooking_time', 10,
      'steps', jsonb_build_array(
        jsonb_build_object('preparation_time', 2, 'preparation_type','active','description','Bring milk to a simmer.'),
        jsonb_build_object('preparation_time', 5, 'preparation_type','active','description','Cook oats, stirring.'),
        jsonb_build_object('preparation_time', 3, 'preparation_type','active','description','Slice banana and top.')
      )
    )
  )
  ON CONFLICT (name) DO NOTHING
  RETURNING id
),
m AS (SELECT id FROM ins UNION ALL SELECT id FROM menu WHERE name='Demo Breakfast')
INSERT INTO menu_ingredient (menu_id, ingredient_id, quantity)
SELECT m.id, x.ingredient_id, x.qty
FROM m
JOIN (VALUES
  (1, 40.0::numeric),
  (3, 200.0::numeric),
  (2, 1.0::numeric)
) AS x(ingredient_id, qty) ON TRUE
ON CONFLICT (menu_id, ingredient_id) DO UPDATE SET quantity = EXCLUDED.quantity;

-- Lunch
WITH ins AS (
  INSERT INTO menu (name, description, recipe)
  VALUES (
    'Demo Lunch',
    'Grilled chicken with rice and broccoli',
    jsonb_build_object(
      'cooking_time', 25,
      'steps', jsonb_build_array(
        jsonb_build_object('preparation_time', 15, 'preparation_type','active','description','Cook rice.'),
        jsonb_build_object('preparation_time', 8,  'preparation_type','active','description','Grill chicken.'),
        jsonb_build_object('preparation_time', 5,  'preparation_type','active','description','Steam broccoli and drizzle oil.')
      )
    )
  )
  ON CONFLICT (name) DO NOTHING
  RETURNING id
),
m AS (SELECT id FROM ins UNION ALL SELECT id FROM menu WHERE name='Demo Lunch')
INSERT INTO menu_ingredient (menu_id, ingredient_id, quantity)
SELECT m.id, x.ingredient_id, x.qty
FROM m
JOIN (VALUES
  (5, 150.0::numeric),
  (6, 75.0::numeric),
  (9, 100.0::numeric),
  (7, 10.0::numeric)
) AS x(ingredient_id, qty) ON TRUE
ON CONFLICT (menu_id, ingredient_id) DO UPDATE SET quantity = EXCLUDED.quantity;

-- Dinner
WITH ins AS (
  INSERT INTO menu (name, description, recipe)
  VALUES (
    'Demo Dinner',
    'Salmon with pasta and spinach',
    jsonb_build_object(
      'cooking_time', 20,
      'steps', jsonb_build_array(
        jsonb_build_object('preparation_time', 10, 'preparation_type','active','description','Boil pasta to al dente.'),
        jsonb_build_object('preparation_time', 8,  'preparation_type','active','description','Pan-sear salmon.'),
        jsonb_build_object('preparation_time', 2,  'preparation_type','active','description','Wilt spinach with a touch of oil.')
      )
    )
  )
  ON CONFLICT (name) DO NOTHING
  RETURNING id
),
m AS (SELECT id FROM ins UNION ALL SELECT id FROM menu WHERE name='Demo Dinner')
INSERT INTO menu_ingredient (menu_id, ingredient_id, quantity)
SELECT m.id, x.ingredient_id, x.qty
FROM m
JOIN (VALUES
  (10, 150.0::numeric),
  (12, 75.0::numeric),
  (4, 100.0::numeric),
  (7, 10.0::numeric),
  (13, 100.0::numeric)
) AS x(ingredient_id, qty) ON TRUE
ON CONFLICT (menu_id, ingredient_id) DO UPDATE SET quantity = EXCLUDED.quantity;

-- Demo meals (3 per type) for user 1 (can be removed if API should create all meals)
WITH bmenu AS (SELECT id FROM menu WHERE name='Demo Breakfast')
INSERT INTO meal (user_id, date, type, info, source_menu_id) VALUES
  (1, DATE '2024-06-01', 'breakfast', jsonb_build_object('name','Oats & Banana','description','Classic bowl','people',1), (SELECT id FROM bmenu)),
  (1, DATE '2024-06-02', 'breakfast', jsonb_build_object('name','Greek Yogurt Bowl','description','Yogurt, oats, banana','people',1), (SELECT id FROM bmenu)),
  (1, DATE '2024-06-03', 'breakfast', jsonb_build_object('name','Eggs, Spinach & Tomato','description','Scramble with veggies','people',1), (SELECT id FROM bmenu))
ON CONFLICT (user_id, date, type) DO NOTHING;

WITH
b1 AS (SELECT id AS meal_id FROM meal WHERE user_id=1 AND date=DATE '2024-06-01' AND type='breakfast'),
b2 AS (SELECT id AS meal_id FROM meal WHERE user_id=1 AND date=DATE '2024-06-02' AND type='breakfast'),
b3 AS (SELECT id AS meal_id FROM meal WHERE user_id=1 AND date=DATE '2024-06-03' AND type='breakfast')
INSERT INTO meal_ingredient (meal_id, ingredient_id, quantity)
SELECT * FROM (
  SELECT (SELECT meal_id FROM b1), 1, 40.0 UNION ALL
  SELECT (SELECT meal_id FROM b1), 3, 200.0 UNION ALL
  SELECT (SELECT meal_id FROM b1), 2, 1.0  UNION ALL
  SELECT (SELECT meal_id FROM b2), 11, 200.0 UNION ALL
  SELECT (SELECT meal_id FROM b2), 1, 30.0  UNION ALL
  SELECT (SELECT meal_id FROM b2), 2, 1.0  UNION ALL
  SELECT (SELECT meal_id FROM b3), 8, 2.0  UNION ALL
  SELECT (SELECT meal_id FROM b3), 4, 80.0  UNION ALL
  SELECT (SELECT meal_id FROM b3), 13, 100.0
) s(meal_id, ingredient_id, quantity)
ON CONFLICT (meal_id, ingredient_id) DO UPDATE SET quantity = EXCLUDED.quantity;

WITH lmenu AS (SELECT id FROM menu WHERE name='Demo Lunch')
INSERT INTO meal (user_id, date, type, info, source_menu_id) VALUES
  (1, DATE '2024-06-01', 'lunch', jsonb_build_object('name','Chicken Rice Bowl','description','Grilled chicken, rice, broccoli','people',1), (SELECT id FROM lmenu)),
  (1, DATE '2024-06-02', 'lunch', jsonb_build_object('name','Pasta Primavera','description','Pasta with tomato and spinach','people',1), (SELECT id FROM lmenu)),
  (1, DATE '2024-06-03', 'lunch', jsonb_build_object('name','Salmon & Rice','description','Seared salmon with rice','people',1), (SELECT id FROM lmenu))
ON CONFLICT (user_id, date, type) DO NOTHING;

WITH
l1 AS (SELECT id AS meal_id FROM meal WHERE user_id=1 AND date=DATE '2024-06-01' AND type='lunch'),
l2 AS (SELECT id AS meal_id FROM meal WHERE user_id=1 AND date=DATE '2024-06-02' AND type='lunch'),
l3 AS (SELECT id AS meal_id FROM meal WHERE user_id=1 AND date=DATE '2024-06-03' AND type='lunch')
INSERT INTO meal_ingredient (meal_id, ingredient_id, quantity)
SELECT * FROM (
  SELECT (SELECT meal_id FROM l1), 5, 150.0 UNION ALL
  SELECT (SELECT meal_id FROM l1), 6, 75.0  UNION ALL
  SELECT (SELECT meal_id FROM l1), 9, 100.0 UNION ALL
  SELECT (SELECT meal_id FROM l1), 7, 10.0  UNION ALL
  SELECT (SELECT meal_id FROM l2), 12, 75.0 UNION ALL
  SELECT (SELECT meal_id FROM l2), 13, 150.0 UNION ALL
  SELECT (SELECT meal_id FROM l2), 4, 80.0  UNION ALL
  SELECT (SELECT meal_id FROM l2), 7, 10.0  UNION ALL
  SELECT (SELECT meal_id FROM l3), 10, 150.0 UNION ALL
  SELECT (SELECT meal_id FROM l3), 6, 75.0
) s(meal_id, ingredient_id, quantity)
ON CONFLICT (meal_id, ingredient_id) DO UPDATE SET quantity = EXCLUDED.quantity;

WITH dmenu AS (SELECT id FROM menu WHERE name='Demo Dinner')
INSERT INTO meal (user_id, date, type, info, source_menu_id) VALUES
  (1, DATE '2024-06-01', 'dinner', jsonb_build_object('name','Salmon Pasta','description','Salmon with pasta & spinach','people',1), (SELECT id FROM dmenu)),
  (1, DATE '2024-06-02', 'dinner', jsonb_build_object('name','Chicken & Greens','description','Chicken, spinach, tomatoes','people',1), (SELECT id FROM dmenu)),
  (1, DATE '2024-06-03', 'dinner', jsonb_build_object('name','Yogurt & Oats','description','Light dinner bowl','people',1), (SELECT id FROM dmenu))
ON CONFLICT (user_id, date, type) DO NOTHING;

WITH
d1 AS (SELECT id AS meal_id FROM meal WHERE user_id=1 AND date=DATE '2024-06-01' AND type='dinner'),
d2 AS (SELECT id AS meal_id FROM meal WHERE user_id=1 AND date=DATE '2024-06-02' AND type='dinner'),
d3 AS (SELECT id AS meal_id FROM meal WHERE user_id=1 AND date=DATE '2024-06-03' AND type='dinner')
INSERT INTO meal_ingredient (meal_id, ingredient_id, quantity)
SELECT * FROM (
  SELECT (SELECT meal_id FROM d1), 10, 150.0 UNION ALL
  SELECT (SELECT meal_id FROM d1), 12, 75.0  UNION ALL
  SELECT (SELECT meal_id FROM d1), 4, 100.0  UNION ALL
  SELECT (SELECT meal_id FROM d1), 7, 10.0   UNION ALL
  SELECT (SELECT meal_id FROM d2), 5, 150.0  UNION ALL
  SELECT (SELECT meal_id FROM d2), 4, 100.0  UNION ALL
  SELECT (SELECT meal_id FROM d2), 13, 150.0 UNION ALL
  SELECT (SELECT meal_id FROM d2), 7, 10.0   UNION ALL
  SELECT (SELECT meal_id FROM d3), 11, 250.0 UNION ALL
  SELECT (SELECT meal_id FROM d3), 1, 30.0   UNION ALL
  SELECT (SELECT meal_id FROM d3), 2, 1.0
) s(meal_id, ingredient_id, quantity)
ON CONFLICT (meal_id, ingredient_id) DO UPDATE SET quantity = EXCLUDED.quantity;