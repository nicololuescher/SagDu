// components/site-header.tsx
'use client';

import Link from 'next/link';
import { Menu, Home, Users, Settings, LogIn } from 'lucide-react';
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
    <div className="mx-auto flex h-14 w-full max-w-screen-sm items-center justify-between px-3">
      {/* Drawer (mobile nav) */}
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="Open menu">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-[85vw] p-0">
          <div className="px-4 pb-3 pt-4">
            <SheetHeader>
              <SheetTitle className="text-left">My App</SheetTitle>
            </SheetHeader>
          </div>
          <Separator />

          <nav className="flex flex-col gap-1 p-2">
            <SheetClose asChild>
              <Link
                href="/"
                className="rounded-md px-3 py-3 text-base hover:bg-muted"
              >
                <div className="flex items-center gap-3">
                  <Home className="h-4 w-4" /> <span>Home</span>
                </div>
              </Link>
            </SheetClose>
            <SheetClose asChild>
              <Link
                href="/meals"
                className="rounded-md px-3 py-3 text-base hover:bg-muted"
              >
                <div className="flex items-center gap-3">
                  <Home className="h-4 w-4" /> <span>Meals</span>
                </div>
              </Link>
            </SheetClose>
            <SheetClose asChild>
              <Link
                href="/users"
                className="rounded-md px-3 py-3 text-base hover:bg-muted"
              >
                <div className="flex items-center gap-3">
                  <Users className="h-4 w-4" /> <span>Users</span>
                </div>
              </Link>
            </SheetClose>
            <SheetClose asChild>
              <Link
                href="/settings"
                className="rounded-md px-3 py-3 text-base hover:bg-muted"
              >
                <div className="flex items-center gap-3">
                  <Settings className="h-4 w-4" /> <span>Settings</span>
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
                  <LogIn className="h-4 w-4" /> <span>Login</span>
                </div>
              </Link>
            </SheetClose>
          </nav>
        </SheetContent>
      </Sheet>

      {/* Brand */}
      <Link href="/" className="font-semibold tracking-tight">
        My App
      </Link>

      {/* Right action */}
      <Link href="/login">
        <Button variant="outline" size="sm">
          Sign in
        </Button>
      </Link>
    </div>
  );
}
