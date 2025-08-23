// app/settings/page.tsx
'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
// import { Label } from '@/components/ui/label' // (unused, safe to remove)
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { useQuery } from '@tanstack/react-query';

// ---- Schema ----
const pctRange = z
  .tuple([z.number(), z.number()])
  .refine(([min, max]) => min < max, { message: 'Min must be less than max' })
  .refine(([min, max]) => min >= 0 && max <= 100, {
    message: 'Range must be between 0 and 100',
  });

const kcalRange = z
  .tuple([z.number(), z.number()])
  .refine(([min, max]) => min < max, { message: 'Min must be less than max' })
  .refine(([min, max]) => min >= 800 && max <= 5000, {
    message: 'Range must be 800–5000 kcal',
  });

const PreferencesSchema = z.object({
  dietary: z.object({
    vegetarian: z.boolean(),
    vegan: z.boolean(),
    celiac: z.boolean(),
    lactose: z.boolean(),
    soy: z.boolean(),
  }),
  macros: z.object({
    protein: pctRange,
    fat: pctRange,
    carbs: pctRange,
  }),
  calories: kcalRange,
});
type PreferencesValues = z.infer<typeof PreferencesSchema>;

const PreferencesServerPayload = z.object({
  dietary: z
    .object({
      vegetarian: z.boolean().optional(),
      vegan: z.boolean().optional(),
      celiac: z.boolean().optional(),
      lactose: z.boolean().optional(),
      soy: z.boolean().optional(),
    })
    .optional(),
  macros: z
    .object({
      protein: pctRange.optional(),
      fat: pctRange.optional(),
      carbs: pctRange.optional(),
    })
    .optional(),
  calories: kcalRange.optional(),
});
type PreferencesServerPayload = z.infer<typeof PreferencesServerPayload>;

// sensible mobile defaults
const DEFAULTS: PreferencesValues = {
  dietary: {
    vegetarian: false,
    vegan: false,
    celiac: false,
    lactose: false,
    soy: false,
  },
  macros: {
    protein: [20, 30],
    fat: [20, 35],
    carbs: [40, 60],
  },
  calories: [1800, 2400],
};

export default function SettingsPage() {
  const form = useForm<PreferencesValues>({
    resolver: zodResolver(PreferencesSchema),
    defaultValues: DEFAULTS,
    mode: 'onChange',
  });
  const [saving, setSaving] = React.useState(false);
  const values = form.watch();

  const { data } = useQuery({
    queryKey: ['preferences'],
    queryFn: async (): Promise<PreferencesServerPayload> => {
      const r = await fetch('/api/preferences');
      const j = await r.json();
      return PreferencesServerPayload.parse(j); // allow missing fields safely
    },
  });

  React.useEffect(() => {
    if (!data) return;
    form.reset(
      {
        ...DEFAULTS,
        dietary: { ...DEFAULTS.dietary, ...data.dietary },
        macros: {
          protein: data.macros?.protein ?? DEFAULTS.macros.protein,
          fat: data.macros?.fat ?? DEFAULTS.macros.fat,
          carbs: data.macros?.carbs ?? DEFAULTS.macros.carbs,
        },
        calories: data.calories ?? DEFAULTS.calories,
      },
      { keepDirtyValues: true } // optional: preserve what the user already changed
    );
  }, [data, form]);

  async function onSubmit(data: PreferencesValues) {
    setSaving(true);
    try {
      // POST to your API (replace with real endpoint or React Query mutation)
      const res = await fetch('/api/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to save');
    } catch (e) {
      console.error(e);
      // You could surface a toast here
    } finally {
      setSaving(false);
    }
  }

  function resetDefaults() {
    form.reset(DEFAULTS);
  }

  return (
    <div className="mx-auto w-full max-w-screen-sm space-y-6">
      <h1 className="text-xl font-semibold">Preferences</h1>
      <p className="text-sm text-muted-foreground">
        Tune dietary preferences and nutrition goals.
      </p>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Dietary */}
          <Card>
            <CardHeader>
              <CardTitle>Food preferences</CardTitle>
              <CardDescription>Select any that apply.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              <DietaryCheckbox
                name="dietary.vegetarian"
                label="Vegetarian"
                control={form.control}
              />
              <DietaryCheckbox
                name="dietary.vegan"
                label="Vegan"
                control={form.control}
              />
              <DietaryCheckbox
                name="dietary.celiac"
                label="Celiac (gluten-free)"
                control={form.control}
              />
              <DietaryCheckbox
                name="dietary.lactose"
                label="Lactose intolerance"
                control={form.control}
              />
              <DietaryCheckbox
                name="dietary.soy"
                label="Soy intolerance"
                control={form.control}
              />
              <FormDescription className="mt-1">
                You can pick multiple. (Vegan implies vegetarian; select both if
                you need strict vegan filtering.)
              </FormDescription>
            </CardContent>
          </Card>

          {/* Macros */}
          <Card>
            <CardHeader>
              <CardTitle>Macro goals (ranges)</CardTitle>
              <CardDescription>
                Set target ranges as % of daily calories.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <RangeField
                label="Protein"
                control={form.control}
                name="macros.protein"
                min={0}
                max={100}
                step={1}
                unit="%"
              />
              <RangeField
                label="Fat"
                control={form.control}
                name="macros.fat"
                min={0}
                max={100}
                step={1}
                unit="%"
              />
              <RangeField
                label="Carbs"
                control={form.control}
                name="macros.carbs"
                min={0}
                max={100}
                step={1}
                unit="%"
              />
              <Separator />
              <p className="text-xs text-muted-foreground">
                Tip: Macros don’t have to add to exactly 100%, but many plans
                target ~100% combined.
              </p>
            </CardContent>
          </Card>

          {/* Calories */}
          <Card>
            <CardHeader>
              <CardTitle>Calorie goal</CardTitle>
              <CardDescription>Daily calorie range (kcal).</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <RangeField
                label="Calories"
                control={form.control}
                name="calories"
                min={800}
                max={5000}
                step={50}
                unit="kcal"
              />
            </CardContent>
          </Card>

          {/* Live summary (mobile-friendly) */}
          <Card>
            <CardHeader>
              <CardTitle>Summary</CardTitle>
              <CardDescription>Review your selections.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div>
                <span className="font-medium">Dietary: </span>
                {summarizeDietary(values.dietary) || 'None'}
              </div>
              <div>
                <span className="font-medium">Protein: </span>
                {values.macros.protein[0]}–{values.macros.protein[1]}%
              </div>
              <div>
                <span className="font-medium">Fat: </span>
                {values.macros.fat[0]}–{values.macros.fat[1]}%
              </div>
              <div>
                <span className="font-medium">Carbs: </span>
                {values.macros.carbs[0]}–{values.macros.carbs[1]}%
              </div>
              <div>
                <span className="font-medium">Calories: </span>
                {values.calories[0]}–{values.calories[1]} kcal
              </div>
            </CardContent>
            <CardFooter className="flex gap-2">
              <Button type="button" variant="outline" onClick={resetDefaults}>
                Reset
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? 'Saving…' : 'Save preferences'}
              </Button>
            </CardFooter>
          </Card>
        </form>
      </Form>
    </div>
  );
}

// ----- Helpers & small field components -----

function summarizeDietary(d: PreferencesValues['dietary']) {
  const picks = Object.entries(d)
    .filter(([, v]) => v)
    .map(([k]) => {
      if (k === 'celiac') return 'Celiac';
      if (k === 'lactose') return 'Lactose';
      return k[0].toUpperCase() + k.slice(1);
    });
  return picks.join(', ');
}

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

function DietaryCheckbox({ name, label, control }: CheckboxFieldProps) {
  return (
    <FormField
      control={control}
      name={name as any}
      render={({ field }) => (
        <FormItem className="flex items-center gap-3 space-y-0">
          <FormControl>
            <Checkbox
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

type RangeFieldProps = {
  name: 'macros.protein' | 'macros.fat' | 'macros.carbs' | 'calories';
  label: string;
  control: any;
  min: number;
  max: number;
  step?: number;
  unit?: string;
};

function RangeField({
  name,
  label,
  control,
  min,
  max,
  step = 1,
  unit = '',
}: RangeFieldProps) {
  return (
    <FormField
      control={control}
      name={name as any}
      render={({ field }) => {
        const val: number[] = (field.value as number[] | undefined) ?? [
          min,
          max,
        ];
        return (
          <FormItem className="space-y-2">
            <div className="flex items-center justify-between">
              <FormLabel>{label}</FormLabel>
              <span className="text-sm text-muted-foreground">
                {val[0]}–{val[1]} {unit}
              </span>
            </div>
            <FormControl>
              <Slider
                value={val}
                min={min}
                max={max}
                step={step}
                onValueChange={(v) => field.onChange(v as [number, number])}
                className="touch-pan-x"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        );
      }}
    />
  );
}
