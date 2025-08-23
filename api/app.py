import os
from flask import Flask
from database_adapter import DatabaseAdapter

app = Flask(__name__)
db_adapter = DatabaseAdapter(
    host=os.environ.get("DB_HOST", ""),
    username=os.environ.get("DB_USERNAME", ""),
    password=os.environ.get("DB_PASSWORD", ""),
    database=os.environ.get("DB_DATABASE", ""),
    port=int(os.environ.get("DB_PORT", 5432))
)

@app.route('/')
def index():
    return "root"

# TODO: Add endpoints for creating, updating, and deleting users, ingredients, meals, and menus.

@app.get('/user/<int:user_id>')
def get_user(user_id: int):
    user = db_adapter.get_user(user_id)
    if user:
        return user
    return {"error": "User not found"}, 404

@app.get('/ingredient/<int:ingredient_id>')
def get_ingredient(ingredient_id: int):
    ingredient = db_adapter.get_ingredient(ingredient_id)
    if ingredient:
        return ingredient
    return {"error": "Ingredient not found"}, 404

@app.get('/meal/<int:meal_id>')
def get_meal(meal_id: int):
    meal = db_adapter.get_meal(meal_id)
    if meal:
        return meal
    return {"error": "Meal not found"}, 404

@app.get('/menu/<int:menu_id>')
def get_menu(menu_id: int):
    menu = db_adapter.get_menu(menu_id)
    if menu:
        return menu
    return {"error": "Menu not found"}, 404

if __name__ == '__main__':
    app.run(debug=True)
