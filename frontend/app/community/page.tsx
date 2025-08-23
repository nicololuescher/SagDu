'use client';

import * as React from 'react';
import { Users, RefreshCw, Utensils } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import type IMeal from '@/types/interfaces/IMeal';
import { MealType } from '@/types/enums/mealType'; // ⬅️ adjust if your path differs
import { toast } from 'sonner';

type Friend = {
  id: string;
  name: string;
  initials: string;
  lastFed: Date;
  hp: number; // 0..100
  since: string;
};

type CommunityPost = {
  id: string;
  author: Friend;
  meal: IMeal;
};

/**
 * This page data is currently only mocked
 * Data should be fetched from an API
 * Meal type already exist in /types and follow the other implementation
 */
export default function CommunityPage() {
  const [mounted, setMounted] = React.useState(false);
  const [friends, setFriends] = React.useState<Friend[] | null>(null);
  const [feed, setFeed] = React.useState<CommunityPost[] | null>(null);

  React.useEffect(() => {
    setMounted(true);
    const names = DEFAULT_NAMES;
    const fr = makeFakeFriends(names);
    setFriends(fr);
    setFeed(makeFakeCommunityMeals(fr, 24)); // 24 posts
  }, []);

  const refresh = () => {
    const names = shuffle([...DEFAULT_NAMES]);
    const fr = makeFakeFriends(names);
    setFriends(fr);
    setFeed(makeFakeCommunityMeals(fr, 24));
  };

  return (
    <div className="grid gap-3" style={{ gridTemplateRows: 'auto 1fr' }}>
      {/* Actions */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Community</h1>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={refresh}
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <Button variant="outline" size="sm" className="gap-2">
            <Users className="h-4 w-4" />
            Add friend
          </Button>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="min-h-0 overflow-y-auto">
        <div className="space-y-6 pb-4">
          {/* FRIENDS */}
          <section className="space-y-2">
            <div className="px-1 text-sm font-medium text-muted-foreground">
              Friends
            </div>

            {!mounted || !friends ? (
              <div className="px-3 text-sm text-muted-foreground">
                Loading friends…
              </div>
            ) : (
              <div className="flex gap-3 overflow-x-auto px-1 pb-1">
                {friends.map((f) => (
                  <FriendCard key={f.id} friend={f} />
                ))}
              </div>
            )}
          </section>

          {/* COMMUNITY FEED (mocked) */}
          <section className="space-y-2">
            <div className="px-1 text-sm font-medium text-muted-foreground">
              Friend feed
            </div>

            {!mounted || !feed ? (
              <Card>
                <CardContent className="p-4 text-sm text-muted-foreground">
                  Loading feed…
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-3 px-1">
                {feed.map((p) => (
                  <FeedCard key={p.id} post={p} />
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

function FriendCard({ friend }: { friend: Friend }) {
  const color =
    friend.hp > 66
      ? 'bg-emerald-500'
      : friend.hp > 33
      ? 'bg-amber-500'
      : 'bg-rose-500';

  return (
    <Card className="min-w-[180px]">
      <CardHeader className="flex-row items-center gap-3 space-y-0">
        <AvatarCircle initials={friend.initials} />
        <div className="min-w-0">
          <CardTitle className="truncate text-base">{friend.name}</CardTitle>
          <p className="text-xs text-muted-foreground">
            Last fed {friend.since}
          </p>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="mb-1 flex items-center justify-between text-xs">
          <span className="text-muted-foreground">HP</span>
          <span className="tabular-nums">{friend.hp}%</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded bg-muted">
          {friend.hp === 0 ? (
            <div className="h-2 w-full bg-rose-900 animate-pulse" />
          ) : (
            <div
              className={`h-2 ${color}`}
              style={{ width: `${friend.hp}%` }}
            />
          )}
        </div>
      </CardContent>
      <CardFooter className="pt-2">
        <Button
          onClick={() => toast(`You helped ${friend.name}! (+10 HP)`)}
          variant="outline"
          size="sm"
          className="w-full gap-1"
          disabled={friend.hp > 50}
        >
          <span className="flex flex-row gap-1">
            Help out <Utensils className="h-4 w-4" />
          </span>
        </Button>
      </CardFooter>
    </Card>
  );
}

function FeedCard({ post }: { post: CommunityPost }) {
  const { author, meal } = post;
  const dateKey = toYMDLocal(meal.date);

  return (
    <Card>
      <CardHeader className="space-y-1">
        <div className="flex items-center gap-3">
          <AvatarCircle initials={author.initials} />
          <div className="min-w-0">
            <CardTitle className="truncate text-base">{author.name}</CardTitle>
            <p className="text-xs text-muted-foreground">
              {dateKey} • {meal.type.toLowerCase?.() ?? String(meal.type)}
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="mb-1 text-sm font-medium">{meal.name}</div>
        <p className="text-sm text-muted-foreground">
          {meal.description || '—'}
        </p>
        <div className="mt-3 grid grid-cols-4 gap-2 text-center text-xs">
          <div className="rounded border p-2">
            <div className="tabular-nums">{meal.macros.calories}</div>
            <div className="text-muted-foreground">kcal</div>
          </div>
          <div className="rounded border p-2">
            <div className="tabular-nums">{meal.macros.protein}g</div>
            <div className="text-muted-foreground">Protein</div>
          </div>
          <div className="rounded border p-2">
            <div className="tabular-nums">{meal.macros.carbs}g</div>
            <div className="text-muted-foreground">Carbs</div>
          </div>
          <div className="rounded border p-2">
            <div className="tabular-nums">{meal.macros.fat}g</div>
            <div className="text-muted-foreground">Fat</div>
          </div>
        </div>
      </CardContent>

      <CardFooter className="justify-between text-xs text-muted-foreground">
        <span>
          Servings: <span className="tabular-nums">{meal.servings}</span>
        </span>
        <Button asChild variant="outline" size="sm">
          {/* This should link to the meal */}
          Try it
        </Button>
      </CardFooter>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/* Mock data                                                          */
/* ------------------------------------------------------------------ */

const DEFAULT_NAMES = [
  'Alex Kim',
  'Sam Miller',
  'Charlie Rivera',
  'Parker Ito',
  'Rowan Blake',
  'Sasha Almeida',
];

function makeFakeFriends(names: string[]): Friend[] {
  const hoursSince = [70, 5, 40, 8, 150, 60].slice(0, 8);
  const now = Date.now();
  return names.slice(0, 8).map((name, i) => {
    const lastFed = new Date(now - hoursSince[i] * 60 * 60 * 1000);
    return {
      id: `friend-${i + 1}`,
      name,
      initials: initialsFromName(name),
      lastFed,
      hp: calcHp(lastFed),
      since: timeAgo(lastFed),
    };
  });
}

function makeFakeCommunityMeals(
  friends: Friend[],
  count: number
): CommunityPost[] {
  const types: MealType[] = [
    MealType.Breakfast,
    MealType.Lunch,
    MealType.Dinner,
  ];
  const dishes = [
    {
      name: 'Overnight oats with berries',
      base: { kcal: 380, p: 18, c: 52, f: 10 },
    },
    {
      name: 'Chicken stir-fry with veggies',
      base: { kcal: 520, p: 38, c: 48, f: 18 },
    },
    { name: 'Tofu scramble tacos', base: { kcal: 430, p: 24, c: 42, f: 16 } },
    { name: 'Greek salad with feta', base: { kcal: 350, p: 14, c: 22, f: 22 } },
    { name: 'Pasta pomodoro', base: { kcal: 600, p: 20, c: 88, f: 14 } },
    { name: 'Sushi bowl', base: { kcal: 560, p: 32, c: 70, f: 16 } },
    {
      name: 'Grilled salmon + quinoa',
      base: { kcal: 610, p: 40, c: 45, f: 26 },
    },
    { name: 'Veggie Buddha bowl', base: { kcal: 520, p: 22, c: 68, f: 16 } },
    { name: 'Avocado toast + egg', base: { kcal: 420, p: 18, c: 38, f: 20 } },
    { name: 'Lentil soup', base: { kcal: 390, p: 24, c: 52, f: 8 } },
    { name: 'Shrimp garlic pasta', base: { kcal: 650, p: 36, c: 80, f: 20 } },
  ];

  const out: CommunityPost[] = [];
  const now = Date.now();

  for (let i = 0; i < count; i++) {
    const author = friends[(i * 3 + 2) % friends.length];
    const hoursAgo = 3 + ((i * 11) % 96); // within ~4 days
    const date = new Date(now - hoursAgo * 60 * 60 * 1000);
    const type = types[i % types.length];
    const dish = dishes[(i * 5 + 1) % dishes.length];

    const servings = 1 + ((i * 3) % 4);
    const meal: IMeal = {
      id: `cmeal-${i + 1}`,
      date,
      description: `${dish.name} with a twist`,
      servings,
      ingredients: [
        { quantity: 1, ingredient: { name: 'Olive oil', unit: 'tbsp' } as any },
        {
          quantity: 200,
          ingredient: { name: 'Mixed veggies', unit: 'g' } as any,
        },
      ],
      type,
      selected: false,
      name: dish.name,
      macros: {
        calories: dish.base.kcal,
        protein: dish.base.p,
        carbs: dish.base.c,
        fat: dish.base.f,
      },
    };

    out.push({ id: `post-${i + 1}`, author, meal });
  }

  // newest first
  out.sort((a, b) => b.meal.date.getTime() - a.meal.date.getTime());
  return out;
}

/* ------------------------------------------------------------------ */
/* Small UI helpers                                                   */
/* ------------------------------------------------------------------ */

function AvatarCircle({ initials }: { initials: string }) {
  return (
    <div className="grid h-10 w-10 place-items-center rounded-full border bg-muted font-medium">
      {initials}
    </div>
  );
}

function initialsFromName(name: string) {
  return name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

// HP decays 100 → 0 over 5 days without feeding
function calcHp(lastFed: Date) {
  const hours = Math.max(0, (Date.now() - lastFed.getTime()) / 36e5);
  const days = hours / 24;
  const pct = 100 - (days / 5) * 100;
  return clamp(Math.round(pct), 0, 100);
}

function timeAgo(date: Date) {
  const diff = Date.now() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function toYMDLocal(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
