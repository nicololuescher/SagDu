import IMeal from '@/types/interfaces/IMeal';
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

// Internal shape: O(1) lookup by id
type MealsState = {
  mealsById: Record<string, IMeal>;
  // setters / updaters
  setMeals: (meals: IMeal[]) => void;
  upsertMeal: (meal: IMeal) => void;
  updateMeal: (id: string, patch: Partial<IMeal>) => void;
  removeMeal: (id: string) => void;
  // selectors
  getMeal: (id: string) => IMeal | undefined;
};

export const useMealsStore = create<MealsState>()(
  devtools((set, get) => ({
    mealsById: {},

    setMeals: (meals) =>
      set(
        () => ({
          mealsById: Object.fromEntries(meals.map((m) => [m.id, m])),
        }),
        false,
        'meals/setMeals'
      ),

    upsertMeal: (meal) =>
      set(
        (state) => ({
          mealsById: {
            ...state.mealsById,
            [meal.id]: { ...(state.mealsById[meal.id] ?? meal), ...meal },
          },
        }),
        false,
        'meals/upsertMeal'
      ),

    updateMeal: (id, patch) =>
      set(
        (state) => {
          const existing = state.mealsById[id];
          if (!existing) {
            if (process.env.NODE_ENV !== 'production') {
              console.warn(
                `updateMeal: meal "${id}" not found. Call upsertMeal() first.`
              );
            }
            return {};
          }
          // Merge shallowly; replace arrays like ingredients when provided in patch
          const next: IMeal = { ...existing, ...patch, id: existing.id };
          return { mealsById: { ...state.mealsById, [id]: next } };
        },
        false,
        'meals/updateMeal'
      ),

    removeMeal: (id) =>
      set(
        (state) => {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { [id]: _omit, ...rest } = state.mealsById;
          return { mealsById: rest };
        },
        false,
        'meals/removeMeal'
      ),

    getMeal: (id) => get().mealsById[id],
  }))
);

// Convenience hooks
export const useMeal = (id: string) => useMealsStore((s) => s.mealsById[id]);
export const useUpdateMeal = () => useMealsStore((s) => s.updateMeal);

// Call from anywhere (even outside React files)
export const updateMealDirect = (id: string, patch: Partial<IMeal>) =>
  useMealsStore.getState().updateMeal(id, patch);
