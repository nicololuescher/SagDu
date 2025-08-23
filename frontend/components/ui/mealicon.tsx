import { MealType } from '@/types/enums/mealType';
import { Coffee, Sandwich, Utensils, CircleOff } from 'lucide-react';

//I don't like how react handles having a single parameter
export function MealIcon({ type }: { type: MealType }) {
  switch (type) {
    case MealType.Breakfast:
      return <Coffee />;
    case MealType.Lunch:
      return <Sandwich />;
    case MealType.Dinner:
      return <Utensils />;
    default:
      return <CircleOff />;
  }
}
