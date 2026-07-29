"use client";

import { useState } from "react";
import { useWalletStore } from "@/lib/walletStore";

interface BetInputProps {
  onBet: (amount: number) => void;
  disabled?: boolean;
  min?: number;
}

export default function BetInput({ onBet, disabled, min = 10 }: BetInputProps) {
  const balance = useWalletStore((s) => s.balance);
  const [amount, setAmount] = useState(50);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = () => {
    if (amount < min) {
      setError(`La apuesta mínima es ${min} fichas.`);
      return;
    }
    if (amount > balance) {
      setError("No tienes suficientes fichas para esa apuesta.");
      return;
    }
    setError(null);
    onBet(amount);
  };

  return (
    <div className="rounded-lg border border-gold/20 bg-felt/60 felt-texture p-5">
      <div className="flex items-center justify-between font-mono text-xs text-paper/60">
        <span>Tu saldo</span>
        <span className="text-gold">{balance} fichas</span>
      </div>

      <label className="mt-4 block font-mono text-xs uppercase tracking-widest text-paper/50">
        Cantidad a apostar
      </label>
      <div className="mt-2 flex items-center gap-3">
        <input
          type="number"
          min={min}
          step={10}
          value={amount}
          disabled={disabled}
          onChange={(e) => setAmount(Number(e.target.value))}
          className="w-32 rounded-md border border-paper/20 bg-void px-3 py-2 font-mono text-paper focus:border-gold focus:outline-none"
        />
        <div className="flex gap-2">
          {[25, 50, 100].map((chip) => (
            <button
              key={chip}
              type="button"
              disabled={disabled}
              onClick={() => setAmount(chip)}
              className="rounded-full border border-gold/30 px-3 py-1 font-mono text-xs text-paper/70 hover:border-gold hover:text-gold"
            >
              {chip}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="mt-2 font-mono text-xs text-alert">{error}</p>}

      <button
        onClick={handleSubmit}
        disabled={disabled}
        className="mt-4 w-full rounded-md bg-gold px-4 py-2.5 font-mono text-sm font-semibold text-void transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Apostar {amount} fichas
      </button>
    </div>
  );
}
