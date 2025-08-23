from typing import TypedDict, Dict, Any, List, Optional
from datetime import date

class User(TypedDict):
    id: int
    name: str
    age: int
    location: str
    vegan: bool
    vegetarian: bool
    gluten_free: bool
    lactose_free: bool
    soy_free: bool
    inventory: Optional[Dict[str, float]]

class User_Ingredient(TypedDict):
    user_id: int
    ingredient_id: int
    quantity: float
    
class Ingredient(TypedDict):
    id: int
    name: str
    calories: float
    protein: float
    carbs: float
    fat: float
    fiber: float
    vegetarian: bool
    vegan: bool
    gluten_free: bool
    lactose_free: bool
    soy_free: bool

class Meal(TypedDict):
    id: int
    user_id: int
    date: date
    type: str
    name: str
    description: str
    people: int
    menu_id: int

class Meal_Ingredient(TypedDict):
    meal_id: int
    ingredient_id: int
    quantity: float

class Menu(TypedDict):
    id: int
    name: str
    description: str
    cooking_time: int
    recipe: List[Dict[str, Any]]

class Menu_Ingredient(TypedDict):
    menu_id: int
    ingredient_id: int
    quantity: float

class ResponseMessage(TypedDict):
    data: Any
    status: str
    error: Optional[str]