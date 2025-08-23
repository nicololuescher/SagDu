// app/meals/create/page.tsx
'use client';

import * as React from 'react';
import { Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { PeopleStepper } from '@/components/people-stepper';
import { useMealsStore, useUpdateMeal } from '@/lib/store/meals'; // adjust path if needed
import IMeal from '@/types/interfaces/IMeal';
import { Drawer } from '@/components/ui/drawer';
import { EditDrawer } from '@/components/edit-drawer';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type MealType = 'breakfast' | 'lunch' | 'dinner';
const MEALS: MealType[] = ['breakfast', 'lunch', 'dinner'];

const MAX_COLUMNS = 14;

export default function CreateMealsPage() {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);
  const router = useRouter();

  const [drawerOpen, setDrawerOpen] = React.useState('');

  // Pull all meals from the store
  const mealsById = useMealsStore((s) => s.mealsById);
  const meals = React.useMemo(() => Object.values(mealsById), [mealsById]);

  // Build columns (unique yyyy-mm-dd) for today → future, max 14
  const columns = React.useMemo(() => {
    const today = atLocalMidnight(new Date());
    const keys = new Set<string>();
    for (const m of meals) {
      const d = atLocalMidnight(m.date);
      if (d >= today) keys.add(toYMDLocal(d));
    }
    // sort ascending, keep first 14
    return Array.from(keys)
      .sort()
      .slice(0, MAX_COLUMNS)
      .map((key) => ({
        key,
        ...(mounted ? fmtLocal(new Date(key)) : fmtUTC(new Date(key))), // SSR-safe
      }));
  }, [meals, mounted]);

  const index = React.useMemo(() => {
    const map = new Map<string, IMeal>();
    for (const m of meals) {
      const key = `${toYMDLocal(m.date)}:${m.type}`;
      map.set(key, m);
    }
    return map;
  }, [meals]);

  const updateMeal = useUpdateMeal();

  React.useEffect(() => {
    console.log('Meals updated:', meals);
    console.log('Drawer open: ', !!drawerOpen);
  }, [meals, drawerOpen]);

  async function onSave() {
    await fetch('/api/meals/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: meals.map((m) => ({
          id: m.id,
          date: m.date,
          type: m.type,
        })),
      }),
    });
    // TODO: toast success

    router.push('/meals');
  }

  if (!mounted || !meals) {
    return (
      <div className="grid gap-3" style={{ gridTemplateRows: 'auto 1fr' }}>
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">Create Meals</h1>
          <Button disabled>Save</Button>
        </div>
        <div className="min-h-0 overflow-y-auto">
          <div className="h-full overflow-x-auto p-4 text-sm text-muted-foreground">
            Loading…
          </div>
        </div>
      </div>
    );
  }

  const selectedCount = meals.reduce((acc, m) => acc + (m.selected ? 1 : 0), 0);

  return (
    <div
      className="grid gap-3 max-h-full"
      style={{ gridTemplateRows: 'auto 1fr' }}
    >
      {/* Actions */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Create Meals</h1>
        <Button onClick={onSave} disabled={selectedCount === 0}>
          Save ({selectedCount})
        </Button>
      </div>

      {/* Scroll area for table */}
      <div className="min-h-0 overflow-y-auto">
        <div className="h-full overflow-x-auto">
          <Table className="min-w-full table-fixed">
            <colgroup>
              <col className="w-[80px]" />
              {columns.map((c) => (
                <col key={c.key} className="w-[168px]" />
              ))}
            </colgroup>

            {/* Sticky header */}
            <TableHeader className="sticky top-0 z-30 bg-background">
              <TableRow className="h-12">
                <TableHead className="sticky left-0 z-10 bg-background w-[80px] shadow-[2px_0_0_0_hsl(var(--border))]">
                  Meal Type
                </TableHead>
                {columns.map((c) => (
                  <TableHead key={c.key} className="text-center">
                    <div className="flex flex-col items-center leading-tight">
                      <span
                        suppressHydrationWarning
                        className="text-xs text-muted-foreground"
                      >
                        {c.weekday}
                      </span>
                      <span suppressHydrationWarning className="font-medium">
                        {c.monthDay}
                      </span>
                      {c.isToday && (
                        <span className="mt-1 rounded bg-green-200 px-1.5 py-0.5 text-[10px]">
                          Today
                        </span>
                      )}
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>

            {/* Rows */}
            <TableBody>
              {MEALS.map((mealType) => (
                <TableRow className="hover:shadow-md hover:bg-muted/30 transition-all duration-150"
                  key={mealType}
                  style={{
                    // Split remaining height evenly between 3 rows
                    height: 'calc((h-full - 100px / 3)',
                  }}
                >
                  <TableCell className="sticky left-0 z-10 bg-background font-medium capitalize shadow-[2px_0_0_0_hsl(var(--border))]">
                    {mealType}
                  </TableCell>

                  {columns.map((c) => {
                    const k = `${c.key}:${mealType}`;
                    const meal = index.get(k); // IMeal | undefined
                    const checked = !!meal?.selected;
                    const servings = meal?.servings ?? 1;

                    return (
                      <TableCell key={k} className="p-2">
                        <div className="flex h-full">
                          <div className="flex h-full w-full flex-col rounded-lg border bg-muted/20 p-3">
                            {/* header: checkbox + cog */}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Checkbox
                                  checked={checked}
                                  onCheckedChange={(v) => {
                                    if (!meal) return;
                                    updateMeal(meal.id, {
                                      selected: v === true,
                                    });
                                  }}
                                  aria-label={`Select ${mealType} on ${c.a11y}`}
                                  disabled={!meal}
                                />
                                <span className="text-xs text-muted-foreground">
                                  {meal ? 'Select' : 'No meal'}
                                </span>
                              </div>

                              {/*                               <Link
                                href={`/meals/${c.key}/${mealType}`}
                                className="inline-flex rounded p-2 hover:bg-muted"
                                aria-label={`Edit ${mealType} details for ${c.a11y}`}
                              > */}
                              <Settings
                                className="h-5 w-5"
                                onClick={() => setDrawerOpen(meal?.id || '')}
                              />
                            </div>

                            {/* content */}
                            <Link href="/mealDetails">
                              <div className="mt-2 grid gap-2">
                                <div className="h-2 w-full overflow-hidden rounded bg-muted">
                                  <div className="h-2 w-0 bg-foreground/30" />
                                </div>

                                <div className="flex h-6 items-center text-sm">
                                  <span className="truncate">
                                    {meal?.name ?? '—'}
                                  </span>
                                </div>

                                <div className="flex flex-col text-xs text-muted-foreground">
                                  <span>Protein: {meal?.macros.protein}</span>
                                  <span>Fat: {meal?.macros.fat}</span>
                                  <span>Carbs: {meal?.macros.carbs}</span>
                                  <span>kcal: {meal?.macros.calories}</span>
                                </div>
                              </div>
                            </Link>

                            <div className="mt-2">
                              <PeopleStepper
                                value={servings}
                                onChange={(n) =>
                                  meal && updateMeal(meal.id, { servings: n })
                                }
                                min={1}
                                max={12}
                              />
                            </div>
                          </div>
                        </div>
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
      <Drawer
        open={!!drawerOpen}
        onOpenChange={() => setDrawerOpen(drawerOpen)}
      >
        <EditDrawer id={drawerOpen} setDrawerOpen={setDrawerOpen} />
      </Drawer>
    </div>
  );
}

/* ---------- helpers ---------- */

// “Today” at local midnight
function atLocalMidnight(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

// YYYY-MM-DD (local)
function toYMDLocal(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// Header labels (local vs. deterministic UTC for SSR)
function fmtLocal(d: Date) {
  const weekday = new Intl.DateTimeFormat(undefined, {
    weekday: 'short',
  }).format(d);
  const monthDay = new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
  }).format(d);
  const a11y = new Intl.DateTimeFormat(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(d);
  const todayKey = toYMDLocal(new Date());
  return { weekday, monthDay, a11y, isToday: toYMDLocal(d) === todayKey };
}
function fmtUTC(d: Date) {
  const tz = 'UTC';
  const locale = 'en-US';
  const weekday = new Intl.DateTimeFormat(locale, {
    weekday: 'short',
    timeZone: tz,
  }).format(d);
  const monthDay = new Intl.DateTimeFormat(locale, {
    month: 'short',
    day: 'numeric',
    timeZone: tz,
  }).format(d);
  const a11y = new Intl.DateTimeFormat(locale, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: tz,
  }).format(d);
  const today = new Date();
  const todayUTC = new Date(
    Date.UTC(today.getFullYear(), today.getMonth(), today.getDate())
  );
  const todayKey = `${todayUTC.getUTCFullYear()}-${String(
    todayUTC.getUTCMonth() + 1
  ).padStart(2, '0')}-${String(todayUTC.getUTCDate()).padStart(2, '0')}`;
  const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(
    2,
    '0'
  )}-${String(d.getUTCDate()).padStart(2, '0')}`;
  return { weekday, monthDay, a11y, isToday: key === todayKey };
}
