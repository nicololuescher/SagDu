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
import { useState } from "react";
import { createPortal } from "react-dom";

export default function Meals() {
  let previousDay = new Date().getDate();

  // Pull all meals from the store
  const mealsById = useMealsStore((s) => s.mealsById);
  const meals = React.useMemo(
    () => Object.values(mealsById).filter((m) => m.selected),
    [mealsById]
  );

  return (
    <Table className="caption-top">
      <TableCaption className="flex items-center justify-between">
        <span></span>
        <span>Upcoming meals</span>
        <Link href="/create-mealplan">
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
                <TableCell>
                  <div className="py-3 text-center text-sm font-semibold text-gray-500">
                    {meal.date.toDateString()}
                  </div>
                  <DayCard {...meal}></DayCard>
                </TableCell>
              </TableRow>
            );
          }
          
          return (
            <TableRow key={meal.date.toDateString() + meal.type}>
              <TableCell className="font-medium">
                <DayCard {...meal}></DayCard>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

export function DayCard(meal: IMeal) {
  const router = useRouter();
  const removeMeal = useMealsStore((s) => s.removeMeal);
  const { incrementSnack } = useUserStore();
  const [showDuck, setShowDuck] = useState(false);

  return (
    <div>
    <Card className="grid gap-4">
      <CardHeader>
        <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
          <div className="flex items-center gap-2">
            <MealIcon type={meal.type}></MealIcon>
            {meal.type}
          </div>
        </CardTitle>
        <CardDescription>{meal.date.toDateString()}</CardDescription>
        <CardAction>
          <Link href={`/mealDetails/${encodeURIComponent(meal.id)}`}>
            {/* Need to also pass the current meal */}
            <Eye />
          </Link>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-row gap-1.5 text-sm items-center justify-between">
        {meal.name}
        <div className="flex flex-row gap-2 mt-2">
          <Button variant="destructive" onClick={() => {
            setShowDuck(true);
            // Hide after animation duration (e.g., 3s)

            setTimeout(() => {
              removeMeal(meal.id)
              setShowDuck(false)
            }, 3000);
            }}>
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
            <img src={"/tamagochiSad.svg"}/>
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
