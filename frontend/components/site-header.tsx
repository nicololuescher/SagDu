// components/site-header.tsx
'use client';

import Link from 'next/link';
import {
  Menu,
  Settings,
  LogOut,
  CircleUser,
  Home,
  Users,
  WalletCards,
  Egg,
  Utensils,
  Warehouse,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetClose,
} from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';

export function SiteHeader() {
  return (
    <div className="mx-auto flex h-full w-full max-w-screen-sm items-center justify-between px-3">
      {/* Drawer (mobile nav) */}
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="Open menu">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-[85vw] p-0">
          <div className="px-4 pb-3 pt-4">
            <SheetHeader className="flex flex-row gap-3">
              <CircleUser className="h-6 w-6" />

              <SheetTitle className="text-left">Säg Du</SheetTitle>
            </SheetHeader>
          </div>
          <Separator />

          <nav className="flex flex-col gap-1 p-2">
            <SheetClose asChild>
              <Link
                href="/meals"
                className="rounded-md px-3 py-3 text-base hover:bg-muted"
              >
                <div className="flex items-center gap-3">
                  <Utensils className="h-4 w-4" /> <span>Meals</span>
                </div>
              </Link>
            </SheetClose>
                        <SheetClose asChild>
              <Link
                href="/shoppingList"
                className="rounded-md px-3 py-3 text-base hover:bg-muted"
              >
                <div className="flex items-center gap-3">
                  <WalletCards className="h-4 w-4" /> <span>Shopping List</span>
                </div>
              </Link>
            </SheetClose>
            <SheetClose asChild>
              <Link
                href="/inventory"
                className="rounded-md px-3 py-3 text-base hover:bg-muted"
              >
                <div className="flex items-center gap-3">
                  <Warehouse className="h-4 w-4" /> <span>Inventory</span>
                </div>
              </Link>
            </SheetClose>
            <SheetClose asChild>
              <Link
                href="/tamagochi"
                className="rounded-md px-3 py-3 text-base hover:bg-muted"
              >
                <div className="flex items-center gap-3">
                  <Egg className="h-4 w-4" /> <span>SagDuck</span>
                </div>
              </Link>
            </SheetClose>
            <SheetClose asChild>
              <Link
                href="/preferences"
                className="rounded-md px-3 py-3 text-base hover:bg-muted"
              >
                <div className="flex items-center gap-3">
                  <Settings className="h-4 w-4" /> <span>Preferences</span>
                </div>
              </Link>
            </SheetClose>
            <Separator className="my-2" />
            <SheetClose asChild>
              <Link
                href="/login"
                className="rounded-md px-3 py-3 text-base hover:bg-muted"
              >
                <div className="flex items-center gap-3">
                  <LogOut className="h-4 w-4" /> <span>Logout</span>
                </div>
              </Link>
            </SheetClose>
          </nav>
        </SheetContent>
      </Sheet>

      {/* Brand */}
      <Link href="/meals" className="font-semibold tracking-tight">
        Säg Du
      </Link>

      {/* Right action */}
      <div></div>
    </div>
  );
}
