'use client';

import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Eye } from 'lucide-react';
import Link from "next/link";
import { MealIcon } from "@/components/ui/mealicon";

//This is just for testing. Will need to implement a correct struct later
type Day = {
  date: Date
  meal: string
  type: string
}

const mockDays: Day[] = [
  { date: new Date("2025-08-25T12:00:00"), meal: "testmeal", type: "breakfast" },
  { date: new Date("2025-08-25T12:00:00"), meal: "testLunch", type: "lunch" },
  { date: new Date("2025-08-26T12:00:00"), meal: "testmeal2", type: "lunch" },
  { date: new Date("2025-08-27T12:00:00"), meal: "testmeal3", type: "supper" },
  { date: new Date("2025-08-28T12:00:00"), meal: "testmeal4", type: "breakfast" },
  { date: new Date("2025-08-29T12:00:00"), meal: "testmeal5", type: "error" },
  { date: new Date("2025-08-30T12:00:00"), meal: "testmeal6", type: "lunch" },
  { date: new Date("2025-08-31T12:00:00"), meal: "testmeal7", type: "breakfast" }
]

export default function Meals() {
  let previousDay = mockDays[0].date.getDate();

  return (
    <Table className="caption-top">
      <TableCaption>Upcoming meals</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[100px]">
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {mockDays.map((day: Day) => {
          const showSeparator = previousDay !== day.date.getDate();
          previousDay = day.date.getDate();

          if (showSeparator) {
            return (
              <TableRow>
                <TableCell className="font-medium">
                <hr className="my-4 border-gray-300" />
                <DayCard {...day}></DayCard>
                </TableCell>
              </TableRow>
            );
          }

          //I want to show a verticle line but that breaks things because its inside a table
          return (
            <TableRow>

              <TableCell className="font-medium">
                <DayCard {...day}></DayCard>
              </TableCell>
            </TableRow>);

        })}
      </TableBody>
    </Table>
  );
}

export function DayCard(day: Day) {
  return (
    <Card className="grid gap-4">
      <CardHeader>
        <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
          <div className="flex items-center gap-2">
            <MealIcon type={day.type}></MealIcon>
            {day.date.toLocaleDateString("en-US", { weekday: "long" })}
          </div>
        </CardTitle>
        <CardDescription>{day.date.toDateString()}</CardDescription>
        <CardAction>
          <Link href="/mealDetails"> {/* Need to also pass the current meal */}
            <Eye>
            </Eye>
          </Link>
        </CardAction>
      </CardHeader>
      <CardContent className="flex-col items-start gap-1.5 text-sm">
        <p>{day.meal}</p>
      </CardContent>
    </Card>
  )
}


