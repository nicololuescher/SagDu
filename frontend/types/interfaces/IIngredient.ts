import { IngredientUnit } from '../enums/ingredientUnit';

export default interface IIngredient {
  name: string;
  unit: IngredientUnit;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}
