from __future__ import annotations

# pyright: reportUnusedFunction=false

import os
from datetime import date
from typing import Any, Dict, List, Tuple, cast

from flask import Flask, jsonify, request, Response
from werkzeug.exceptions import HTTPException

from database_adapter import DatabaseAdapter
from meal_manager import MealManager
from datetime import timedelta
from datatypes import (
    User, UserCreate, UserUpdate,
    Ingredient, IngredientCreate, IngredientUpdate,
    Menu, MenuCreate, MenuUpdate,
    Meal, MealCreate, MealUpdate,
    InventoryUpsert,
    Meal_Ingredient, Menu_Ingredient, MenuIngredientsPayload, MealIngredientsPayload
)

# ---------- helpers ----------

class APIError(Exception):
    def __init__(self, status: int, code: str, message: str):
        self.status = status
        self.code = code
        self.message = message
        super().__init__(message)

def error_response(status: int, code: str, message: str) -> Tuple[Response, int]:
    return jsonify({"error": {"code": code, "message": message}}), status

def parse_iso_date(s: str) -> date:
    try:
        return date.fromisoformat(s)
    except Exception:
        raise APIError(422, "invalid_date", f"Invalid ISO date: {s!r}")

def json_body() -> Dict[str, Any]:
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        raise APIError(400, "invalid_json", "Body must be a JSON object")
    return cast(Dict[str, Any], data)

# ---------- app ----------

def create_app() -> Flask:
    app = Flask(__name__)

    db = DatabaseAdapter(
        host=os.getenv("PGHOST", "127.0.0.1"),
        username=os.getenv("PGUSER", "postgres"),
        password=os.getenv("PGPASSWORD", "postgres"),
        database=os.getenv("PGDATABASE", "sagdu"),
        port=int(os.getenv("PGPORT", "5432")),
    )

    meal_manager = MealManager(db)

    # Errors
    @app.errorhandler(APIError)
    def handle_api_error(err: APIError):
        return error_response(err.status, err.code, err.message)

    @app.errorhandler(Exception)
    def handle_unexpected(err: Exception):
        if isinstance(err, HTTPException):
            return error_response(err.code or 500, "http_error", cast(str, err.description))
        print(f"Unexpected error: {err}")
        return error_response(500, "internal_error", "Something went wrong")

    @app.get("/healthz")
    def health() -> Tuple[Response, int]:
        try:
            db.list_users(limit=1, offset=0)
            return jsonify({"ok": True}), 200
        except Exception as e:
            print(f"/healthz error: {e}")
            return jsonify({"ok": False}), 500

    # ---------- Users ----------

    @app.get("/users")
    def list_users_endpoint() -> Tuple[Response, int]:
        limit = int(request.args.get("limit", "50"))
        offset = int(request.args.get("offset", "0"))
        users = db.list_users(limit=limit, offset=offset)
        return jsonify(users), 200

    @app.post("/users")
    def create_user_endpoint() -> Tuple[Response, int, Dict[str, str]]:
        body = cast(UserCreate, json_body())
        ok = db.create_user(cast(User, {**body, "inventory": {}}))
        if not ok:
            raise APIError(409, "conflict_or_invalid", "Could not create user")
        return jsonify({"id": body["id"]}), 201, {"Location": f"/users/{body['id']}"}

    @app.get("/users/<int:user_id>")
    def get_user_endpoint(user_id: int) -> Tuple[Response, int]:
        u = db.get_user(user_id)
        if u is None:
            raise APIError(404, "not_found", "User not found")
        return jsonify(u), 200

    @app.patch("/users/<int:user_id>")
    def update_user_endpoint(user_id: int) -> Tuple[Response, int]:
        body = cast(UserUpdate, json_body())
        ok = db.update_user(user_id, **body)
        if not ok:
            raise APIError(404, "not_found", "User not found or no changes")
        return Response(status=204), 204

    @app.delete("/users/<int:user_id>")
    def delete_user_endpoint(user_id: int) -> Tuple[str, int]:
        ok = db.delete_user(user_id)
        if not ok:
            raise APIError(404, "not_found", "User not found")
        return '', 204

    @app.get("/users/<int:user_id>/inventory")
    def get_user_inventory_endpoint(user_id: int) -> Tuple[Response, int]:
        return jsonify(db.get_user_inventory(user_id)), 200

    @app.put("/users/<int:user_id>/inventory/<int:ingredient_id>")
    def upsert_inventory_item_endpoint(user_id: int, ingredient_id: int) -> Tuple[Response | str, int]:
        body = cast(InventoryUpsert, json_body())
        qty = float(body.get("quantity", 0))
        ok = db.upsert_user_ingredient(user_id, ingredient_id, qty)
        if not ok:
            raise APIError(400, "bad_request", "Unable to upsert inventory item")
        return (jsonify({"ingredient_id": ingredient_id, "quantity": qty}), 200) if qty > 0 else ('', 204)

    # ---------- Ingredients ----------

    @app.get("/ingredients")
    def list_ingredients_endpoint() -> Tuple[Response, int]:
        limit = int(request.args.get("limit", "200"))
        offset = int(request.args.get("offset", "0"))
        return jsonify(db.list_ingredients(limit=limit, offset=offset)), 200

    @app.post("/ingredients")
    def create_ingredient_endpoint() -> Tuple[Response, int, Dict[str, str]]:
        body = cast(IngredientCreate, json_body())
        ok = db.create_ingredient(cast(Ingredient, body))
        if not ok:
            raise APIError(409, "conflict_or_invalid", "Could not create ingredient")
        return jsonify({"id": body["id"]}), 201, {"Location": f"/ingredients/{body['id']}"}

    @app.get("/ingredients/<int:ingredient_id>")
    def get_ingredient_endpoint(ingredient_id: int) -> Tuple[Response, int]:
        ing = db.get_ingredient(ingredient_id)
        if ing is None:
            raise APIError(404, "not_found", "Ingredient not found")
        return jsonify(ing), 200

    @app.patch("/ingredients/<int:ingredient_id>")
    def update_ingredient_endpoint(ingredient_id: int) -> Tuple[str, int]:
        body = cast(IngredientUpdate, json_body())
        ok = db.update_ingredient(ingredient_id, **body)
        if not ok:
            raise APIError(404, "not_found", "Ingredient not found or no changes")
        return '', 204

    @app.delete("/ingredients/<int:ingredient_id>")
    def delete_ingredient_endpoint(ingredient_id: int) -> Tuple[str, int]:
        ok = db.delete_ingredient(ingredient_id)
        if not ok:
            raise APIError(404, "not_found", "Ingredient not found")
        return '', 204

    # ---------- Menus ----------

    @app.get("/menus")
    def list_menus_endpoint() -> Tuple[Response, int]:
        limit = int(request.args.get("limit", "100"))
        offset = int(request.args.get("offset", "0"))
        return jsonify(db.list_menus(limit=limit, offset=offset)), 200

    @app.post("/menus")
    def create_menu_endpoint() -> Tuple[Response, int, Dict[str, str]]:
        body = cast(MenuCreate, json_body())
        new_id = db.create_menu(cast(Menu, body))
        if new_id is None:
            raise APIError(409, "conflict_or_invalid", "Could not create menu")
        return jsonify({"id": new_id}), 201, {"Location": f"/menus/{new_id}"}

    @app.get("/menus/<int:menu_id>")
    def get_menu_endpoint(menu_id: int) -> Tuple[Response, int]:
        m = db.get_menu(menu_id)
        if m is None:
            raise APIError(404, "not_found", "Menu not found")
        return jsonify(m), 200

    @app.patch("/menus/<int:menu_id>")
    def update_menu_endpoint(menu_id: int) -> Tuple[str, int]:
        body = cast(MenuUpdate, json_body())
        ok = db.update_menu(menu_id, **body)
        if not ok:
            raise APIError(404, "not_found", "Menu not found or no changes")
        return '', 204

    @app.delete("/menus/<int:menu_id>")
    def delete_menu_endpoint(menu_id: int) -> Tuple[str, int]:
        ok = db.delete_menu(menu_id)
        if not ok:
            raise APIError(404, "not_found", "Menu not found")
        return '', 204

    @app.get("/menus/<int:menu_id>/ingredients")
    def get_menu_ingredients_endpoint(menu_id: int) -> Tuple[Response, int]:
        return jsonify(db.get_menu_ingredients(menu_id)), 200

    @app.put("/menus/<int:menu_id>/ingredients")
    def set_menu_ingredients_endpoint(menu_id: int) -> Tuple[str, int]:
        body = cast(MenuIngredientsPayload, json_body())
        items: List[Menu_Ingredient] = [{"menu_id": menu_id, **it} for it in body.get("items", [])]
        ok = db.set_menu_ingredients(menu_id, items)
        if not ok:
            raise APIError(400, "bad_request", "Could not set menu ingredients")
        return '', 204

    # ---------- Meals (single-day only) ----------

    @app.post("/meals")
    def create_meal_endpoint() -> Tuple[Response, int, Dict[str, str]]:
        body = cast(MealCreate, json_body())
        new_id = db.create_meal(
            cast(Meal, {
                "id": 0,
                "user_id": body["user_id"],
                "date": parse_iso_date(body["date"]),
                "type": body["type"],
                "name": body["name"],
                "description": body["description"],
                "people": body["people"],
                "menu_id": body.get("menu_id"),
            })
        )
        if new_id is None:
            raise APIError(409, "conflict_or_invalid", "Could not create meal")
        return jsonify({"id": new_id}), 201, {"Location": f"/meals/{new_id}"}

    @app.get("/meals/<int:meal_id>")
    def get_meal_endpoint(meal_id: int) -> Tuple[Response, int]:
        m = db.get_meal(meal_id)
        if m is None:
            raise APIError(404, "not_found", "Meal not found")
        return jsonify(m), 200

    @app.patch("/meals/<int:meal_id>")
    def update_meal_endpoint(meal_id: int) -> Tuple[str, int]:
        body = cast(MealUpdate, json_body())
        if "date" in body and body["date"]:
            body = cast(MealUpdate, {**body, "date": parse_iso_date(body["date"])})
        ok = db.update_meal(meal_id, **body)
        if not ok:
            raise APIError(404, "not_found", "Meal not found or no changes")
        return '', 204

    @app.delete("/meals/<int:meal_id>")
    def delete_meal_endpoint(meal_id: int) -> Tuple[str, int]:
        ok = db.delete_meal(meal_id)
        if not ok:
            raise APIError(404, "not_found", "Meal not found")
        return '', 204

    @app.get("/users/<int:user_id>/meals")
    def list_meals_for_user_on_date_endpoint(user_id: int) -> Tuple[Response, int]:
        date_from = date.today()
        date_to = date.today() + timedelta(days=7)
        meals = db.list_meals_by_user(user_id, date_from, date_to)
        return jsonify(meals), 200

    @app.get("/meals/<int:meal_id>/ingredients")
    def get_meal_ingredients_endpoint(meal_id: int) -> Tuple[Response, int]:
        return jsonify(db.get_meal_ingredients(meal_id)), 200

    @app.put("/meals/<int:meal_id>/ingredients")
    def set_meal_ingredients_endpoint(meal_id: int) -> Tuple[str, int]:
        body = cast(MealIngredientsPayload, json_body())
        items: List[Meal_Ingredient] = [{"meal_id": meal_id, **it} for it in body.get("items", [])]
        ok = db.set_meal_ingredients(meal_id, items)
        if not ok:
            raise APIError(400, "bad_request", "Could not set meal ingredients")
        return '', 204

    return app


app = create_app()

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.getenv("PORT", "4000")), debug=True)
