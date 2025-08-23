import { IngredientUnit } from '../enums/ingredientUnit';
import { MealType } from '../enums/mealType';
import IIngredient from './IIngredient';

export default interface IMeal {
  id: string;
  date: Date;
  description: string;
  servings: number;
  ingredients: { quantity: number; ingredient: IIngredient }[];
  type: MealType;
  selected: boolean;
  name: string;
  macros: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
}
