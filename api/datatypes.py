from typing import TypedDict, Dict, Any
from datetime import date

class User(TypedDict):
    id: int
    info: Dict[str, Any]
    preferences: Dict[str, Any]
    inventory: Dict[int, float]
    
class Ingredient(TypedDict):
    id: int
    name: str
    unit: str
    nutrition: Dict[str, float]

class Meal(TypedDict):
    id: int
    user_id: int
    date: date
    type: str
    info: Dict[str, Any]
    source_menu_id: int | None

class Menu(TypedDict):
    id: int
    name: str
    description: str
    recipe: Dict[str, Any]