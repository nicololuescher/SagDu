'use client';

import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableRow,
} from '@/components/ui/table';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Cookie, Eye, Plus } from 'lucide-react';
import Link from 'next/link';
import { MealIcon } from '@/components/ui/mealicon';
import { Button } from '@/components/ui/button';
import IMeal from '@/types/interfaces/IMeal';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { useMealsStore } from '@/lib/store/meals';
import { useUserStore } from '@/lib/store/user';
import React from 'react';
import { Snacks } from '@/types/enums/ISnacks';
import { useState } from 'react';
import { createPortal } from 'react-dom';

export default function Meals() {
  let previousDay = new Date().getDate();

  // Pull all meals from the store
  const mealsById = useMealsStore((s) => s.mealsById);
  const meals = React.useMemo(
    () => Object.values(mealsById).filter((m) => m.selected),
    [mealsById]
  );

  return (
    <div className="w-full max-w-full overflow-x-hidden">
      <Table className="caption-top table-fixed w-full">
        <TableCaption className="flex items-center justify-between w-full min-w-0">
          <span className="shrink-0" />
          <span className="mx-2 flex-1 min-w-0 truncate text-center">
            Upcoming meals
          </span>
          <Link
            href="/create-mealplan"
            aria-label="Create meal plan"
            className="shrink-0"
          >
            <Plus />
          </Link>
        </TableCaption>

        <TableBody>
          {meals.map((meal: IMeal) => {
            const showSeparator = previousDay !== meal.date.getDate();
            previousDay = meal.date.getDate();

            if (showSeparator) {
              return (
                <TableRow key={meal.date.toDateString() + meal.type}>
                  <TableCell className="w-full align-top">
                    <div className="py-3 text-center text-sm font-semibold text-gray-500">
                      {meal.date.toDateString()}
                    </div>
                    <DayCard {...meal} />
                  </TableCell>
                </TableRow>
              );
            }

            return (
              <TableRow key={meal.date.toDateString() + meal.type}>
                <TableCell className="w-full align-top">
                  <DayCard {...meal} />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

export function DayCard(meal: IMeal) {
  const router = useRouter();
  const removeMeal = useMealsStore((s) => s.removeMeal);
  const { incrementSnack } = useUserStore();
  const [showDuck, setShowDuck] = useState(false);

  return (
    <div>
      <Card className="grid gap-4 w-full min-w-0 overflow-hidden">
        <CardHeader className="min-w-0">
          {/* Header row: icon + title/desc on the left, action on the right */}
          <div className="flex items-start gap-2 min-w-0">
            <div className="shrink-0 mt-1">
              <MealIcon type={meal.type} />
            </div>

            <div className="flex-1 min-w-0">
              <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl truncate">
                {/* Single-line ellipsis for the name; allow breaking long tokens */}
                <span className="block min-w-0 truncate break-words">
                  {meal.name}
                </span>
              </CardTitle>
              <CardDescription className="min-w-0 overflow-hidden text-ellipsis">
                {meal.date.toDateString()}
              </CardDescription>
            </div>

            <CardAction className="shrink-0 ml-2">
              <Link href={`/mealDetails/${encodeURIComponent(meal.id)}`}>
                <Eye />
              </Link>
            </CardAction>
          </div>
        </CardHeader>

        <CardContent className="flex flex-row gap-2 text-sm items-start min-w-0">
          {/* Description: single-line ellipsis to avoid horizontal scroll */}
          <p className="flex-1 min-w-0 overflow-hidden text-ellipsis whitespace-nowrap break-words">
            {meal.description}
          </p>

          {/* Buttons shouldn't shrink and cause overflow */}
          <div className="flex flex-row gap-2 mt-2 shrink-0">
            <Button
              variant="destructive"
              onClick={() => {
                setShowDuck(true);
                // Hide after animation duration (e.g., 3s)

                setTimeout(() => {
                  removeMeal(meal.id);
                  setShowDuck(false);
                }, 3000);
              }}
            >
              Missed
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                incrementSnack(Snacks.COOKIE, 5);
                toast('You Received:', {
                  description: (
                    <span className="flex flex-row gap-1 text-orange-500">
                      5
                      <Cookie className="text-orange-500 inline-block" />
                      <span>You can feed your Tamagochi now!</span>
                    </span>
                  ),
                  action: {
                    label: 'Feed',
                    onClick: () => router.push('/tamagochi'),
                  },
                });
                removeMeal(meal.id);
              }}
            >
              Eat
            </Button>
          </div>
        </CardContent>
      </Card>
      <div className="relative">
        {showDuck &&
          createPortal(
            <div className="fixed bottom-[-200px] left-1/2 transform -translate-x-1/2 z-[9999] animate-duck ">
              <img src={'/tamagochiSad.svg'} />
            </div>,
            document.body
          )}

        <style jsx>{`
          @keyframes duckPop {
            0% {
              bottom: -200px;
              transform: translateX(-20%) scale(3);
              opacity: 0;
            }
            30% {
              bottom: 50px;
              transform: translateX(-10%) scale(3);
              opacity: 1;
            }
            70% {
              bottom: 50px;
              transform: translateX(10%) scale(3);
              opacity: 1;
            }
            70.001% {
              bottom: 50px;
              transform: translateX(10%) scale(3) scaleX(-1);
              opacity: 1;
            }
            100% {
              bottom: 0px;
              transform: translateX(-100%) scale(3) rotate(-25deg) scaleX(-1);
              opacity: 0;
            }
          }
          .animate-duck {
            animation: duckPop 3s ease-in-out forwards;
          }
        `}</style>
      </div>
    </div>
  );
}
