'use client';

import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useMealsStore } from '@/lib/store/meals';
import IMeal from '@/types/interfaces/IMeal';
import { MealType } from '@/types/enums/mealType';
import { IngredientUnit } from '@/types/enums/ingredientUnit';

type ApiIngredient = {
  ingredient: {
    id: number;
    name: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    // other flags ignored
  };
  quantity: number; // grams
};

type ApiMeal = {
  id: number;
  name: string;
  description: string;
  date: string;       // "Sun, 24 Aug 2025 00:00:00 GMT"
  type: string;       // "breakfast" | "lunch" | "dinner"
  people: number;     // -> servings
  ingredients: ApiIngredient[];
  // menu_id, user_id ignored
};

function toLocalMidnight(d: Date) {
  const nd = new Date(d);
  nd.setHours(0, 0, 0, 0);
  return nd;
}

function toMealType(t: string): MealType {
  switch (t?.toLowerCase()) {
    case 'breakfast': return MealType.Breakfast;
    case 'lunch':     return MealType.Lunch;
    case 'dinner':    return MealType.Dinner;
    default:          return MealType.Lunch; // sane fallback
  }
}

function sumMacros(ings: ApiIngredient[]) {
  return ings.reduce(
    (acc, it) => {
      const factor = (it.quantity ?? 0) / 100; // API nutrients look per 100g
      acc.calories += (it.ingredient.calories ?? 0) * factor;
      acc.protein  += (it.ingredient.protein  ?? 0) * factor;
      acc.carbs    += (it.ingredient.carbs    ?? 0) * factor;
      acc.fat      += (it.ingredient.fat      ?? 0) * factor;
      return acc;
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );
}

async function fetchMeals(): Promise<IMeal[]> {
  const r = await fetch('/api/users/1/meals', {
    cache: 'no-store',
    credentials: 'same-origin',
    headers: { Accept: 'application/json' },
  });
  if (!r.ok) {
    const text = await r.text().catch(() => '');
    throw new Error(`Failed to load meals: ${r.status} ${r.statusText} ${text}`);
  }

  const raw = (await r.json()) as unknown;
  const arr: ApiMeal[] = Array.isArray(raw) ? raw : (raw as any)?.meals ?? [];

  return arr.map((m): IMeal => {
    const date = toLocalMidnight(new Date(m.date));
    const macros = sumMacros(m.ingredients);

    return {
      id: String(m.id),
      name: m.name,
      description: m.description,
      date,
      type: toMealType(m.type),
      servings: m.people ?? 1,
      selected: false, // or derive however your UI expects
      ingredients: m.ingredients.map((it) => ({
        quantity: it.quantity,
        ingredient: {
          name: it.ingredient.name,
          unit: IngredientUnit.Grams,
          calories: it.ingredient.calories,
          protein: it.ingredient.protein,
          carbs: it.ingredient.carbs,
          fat: it.ingredient.fat,
        },
      })),
      macros, // matches what your test data had
    };
  });
}
const baseDate = new Date(); // today
// Test data
export const testMeals: IMeal[] = [
  {
    id: '1',
    name: `Greek Yogurt Parfait`,
    date: new Date(baseDate),
    description:
      'Creamy yogurt layered with berries, a crunch of granola, and a drizzle of honey.',
    type: MealType.Breakfast,
    ingredients: [
      {
        quantity: 1,
        ingredient: {
          name: 'Greek Yogurt',
          unit: IngredientUnit.Grams,
          calories: 100,
          protein: 17,
          carbs: 6,
          fat: 0,
        },
      },
      {
        quantity: 1,
        ingredient: {
          name: 'Mixed Berries',
          unit: IngredientUnit.Grams,
          calories: 60,
          protein: 1,
          carbs: 14,
          fat: 0,
        },
      },
      {
        quantity: 1,
        ingredient: {
          name: 'Granola',
          unit: IngredientUnit.Grams,
          calories: 200,
          protein: 4,
          carbs: 30,
          fat: 6,
        },
      },
      {
        quantity: 1,
        ingredient: {
          name: 'Honey',
          unit: IngredientUnit.Grams,
          calories: 60,
          protein: 0,
          carbs: 17,
          fat: 0,
        },
      },
      {
        quantity: 1,
        ingredient: {
          name: 'Almonds',
          unit: IngredientUnit.Grams,
          calories: 170,
          protein: 6,
          carbs: 6,
          fat: 15,
        },
      },
    ],
    servings: 2,
    selected: true,
    macros: { calories: 420, protein: 25, carbs: 55, fat: 9 },
  },
  {
    id: '2',
    name: `Chicken Caesar Wrap`,
    date: new Date(baseDate),
    description:
      'Grilled chicken tossed with light Caesar, crisp romaine, and parmesan in a soft tortilla.',
    type: MealType.Lunch,
    ingredients: [
      {
        quantity: 1,
        ingredient: {
          name: 'Grilled Chicken Breast',
          unit: IngredientUnit.Grams,
          calories: 220,
          protein: 40,
          carbs: 0,
          fat: 5,
        },
      },
      {
        quantity: 1,
        ingredient: {
          name: 'Whole-Wheat Tortilla',
          unit: IngredientUnit.Grams,
          calories: 170,
          protein: 6,
          carbs: 28,
          fat: 4,
        },
      },
      {
        quantity: 1,
        ingredient: {
          name: 'Romaine Lettuce',
          unit: IngredientUnit.Grams,
          calories: 10,
          protein: 1,
          carbs: 2,
          fat: 0,
        },
      },
      {
        quantity: 1,
        ingredient: {
          name: 'Parmesan',
          unit: IngredientUnit.Grams,
          calories: 80,
          protein: 7,
          carbs: 1,
          fat: 6,
        },
      },
      {
        quantity: 1,
        ingredient: {
          name: 'Light Caesar Dressing',
          unit: IngredientUnit.Grams,
          calories: 80,
          protein: 1,
          carbs: 3,
          fat: 7,
        },
      },
    ],
    servings: 1,
    selected: false,
    macros: { calories: 540, protein: 38, carbs: 36, fat: 20 },
  },
  {
    id: '3',
    name: `Stir Fry`,
    date: new Date(baseDate),
    description:
      'Chicken stir-fry with tofu in a savory sauce over brown rice.',
    type: MealType.Dinner,
    ingredients: [
      {
        quantity: 200,
        ingredient: {
          name: 'Chicken breast',
          unit: IngredientUnit.Grams,
          calories: 300,
          protein: 34,
          carbs: 0,
          fat: 18,
        },
      },
      {
        quantity: 1,
        ingredient: {
          name: 'Rice',
          unit: IngredientUnit.Grams,
          calories: 300,
          protein: 34,
          carbs: 0,
          fat: 18,
        },
      },
      {
        quantity: 1,
        ingredient: {
          name: 'Bell Peppers',
          unit: IngredientUnit.Pieces,
          calories: 220,
          protein: 8,
          carbs: 39,
          fat: 3,
        },
      },
      {
        quantity: 1,
        ingredient: {
          name: 'Broccoli (roasted)',
          unit: IngredientUnit.Grams,
          calories: 60,
          protein: 3,
          carbs: 12,
          fat: 1,
        },
      },
      {
        quantity: 1,
        ingredient: {
          name: 'Olive Oil',
          unit: IngredientUnit.Grams,
          calories: 120,
          protein: 0,
          carbs: 0,
          fat: 14,
        },
      },
      {
        quantity: 1,
        ingredient: {
          name: 'Lemon Juice',
          unit: IngredientUnit.Grams,
          calories: 5,
          protein: 0,
          carbs: 2,
          fat: 0,
        },
      },
    ],
    servings: 3,
    selected: true,
    macros: { calories: 650, protein: 40, carbs: 41, fat: 27 },
  },

  // +1 day (meals 4–6)
  {
    id: '4',
    name: `Avocado Egg Toast`,
    date: new Date(
      baseDate.getFullYear(),
      baseDate.getMonth(),
      baseDate.getDate() + 1
    ),
    description:
      'Sourdough toast topped with creamy avocado and a soft-fried egg.',
    type: MealType.Breakfast,
    ingredients: [
      {
        quantity: 1,
        ingredient: {
          name: 'Sourdough Bread',
          unit: IngredientUnit.Grams,
          calories: 160,
          protein: 6,
          carbs: 30,
          fat: 2,
        },
      },
      {
        quantity: 1,
        ingredient: {
          name: 'Avocado',
          unit: IngredientUnit.Grams,
          calories: 160,
          protein: 2,
          carbs: 8,
          fat: 15,
        },
      },
      {
        quantity: 1,
        ingredient: {
          name: 'Egg',
          unit: IngredientUnit.Grams,
          calories: 70,
          protein: 6,
          carbs: 1,
          fat: 5,
        },
      },
      {
        quantity: 1,
        ingredient: {
          name: 'Olive Oil (for frying)',
          unit: IngredientUnit.Grams,
          calories: 40,
          protein: 0,
          carbs: 0,
          fat: 4,
        },
      },
      {
        quantity: 1,
        ingredient: {
          name: 'Cherry Tomatoes',
          unit: IngredientUnit.Grams,
          calories: 20,
          protein: 1,
          carbs: 4,
          fat: 0,
        },
      },
    ],
    servings: 2,
    selected: false,
    macros: { calories: 430, protein: 13, carbs: 43, fat: 26 },
  },
  {
    id: '5',
    name: `Turkey Quinoa Bowl`,
    date: new Date(
      baseDate.getFullYear(),
      baseDate.getMonth(),
      baseDate.getDate() + 1
    ),
    description:
      'Lean ground turkey with veggies over quinoa and a dollop of yogurt sauce.',
    type: MealType.Lunch,
    ingredients: [
      {
        quantity: 1,
        ingredient: {
          name: 'Ground Turkey (lean)',
          unit: IngredientUnit.Grams,
          calories: 240,
          protein: 32,
          carbs: 0,
          fat: 12,
        },
      },
      {
        quantity: 1,
        ingredient: {
          name: 'Quinoa (cooked)',
          unit: IngredientUnit.Grams,
          calories: 200,
          protein: 7,
          carbs: 36,
          fat: 3,
        },
      },
      {
        quantity: 1,
        ingredient: {
          name: 'Bell Pepper',
          unit: IngredientUnit.Grams,
          calories: 30,
          protein: 1,
          carbs: 7,
          fat: 0,
        },
      },
      {
        quantity: 1,
        ingredient: {
          name: 'Spinach',
          unit: IngredientUnit.Grams,
          calories: 10,
          protein: 1,
          carbs: 1,
          fat: 0,
        },
      },
      {
        quantity: 1,
        ingredient: {
          name: 'Greek Yogurt Sauce',
          unit: IngredientUnit.Grams,
          calories: 50,
          protein: 5,
          carbs: 2,
          fat: 2,
        },
      },
    ],
    servings: 1,
    selected: true,
    macros: { calories: 530, protein: 43, carbs: 42, fat: 18 },
  },
  {
    id: '6',
    name: `Beef Stir-Fry with Rice`,
    date: new Date(
      baseDate.getFullYear(),
      baseDate.getMonth(),
      baseDate.getDate() + 1
    ),
    description:
      'Quick-sautéed beef and colorful vegetables tossed in a savory sauce over rice.',
    type: MealType.Dinner,
    ingredients: [
      {
        quantity: 1,
        ingredient: {
          name: 'Beef Strips',
          unit: IngredientUnit.Grams,
          calories: 280,
          protein: 30,
          carbs: 0,
          fat: 18,
        },
      },
      {
        quantity: 1,
        ingredient: {
          name: 'Brown Rice (cooked)',
          unit: IngredientUnit.Grams,
          calories: 220,
          protein: 5,
          carbs: 46,
          fat: 2,
        },
      },
      {
        quantity: 1,
        ingredient: {
          name: 'Mixed Vegetables',
          unit: IngredientUnit.Grams,
          calories: 70,
          protein: 3,
          carbs: 14,
          fat: 1,
        },
      },
      {
        quantity: 1,
        ingredient: {
          name: 'Stir-Fry Sauce',
          unit: IngredientUnit.Grams,
          calories: 60,
          protein: 2,
          carbs: 10,
          fat: 1,
        },
      },
      {
        quantity: 1,
        ingredient: {
          name: 'Sesame Oil',
          unit: IngredientUnit.Grams,
          calories: 90,
          protein: 0,
          carbs: 0,
          fat: 10,
        },
      },
    ],
    servings: 3,
    selected: false,
    macros: { calories: 640, protein: 35, carbs: 56, fat: 23 },
  },

  // +2 days (meals 7–9)
  {
    id: '7',
    name: `Banana Peanut Oatmeal`,
    date: new Date(
      baseDate.getFullYear(),
      baseDate.getMonth(),
      baseDate.getDate() + 2
    ),
    description:
      'Warm oats topped with banana, peanut butter, and a sprinkle of cinnamon.',
    type: MealType.Breakfast,
    ingredients: [
      {
        quantity: 1,
        ingredient: {
          name: 'Rolled Oats (dry)',
          unit: IngredientUnit.Grams,
          calories: 150,
          protein: 5,
          carbs: 27,
          fat: 3,
        },
      },
      {
        quantity: 1,
        ingredient: {
          name: 'Banana',
          unit: IngredientUnit.Grams,
          calories: 105,
          protein: 1,
          carbs: 27,
          fat: 0,
        },
      },
      {
        quantity: 1,
        ingredient: {
          name: 'Peanut Butter',
          unit: IngredientUnit.Grams,
          calories: 190,
          protein: 7,
          carbs: 7,
          fat: 16,
        },
      },
      {
        quantity: 1,
        ingredient: {
          name: 'Milk (or alt.)',
          unit: IngredientUnit.Grams,
          calories: 80,
          protein: 4,
          carbs: 8,
          fat: 4,
        },
      },
      {
        quantity: 1,
        ingredient: {
          name: 'Cinnamon',
          unit: IngredientUnit.Grams,
          calories: 5,
          protein: 0,
          carbs: 1,
          fat: 0,
        },
      },
    ],
    servings: 2,
    selected: true,
    macros: { calories: 470, protein: 16, carbs: 60, fat: 18 },
  },
  {
    id: '8',
    name: `Hearty Lentil Soup`,
    date: new Date(
      baseDate.getFullYear(),
      baseDate.getMonth(),
      baseDate.getDate() + 2
    ),
    description:
      'Comforting bowl of lentils simmered with vegetables and herbs; served with bread.',
    type: MealType.Lunch,
    ingredients: [
      {
        quantity: 1,
        ingredient: {
          name: 'Lentils (cooked)',
          unit: IngredientUnit.Grams,
          calories: 230,
          protein: 18,
          carbs: 40,
          fat: 1,
        },
      },
      {
        quantity: 1,
        ingredient: {
          name: 'Carrot & Celery',
          unit: IngredientUnit.Grams,
          calories: 40,
          protein: 1,
          carbs: 9,
          fat: 0,
        },
      },
      {
        quantity: 1,
        ingredient: {
          name: 'Onion & Garlic',
          unit: IngredientUnit.Grams,
          calories: 30,
          protein: 1,
          carbs: 7,
          fat: 0,
        },
      },
      {
        quantity: 1,
        ingredient: {
          name: 'Olive Oil',
          unit: IngredientUnit.Grams,
          calories: 80,
          protein: 0,
          carbs: 0,
          fat: 9,
        },
      },
      {
        quantity: 1,
        ingredient: {
          name: 'Whole-Grain Bread',
          unit: IngredientUnit.Grams,
          calories: 120,
          protein: 5,
          carbs: 23,
          fat: 2,
        },
      },
    ],
    servings: 1,
    selected: false,
    macros: { calories: 500, protein: 25, carbs: 63, fat: 12 },
  },
  {
    id: '9',
    name: `Chicken Pesto Pasta`,
    date: new Date(
      baseDate.getFullYear(),
      baseDate.getMonth(),
      baseDate.getDate() + 2
    ),
    description:
      'Al dente pasta tossed with basil pesto, juicy chicken, and cherry tomatoes.',
    type: MealType.Dinner,
    ingredients: [
      {
        quantity: 1,
        ingredient: {
          name: 'Pasta (cooked)',
          unit: IngredientUnit.Grams,
          calories: 300,
          protein: 10,
          carbs: 60,
          fat: 3,
        },
      },
      {
        quantity: 1,
        ingredient: {
          name: 'Chicken Breast',
          unit: IngredientUnit.Grams,
          calories: 200,
          protein: 37,
          carbs: 0,
          fat: 4,
        },
      },
      {
        quantity: 1,
        ingredient: {
          name: 'Basil Pesto',
          unit: IngredientUnit.Grams,
          calories: 180,
          protein: 4,
          carbs: 6,
          fat: 16,
        },
      },
      {
        quantity: 1,
        ingredient: {
          name: 'Cherry Tomatoes',
          unit: IngredientUnit.Grams,
          calories: 20,
          protein: 1,
          carbs: 4,
          fat: 0,
        },
      },
      {
        quantity: 1,
        ingredient: {
          name: 'Parmesan',
          unit: IngredientUnit.Grams,
          calories: 80,
          protein: 7,
          carbs: 1,
          fat: 6,
        },
      },
    ],
    servings: 3,
    selected: true,
    macros: { calories: 720, protein: 37, carbs: 67, fat: 28 },
  },

  // +3 days (meals 10–12)
  {
    id: '10',
    name: `Berry Smoothie Bowl`,
    date: new Date(
      baseDate.getFullYear(),
      baseDate.getMonth(),
      baseDate.getDate() + 3
    ),
    description:
      'Thick smoothie topped with banana, seeds, and granola for spoonable goodness.',
    type: MealType.Breakfast,
    ingredients: [
      {
        quantity: 1,
        ingredient: {
          name: 'Frozen Berries',
          unit: IngredientUnit.Grams,
          calories: 90,
          protein: 1,
          carbs: 22,
          fat: 1,
        },
      },
      {
        quantity: 1,
        ingredient: {
          name: 'Banana',
          unit: IngredientUnit.Grams,
          calories: 105,
          protein: 1,
          carbs: 27,
          fat: 0,
        },
      },
      {
        quantity: 1,
        ingredient: {
          name: 'Greek Yogurt',
          unit: IngredientUnit.Grams,
          calories: 80,
          protein: 14,
          carbs: 5,
          fat: 0,
        },
      },
      {
        quantity: 1,
        ingredient: {
          name: 'Granola',
          unit: IngredientUnit.Grams,
          calories: 160,
          protein: 3,
          carbs: 24,
          fat: 5,
        },
      },
      {
        quantity: 1,
        ingredient: {
          name: 'Chia Seeds',
          unit: IngredientUnit.Grams,
          calories: 60,
          protein: 2,
          carbs: 4,
          fat: 4,
        },
      },
    ],
    servings: 2,
    selected: false,
    macros: { calories: 420, protein: 20, carbs: 68, fat: 10 },
  },
  {
    id: '11',
    name: `Tuna Salad Sandwich`,
    date: new Date(
      baseDate.getFullYear(),
      baseDate.getMonth(),
      baseDate.getDate() + 3
    ),
    description: 'Classic tuna salad on whole-grain bread with crisp lettuce.',
    type: MealType.Lunch,
    ingredients: [
      {
        quantity: 1,
        ingredient: {
          name: 'Canned Tuna (in water)',
          unit: IngredientUnit.Grams,
          calories: 160,
          protein: 36,
          carbs: 0,
          fat: 1,
        },
      },
      {
        quantity: 1,
        ingredient: {
          name: 'Whole-Grain Bread',
          unit: IngredientUnit.Grams,
          calories: 220,
          protein: 8,
          carbs: 40,
          fat: 4,
        },
      },
      {
        quantity: 1,
        ingredient: {
          name: 'Light Mayo',
          unit: IngredientUnit.Grams,
          calories: 60,
          protein: 0,
          carbs: 2,
          fat: 6,
        },
      },
      {
        quantity: 1,
        ingredient: {
          name: 'Celery & Onion',
          unit: IngredientUnit.Grams,
          calories: 20,
          protein: 1,
          carbs: 4,
          fat: 0,
        },
      },
      {
        quantity: 1,
        ingredient: {
          name: 'Lettuce',
          unit: IngredientUnit.Grams,
          calories: 5,
          protein: 0,
          carbs: 1,
          fat: 0,
        },
      },
    ],
    servings: 1,
    selected: true,
    macros: { calories: 465, protein: 33, carbs: 47, fat: 11 },
  },
  {
    id: '12',
    name: `Shrimp Tacos`,
    date: new Date(
      baseDate.getFullYear(),
      baseDate.getMonth(),
      baseDate.getDate() + 3
    ),
    description: 'Zesty shrimp in warm tortillas with slaw and lime crema.',
    type: MealType.Dinner,
    ingredients: [
      {
        quantity: 1,
        ingredient: {
          name: 'Shrimp',
          unit: IngredientUnit.Grams,
          calories: 140,
          protein: 26,
          carbs: 1,
          fat: 2,
        },
      },
      {
        quantity: 1,
        ingredient: {
          name: 'Corn Tortillas',
          unit: IngredientUnit.Grams,
          calories: 200,
          protein: 5,
          carbs: 42,
          fat: 3,
        },
      },
      {
        quantity: 1,
        ingredient: {
          name: 'Cabbage Slaw',
          unit: IngredientUnit.Grams,
          calories: 60,
          protein: 2,
          carbs: 10,
          fat: 2,
        },
      },
      {
        quantity: 1,
        ingredient: {
          name: 'Lime Crema',
          unit: IngredientUnit.Grams,
          calories: 100,
          protein: 2,
          carbs: 3,
          fat: 9,
        },
      },
      {
        quantity: 1,
        ingredient: {
          name: 'Avocado',
          unit: IngredientUnit.Grams,
          calories: 120,
          protein: 2,
          carbs: 6,
          fat: 11,
        },
      },
    ],
    servings: 3,
    selected: false,
    macros: { calories: 570, protein: 30, carbs: 62, fat: 22 },
  },

  // +4 days (meals 13–15)
  {
    id: '13',
    name: `Cottage Cheese Fruit Bowl`,
    date: new Date(
      baseDate.getFullYear(),
      baseDate.getMonth(),
      baseDate.getDate() + 4
    ),
    description:
      'High-protein cottage cheese with pineapple, berries, and a sprinkle of nuts.',
    type: MealType.Breakfast,
    ingredients: [
      {
        quantity: 1,
        ingredient: {
          name: 'Cottage Cheese (low-fat)',
          unit: IngredientUnit.Grams,
          calories: 140,
          protein: 24,
          carbs: 6,
          fat: 3,
        },
      },
      {
        quantity: 1,
        ingredient: {
          name: 'Pineapple Chunks',
          unit: IngredientUnit.Grams,
          calories: 80,
          protein: 1,
          carbs: 20,
          fat: 0,
        },
      },
      {
        quantity: 1,
        ingredient: {
          name: 'Blueberries',
          unit: IngredientUnit.Grams,
          calories: 60,
          protein: 1,
          carbs: 14,
          fat: 0,
        },
      },
      {
        quantity: 1,
        ingredient: {
          name: 'Almonds',
          unit: IngredientUnit.Grams,
          calories: 120,
          protein: 4,
          carbs: 4,
          fat: 11,
        },
      },
      {
        quantity: 1,
        ingredient: {
          name: 'Honey',
          unit: IngredientUnit.Grams,
          calories: 40,
          protein: 0,
          carbs: 11,
          fat: 0,
        },
      },
    ],
    servings: 2,
    selected: true,
    macros: { calories: 360, protein: 27, carbs: 45, fat: 10 },
  },
  {
    id: '14',
    name: `Chickpea Buddha Bowl`,
    date: new Date(
      baseDate.getFullYear(),
      baseDate.getMonth(),
      baseDate.getDate() + 4
    ),
    description:
      'Roasted chickpeas with sweet potato, greens, and tahini drizzle.',
    type: MealType.Lunch,
    ingredients: [
      {
        quantity: 1,
        ingredient: {
          name: 'Chickpeas (roasted)',
          unit: IngredientUnit.Grams,
          calories: 240,
          protein: 12,
          carbs: 40,
          fat: 6,
        },
      },
      {
        quantity: 1,
        ingredient: {
          name: 'Sweet Potato (roasted)',
          unit: IngredientUnit.Grams,
          calories: 180,
          protein: 3,
          carbs: 41,
          fat: 0,
        },
      },
      {
        quantity: 1,
        ingredient: {
          name: 'Mixed Greens',
          unit: IngredientUnit.Grams,
          calories: 20,
          protein: 2,
          carbs: 3,
          fat: 0,
        },
      },
      {
        quantity: 1,
        ingredient: {
          name: 'Quinoa (cooked)',
          unit: IngredientUnit.Grams,
          calories: 150,
          protein: 6,
          carbs: 27,
          fat: 2,
        },
      },
      {
        quantity: 1,
        ingredient: {
          name: 'Tahini Sauce',
          unit: IngredientUnit.Grams,
          calories: 120,
          protein: 4,
          carbs: 4,
          fat: 10,
        },
      },
    ],
    servings: 1,
    selected: false,
    macros: { calories: 600, protein: 27, carbs: 115, fat: 18 },
  },
  {
    id: '15',
    name: `Margherita Pizza + Arugula`,
    date: new Date(
      baseDate.getFullYear(),
      baseDate.getMonth(),
      baseDate.getDate() + 4
    ),
    description:
      'Thin-crust tomato, mozzarella, and basil with a peppery arugula side.',
    type: MealType.Dinner,
    ingredients: [
      {
        quantity: 1,
        ingredient: {
          name: 'Pizza Crust (thin)',
          unit: IngredientUnit.Grams,
          calories: 320,
          protein: 10,
          carbs: 60,
          fat: 4,
        },
      },
      {
        quantity: 1,
        ingredient: {
          name: 'Tomato Sauce',
          unit: IngredientUnit.Grams,
          calories: 60,
          protein: 2,
          carbs: 12,
          fat: 1,
        },
      },
      {
        quantity: 1,
        ingredient: {
          name: 'Mozzarella',
          unit: IngredientUnit.Grams,
          calories: 260,
          protein: 18,
          carbs: 3,
          fat: 19,
        },
      },
      {
        quantity: 1,
        ingredient: {
          name: 'Basil',
          unit: IngredientUnit.Grams,
          calories: 5,
          protein: 0,
          carbs: 1,
          fat: 0,
        },
      },
      {
        quantity: 1,
        ingredient: {
          name: 'Arugula (side salad)',
          unit: IngredientUnit.Grams,
          calories: 30,
          protein: 2,
          carbs: 4,
          fat: 1,
        },
      },
    ],
    servings: 3,
    selected: true,
    macros: { calories: 720, protein: 28, carbs: 78, fat: 30 },
  },

  // +5 days (meals 16–18)
  {
    id: '16',
    name: `Protein Pancakes`,
    date: new Date(
      baseDate.getFullYear(),
      baseDate.getMonth(),
      baseDate.getDate() + 5
    ),
    description:
      'Fluffy pancakes boosted with protein powder and topped with berries.',
    type: MealType.Breakfast,
    ingredients: [
      {
        quantity: 1,
        ingredient: {
          name: 'Pancake Batter',
          unit: IngredientUnit.Grams,
          calories: 260,
          protein: 8,
          carbs: 45,
          fat: 6,
        },
      },
      {
        quantity: 1,
        ingredient: {
          name: 'Protein Powder',
          unit: IngredientUnit.Grams,
          calories: 120,
          protein: 24,
          carbs: 3,
          fat: 2,
        },
      },
      {
        quantity: 1,
        ingredient: {
          name: 'Egg',
          unit: IngredientUnit.Grams,
          calories: 70,
          protein: 6,
          carbs: 1,
          fat: 5,
        },
      },
      {
        quantity: 1,
        ingredient: {
          name: 'Maple Syrup',
          unit: IngredientUnit.Grams,
          calories: 100,
          protein: 0,
          carbs: 26,
          fat: 0,
        },
      },
      {
        quantity: 1,
        ingredient: {
          name: 'Mixed Berries',
          unit: IngredientUnit.Grams,
          calories: 60,
          protein: 1,
          carbs: 14,
          fat: 0,
        },
      },
    ],
    servings: 2,
    selected: false,
    macros: { calories: 520, protein: 30, carbs: 75, fat: 12 },
  },
  {
    id: '17',
    name: `Mediterranean Chicken Salad`,
    date: new Date(
      baseDate.getFullYear(),
      baseDate.getMonth(),
      baseDate.getDate() + 5
    ),
    description:
      'Herbed chicken over crisp veggies with olives and feta; lemon-oregano vinaigrette.',
    type: MealType.Lunch,
    ingredients: [
      {
        quantity: 1,
        ingredient: {
          name: 'Grilled Chicken',
          unit: IngredientUnit.Grams,
          calories: 220,
          protein: 40,
          carbs: 0,
          fat: 5,
        },
      },
      {
        quantity: 1,
        ingredient: {
          name: 'Cucumber & Tomato',
          unit: IngredientUnit.Grams,
          calories: 40,
          protein: 2,
          carbs: 8,
          fat: 0,
        },
      },
      {
        quantity: 1,
        ingredient: {
          name: 'Kalamata Olives',
          unit: IngredientUnit.Grams,
          calories: 80,
          protein: 1,
          carbs: 5,
          fat: 7,
        },
      },
      {
        quantity: 1,
        ingredient: {
          name: 'Feta Cheese',
          unit: IngredientUnit.Grams,
          calories: 100,
          protein: 5,
          carbs: 2,
          fat: 8,
        },
      },
      {
        quantity: 1,
        ingredient: {
          name: 'Olive Oil & Lemon',
          unit: IngredientUnit.Grams,
          calories: 100,
          protein: 0,
          carbs: 1,
          fat: 11,
        },
      },
    ],
    servings: 1,
    selected: true,
    macros: { calories: 520, protein: 36, carbs: 16, fat: 31 },
  },
  {
    id: '18',
    name: `Baked Cod with Potatoes`,
    date: new Date(
      baseDate.getFullYear(),
      baseDate.getMonth(),
      baseDate.getDate() + 5
    ),
    description:
      'Tender cod baked with baby potatoes and green beans, finished with herbs.',
    type: MealType.Dinner,
    ingredients: [
      {
        quantity: 1,
        ingredient: {
          name: 'Cod Fillet',
          unit: IngredientUnit.Grams,
          calories: 160,
          protein: 35,
          carbs: 0,
          fat: 2,
        },
      },
      {
        quantity: 1,
        ingredient: {
          name: 'Baby Potatoes',
          unit: IngredientUnit.Grams,
          calories: 220,
          protein: 5,
          carbs: 50,
          fat: 0,
        },
      },
      {
        quantity: 1,
        ingredient: {
          name: 'Green Beans',
          unit: IngredientUnit.Grams,
          calories: 40,
          protein: 2,
          carbs: 9,
          fat: 0,
        },
      },
      {
        quantity: 1,
        ingredient: {
          name: 'Olive Oil',
          unit: IngredientUnit.Grams,
          calories: 120,
          protein: 0,
          carbs: 0,
          fat: 14,
        },
      },
      {
        quantity: 1,
        ingredient: {
          name: 'Herbs & Lemon',
          unit: IngredientUnit.Grams,
          calories: 5,
          protein: 0,
          carbs: 1,
          fat: 0,
        },
      },
    ],
    servings: 3,
    selected: false,
    macros: { calories: 540, protein: 37, carbs: 60, fat: 16 },
  },

  // +6 days (meals 19–21)
  {
    id: '19',
    name: `Veggie Omelette & Toast`,
    date: new Date(
      baseDate.getFullYear(),
      baseDate.getMonth(),
      baseDate.getDate() + 6
    ),
    description:
      'Fluffy three-egg omelette with sautéed veggies and a slice of whole-grain toast.',
    type: MealType.Breakfast,
    ingredients: [
      {
        quantity: 1,
        ingredient: {
          name: 'Eggs',
          unit: IngredientUnit.Grams,
          calories: 210,
          protein: 18,
          carbs: 3,
          fat: 15,
        },
      },
      {
        quantity: 1,
        ingredient: {
          name: 'Bell Pepper & Onion',
          unit: IngredientUnit.Grams,
          calories: 40,
          protein: 1,
          carbs: 9,
          fat: 0,
        },
      },
      {
        quantity: 1,
        ingredient: {
          name: 'Mushrooms',
          unit: IngredientUnit.Grams,
          calories: 20,
          protein: 3,
          carbs: 3,
          fat: 0,
        },
      },
      {
        quantity: 1,
        ingredient: {
          name: 'Olive Oil (cooking)',
          unit: IngredientUnit.Grams,
          calories: 80,
          protein: 0,
          carbs: 0,
          fat: 9,
        },
      },
      {
        quantity: 1,
        ingredient: {
          name: 'Whole-Grain Toast',
          unit: IngredientUnit.Grams,
          calories: 110,
          protein: 4,
          carbs: 20,
          fat: 2,
        },
      },
    ],
    servings: 2,
    selected: true,
    macros: { calories: 430, protein: 26, carbs: 35, fat: 24 },
  },
  {
    id: '20',
    name: `Beef Burrito Bowl`,
    date: new Date(
      baseDate.getFullYear(),
      baseDate.getMonth(),
      baseDate.getDate() + 6
    ),
    description:
      'Seasoned beef with rice, beans, corn, and salsa—no tortilla needed.',
    type: MealType.Lunch,
    ingredients: [
      {
        quantity: 1,
        ingredient: {
          name: 'Ground Beef (90/10)',
          unit: IngredientUnit.Grams,
          calories: 260,
          protein: 26,
          carbs: 0,
          fat: 17,
        },
      },
      {
        quantity: 1,
        ingredient: {
          name: 'Brown Rice (cooked)',
          unit: IngredientUnit.Grams,
          calories: 220,
          protein: 5,
          carbs: 46,
          fat: 2,
        },
      },
      {
        quantity: 1,
        ingredient: {
          name: 'Black Beans',
          unit: IngredientUnit.Grams,
          calories: 160,
          protein: 10,
          carbs: 28,
          fat: 1,
        },
      },
      {
        quantity: 1,
        ingredient: {
          name: 'Corn',
          unit: IngredientUnit.Grams,
          calories: 80,
          protein: 3,
          carbs: 18,
          fat: 1,
        },
      },
      {
        quantity: 1,
        ingredient: {
          name: 'Salsa',
          unit: IngredientUnit.Grams,
          calories: 30,
          protein: 1,
          carbs: 7,
          fat: 0,
        },
      },
    ],
    servings: 1,
    selected: false,
    macros: { calories: 620, protein: 40, carbs: 99, fat: 20 },
  },
  {
    id: '21',
    name: `Mushroom Risotto`,
    date: new Date(
      baseDate.getFullYear(),
      baseDate.getMonth(),
      baseDate.getDate() + 6
    ),
    description:
      'Creamy arborio rice with sautéed mushrooms, parmesan, and fresh herbs.',
    type: MealType.Dinner,
    ingredients: [
      {
        quantity: 1,
        ingredient: {
          name: 'Arborio Rice (cooked)',
          unit: IngredientUnit.Grams,
          calories: 280,
          protein: 6,
          carbs: 58,
          fat: 3,
        },
      },
      {
        quantity: 1,
        ingredient: {
          name: 'Mushrooms',
          unit: IngredientUnit.Grams,
          calories: 40,
          protein: 6,
          carbs: 6,
          fat: 0,
        },
      },
      {
        quantity: 1,
        ingredient: {
          name: 'Parmesan',
          unit: IngredientUnit.Grams,
          calories: 120,
          protein: 11,
          carbs: 2,
          fat: 8,
        },
      },
      {
        quantity: 1,
        ingredient: {
          name: 'Olive Oil & Butter',
          unit: IngredientUnit.Grams,
          calories: 160,
          protein: 0,
          carbs: 0,
          fat: 18,
        },
      },
      {
        quantity: 1,
        ingredient: {
          name: 'Vegetable Stock',
          unit: IngredientUnit.Grams,
          calories: 20,
          protein: 1,
          carbs: 3,
          fat: 0,
        },
      },
    ],
    servings: 3,
    selected: true,
    macros: { calories: 680, protein: 22, carbs: 72, fat: 30 },
  },
];

export const testMealsAA: IMeal[] = Array.from({ length: 7 }, (_, day) => {
  const baseDate = new Date();
  baseDate.setHours(0, 0, 0, 0);
  baseDate.setDate(baseDate.getDate() + day); // <-- change: forward from today

  const result: IMeal[] = [
    {
      id: `${day * 3 + 1}`,
      name: `Breakfast Day ${day + 1}`,
      date: new Date(baseDate),
      description: `Healthy breakfast for day ${day + 1}`,
      type: MealType.Breakfast,
      ingredients: [
        {
          quantity: 1,
          ingredient: {
            name: 'Oats',
            unit: IngredientUnit.Grams,
            calories: 150,
            protein: 5,
            carbs: 27,
            fat: 3,
          },
        },
      ],
      servings: 2,
      selected: false,
      macros: { calories: 300, protein: 10, carbs: 54, fat: 6 },
    },
    {
      id: `${day * 3 + 2}`,
      name: `Lunch Day ${day + 1}`,
      date: new Date(baseDate),
      description: `Nutritious lunch for day ${day + 1}`,
      type: MealType.Lunch,
      ingredients: [
        {
          quantity: 1,
          ingredient: {
            name: 'Oats',
            unit: IngredientUnit.Grams,
            calories: 150,
            protein: 5,
            carbs: 27,
            fat: 3,
          },
        },
      ],
      servings: 1,
      selected: true,
      macros: { calories: 300, protein: 10, carbs: 54, fat: 6 },
    },
    {
      id: `${day * 3 + 3}`,
      name: `Dinner Day ${day + 1}`,
      date: new Date(baseDate),
      description: `Delicious dinner for day ${day + 1}`,
      type: MealType.Dinner,
      ingredients: [
        {
          quantity: 1,
          ingredient: {
            name: 'Oats',
            unit: IngredientUnit.Grams,
            calories: 150,
            protein: 5,
            carbs: 27,
            fat: 3,
          },
        },
      ],
      servings: 3,
      selected: true,
      macros: { calories: 300, protein: 10, carbs: 54, fat: 6 },
    },
  ];

  return result;
}).flat();

export default function MealsBridge() {
  const setMeals = useMealsStore((s: any) => s.setMeals);

  const { data } = useQuery({
    queryKey: ['meals'],
    queryFn: async () => testMeals, // fetchMeals
    staleTime: 60_000, // tweak to your needs
    refetchOnWindowFocus: true, // auto-refresh when user returns
  });

  useEffect(() => {
    if (data) setMeals(data);
  }, [data, setMeals]);

  return null;
}
