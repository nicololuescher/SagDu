import { Checkbox } from './ui/checkbox';
import { FormField, FormItem, FormControl, FormLabel } from './ui/form';

type CheckboxFieldProps = {
  name:
    | 'dietary.vegetarian'
    | 'dietary.vegan'
    | 'dietary.celiac'
    | 'dietary.lactose'
    | 'dietary.soy';
  label: string;
  control: any;
};

export function DietaryCheckbox({ name, label, control }: CheckboxFieldProps) {
  return (
    <FormField
      control={control}
      name={name as any}
      render={({ field }) => (
        <FormItem className="flex items-center gap-3 space-y-0">
          <FormControl>
            <Checkbox
              id={name}
              checked={!!field.value}
              onCheckedChange={(v) => field.onChange(v === true)} // ensure boolean
            />
          </FormControl>
          <div className="grid leading-tight">
            <FormLabel className="text-base">{label}</FormLabel>
          </div>
        </FormItem>
      )}
    />
  );
}
