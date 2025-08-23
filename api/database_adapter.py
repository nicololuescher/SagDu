from typing import List, Any, Tuple
from datatypes import User, Ingredient, Meal, Menu
from psycopg2 import connect, OperationalError
import json
from datetime import date

class DatabaseAdapter:
    def __init__(self, host: str, username: str, password: str, database: str, port: int = 5432) -> None:
        """
        Initialize the DatabaseAdapter with connection parameters.
        :param host: Database host address.
        :param username: Database username.
        :param password: Database password.
        :param database: Database name.
        :param port: Database port number (default is 5432 for PostgreSQL).
        """
        self.host = host
        self.username = username
        self.password = password
        self.database = database
        self.port = port
        self.connection = None
        
    def connect(self) -> bool:
        """
        Establish a connection to the PostgreSQL database.

        :return: True if connection is successful, False otherwise.
        """
        try:
            self.connection = connect(
                dbname=self.database,
                user=self.username,
                password=self.password,
                host=self.host,
                port=self.port
            )
            return True
        except OperationalError as e:
            print(f"Connection error: {e}")
            return False

    def disconnect(self) -> bool:
        """
        Close the database connection.
        :return: True if disconnection is successful, False otherwise.
        """
        try:
            if self.connection:
                self.connection.close()
                self.connection = None
            return True
        except Exception as e:
            print(f"Disconnection error: {e}")
            return False
        
    def _query(self, query: str, params: Tuple[Any, ...]) -> List[Tuple[Any,...]]|None:
        """
        Execute a SQL query and return the results.
        :param query: SQL query string.
        :param params: Tuple of parameters to pass to the SQL query.
        :return: List of tuples containing the query results, or None if an error occurs.
        """
        if not self.connection:
            if not self.connect():
                return None
            
        try:
            if not self.connection:
                print("No database connection available.")
                return None
            cursor = self.connection.cursor()
            cursor.execute(query, params)
            if query.strip().upper().startswith("SELECT"):
                result = cursor.fetchall()
                cursor.close()
                return result
            else:
                self.connection.commit()
                cursor.close()
                return []
        except Exception as e:
            raise e

    def get_user(self, user_id: int) -> User|Exception|None:
        """
        Retrieve a user by their ID.
        :param user_id: ID of the user to retrieve.
        :return: User object if found, None otherwise.
        """
        if not self.connection:
            if not self.connect():
                return Exception("Could not connect to database")
        try:
            result_user = self._query("SELECT * FROM app.user WHERE id = %s", (user_id,))
            result_inventory = self._query("SELECT ingredient_id, quantity FROM app.inventory WHERE user_id = %s", (user_id,))
            if result_user:
                row = result_user[0]
                inventory = {item[0]: float(item[1]) for item in result_inventory} if result_inventory else {}
                return User(
                    id=row[0],
                    info=row[1],
                    preferences=row[2],
                    inventory=inventory
                )
        except Exception as e:
            print(f"Error retrieving user: {e}")
            return e
        return None
    
    def create_user(self, user: User) -> bool:
        """
        Create a new user in the database.
        :param user: User object containing user details.
        :return: True if user creation is successful, False otherwise.
        """
        if not self.connection:
            if not self.connect():
                return False
        id = user.get("id", None)
        if not id:
            print("User ID is required.")
            return False
        try:
            result = self._query(
                "INSERT INTO app.user (id, info, preferences) VALUES (%s, %s, %s)",
                (id, json.dumps(user.get("info", {})), json.dumps(user.get("preferences", {})))
            )
            return result is not None
        except Exception as e:
            print(f"Error creating user: {e}")
            return False


    def update_user(self, user: User) -> bool:
        """
        Update an existing user in the database.
        :param user: User object containing updated user details.
        :return: True if user update is successful, False otherwise.
        """
        if not self.connection:
            if not self.connect():
                return False
        try:
            result = self._query(
                "UPDATE app.user SET info = %s, preferences = %s WHERE id = %s",
                (json.dumps(user.get("info", {})), json.dumps(user.get("preferences", {})), user.get("id", None))
            )
            return result is not None
        except Exception as e:
            print(f"Error updating user: {e}")
            return False
        
    def delete_user(self, user_id: int) -> bool:
        """
        Delete a user from the database by their ID.
        :param user_id: ID of the user to delete.
        :return: True if user deletion is successful, False otherwise.
        """
        if not self.connection:
            if not self.connect():
                return False
        try:
            result = self._query("DELETE FROM app.user WHERE id = %s", (user_id,))
            return result is not None
        except Exception as e:
            print(f"Error deleting user: {e}")
            return False

    def get_ingredient(self, ingredient_id: int) -> Ingredient|None:
        """
        Retrieve an ingredient by its ID.
        :param ingredient_id: ID of the ingredient to retrieve.
        :return: Ingredient object if found, None otherwise.
        """
        try:
            result = self._query("SELECT * FROM app.ingredient WHERE id = %s", (ingredient_id,))
            if result:
                row = result[0]
                return Ingredient(
                    id=row[0],
                    name=row[1],
                    unit=row[2],
                    nutrition=row[3]
                )
        except Exception as e:
            print(f"Error retrieving ingredient: {e}")
        return None

    def create_ingredient(self, ingredient: Ingredient) -> bool:
        """
        Create a new ingredient in the database.
        :param ingredient: Ingredient object containing ingredient details.
        :return: True if ingredient creation is successful, False otherwise.
        """
        try:
            result = self._query(
                "INSERT INTO app.ingredient (id, name, unit, nutrition) VALUES (%s, %s, %s, %s)",
                (ingredient.get("id", None), ingredient.get("name", ""), ingredient.get("unit", ""), json.dumps(ingredient.get("nutrition", {})))
            )
            return result is not None
        except Exception as e:
            print(f"Error creating ingredient: {e}")
            return False
    
    def update_ingredient(self, ingredient: Ingredient) -> bool:
        """
        Update an existing ingredient in the database.
        :param ingredient: Ingredient object containing updated ingredient details.
        :return: True if ingredient update is successful, False otherwise.
        """
        try:
            result = self._query(
                "UPDATE app.ingredient SET name = %s, unit = %s, nutrition = %s WHERE id = %s",
                (ingredient.get("name", ""), ingredient.get("unit", ""), json.dumps(ingredient.get("nutrition", {})), ingredient.get("id", None))
            )
            return result is not None
        except Exception as e:
            print(f"Error updating ingredient: {e}")
            return False
        
    def delete_ingredient(self, ingredient_id: int) -> bool:
        """
        Delete an ingredient from the database by its ID.
        :param ingredient_id: ID of the ingredient to delete.
        :return: True if ingredient deletion is successful, False otherwise.
        """
        try:
            result = self._query("DELETE FROM app.ingredient WHERE id = %s", (ingredient_id,))
            return result is not None
        except Exception as e:
            print(f"Error deleting ingredient: {e}")
            return False
    
    def get_meal(self, meal_id: int) -> Meal|None:
        """
        Retrieve a meal by its ID.
        :param meal_id: ID of the meal to retrieve.
        :return: Meal object if found, None otherwise.
        """
        try:
            result = self._query("SELECT * FROM app.meal WHERE id = %s", (meal_id,))
            if result:
                row = result[0]
                return Meal(
                    id=row[0],
                    user_id=row[1],
                    date=row[2],
                    type=row[3],
                    info=row[4],
                    source_menu_id=row[5]
                )
        except Exception as e:
            print(f"Error retrieving meal: {e}")
        return None

    def create_meal(self, meal: Meal) -> bool:
        """
        Create a new meal in the database.
        :param meal: Meal object containing meal details.
        :return: True if meal creation is successful, False otherwise.
        """
        try:
            result = self._query(
                "INSERT INTO app.meal (id, user_id, date, type, info, source_menu_id) VALUES (%s, %s, %s, %s, %s, %s)",
                (meal.get("id", None), meal.get("user_id", None), meal.get("date", None), meal.get("type", ""), json.dumps(meal.get("info", {})), meal.get("source_menu_id", None))
            )
            return result is not None
        except Exception as e:
            print(f"Error creating meal: {e}")
            return False
        
    def update_meal(self, meal: Meal) -> bool:
        """
        Update an existing meal in the database.
        :param meal: Meal object containing updated meal details.
        :return: True if meal update is successful, False otherwise.
        """
        try:
            result = self._query(
                "UPDATE app.meal SET user_id = %s, date = %s, type = %s, info = %s, source_menu_id = %s WHERE id = %s",
                (meal.get("user_id", None), meal.get("date", None), meal.get("type", ""), json.dumps(meal.get("info", {})), meal.get("source_menu_id", None), meal.get("id", None))
            )
            return result is not None
        except Exception as e:
            print(f"Error updating meal: {e}")
            return False
        
    def delete_meal(self, meal_id: int) -> bool:
        """
        Delete a meal from the database by its ID.
        :param meal_id: ID of the meal to delete.
        :return: True if meal deletion is successful, False otherwise.
        """
        try:
            result = self._query("DELETE FROM app.meal WHERE id = %s", (meal_id,))
            return result is not None
        except Exception as e:
            print(f"Error deleting meal: {e}")
            return False
    
    def get_menu(self, menu_id: int) -> Menu|None:
        """
        Retrieve a menu by its ID.
        :param menu_id: ID of the menu to retrieve.
        :return: Menu object if found, None otherwise.
        """
        try:
            result = self._query("SELECT * FROM app.menu WHERE id = %s", (menu_id,))
            if result:
                row = result[0]
                return Menu(
                    id=row[0],
                    name=row[1],
                    description=row[2],
                    recipe=row[3]
                )
        except Exception as e:
            print(f"Error retrieving menu: {e}")
        return None

    def create_menu(self, menu: Menu) -> bool:
        """
        Create a new menu in the database.
        :param menu: Menu object containing menu details.
        :return: True if menu creation is successful, False otherwise.
        """
        try:
            result = self._query(
                "INSERT INTO app.menu (id, name, description, recipe) VALUES (%s, %s, %s, %s)",
                (menu.get("id", None), menu.get("name", ""), menu.get("description", ""), json.dumps(menu.get("recipe", {})))
            )
            return result is not None
        except Exception as e:
            print(f"Error creating menu: {e}")
            return False
        
    def update_menu(self, menu: Menu) -> bool:
        """
        Update an existing menu in the database.
        :param menu: Menu object containing updated menu details.
        :return: True if menu update is successful, False otherwise.
        """
        try:
            result = self._query(
                "UPDATE app.menu SET name = %s, description = %s, recipe = %s WHERE id = %s",
                (menu.get("name", ""), menu.get("description", ""), json.dumps(menu.get("recipe", {})), menu.get("id", None))
            )
            return result is not None
        except Exception as e:
            print(f"Error updating menu: {e}")
            return False
        
    def delete_menu(self, menu_id: int) -> bool:
        """
        Delete a menu from the database by its ID.
        :param menu_id: ID of the menu to delete.
        :return: True if menu deletion is successful, False otherwise.
        """
        try:
            result = self._query("DELETE FROM app.menu WHERE id = %s", (menu_id,))
            return result is not None
        except Exception as e:
            print(f"Error deleting menu: {e}")
            return False

def main():
    """
    Test the DatabaseAdapter functionality.
    """
    db = DatabaseAdapter(
        host="127.0.0.1",
        username="postgres",
        password="postgres",
        database="sagdu",
        port=5432
    )
    if db.connect():
        print("user test")
        print(db.get_user(1))
        if db.create_user(User(id=2, info={"name": "Test User"}, preferences={}, inventory={})):
            db.update_user(User(id=2, info={"name": "Updated User"}, preferences={"diet": "vegan"}, inventory={}))
            print(db.get_user(2))
            db.delete_user(2)
        print("ingredient test")
        print(db.get_ingredient(1))
        if db.create_ingredient(Ingredient(id=14, name="Tomato", unit="pcs", nutrition={"calories": 18})):
            db.update_ingredient(Ingredient(id=14, name="Tomato", unit="pieces", nutrition={"calories": 20}))
            print(db.get_ingredient(14))
            db.delete_ingredient(14)
        print("meal test")
        print(db.get_meal(1))
        if db.create_meal(Meal(id=10, user_id=1, date=date.today(), type="lunch", info={"description": "Salad"}, source_menu_id=None)):
            db.update_meal(Meal(id=10, user_id=1, date=date.today(), type="dinner", info={"description": "Pasta"}, source_menu_id=None))
            print(db.get_meal(10))
            db.delete_meal(10)
        print("menu test")
        print(db.get_menu(1))
        if db.create_menu(Menu(id=4, name="Italian Dinner", description="A selection of Italian dishes", recipe={"steps": ["Boil pasta", "Prepare sauce"]})):
            db.update_menu(Menu(id=4, name="Italian Feast", description="An updated selection of Italian dishes", recipe={"steps": ["Boil pasta", "Prepare sauce", "Serve with wine"]}))
            print(db.get_menu(4))
            db.delete_menu(4)
        db.disconnect()
    else:
        print("Failed to connect to the database.")

if __name__ == "__main__":
    main()