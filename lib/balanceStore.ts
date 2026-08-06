import { create } from 'zustand';

interface BalanceState {
  balance: number;
  updateBalance: (amount: number) => void;
  /**
   * Acepta un número o una función del saldo anterior.
   *
   * Las salas ya llamaban `setBalance((prev) => prev - apuesta)`, pero la firma
   * solo admitía número: el saldo quedaba puesto a la propia función y la caja
   * mostraba NaN a partir de la primera apuesta.
   */
  setBalance: (amount: number | ((previous: number) => number)) => void;
}

export const useBalanceStore = create<BalanceState>((set) => ({
  balance: 12450.75, // Saldo inicial de prueba
  updateBalance: (amount) => set((state) => ({ balance: state.balance + amount })),
  setBalance: (amount) =>
    set((state) => ({ balance: typeof amount === "function" ? amount(state.balance) : amount })),
}));