"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { Toaster } from "@/components/ui/sonner";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

type ShoppingItem = {
  id: number;
  name: string;
  amount: number;
  unit: string;
  diet: DietType;
};

type DietType = "vegan" | "vegetarian" | "none";

export default function ShoppingList() {
  const [items, setItems] = useState<ShoppingItem[]>([
    { id: 1, name: "Apples", amount: 5, unit: "pcs", diet: "vegan" },
    { id: 2, name: "Milk", amount: 1, unit: "L", diet: "vegetarian" },
    { id: 3, name: "Flour", amount: 2, unit: "kg", diet: "vegan" },
    { id: 4, name: "Eggs", amount: 12, unit: "pcs", diet: "vegetarian" },
    { id: 5, name: "Chicken Breast", amount: 1, unit: "kg", diet: "none" },
  ]);

  //This should in the future also add the Item to the inventory with the provided quantity
  const handleRemove = (id: number) => {
    const removedItem = items.find((i) => i.id === id);
    setItems((prev) => prev.filter((item) => item.id !== id));
    toast("Item was added to Inventory", {
      action: {
        label: "Undo",
        onClick: () =>
          removedItem && setItems((prev) => [...prev, removedItem]),
      },
    });
  };

  return (
    <div className="space-y-4 p-4">
      <AnimatePresence>
        {items.map((item) => (
          <motion.div
            key={item.id}
            initial={{ x: 0, opacity: 1 }}
            exit={{ x: 300, opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <motion.div
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              onDragEnd={(e, info) => {
                if (info.offset.x > 100) {
                  handleRemove(item.id);
                }
              }}
              whileDrag={{ scale: 1.05 }}
              className="relative"
            >
              <Card className="w-full hover:shadow-lg hover:scale-105 transition-transform duration-200">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-lg">{item.name}</CardTitle>
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
                  <Badge variant="secondary">
                    {item.amount} {item.unit}
                  </Badge>
                </CardHeader>
              </Card>
            </motion.div>
          </motion.div>
        ))}
      </AnimatePresence>
      {items.length === 0 && (
        <p className="text-center text-muted-foreground">Now get cookin! 🎉</p>
      )}
      {items.length !== 0 && (
        <p className="text-center text-sm text-muted-foreground">
          Total items: {items.length}
        </p>
      )}
    </div>
  );
}
