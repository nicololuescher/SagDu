SET search_path TO app, public;

---------------------------------------------------------------------
-- User
---------------------------------------------------------------------
INSERT INTO "user" (id, name, age, location,
                    vegan, vegetarian, gluten_free, lactose_free, soy_free)
VALUES
  (1, 'Demo User', 30, 'Zurich',
   FALSE, FALSE, FALSE, FALSE, FALSE)
ON CONFLICT (id) DO UPDATE
SET name = EXCLUDED.name,
    age = EXCLUDED.age,
    location = EXCLUDED.location,
    vegan = EXCLUDED.vegan,
    vegetarian = EXCLUDED.vegetarian,
    gluten_free = EXCLUDED.gluten_free,
    lactose_free = EXCLUDED.lactose_free,
    soy_free = EXCLUDED.soy_free;

---------------------------------------------------------------------
-- Ingredients (≥10) — macros are “per 100 g” for solids and “per 100 g (~ml)” for liquids.
-- Standardized to 100 g across the board for consistency (no per-piece macros).
---------------------------------------------------------------------
INSERT INTO ingredient (id, name, calories, protein, carbs, fat, fiber,
                        vegetarian, vegan, gluten_free, lactose_free, soy_free)
VALUES
  -- grains / starch (per 100 g, dry unless noted)
  (1,  'oatmeal',           389.000, 16.900, 66.300,  6.900, 10.600, TRUE, TRUE,  TRUE,  TRUE,  TRUE),
  (6,  'rice (uncooked)',   360.000,  7.100, 79.000,  0.600,  1.300, TRUE, TRUE,  TRUE,  TRUE,  TRUE),
  (12, 'pasta (dry)',       371.000, 13.000, 75.000,  1.500,  3.200, TRUE, TRUE,  FALSE, TRUE,  TRUE), -- wheat → not gluten_free

  -- fruit / veg (per 100 g)
  (2,  'banana',             89.000,  1.100, 22.800,  0.300,  2.600, TRUE, TRUE,  TRUE,  TRUE,  TRUE),
  (4,  'spinach',            23.000,  2.900,  3.600,  0.400,  2.200, TRUE, TRUE,  TRUE,  TRUE,  TRUE),
  (9,  'broccoli',           34.000,  2.800,  6.600,  0.400,  2.600, TRUE, TRUE,  TRUE,  TRUE,  TRUE),
  (13, 'tomato',             18.000,  0.900,  3.900,  0.200,  1.200, TRUE, TRUE,  TRUE,  TRUE,  TRUE),

  -- proteins / fats (per 100 g)
  (5,  'chicken breast',    165.000, 31.000,  0.000,  3.600,  0.000, FALSE, FALSE, TRUE,  TRUE,  TRUE),
  (10, 'salmon',            208.000, 20.000,  0.000, 13.000,  0.000, FALSE, FALSE, TRUE,  TRUE,  TRUE),
  (7,  'olive oil',         884.000,  0.000,  0.000,100.000,  0.000, TRUE, TRUE,  TRUE,  TRUE,  TRUE),

  -- dairy / eggs (per 100 g)
  (3,  'milk, 2%',           50.000,  3.400,  5.000,  2.000,  0.000, TRUE, FALSE, TRUE,  FALSE, TRUE),
  (11, 'yogurt, Greek 0%',   59.000, 10.000,  3.600,  0.400,  0.000, TRUE, FALSE, TRUE,  FALSE, TRUE),
  (8,  'egg',               155.000, 13.000,  1.100, 11.000,  0.000, TRUE, FALSE, TRUE,  TRUE,  TRUE)
ON CONFLICT (id) DO NOTHING;

---------------------------------------------------------------------
-- User inventory (3 items) — grams throughout
---------------------------------------------------------------------
INSERT INTO user_ingredient (user_id, ingredient_id, quantity) VALUES
  (1, 1, 500.000),   -- oatmeal (g)
  (1, 2, 600.000),   -- bananas ~5 medium ≈ 600 g total
  (1, 3,1000.000)    -- milk ~1000 g (~1000 ml)
ON CONFLICT (user_id, ingredient_id) DO UPDATE SET quantity = EXCLUDED.quantity;

---------------------------------------------------------------------
-- Menus (one per type). cooking_time is a column;
-- recipe JSON is an ARRAY of step objects (no "steps" wrapper).
---------------------------------------------------------------------
-- Breakfast
WITH ins AS (
  INSERT INTO menu (name, description, cooking_time, recipe)
  VALUES (
    'Demo Breakfast',
    'Oatmeal with banana and milk',
    10,
    jsonb_build_array(
      jsonb_build_object('preparation_time', 2, 'preparation_type','active','description','Bring milk to a simmer.'),
      jsonb_build_object('preparation_time', 5, 'preparation_type','active','description','Cook oats, stirring.'),
      jsonb_build_object('preparation_time', 3, 'preparation_type','active','description','Slice banana and top.')
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
  (1,  40.000),  -- oatmeal 40 g
  (3, 200.000),  -- milk ~200 g (~200 ml)
  (2, 118.000)   -- banana 118 g (≈ 1 medium, edible portion)
) AS x(ingredient_id, qty) ON TRUE
ON CONFLICT (menu_id, ingredient_id) DO UPDATE SET quantity = EXCLUDED.quantity;

-- Lunch
WITH ins AS (
  INSERT INTO menu (name, description, cooking_time, recipe)
  VALUES (
    'Demo Lunch',
    'Grilled chicken with rice and broccoli',
    25,
    jsonb_build_array(
      jsonb_build_object('preparation_time', 15, 'preparation_type','active','description','Cook rice.'),
      jsonb_build_object('preparation_time', 8,  'preparation_type','active','description','Grill chicken.'),
      jsonb_build_object('preparation_time', 5,  'preparation_type','active','description','Steam broccoli and drizzle oil.')
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
  (5, 150.000), -- chicken 150 g
  (6,  75.000), -- rice (dry) 75 g
  (9, 100.000), -- broccoli 100 g
  (7,  10.000)  -- olive oil 10 g
) AS x(ingredient_id, qty) ON TRUE
ON CONFLICT (menu_id, ingredient_id) DO UPDATE SET quantity = EXCLUDED.quantity;

-- Dinner
WITH ins AS (
  INSERT INTO menu (name, description, cooking_time, recipe)
  VALUES (
    'Demo Dinner',
    'Salmon with pasta and spinach',
    20,
    jsonb_build_array(
      jsonb_build_object('preparation_time', 10, 'preparation_type','active','description','Boil pasta to al dente.'),
      jsonb_build_object('preparation_time', 8,  'preparation_type','active','description','Pan-sear salmon.'),
      jsonb_build_object('preparation_time', 2,  'preparation_type','active','description','Wilt spinach with a touch of oil.')
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
  (10, 150.000), -- salmon 150 g
  (12,  75.000), -- pasta (dry) 75 g
  (4,  100.000), -- spinach 100 g
  (7,   10.000), -- olive oil 10 g
  (13, 100.000)  -- tomato 100 g
) AS x(ingredient_id, qty) ON TRUE
ON CONFLICT (menu_id, ingredient_id) DO UPDATE SET quantity = EXCLUDED.quantity;

---------------------------------------------------------------------
-- Demo meals (3 per type) for user 1 — new meal schema
---------------------------------------------------------------------
-- Breakfasts
WITH bmenu AS (SELECT id FROM menu WHERE name='Demo Breakfast')
INSERT INTO meal (user_id, date, type, name, description, people, menu_id) VALUES
  (1, DATE '2024-06-01', 'breakfast', 'Oats & Banana',            'Classic bowl',                    1, (SELECT id FROM bmenu)),
  (1, DATE '2024-06-02', 'breakfast', 'Greek Yogurt Bowl',        'Yogurt, oats, banana',            1, (SELECT id FROM bmenu)),
  (1, DATE '2024-06-03', 'breakfast', 'Eggs, Spinach & Tomato',   'Scramble with veggies',           1, (SELECT id FROM bmenu));

WITH
b1 AS (SELECT id AS meal_id FROM meal WHERE user_id=1 AND date=DATE '2024-06-01' AND type='breakfast'),
b2 AS (SELECT id AS meal_id FROM meal WHERE user_id=1 AND date=DATE '2024-06-02' AND type='breakfast'),
b3 AS (SELECT id AS meal_id FROM meal WHERE user_id=1 AND date=DATE '2024-06-03' AND type='breakfast')
INSERT INTO meal_ingredient (meal_id, ingredient_id, quantity)
SELECT * FROM (
  SELECT (SELECT meal_id FROM b1), 1,   40.000 UNION ALL  -- oats 40 g
  SELECT (SELECT meal_id FROM b1), 3,  200.000 UNION ALL  -- milk ~200 g
  SELECT (SELECT meal_id FROM b1), 2,  118.000 UNION ALL  -- banana 118 g

  SELECT (SELECT meal_id FROM b2), 11, 200.000 UNION ALL  -- yogurt 200 g
  SELECT (SELECT meal_id FROM b2), 1,   30.000 UNION ALL  -- oats 30 g
  SELECT (SELECT meal_id FROM b2), 2,  118.000 UNION ALL  -- banana 118 g

  SELECT (SELECT meal_id FROM b3), 8,  100.000 UNION ALL  -- egg ~100 g (≈2 eggs, edible portion)
  SELECT (SELECT meal_id FROM b3), 4,   80.000 UNION ALL  -- spinach 80 g
  SELECT (SELECT meal_id FROM b3), 13, 100.000            -- tomato 100 g
) s(meal_id, ingredient_id, quantity)
ON CONFLICT (meal_id, ingredient_id) DO UPDATE SET quantity = EXCLUDED.quantity;

-- Lunches
WITH lmenu AS (SELECT id FROM menu WHERE name='Demo Lunch')
INSERT INTO meal (user_id, date, type, name, description, people, menu_id) VALUES
  (1, DATE '2024-06-01', 'lunch', 'Chicken Rice Bowl', 'Grilled chicken, rice, broccoli', 1, (SELECT id FROM lmenu)),
  (1, DATE '2024-06-02', 'lunch', 'Pasta Primavera',   'Pasta with tomato and spinach',   1, (SELECT id FROM lmenu)),
  (1, DATE '2024-06-03', 'lunch', 'Salmon & Rice',     'Seared salmon with rice',         1, (SELECT id FROM lmenu));

WITH
l1 AS (SELECT id AS meal_id FROM meal WHERE user_id=1 AND date=DATE '2024-06-01' AND type='lunch'),
l2 AS (SELECT id AS meal_id FROM meal WHERE user_id=1 AND date=DATE '2024-06-02' AND type='lunch'),
l3 AS (SELECT id AS meal_id FROM meal WHERE user_id=1 AND date=DATE '2024-06-03' AND type='lunch')
INSERT INTO meal_ingredient (meal_id, ingredient_id, quantity)
SELECT * FROM (
  SELECT (SELECT meal_id FROM l1), 5, 150.000 UNION ALL
  SELECT (SELECT meal_id FROM l1), 6,  75.000 UNION ALL
  SELECT (SELECT meal_id FROM l1), 9, 100.000 UNION ALL
  SELECT (SELECT meal_id FROM l1), 7,  10.000 UNION ALL

  SELECT (SELECT meal_id FROM l2), 12, 75.000 UNION ALL
  SELECT (SELECT meal_id FROM l2), 13,150.000 UNION ALL
  SELECT (SELECT meal_id FROM l2), 4,  80.000 UNION ALL
  SELECT (SELECT meal_id FROM l2), 7,  10.000 UNION ALL

  SELECT (SELECT meal_id FROM l3), 10,150.000 UNION ALL
  SELECT (SELECT meal_id FROM l3), 6,  75.000
) s(meal_id, ingredient_id, quantity)
ON CONFLICT (meal_id, ingredient_id) DO UPDATE SET quantity = EXCLUDED.quantity;

-- Dinners
WITH dmenu AS (SELECT id FROM menu WHERE name='Demo Dinner')
INSERT INTO meal (user_id, date, type, name, description, people, menu_id) VALUES
  (1, DATE '2024-06-01', 'dinner', 'Salmon Pasta',      'Salmon with pasta & spinach', 1, (SELECT id FROM dmenu)),
  (1, DATE '2024-06-02', 'dinner', 'Chicken & Greens',  'Chicken, spinach, tomatoes',  1, (SELECT id FROM dmenu)),
  (1, DATE '2024-06-03', 'dinner', 'Yogurt & Oats',     'Light dinner bowl',           1, (SELECT id FROM dmenu));

WITH
d1 AS (SELECT id AS meal_id FROM meal WHERE user_id=1 AND date=DATE '2024-06-01' AND type='dinner'),
d2 AS (SELECT id AS meal_id FROM meal WHERE user_id=1 AND date=DATE '2024-06-02' AND type='dinner'),
d3 AS (SELECT id AS meal_id FROM meal WHERE user_id=1 AND date=DATE '2024-06-03' AND type='dinner')
INSERT INTO meal_ingredient (meal_id, ingredient_id, quantity)
SELECT * FROM (
  SELECT (SELECT meal_id FROM d1), 10,150.000 UNION ALL
  SELECT (SELECT meal_id FROM d1), 12, 75.000 UNION ALL
  SELECT (SELECT meal_id FROM d1), 4, 100.000 UNION ALL
  SELECT (SELECT meal_id FROM d1), 7,  10.000 UNION ALL

  SELECT (SELECT meal_id FROM d2), 5, 150.000 UNION ALL
  SELECT (SELECT meal_id FROM d2), 4, 100.000 UNION ALL
  SELECT (SELECT meal_id FROM d2), 13,150.000 UNION ALL
  SELECT (SELECT meal_id FROM d2), 7,  10.000 UNION ALL

  SELECT (SELECT meal_id FROM d3), 11,250.000 UNION ALL
  SELECT (SELECT meal_id FROM d3), 1,  30.000 UNION ALL
  SELECT (SELECT meal_id FROM d3), 2, 118.000
) s(meal_id, ingredient_id, quantity)
ON CONFLICT (meal_id, ingredient_id) DO UPDATE SET quantity = EXCLUDED.quantity;