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
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useMealsStore } from '@/lib/store/meals';
import React from 'react';
import IMeal from '@/types/interfaces/IMeal';
import Image from 'next/image';

//This is just for testing purposes. Needs to be either gotten from API or passed in when this view is called

export default function MealDetails() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();

  const meal = useMealsStore((s) => s.getMeal(id));

  if (!meal) {
    return <Card>Meal not found</Card>;
  }

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
              {meal.name}
            </CardTitle>
            <CardAction>
              <MealIcon type={meal.type} />
            </CardAction>
          </CardHeader>
          <CardContent>
            <Image
              src="/images/ChickenStyrFry.jpg"
              width={0}
              height={0}
              sizes="100vw"
              style={{ width: '100%', height: 'auto' }} // optional
              alt="Picture of prepared meal"
              className="rounded-md"
            />
          </CardContent>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            {meal.description}
          </CardFooter>
        </Card>
        <Card>
          <IngredientsList meal={meal} />
        </Card>
        <Card>
          <RecipeSteps></RecipeSteps>
        </Card>
      </div>
    </>
  );
}

export function IngredientsList({ meal }: { meal: IMeal }) {
  return (
    <Table>
      <TableBody>
        {meal.ingredients.map((ingredient) => (
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
