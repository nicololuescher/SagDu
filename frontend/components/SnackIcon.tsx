import { Cookie, Apple, Banana, Drumstick, CupSoda } from 'lucide-react';

export function SnackIcon(props: { itemValue: string }) {
  switch (props.itemValue) {
    case 'cookie':
      return <Cookie color="orange"></Cookie>;
    case 'apple':
      return <Apple color="red"></Apple>;
    case 'banana':
      return <Banana color="yellow"></Banana>;
    case 'drumstick':
      return <Drumstick color="brown"></Drumstick>;
    case 'cup-soda':
      return <CupSoda></CupSoda>;
  }
  return null;
}
