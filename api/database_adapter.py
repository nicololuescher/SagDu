from datatypes import User, Ingredient, Meal, Menu
from pg8000 import connect as pg8000_connect, Connection, Cursor
class DatabaseAdapter:
    def __init__(self, username: str, password: str, database: str, port: int = 5432) -> None:
        self.username = username
        self.password = password
        self.database = database
        self.port = port
        self.connection: Connection|None = None

    def connect(self) -> bool:
        try:
            self.connection = pg8000_connect(
                user=str(self.username),
                password=str(self.password),
                database=str(self.database),
                port=int(self.port)
            )
            return True
        except Exception as e:
            print(f"Connection error: {e}")
            return False

    def disconnect(self) -> bool:
        try:
            if self.connection:
                self.connection.close()
                self.connection = None
            return True
        except Exception as e:
            print(f"Disconnection error: {e}")
            return False
    
    def _run_query(self, query: str, params: tuple = ()) -> list|None:
        if not self.connection:
            print("No active database connection.")
            return None
        try:
            cursor: Cursor = self.connection.cursor()
            cursor.execute(query, params)
            results = cursor.fetchall()
            cursor.close()
            return results
        except Exception as e:
            print(f"Query error: {e}")
            return None

    def get_user(self, user_id: int) -> User|None:
        pass

    def create_user(self, user: User) -> bool:
        return True

    def update_user(self, user: User) -> bool:
        return True

    def get_ingredient(self, ingredient_id: int) -> Ingredient|None:
        pass

    def create_ingredient(self, ingredient: Ingredient) -> bool:
        return True
    
    def update_ingredient(self, ingredient: Ingredient) -> bool:
        return True
    
    def get_meal(self, meal_id: int) -> Meal|None:
        pass

    def create_meal(self, meal: Meal) -> bool:
        return True
    
    def get_menu(self, menu_id: int) -> Menu|None:
        pass

    def create_menu(self, menu: Menu) -> bool:
        return True
    
    def update_menu(self, menu: Menu) -> bool:
        return True
