from database_adapter import DatabaseAdapter
from datatypes import User, ResponseMessage, Meal, Menu
from datetime import date, timedelta
from typing import List
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
                self.create_meal_type(user_id, "breakfast", meal_date)
            if not any(m["type"] == "lunch" for m in meals_on_date):
                self.create_meal_type(user_id, "lunch", meal_date)
            if not any(m["type"] == "dinner" for m in meals_on_date):
                self.create_meal_type(user_id, "dinner", meal_date)
        return {"data": self.get_meals_of_user(user_id)["data"], "status": "success", "error": None}

    def create_meal_type(self, user_id: int, meal_type: str, meal_date: date) -> Meal:
        menus: List[Menu] = self.db.list_menus()
        filtered_menus = [m for m in menus if meal_type in m["type"].lower()]
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
        meal_id = self.db.create_meal(meal)
        meal["id"] = meal_id if meal_id is not None else 0
        return meal

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