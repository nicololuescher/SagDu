import IUser from "@/types/interfaces/IUser";
import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { Snacks } from "@/types/enums/ISnacks"; // assuming Snacks type exists

interface UserStore {
  user: IUser | null;
  setUser: (user: Omit<IUser, "snacks">) => void;
  incrementSnack: (snack: Snacks, amount?: number) => void;
  decrementSnack: (snack: Snacks, amount?: number) => void;
  setSnackQuantity: (snack: Snacks, quantity: number) => void;
  getSnackQuantity: (snack: Snacks) => number;
  clearUser: () => void;
  setDuckHealth: (health: number) => void;
  getDuckHealth: () => number;
}

const DEFAULT_SNACK_QUANTITY = 5;

export const useUserStore = create<UserStore>((set, get) => ({
  user: null,

  setUser: (user) => {
    // Initialize each snack with quantity 5
    const snacksRecord: Record<Snacks, number> = Object.values(Snacks).reduce(
      (acc, snack) => {
        acc[snack] = DEFAULT_SNACK_QUANTITY;
        return acc;
      },
      {} as Record<Snacks, number>
    );

    set({ user: { ...user, snacks: snacksRecord } });
  },

  incrementSnack: (snack, amount = 1) =>
    set((state) => {
      if (!state.user) return {};
      return {
        user: {
          ...state.user,
          snacks: {
            ...state.user.snacks,
            [snack]: (state.user.snacks[snack] || 0) + amount,
          },
        },
      };
    }),

  decrementSnack: (snack, amount = 1) =>
    set((state) => {
      if (!state.user) return {};
      const current = state.user.snacks[snack] || 0;
      return {
        user: {
          ...state.user,
          snacks: {
            ...state.user.snacks,
            [snack]: Math.max(current - amount, 0),
          },
        },
      };
    }),

  setSnackQuantity: (snack, quantity) =>
    set((state) => {
      if (!state.user) return {};
      return {
        user: {
          ...state.user,
          snacks: {
            ...state.user.snacks,
            [snack]: Math.max(quantity, 0),
          },
        },
      };
    }),

  getSnackQuantity: (snack) => {
    const user = get().user;
    if (!user) return 0;
    return user.snacks[snack] || 0;
  },

  setDuckHealth: (health) =>
    set((state) => {
      if (!state.user) return {};
      return {
        user: { ...state.user, duckHealth: health },
      };
    }),

  getDuckHealth: () => {
    const user = get().user;
    if (!user) return 0;
    return user.duckHealth;
  },

  clearUser: () => set({ user: null }),
}));
