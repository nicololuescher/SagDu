import { Minus, Plus, BarChart } from 'lucide-react';
import { Button } from './ui/button';
import { z } from 'zod';

import {
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from './ui/drawer';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from './ui/card';
import { Form, FormDescription } from './ui/form';
import { DietaryCheckbox } from './dietary-checkbox';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import React from 'react';
import { useUpdateMeal } from '@/lib/store/meals';

const PreferencesSchema = z.object({
  dietary: z.object({
    vegetarian: z.boolean(),
    vegan: z.boolean(),
    celiac: z.boolean(),
    lactose: z.boolean(),
    soy: z.boolean(),
  }),
});

type PreferencesValues = z.infer<typeof PreferencesSchema>;
const DEFAULTS: PreferencesValues = {
  dietary: {
    vegetarian: false,
    vegan: false,
    celiac: false,
    lactose: false,
    soy: false,
  },
};

export function EditDrawer({
  id,
  setDrawerOpen,
}: {
  id: string;
  setDrawerOpen: (id: string) => void;
}) {
  const form = useForm<PreferencesValues>({
    resolver: zodResolver(PreferencesSchema),
    defaultValues: DEFAULTS,
    mode: 'onChange',
  });

  const [saving, setSaving] = React.useState(false);

  const updateMeal = useUpdateMeal();

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

  const save = () => {
    updateMeal(id, { name: 'Updated Menu' }); // Example function to update meal based on preferences
    setDrawerOpen('');
  };

  return (
    <DrawerContent>
      <div className="mx-auto w-full max-w-sm">
        <DrawerHeader>
          <DrawerTitle>Replace Meal</DrawerTitle>
          <DrawerDescription>Adjust your preferences.</DrawerDescription>
        </DrawerHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                  You can pick multiple. (Vegan implies vegetarian; select both
                  if you need strict vegan filtering.)
                </FormDescription>
              </CardContent>
            </Card>
          </form>
        </Form>
        <DrawerFooter>
          <Button onClick={() => save()}>Replace</Button>
          <Button variant="outline" onClick={() => setDrawerOpen('')}>
            Close
          </Button>
        </DrawerFooter>
      </div>
    </DrawerContent>
  );
}
