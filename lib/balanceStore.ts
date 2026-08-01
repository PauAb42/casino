import { create } from 'zustand';

interface BalanceState {
  balance: number;
  updateBalance: (amount: number) => void;
  setBalance: (amount: number) => void;
}

export const useBalanceStore = create<BalanceState>((set) => ({
  balance: 12450.75, // Saldo inicial de prueba
  updateBalance: (amount) => set((state) => ({ balance: state.balance + amount })),
  setBalance: (amount) => set({ balance: amount }),
}));