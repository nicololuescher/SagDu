from __future__ import annotations

from typing import Any, Dict, List, Optional, Sequence, Tuple, cast
from datetime import date
import json

from psycopg2 import connect, OperationalError
from psycopg2.extensions import connection as PGConnection

from datatypes import (
    User,
    Ingredient,
    Meal,
    Menu,
    Menu_Ingredient,
    Meal_Ingredient,
)


Row = Tuple[Any, ...]
Rows = List[Row]


class DatabaseAdapter:
    def __init__(
        self, host: str, username: str, password: str, database: str, port: int = 5432
    ) -> None:
        self.host: str = host
        self.username: str = username
        self.password: str = password
        self.database: str = database
        self.port: int = port
        self.connection: Optional[PGConnection] = None

    def connect(self) -> bool:
        try:
            self.connection = connect(
                dbname=self.database,
                user=self.username,
                password=self.password,
                host=self.host,
                port=self.port,
            )
            return True
        except OperationalError as e:
            print(f"Connection error: {e}")
            self.connection = None
            return False

    def disconnect(self) -> bool:
        try:
            if self.connection is not None:
                self.connection.close()
                self.connection = None
            return True
        except Exception as e:
            print(f"Disconnection error: {e}")
            return False

    # --- low-level helpers -------------------------------------------------

    def _ensure_connection(self) -> PGConnection:
        if self.connection is None and not self.connect():
            raise RuntimeError("Could not connect to database")
        assert self.connection is not None
        return self.connection

    def _query(self, query: str, params: Sequence[Any]) -> Rows:
        """
        Run any SQL. If the statement produces a result set (e.g., SELECT or
        INSERT/UPDATE/DELETE ... RETURNING), fetch and return those rows.
        For DML, commit the transaction.
        """
        conn = self._ensure_connection()
        with conn.cursor() as cur:
            cur.execute(query, tuple(params))
            has_rows = cur.description is not None
            rows: Rows = cur.fetchall() if has_rows else []

            # Commit for DML (anything that's not a plain SELECT), even if it RETURNs rows
            if not query.lstrip().upper().startswith("SELECT"):
                conn.commit()

            return rows

    def _query_one(self, query: str, params: Sequence[Any]) -> Optional[Row]:
        rows = self._query(query, params)
        return rows[0] if rows else None

    def _execute(self, query: str, params: Sequence[Any]) -> bool:
        self._query(query, params)
        return True

    # --- Users --------------------------------------------------------------

    def get_user(self, user_id: int) -> Optional[User]:
        result_user = self._query(
            """
            SELECT
                id,
                name,
                age,
                location,
                vegan,
                vegetarian,
                gluten_free,
                lactose_free,
                soy_free
            FROM app."user"
            WHERE id = %s
            """,
            (user_id,),
        )

        if not result_user:
            return None

        result_inventory = self._query(
            """
            SELECT
              i.name      AS ingredient_name,
              ui.quantity AS ingredient_quantity
            FROM app.user_ingredient AS ui
            JOIN app.ingredient AS i
              ON i.id = ui.ingredient_id
            WHERE ui.user_id = %s
              AND ui.quantity > 0
            ORDER BY i.name;
            """,
            (user_id,),
        )

        row = result_user[0]
        inventory: Dict[str, float] = {
            cast(str, item[0]): float(item[1]) for item in result_inventory
        }
        return {
            "id": cast(int, row[0]),
            "name": cast(str, row[1]),
            "age": cast(int, row[2]),
            "location": cast(str, row[3]),
            "vegan": cast(bool, row[4]),
            "vegetarian": cast(bool, row[5]),
            "gluten_free": cast(bool, row[6]),
            "lactose_free": cast(bool, row[7]),
            "soy_free": cast(bool, row[8]),
            "inventory": inventory,
        }

    def list_users(self, limit: int = 100, offset: int = 0) -> List[User]:
        rows = self._query(
            """
            SELECT id, name, age, location, vegan, vegetarian,
                   gluten_free, lactose_free, soy_free
            FROM app."user"
            ORDER BY id
            LIMIT %s OFFSET %s
            """,
            (limit, offset),
        )
        return [
            {
                "id": cast(int, r[0]),
                "name": cast(str, r[1]),
                "age": cast(int, r[2]),
                "location": cast(str, r[3]),
                "vegan": cast(bool, r[4]),
                "vegetarian": cast(bool, r[5]),
                "gluten_free": cast(bool, r[6]),
                "lactose_free": cast(bool, r[7]),
                "soy_free": cast(bool, r[8]),
                "inventory": None,
            }
            for r in rows
        ]

    def create_user(self, user: User) -> bool:
        return self._execute(
            """
            INSERT INTO app."user"
            (id, name, age, location, vegan, vegetarian,
             gluten_free, lactose_free, soy_free)
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s)
            """,
            (
                user["id"],
                user["name"],
                user["age"],
                user["location"],
                user["vegan"],
                user["vegetarian"],
                user["gluten_free"],
                user["lactose_free"],
                user["soy_free"],
            ),
        )

    def update_user(self, user_id: int, **fields: Any) -> bool:
        allowed = {
            "name",
            "age",
            "location",
            "vegan",
            "vegetarian",
            "gluten_free",
            "lactose_free",
            "soy_free",
        }
        cols: List[str] = []
        vals: List[Any] = []
        for k, v in fields.items():
            if k in allowed:
                cols.append(f"{k} = %s")
                vals.append(v)
        if not cols:
            return True
        vals.append(user_id)
        return self._execute(
            f'UPDATE app."user" SET {", ".join(cols)} WHERE id = %s', tuple(vals)
        )

    def delete_user(self, user_id: int) -> bool:
        return self._execute('DELETE FROM app."user" WHERE id = %s', (user_id,))

    # Inventory (user_ingredient)

    def upsert_user_ingredient(
        self, user_id: int, ingredient_id: int, quantity: float
    ) -> bool:
        if quantity < 0:
            raise ValueError("quantity must be >= 0")
        if quantity == 0:
            return self._execute(
                "DELETE FROM app.user_ingredient WHERE user_id=%s AND ingredient_id=%s",
                (user_id, ingredient_id),
            )
        return self._execute(
            """
            INSERT INTO app.user_ingredient(user_id, ingredient_id, quantity)
            VALUES (%s,%s,%s)
            ON CONFLICT (user_id, ingredient_id)
            DO UPDATE SET quantity = EXCLUDED.quantity
            """,
            (user_id, ingredient_id, quantity),
        )

    def get_user_inventory(self, user_id: int) -> Dict[int, float]:
        rows = self._query(
            """
            SELECT ingredient_id, quantity
            FROM app.user_ingredient
            WHERE user_id = %s AND quantity > 0
            ORDER BY ingredient_id
            """,
            (user_id,),
        )
        return {int(r[0]): float(r[1]) for r in rows}

    # --- Ingredients -------------------------------------------------------

    def get_ingredient(self, ingredient_id: int) -> Optional[Ingredient]:
        row = self._query_one(
            """
            SELECT id, name, calories, protein, carbs, fat, fiber,
                   vegetarian, vegan, gluten_free, lactose_free, soy_free
            FROM app.ingredient
            WHERE id = %s
            """,
            (ingredient_id,),
        )
        if row is None:
            return None
        return {
            "id": cast(int, row[0]),
            "name": cast(str, row[1]),
            "calories": float(row[2]),
            "protein": float(row[3]),
            "carbs": float(row[4]),
            "fat": float(row[5]),
            "fiber": float(row[6]),
            "vegetarian": cast(bool, row[7]),
            "vegan": cast(bool, row[8]),
            "gluten_free": cast(bool, row[9]),
            "lactose_free": cast(bool, row[10]),
            "soy_free": cast(bool, row[11]),
        }

    def get_ingredient_by_name(self, name: str) -> Optional[Ingredient]:
        row = self._query_one(
            """
            SELECT id, name, calories, protein, carbs, fat, fiber,
                   vegetarian, vegan, gluten_free, lactose_free, soy_free
            FROM app.ingredient
            WHERE name = %s
            """,
            (name,),
        )
        if row is None:
            return None
        return self.get_ingredient(cast(int, row[0]))

    def list_ingredients(self, limit: int = 200, offset: int = 0) -> List[Ingredient]:
        rows = self._query(
            """
            SELECT id, name, calories, protein, carbs, fat, fiber,
                   vegetarian, vegan, gluten_free, lactose_free, soy_free
            FROM app.ingredient
            ORDER BY name
            LIMIT %s OFFSET %s
            """,
            (limit, offset),
        )
        return [
            {
                "id": cast(int, r[0]),
                "name": cast(str, r[1]),
                "calories": float(r[2]),
                "protein": float(r[3]),
                "carbs": float(r[4]),
                "fat": float(r[5]),
                "fiber": float(r[6]),
                "vegetarian": cast(bool, r[7]),
                "vegan": cast(bool, r[8]),
                "gluten_free": cast(bool, r[9]),
                "lactose_free": cast(bool, r[10]),
                "soy_free": cast(bool, r[11]),
            }
            for r in rows
        ]

    def create_ingredient(self, ing: Ingredient) -> bool:
        return self._execute(
            """
            INSERT INTO app.ingredient
            (id, name, calories, protein, carbs, fat, fiber,
             vegetarian, vegan, gluten_free, lactose_free, soy_free)
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
            """,
            (
                ing["id"],
                ing["name"],
                ing["calories"],
                ing["protein"],
                ing["carbs"],
                ing["fat"],
                ing["fiber"],
                ing["vegetarian"],
                ing["vegan"],
                ing["gluten_free"],
                ing["lactose_free"],
                ing["soy_free"],
            ),
        )

    def update_ingredient(self, ingredient_id: int, **fields: Any) -> bool:
        allowed = {
            "name",
            "calories",
            "protein",
            "carbs",
            "fat",
            "fiber",
            "vegetarian",
            "vegan",
            "gluten_free",
            "lactose_free",
            "soy_free",
        }
        cols: List[str] = []
        vals: List[Any] = []
        for k, v in fields.items():
            if k in allowed:
                cols.append(f"{k}=%s")
                vals.append(v)
        if not cols:
            return True
        vals.append(ingredient_id)
        return self._execute(
            f"UPDATE app.ingredient SET {', '.join(cols)} WHERE id = %s", tuple(vals)
        )

    def delete_ingredient(self, ingredient_id: int) -> bool:
        return self._execute(
            "DELETE FROM app.ingredient WHERE id = %s", (ingredient_id,)
        )

    # --- Menus -------------------------------------------------------------

    def get_menu(self, menu_id: int) -> Optional[Menu]:
        row = self._query_one(
            """
            SELECT id, name, description, type, cooking_time, recipe
            FROM app.menu
            WHERE id = %s
            """,
            (menu_id,),
        )
        if row is None:
            return None
        recipe = cast(List[Dict[str, Any]], row[4] or [])
        return {
            "id": cast(int, row[0]),
            "name": cast(str, row[1]),
            "description": cast(Optional[str], row[2]) or "",
            "type": cast(str, row[3]),
            "cooking_time": cast(int, row[4]),
            "recipe": recipe,
        }

    def list_menus(self, limit: int = 100, offset: int = 0) -> List[Menu]:
        rows = self._query(
            """
            SELECT id, name, description, type, cooking_time, recipe
            FROM app.menu
            ORDER BY name
            LIMIT %s OFFSET %s
            """,
            (limit, offset),
        )
        out: List[Menu] = []
        for r in rows:
            out.append(
                {
                    "id": cast(int, r[0]),
                    "name": cast(str, r[1]),
                    "description": cast(Optional[str], r[2]) or "",
                    "type": cast(str, r[3]),
                    "cooking_time": cast(int, r[4]),
                    "recipe": cast(List[Dict[str, Any]], r[5] or []),
                }
            )
        return out

    def create_menu(self, menu: Menu) -> Optional[int]:
        row = self._query_one(
            """
            INSERT INTO app.menu(name, description, cooking_time, recipe)
            VALUES (%s,%s,%s,%s)
            RETURNING id
            """,
            (
                menu["name"],
                menu.get("description", ""),
                menu["cooking_time"],
                json.dumps(menu.get("recipe", [])),
            ),
        )
        return cast(Optional[int], row[0] if row else None)

    def update_menu(self, menu_id: int, **fields: Any) -> bool:
        allowed = {"name", "description", "cooking_time", "recipe"}
        cols: List[str] = []
        vals: List[Any] = []
        for k, v in fields.items():
            if k in allowed:
                if k == "recipe":
                    v = json.dumps(v)
                cols.append(f"{k}=%s")
                vals.append(v)
        if not cols:
            return True
        vals.append(menu_id)
        return self._execute(
            f"UPDATE app.menu SET {', '.join(cols)} WHERE id = %s", tuple(vals)
        )

    def delete_menu(self, menu_id: int) -> bool:
        return self._execute("DELETE FROM app.menu WHERE id = %s", (menu_id,))

    def set_menu_ingredients(self, menu_id: int, items: List[Menu_Ingredient]) -> bool:
        self._execute("DELETE FROM app.menu_ingredient WHERE menu_id = %s", (menu_id,))
        for it in items:
            self._execute(
                """
                INSERT INTO app.menu_ingredient(menu_id, ingredient_id, quantity)
                VALUES (%s,%s,%s)
                """,
                (menu_id, it["ingredient_id"], it["quantity"]),
            )
        return True

    def get_menu_ingredients(self, menu_id: int) -> List[Menu_Ingredient]:
        rows = self._query(
            """
            SELECT menu_id, ingredient_id, quantity
            FROM app.menu_ingredient
            WHERE menu_id = %s
            ORDER BY ingredient_id
            """,
            (menu_id,),
        )
        return [
            {
                "menu_id": cast(int, r[0]),
                "ingredient_id": cast(int, r[1]),
                "quantity": float(r[2]),
            }
            for r in rows
        ]

    # --- Meals -------------------------------------------------------------

    def get_meal(self, meal_id: int) -> Optional[Meal]:
        row = self._query_one(
            """
            SELECT id, user_id, date, type, name, description, people, menu_id
            FROM app.meal
            WHERE id = %s
            """,
            (meal_id,),
        )
        if row is None:
            return None
        return {
            "id": cast(int, row[0]),
            "user_id": cast(int, row[1]),
            "date": cast(date, row[2]),
            "type": cast(str, row[3]),
            "name": cast(str, row[4]),
            "description": cast(str, row[5]),
            "people": cast(int, row[6]),
            "menu_id": cast(int, row[7]),
        }

    def list_meals_by_user(
        self,
        user_id: int,
        date_from: Optional[date] = None,
        date_to: Optional[date] = None,
    ) -> List[Meal]:
        clauses: List[str] = ["user_id = %s"]
        params: List[Any] = [user_id]
        if date_from is not None:
            clauses.append("date >= %s")
            params.append(date_from)
        if date_to is not None:
            clauses.append("date <= %s")
            params.append(date_to)
        rows = self._query(
            f"""
            SELECT id, user_id, date, type, name, description, people, menu_id
            FROM app.meal
            WHERE {" AND ".join(clauses)}
            ORDER BY date, id
            """,
            tuple(params),
        )
        return [
            {
                "id": cast(int, r[0]),
                "user_id": cast(int, r[1]),
                "date": cast(date, r[2]),
                "type": cast(str, r[3]),
                "name": cast(str, r[4]),
                "description": cast(str, r[5]),
                "people": cast(int, r[6]),
                "menu_id": cast(int, r[7]),
            }
            for r in rows
        ]

    def create_meal(self, meal: Meal) -> Optional[int]:
        row = self._query_one(
            """
            INSERT INTO app.meal(user_id, date, type, name, description, people, menu_id)
            VALUES (%s,%s,%s,%s,%s,%s,%s)
            RETURNING id
            """,
            (
                meal["user_id"],
                meal["date"],
                meal["type"],
                meal["name"],
                meal["description"],
                meal["people"],
                meal.get("menu_id"),
            ),
        )
        return cast(Optional[int], row[0] if row else None)

    def update_meal(self, meal_id: int, **fields: Any) -> bool:
        allowed = {
            "user_id",
            "date",
            "type",
            "name",
            "description",
            "people",
            "menu_id",
        }
        cols: List[str] = []
        vals: List[Any] = []
        for k, v in fields.items():
            if k in allowed:
                cols.append(f"{k}=%s")
                vals.append(v)
        if not cols:
            return True
        vals.append(meal_id)
        return self._execute(
            f"UPDATE app.meal SET {', '.join(cols)} WHERE id = %s", tuple(vals)
        )

    def delete_meal(self, meal_id: int) -> bool:
        return self._execute("DELETE FROM app.meal WHERE id = %s", (meal_id,))

    def set_meal_ingredients(self, meal_id: int, items: List[Meal_Ingredient]) -> bool:
        self._execute("DELETE FROM app.meal_ingredient WHERE meal_id = %s", (meal_id,))
        for it in items:
            self._execute(
                """
                INSERT INTO app.meal_ingredient(meal_id, ingredient_id, quantity)
                VALUES (%s,%s,%s)
                """,
                (meal_id, it["ingredient_id"], it["quantity"]),
            )
        return True

    def get_meal_ingredients(self, meal_id: int) -> List[Meal_Ingredient]:
        rows = self._query(
            """
            SELECT meal_id, ingredient_id, quantity
            FROM app.meal_ingredient
            WHERE meal_id = %s
            ORDER BY ingredient_id
            """,
            (meal_id,),
        )
        return [
            {
                "meal_id": cast(int, r[0]),
                "ingredient_id": cast(int, r[1]),
                "quantity": float(r[2]),
            }
            for r in rows
        ]
