import { create } from "zustand";

interface BalanceStore {
  balance: number;
  setBalance: (updater: number | ((prev: number) => number)) => void;
}

export const useBalanceStore = create<BalanceStore>((set) => ({
  balance: 12450.75, // Saldo inicial
  
  // Soportamos tanto setBalance(100) como setBalance((prev) => prev + 100)
  setBalance: (updater) => set((state) => ({
    balance: typeof updater === "function" ? updater(state.balance) : updater
  })),
}));