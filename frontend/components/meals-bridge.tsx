'use client';

import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useMealsStore } from '@/lib/store/meals';
import IMeal from '@/types/interfaces/IMeal';
import { MealType } from '@/types/enums/mealType';
import { IngredientUnit } from '@/types/enums/ingredientUnit';

type ApiMeal = Omit<IMeal, 'date'> & { date: string };

async function fetchMeals(): Promise<IMeal[]> {
  const r = await fetch('/api/meals', { cache: 'no-store' });
  if (!r.ok) throw new Error('Failed to load meals');
  const json: ApiMeal[] = await r.json();
  // Re-hydrate Date from JSON string
  return json.map((m) => ({ ...m, date: new Date(m.date) }));
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
  const setMeals = useMealsStore((s) => s.setMeals);

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
