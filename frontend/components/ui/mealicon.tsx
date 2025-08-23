import { Coffee, Sandwich, Utensils, CircleOff } from 'lucide-react';


//I don't like how react handles having a single parameter
export function MealIcon(props: { type: string }) {
  switch (props.type.toLowerCase()) {
    case "breakfast": return <Coffee />;
    case "lunch": return <Sandwich />;
    case "supper": return <Utensils />;
    default: return <CircleOff />;
  }
}
