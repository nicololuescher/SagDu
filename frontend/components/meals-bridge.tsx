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

// Test data for 2 weeks of meals, 3 meals per day (breakfast, lunch, dinner for each day)

export const testMeals: IMeal[] = Array.from({ length: 14 }, (_, day) => {
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
