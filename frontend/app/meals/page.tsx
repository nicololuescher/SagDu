'use client';

import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Cookie, Eye, Plus } from 'lucide-react';
import Link from 'next/link';
import { MealIcon } from '@/components/ui/mealicon';
import { Button } from '@/components/ui/button';
import IMeal from '@/types/interfaces/IMeal';
import { MealType } from '@/types/enums/mealType';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { useMealsStore } from '@/lib/store/meals';
import React from 'react';

const mockMeals: IMeal[] = [
  {
    date: new Date('2025-08-25T12:00:00'),
    name: 'testmeal',
    type: MealType.Lunch,
    description: 'This is a test meal',
    id: '1',
    ingredients: [],
    macros: { calories: 0, protein: 0, carbs: 0, fat: 0 },
    selected: false,
    servings: 1,
  },
  {
    date: new Date('2025-08-25T12:00:00'),
    name: 'testmeal',
    type: MealType.Dinner,
    description: 'This is a test meal',
    id: '2',
    ingredients: [],
    macros: { calories: 0, protein: 0, carbs: 0, fat: 0 },
    selected: false,
    servings: 2,
  },
  {
    date: new Date('2025-08-26T12:00:00'),
    name: 'testmeal',
    type: MealType.Breakfast,
    description: 'This is a test meal',
    id: '3',
    ingredients: [],
    macros: { calories: 0, protein: 0, carbs: 0, fat: 0 },
    selected: false,
    servings: 1,
  },
  {
    date: new Date('2025-08-27T12:00:00'),
    name: 'testmeal',
    type: MealType.Lunch,
    description: 'This is a test meal',
    id: '4',
    ingredients: [],
    macros: { calories: 0, protein: 0, carbs: 0, fat: 0 },
    selected: false,
    servings: 1,
  },
  {
    date: new Date('2025-08-27T12:00:00'),
    name: 'testmeal',
    type: MealType.Dinner,
    description: 'This is a test meal',
    id: '5',
    ingredients: [],
    macros: { calories: 0, protein: 0, carbs: 0, fat: 0 },
    selected: false,
    servings: 1,
  },
  {
    date: new Date('2025-08-28T12:00:00'),
    name: 'testmeal',
    type: MealType.Breakfast,
    description: 'This is a test meal',
    id: '6',
    ingredients: [],
    macros: { calories: 0, protein: 0, carbs: 0, fat: 0 },
    selected: false,
    servings: 1,
  },
  {
    date: new Date('2025-08-28T12:00:00'),
    name: 'testmeal',
    type: MealType.Lunch,
    description: 'This is a test meal',
    id: '7',
    ingredients: [],
    macros: { calories: 0, protein: 0, carbs: 0, fat: 0 },
    selected: false,
    servings: 1,
  },
];

export default function Meals() {
  let previousDay = new Date().getDate();

  // Pull all meals from the store
  const mealsById = useMealsStore((s) => s.mealsById);
  const meals = React.useMemo(
    () => Object.values(mealsById).filter((m) => m.selected),
    [mealsById]
  );

  return (
    <Table className="caption-top">
      <TableCaption className="flex items-center justify-between">
        <span></span>
        <span>Upcoming meals</span>
        <Link href="/create-mealplan">
          <Plus />
        </Link>
      </TableCaption>
      <TableBody>
        {meals.map((meal: IMeal) => {
          const showSeparator = previousDay !== meal.date.getDate();
          previousDay = meal.date.getDate();

          if (showSeparator) {
            return (
              <TableRow key={meal.date.toDateString() + meal.type}>
                <TableCell>
                  <div className="py-3 text-center text-sm font-semibold text-gray-500">
                    {meal.date.toDateString()}
                  </div>
                  <DayCard {...meal}></DayCard>
                </TableCell>
              </TableRow>
            );
          }

          return (
            <TableRow key={meal.date.toDateString() + meal.type}>
              <TableCell className="font-medium">
                <DayCard {...meal}></DayCard>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

export function DayCard(meal: IMeal) {
  const router = useRouter();
  const removeMeal = useMealsStore((s) => s.removeMeal);

  return (
    <Card className="grid gap-4">
      <CardHeader>
        <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
          <div className="flex items-center gap-2">
            <MealIcon type={meal.type}></MealIcon>
            {meal.type}
          </div>
        </CardTitle>
        <CardDescription>{meal.date.toDateString()}</CardDescription>
        <CardAction>
          <Link href="/mealDetails">
            {/* Need to also pass the current meal */}
            <Eye />
          </Link>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-row gap-1.5 text-sm items-center justify-between">
        {meal.name}
        <div className="flex flex-row gap-2 mt-2">
          <Button variant="destructive" onClick={() => removeMeal(meal.id)}>
            Missed
          </Button>
          <Button
            variant="outline"
            onClick={() =>
              toast('You Received:', {
                description: (
                  <span className="flex flex-row gap-1 text-orange-500">
                    5
                    <Cookie className="text-orange-500 inline-block" />
                    <span>You can feed your Tamagochi now!</span>
                  </span>
                ),
                action: {
                  label: 'Feed',
                  onClick: () => router.push('/tamagochi'),
                },
              })
            }
          >
            Eat
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
