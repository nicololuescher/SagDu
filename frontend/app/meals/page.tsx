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

//This is just for testing. Will need to implement a correct struct later
type Day = {
  dayOfWeek: string
  date: Date
  meal: string
}

const mockDays: Day[] = [
  { dayOfWeek: "Monday", date: new Date(), meal: "testmeal" },
  { dayOfWeek: "Tuesday", date: new Date(), meal: "testmeal2" },
  { dayOfWeek: "Wednesday", date: new Date(), meal: "testmeal3" },
  { dayOfWeek: "Thursday", date: new Date(), meal: "testmeal4" },
  { dayOfWeek: "Friday", date: new Date(), meal: "testmeal5" },
  { dayOfWeek: "Saturday", date: new Date(), meal: "testmeal6" },
  { dayOfWeek: "Tuesday", date: new Date(), meal: "testmeal7" }
]

export default function Meals() {
  return (
    <Table>
      <TableCaption>Upcoming days</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[100px]">
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {mockDays.map((day: Day) => (
          <TableRowDay {...day}></TableRowDay>
        ))}
      </TableBody>
    </Table>
  );
}

export function TableRowDay(day: Day) {
  return (
    <TableRow>
      <TableCell className="font-medium">
        <Card>
          <CardHeader>
            <CardTitle>{day.dayOfWeek}</CardTitle>
            <CardDescription>{day.date.toDateString()}</CardDescription>
            <CardAction>
              <Link href="/mealDetails"> {/* Need to also pass the current meal */}
                <Eye>
                </Eye>
              </Link>
            </CardAction>
          </CardHeader>
          <CardContent>
            <p>{day.meal}</p>
          </CardContent>
        </Card>
      </TableCell>
    </TableRow>
  )
}


