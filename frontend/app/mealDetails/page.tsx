'use client';

import {
  Card,
  CardHeader,
  CardTitle,
  CardFooter,
  CardAction,
  CardContent,
} from '@/components/ui/card';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';

import { MealIcon } from '@/components/ui/mealicon';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import IMeal from '@/types/interfaces/IMeal';
import { MealType } from '@/types/enums/mealType';
import { IngredientUnit } from '@/types/enums/ingredientUnit';

//This is just for testing purposes. Needs to be either gotten from API or passed in when this view is called

export const testMeal: IMeal = {
  date: new Date('2025-08-23T12:00:00'),
  type: MealType.Lunch,
  name: 'Chicken Stir Fry',
  description: 'A delicious chicken stir fry with vegetables and rice.',
  id: '1',
  ingredients: [
    {
      quantity: 200,
      ingredient: {
        name: 'Chicken Breast',
        unit: IngredientUnit.Grams,
        calories: 330,
        protein: 62,
        carbs: 0,
        fat: 7,
      },
    },
    {
      quantity: 2,
      ingredient: {
        name: 'Bell Pepper',
        unit: IngredientUnit.Pieces,
        calories: 330,
        protein: 62,
        carbs: 0,
        fat: 7,
      },
    },
    {
      quantity: 50,
      ingredient: {
        name: 'Broccoli',
        unit: IngredientUnit.Grams,
        calories: 330,
        protein: 62,
        carbs: 0,
        fat: 7,
      },
    },
    {
      quantity: 200,
      ingredient: {
        name: 'Rice',
        unit: IngredientUnit.Grams,
        calories: 330,
        protein: 62,
        carbs: 0,
        fat: 7,
      },
    },
  ],
  macros: { calories: 600, protein: 70, carbs: 80, fat: 10 },
  selected: true,
  servings: 2,
};

export default function MealDetails() {
  const router = useRouter();

  return (
    <>
      <div>
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="flex items-center gap-2 mb-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
      </div>
      <div className="grid gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              {testMeal.name}
            </CardTitle>
            <CardAction>
              <MealIcon type={testMeal.type} />
            </CardAction>
          </CardHeader>
          <CardContent>
            <img
              src="images/ChickenStyrFry.jpg"
              alt="Meal"
              className="w-full h-48 object-cover rounded-md"
            />
          </CardContent>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            {testMeal.description}
          </CardFooter>
        </Card>
        <Card>
          <IngredientsList></IngredientsList>
        </Card>
        <Card>
          <RecipeSteps></RecipeSteps>
        </Card>
      </div>
    </>
  );
}

export function IngredientsList() {
  return (
    <Table>
      <TableBody>
        {testMeal.ingredients.map((ingredient) => (
          <TableRow key={ingredient.ingredient.name}>
            <TableCell className="font-medium text-right w-1/2">
              {ingredient.ingredient.name}
            </TableCell>
            <TableCell className="">
              {ingredient.quantity.toString()} {ingredient.ingredient.unit}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export function RecipeSteps() {
  return (
    <p className="p-4">
      This is some recipe text. It should also support multiline. Now go watch
      some Family Guy Funny Moments on Youtube.
    </p>
  );
}
