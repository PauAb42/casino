import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface BetRecord {
  id: string;
  game: string;
  amount: number;
  result: "win" | "lose";
  payout: number;
  timestamp: string;
}

interface WalletState {
  balance: number;
  history: BetRecord[];
  placeBet: (game: string, amount: number, result: "win" | "lose", multiplier: number) => void;
  resetBalance: () => void;
}

const STARTING_BALANCE = 1000;

export const useWalletStore = create<WalletState>()(
  persist(
    (set) => ({
      balance: STARTING_BALANCE,
      history: [],

      placeBet: (game, amount, result, multiplier) => {
        const payout = result === "win" ? Math.round(amount * multiplier) : -amount;
        const record: BetRecord = {
          id: `${game}-${Date.now()}`,
          game,
          amount,
          result,
          payout,
          timestamp: new Date().toLocaleTimeString("es-MX"),
        };
        set((state) => ({
          balance: Math.max(0, state.balance + payout),
          history: [record, ...state.history].slice(0, 25),
        }));
      },

      resetBalance: () => set({ balance: STARTING_BALANCE, history: [] }),
    }),
    { name: "czt-wallet" }
  )
);
