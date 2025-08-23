// components/people-stepper.tsx
'use client';

import * as React from 'react';
import { Minus, Plus, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils'; // optional helper; remove if you don't use it
import { useMeal, useUpdateMeal } from '@/lib/store/meals';

type PeopleStepperProps = {
  value?: number;
  defaultValue?: number;
  onChange?: (n: number) => void;
  min?: number;
  max?: number;
  step?: number;
  name?: string;
  className?: string;
};

export function PeopleStepper({
  value,
  defaultValue = 1,
  onChange,
  min = 1,
  max = 20,
  step = 1,
  name,
  className,
}: PeopleStepperProps) {
  const [internal, setInternal] = React.useState<number>(defaultValue);
  const val = value ?? internal;

  const setVal = (n: number) => {
    const clamped = Math.min(max, Math.max(min, Math.round(n)));
    onChange?.(clamped);
    if (value === undefined) setInternal(clamped);
  };

  const dec = () => setVal(val - step);
  const inc = () => setVal(val + step);

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.currentTarget.valueAsNumber;
    if (Number.isFinite(v)) setVal(v);
    // allow clearing to retype; do nothing if empty
  };

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="h-9 w-9"
        onClick={dec}
        disabled={val <= min}
        aria-label="Decrease people"
      >
        <Minus className="h-4 w-4" />
      </Button>

      <Input
        id={name}
        name={name}
        type="number"
        inputMode="numeric"
        pattern="[0-9]*"
        className="h-9 w-16 text-center"
        value={String(val)}
        onChange={handleInput}
        onWheel={(e) => (e.currentTarget as HTMLInputElement).blur()} // avoid scroll changing value
        min={min}
        max={max}
        aria-label="Number of people"
        role="spinbutton"
        aria-valuenow={val}
        aria-valuemin={min}
        aria-valuemax={max}
      />

      <Button
        type="button"
        variant="outline"
        size="icon"
        className="h-9 w-9"
        onClick={inc}
        disabled={val >= max}
        aria-label="Increase people"
      >
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  );
}
