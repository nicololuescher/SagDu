import { Card, CardHeader, CardTitle, CardFooter, CardAction, CardContent } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableRow,
} from "@/components/ui/table"

import { MealIcon } from "@/components/ui/mealicon"

//This is just for testing purposes. Needs to be either gotten from API or passed in when this view is called
export type Meal = {
  user: Number
  date: Date
  type: string
  info: MealInfo
  ingredients: MealIngredients[]
}

export type MealInfo = {
  name: string
  description: string
  people: Number
}

export type MealIngredients = {
  name: string
  unit: string
  quantity: Number
}

export const testMeal: Meal = {
  user: 1,
  date: new Date("2025-08-23T12:00:00"),
  type: "Lunch",
  info: {
    name: "Chicken Stir Fry",
    description: "A tasty stir fry with chicken and vegetables.",
    people: 2,
  },
  ingredients: [
    { name: "Chicken Breast", unit: "grams", quantity: 300 },
    { name: "Bell Pepper", unit: "pieces", quantity: 2 },
    { name: "Soy Sauce", unit: "tbsp", quantity: 2 },
    { name: "Olive Oil", unit: "tbsp", quantity: 1 },
  ],
};

export default function MealDetails() {
  return (
    <div className="grid gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {testMeal.info.name}
          </CardTitle>
          <CardAction>
            <MealIcon type={testMeal.type}></MealIcon>
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
          {testMeal.info.description}
        </CardFooter>
      </Card>
      <Card>
        <IngredientsList></IngredientsList>
      </Card>
      <Card>
        <RecipeSteps></RecipeSteps>
      </Card>
    </div>
  )
}

export function IngredientsList() {
  return (
    <Table>
      <TableBody>
        {testMeal.ingredients.map((ingredient) => (
          <TableRow key={ingredient.name}>
            <TableCell className="font-medium text-right w-1/2">{ingredient.name}</TableCell>
            <TableCell className="">{ingredient.quantity.toString()} {ingredient.unit}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

export function RecipeSteps() {
  return (
    <p className="p-4">This is some recipe text. It should also support multiline. Now go watch some Family Guy Funny Moments on Youtube.</p>
  )
}


