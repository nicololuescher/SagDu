from typing import TypedDict, Dict, Any
from datetime import date

class User(TypedDict):
    id: int
    preferences: Dict[str, Any]
    inventory: Dict[int, float]
    
class Ingredient(TypedDict):
    id: int
    name: str
    unit: str
    nutritional_info: Dict[str, float]

class Meal(TypedDict):
    id: int
    user: int
    date: date
    description: str
    servings: float
    ingredients: Dict[int, float]

class Menu(TypedDict):
    id: int
    name: str
    description: str
    ingredients: Dict[int, float]
    recipe: Dict[str, str]