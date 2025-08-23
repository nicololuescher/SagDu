import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { Toaster } from "@/components/ui/sonner";
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Säg Du',
  description: 'Säg Du - Meal planning made simple',
};

import './globals.css';
import { SiteHeader } from '@/components/site-header';
import QueryProvider from '@/components/query-provider';
import MealsBridge from '@/components/meals-bridge';
import UserBridge from '@/components/user-bridge';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-dvh overflow-hidden bg-background text-foreground">
        <Toaster />
        <QueryProvider>
          <MealsBridge />
          <UserBridge />

          <header className="fixed inset-x-0 top-0 z-40 h-[var(--header-h)] border-b bg-background">
            <div className="h-full">
              <SiteHeader />
            </div>
          </header>

          <main className="h-[100svh] overflow-auto pt-[var(--header-h)]">
            {children}
          </main>
        </QueryProvider>
      </body>
    </html>
  );
}
