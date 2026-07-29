"use client";

import { useState } from "react";
import BetInput from "./BetInput";
import { useWalletStore } from "@/lib/walletStore";

const SYMBOLS = ["🍒", "🔔", "⭐", "7️⃣", "🍋", "💎"];
const PAYOUTS: Record<string, number> = {
  "💎💎💎": 10,
  "7️⃣7️⃣7️⃣": 8,
  "⭐⭐⭐": 5,
  default: 3, // cualquier otro trío
};

function spinReels(): string[] {
  return Array.from({ length: 3 }, () => SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]);
}

export default function SlotMachine() {
  const placeBet = useWalletStore((s) => s.placeBet);
  const [reels, setReels] = useState<string[]>(["🍒", "🔔", "⭐"]);
  const [spinning, setSpinning] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleBet = (amount: number) => {
    setSpinning(true);
    setMessage(null);

    // pequeña animación: varios "giros" rápidos antes del resultado final
    let ticks = 0;
    const interval = setInterval(() => {
      setReels(spinReels());
      ticks += 1;
      if (ticks > 8) {
        clearInterval(interval);
        const final = spinReels();
        setReels(final);

        const key = final.join("");
        const isTriple = final[0] === final[1] && final[1] === final[2];
        const multiplier = isTriple ? PAYOUTS[key] ?? PAYOUTS.default : 0;
        const won = multiplier > 0;

        placeBet("Tragamonedas", amount, won ? "win" : "lose", multiplier);
        setMessage(
          won
            ? `¡Ganaste! Trío de ${final[0]} paga x${multiplier}.`
            : "Sin suerte esta vez. Los reels no alinearon."
        );
        setSpinning(false);
      }
    }, 90);
  };

  return (
    <div className="grid gap-8 md:grid-cols-2">
      <div className="rounded-lg border border-gold/20 bg-felt felt-texture p-8 text-center">
        <div className="mx-auto flex max-w-xs justify-center gap-3 rounded-md border border-gold/30 bg-void p-6 text-6xl">
          {reels.map((symbol, i) => (
            <span key={i}>{symbol}</span>
          ))}
        </div>
        {message && (
          <p className="mt-4 font-mono text-sm text-gold">{message}</p>
        )}
        <p className="mt-3 font-mono text-[10px] text-paper/40">
          Trío de 💎 paga x10 · Trío de 7️⃣ paga x8 · Trío de ⭐ paga x5 · Cualquier otro trío paga x3
        </p>
      </div>
      <BetInput onBet={handleBet} disabled={spinning} />
    </div>
  );
}
