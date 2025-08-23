from database_adapter import DatabaseAdapter
from datatypes import User, Ingredient, Meal, Menu, ResponseMessage

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