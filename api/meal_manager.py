from database_adapter import DatabaseAdapter
from datatypes import User, ResponseMessage, Meal, Menu, Ingredient, Meal_Ingredient
from datetime import date, timedelta
from typing import List, Dict
import random

class MealManager:
    def __init__(self, db: DatabaseAdapter):
        self.db = db
    
    def get_user(self, id: int) -> ResponseMessage:
        response: User | Exception | None = self.db.get_user(id)
        print(response)
        if isinstance(response, Exception):
            return {"data": None, "status": "error", "error": str(response)}
        if response is None:
            return {"data": None, "status": "not_found", "error": "User not found"}
        return {"data": response, "status": "success", "error": None}
    
    def get_meals_of_user(self, user_id: int) -> ResponseMessage:
        date_from: date = date.today()
        date_to: date = date.today() + timedelta(days=7)
        meals: List[Meal] = self.db.list_meals_by_user(user_id, date_from, date_to)
        return {"data": meals, "status": "success", "error": None}
    
    def create_meals(self, user_id: int) -> ResponseMessage:
        meals: List[Meal] = self.get_meals_of_user(user_id)["data"]
        for day in range(7):
            meal_date = date.today() + timedelta(days=day)
            meals_on_date = [m for m in meals if m["date"] == meal_date]
            if not any(m["type"] == "breakfast" for m in meals_on_date):
                meals.append(self.create_meal_type(user_id, "breakfast", meal_date))
            if not any(m["type"] == "lunch" for m in meals_on_date):
                meals.append(self.create_meal_type(user_id, "lunch", meal_date))
            if not any(m["type"] == "dinner" for m in meals_on_date):
                meals.append(self.create_meal_type(user_id, "dinner", meal_date))
        return {"data": meals, "status": "success", "error": None}

    def create_meal_type(self, user_id: int, meal_type: str, meal_date: date) -> Meal:
        menus: List[Menu] = self.db.list_menus()
        filtered_menus = [m for m in menus if meal_type in "".join(m["type"]).lower()]
        # TODO: filter by user preferences
        random_menu: Menu = random.choice(filtered_menus) if filtered_menus else random.choice(menus)
        meal: Meal = {
            "id": 0,
            "user_id": user_id,
            "date": meal_date,
            "type": meal_type,
            "name": random_menu["name"],
            "description": random_menu["description"],
            "people": 1,
            "menu_id": random_menu["id"],
        }
        return meal
    
    def safe_meals(self, meals: List[Meal]) -> ResponseMessage:
        meals = [meal for meal in meals if meal["id"] == 0]
        for meal in meals:
            meal_id = self.db.create_meal(meal)
            if meal_id is None:
                return {"data": None, "status": "error", "error": "Failed to create meal"}
            meal["id"] = meal_id
        return {"data": {}, "status": "success", "error": None}
    
    def get_shopping_list(self, user_id: int) -> ResponseMessage:
        date_from: date = date.today()
        date_to: date = date.today() + timedelta(days=7)
        inventory = self.db.get_user_inventory(user_id)
        required_ingredients = self.get_required_ingredients(user_id, date_from, date_to)

        missing_ingredients: Dict[int, float] = {}
        for ingredient_id, required_qty in required_ingredients.items():
            current_qty = inventory.get(ingredient_id, 0.0)
            if required_qty > current_qty:
                missing_ingredients[ingredient_id] = required_qty - current_qty
        
        shopping_list: List[Dict[str, Ingredient | float]] = []
        for ingredient_id, qty in missing_ingredients.items():
            ingredient = self.db.get_ingredient(ingredient_id)
            if ingredient is None:
                continue
            shopping_list.append({"ingredient": ingredient, "quantity": qty})

        return {"data": shopping_list, "status": "success", "error": None}

    def get_required_ingredients(self, user_id: int, date_from: date, date_to: date) -> Dict[int, float]:
        meals: List[Meal] = self.db.list_meals_by_user(user_id, date_from, date_to)
        all_meal_ingredients: List[Meal_Ingredient] = []
        for meal in meals:
            all_meal_ingredients.extend(self.db.get_meal_ingredients(meal["id"]))
        required_ingredients: Dict[int, float] = {}
        for meal_ingredient in all_meal_ingredients:
            if meal_ingredient["ingredient_id"] in required_ingredients:
                required_ingredients[meal_ingredient["ingredient_id"]] += meal_ingredient["quantity"]
            else:
                required_ingredients[meal_ingredient["ingredient_id"]] = meal_ingredient["quantity"]
        return required_ingredients

def main():
    db_adapter = DatabaseAdapter(
            host="127.0.0.1",
            username="postgres",
            password="postgres",
            database="sagdu",
            port=5432
    )
    meal_manager = MealManager(db_adapter)
    user = meal_manager.get_user(100)
    print(user)

if __name__ == "__main__":
    main()