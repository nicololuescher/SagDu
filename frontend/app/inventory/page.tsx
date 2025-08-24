"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardAction,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

type InventoryItem = {
  id: number;
  name: string;
  amount: number;
  unit: string;
  diet: DietType;
};

type DietType = "vegan" | "vegetarian" | "none";

export default function Inventory() {
  const [items, setItems] = useState<InventoryItem[]>([
    { id: 1, name: "Apples", amount: 5, unit: "pcs", diet: "vegan" },
    { id: 2, name: "Milk", amount: 1, unit: "L", diet: "vegetarian" },
    { id: 3, name: "Flour", amount: 2, unit: "kg", diet: "vegan" },
    { id: 4, name: "Eggs", amount: 12, unit: "pcs", diet: "vegetarian" },
    { id: 5, name: "Chicken Breast", amount: 1, unit: "kg", diet: "none" },
  ]);

  const [changes, setChanges] = useState<Record<number, number>>({});

  const handleAmountChange = (id: number, newAmount: number) => {
    setChanges((prev) => ({ ...prev, [id]: newAmount }));
  };

  const confirmChanges = () => {
    setItems(
      (prev) =>
        prev
          .map((item) => {
            const newAmount =
              changes[item.id] !== undefined ? changes[item.id] : item.amount;
            return { ...item, amount: newAmount };
          })
          .filter((item) => item.amount > 0) // remove items with no quantity
    );
    setChanges({});
  };

  return (
    <div className="grid gap-4 p-4">
      {items.map((item) => (
        <Card key={item.id}>
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg">{item.name}</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                className="w-20"
                value={
                  changes[item.id] !== undefined
                    ? changes[item.id]
                    : item.amount
                }
                onChange={(e) =>
                  handleAmountChange(item.id, Number(e.target.value))
                }
                min={0}
              />
              <span>{item.unit}</span>
            </div>
          </CardHeader>
          <CardContent>
            <div>
              {item.diet === "vegan" && (
                <Badge variant="outline">🥦 Vegan</Badge>
              )}
              {item.diet === "vegetarian" && (
                <Badge variant="outline">🧀 Vegetarian</Badge>
              )}
              {item.diet === "none" && (
                <Badge variant="destructive">🍖 Meat</Badge>
              )}
            </div>
          </CardContent>
        </Card>
      ))}

      <Button onClick={confirmChanges}>Confirm Changes</Button>
    </div>
  );
}
