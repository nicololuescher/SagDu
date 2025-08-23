from __future__ import annotations

import os
from typing import List
from datetime import date

from database_adapter import DatabaseAdapter
from datatypes import User, Ingredient, Menu, Meal, Menu_Ingredient, Meal_Ingredient

TEST_USER_ID = 424242
ING1_ID = 91001
ING2_ID = 91002
TEST_MENU_NAME = "Test Menu CRUD"

def main() -> None:
    adapter = DatabaseAdapter(
        host=os.getenv("PGHOST", "127.0.0.1"),
        username=os.getenv("PGUSER", "postgres"),
        password=os.getenv("PGPASSWORD", "postgres"),
        database=os.getenv("PGDATABASE", "sagdu"),
        port=int(os.getenv("PGPORT", "5432")),
    )

    print("Connecting…")
    assert adapter.connect(), "DB connect failed"

    try:
        # -------- cleanup from previous runs (idempotent) --------
        print("Pre-cleanup…")
        # delete any existing menu with the same name
        for m in adapter.list_menus(limit=1000):
            if m["name"] == TEST_MENU_NAME:
                adapter.delete_menu(m["id"])
        # cascade will drop meals/inventory for this user
        adapter.delete_user(TEST_USER_ID)
        adapter.delete_ingredient(ING1_ID)
        adapter.delete_ingredient(ING2_ID)

        # -------- create baseline data --------
        print("Creating ingredients…")
        rice: Ingredient = {
            "id": ING1_ID,
            "name": "Test Rice",
            "calories": 3.6,   # kcal per gram (example)
            "protein": 0.07,
            "carbs": 0.80,
            "fat": 0.01,
            "fiber": 0.01,
            "vegetarian": True,
            "vegan": True,
            "gluten_free": True,
            "lactose_free": True,
            "soy_free": True,
        }
        beans: Ingredient = {
            "id": ING2_ID,
            "name": "Test Beans",
            "calories": 3.4,
            "protein": 0.21,
            "carbs": 0.63,
            "fat": 0.01,
            "fiber": 0.16,
            "vegetarian": True,
            "vegan": True,
            "gluten_free": True,
            "lactose_free": True,
            "soy_free": True,
        }
        assert adapter.create_ingredient(rice)
        assert adapter.create_ingredient(beans)

        print("Creating user…")
        user: User = {
            "id": TEST_USER_ID,
            "name": "CRUD Tester",
            "age": 30,
            "location": "Testville",
            "vegan": False,
            "vegetarian": True,
            "gluten_free": False,
            "lactose_free": False,
            "soy_free": True,
            "inventory": {},
        }
        assert adapter.create_user(user)

        print("Stocking inventory…")
        assert adapter.upsert_user_ingredient(TEST_USER_ID, ING1_ID, 500.0)  # 500g rice
        assert adapter.upsert_user_ingredient(TEST_USER_ID, ING2_ID, 300.0)  # 300g beans

        print("Creating menu…")
        menu: Menu = {
            "id": 0,  # placeholder; DB assigns real id
            "name": TEST_MENU_NAME,
            "description": "Simple test menu",
            "type": "lunch",
            "cooking_time": 20,
            "recipe": [
                {"preparation_time": 5, "preparation_type": "prep", "description": "Rinse rice"},
                {"preparation_time": 15, "preparation_type": "cook", "description": "Boil and simmer"},
            ],
        }
        menu_id = adapter.create_menu(menu)
        assert menu_id is not None

        mi: List[Menu_Ingredient] = [
            {"menu_id": menu_id, "ingredient_id": ING1_ID, "quantity": 120.0},
            {"menu_id": menu_id, "ingredient_id": ING2_ID, "quantity": 80.0},
        ]
        assert adapter.set_menu_ingredients(menu_id, mi)

        print("Creating meal…")
        meal: Meal = {
            "id": 0,  # placeholder
            "user_id": TEST_USER_ID,
            "date": date.today(),
            "type": "lunch",
            "name": "Test Rice & Beans",
            "description": "CRUD smoke test meal",
            "people": 2,
            "menu_id": menu_id,
            "ingredients": None,
        }
        meal_id = adapter.create_meal(meal)
        assert meal_id is not None

        mitems: List[Meal_Ingredient] = [
            {"meal_id": meal_id, "ingredient_id": ING1_ID, "quantity": 120.0},
            {"meal_id": meal_id, "ingredient_id": ING2_ID, "quantity": 80.0},
        ]
        assert adapter.set_meal_ingredients(meal_id, mitems)

        # -------- reads --------
        print("Reading back entities…")
        u = adapter.get_user(TEST_USER_ID)
        assert u is not None and u["name"] == "CRUD Tester"
        inv = adapter.get_user_inventory(TEST_USER_ID)
        print("Inventory:", inv)
        assert ING1_ID in inv and ING2_ID in inv

        menus = adapter.list_menus(limit=10)
        assert any(m["id"] == menu_id for m in menus)

        m = adapter.get_meal(meal_id)
        assert m is not None and m["people"] == 2

        # -------- updates --------
        print("Updating records…")
        assert adapter.update_user(TEST_USER_ID, location="Testville 2")
        assert adapter.update_ingredient(ING1_ID, calories=3.7)
        assert adapter.update_meal(meal_id, people=3, name="Updated Meal")
        m2 = adapter.get_meal(meal_id)
        assert m2 is not None and m2["people"] == 3 and m2["name"] == "Updated Meal"

        ing1_reload = adapter.get_ingredient(ING1_ID)
        assert ing1_reload is not None and abs(ing1_reload["calories"] - 3.7) < 1e-6

        # -------- deletes --------
        print("Deleting entities…")
        assert adapter.delete_meal(meal_id)
        assert adapter.get_meal(meal_id) is None

        assert adapter.delete_menu(menu_id)
        assert adapter.get_menu(menu_id) is None

        assert adapter.delete_user(TEST_USER_ID)
        assert adapter.get_user(TEST_USER_ID) is None

        assert adapter.delete_ingredient(ING1_ID)
        assert adapter.delete_ingredient(ING2_ID)
        print("CRUD smoke test: OK ✅")

    finally:
        adapter.disconnect()
        print("Disconnected.")

if __name__ == "__main__":
    main()
