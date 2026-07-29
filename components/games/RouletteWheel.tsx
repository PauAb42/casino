"use client";

import { useState } from "react";
import BetInput from "./BetInput";
import { useWalletStore } from "@/lib/walletStore";

const POCKETS = [
  { number: 0, color: "green" as const },
  ...Array.from({ length: 36 }, (_, i) => ({
    number: i + 1,
    color: (i + 1) % 2 === 0 ? ("black" as const) : ("red" as const),
  })),
];

const COLOR_STYLES: Record<string, string> = {
  red: "bg-alert text-paper",
  black: "bg-void border border-paper/30 text-paper",
  green: "bg-trust text-void",
};

type Choice = "red" | "black" | "green";

export default function RouletteWheel() {
  const placeBet = useWalletStore((s) => s.placeBet);
  const [choice, setChoice] = useState<Choice>("red");
  const [pendingAmount, setPendingAmount] = useState<number | null>(null);
  const [result, setResult] = useState<(typeof POCKETS)[number] | null>(null);
  const [spinning, setSpinning] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const spin = (amount: number) => {
    setPendingAmount(amount);
    setSpinning(true);
    setMessage(null);

    let ticks = 0;
    const interval = setInterval(() => {
      setResult(POCKETS[Math.floor(Math.random() * POCKETS.length)]);
      ticks += 1;
      if (ticks > 12) {
        clearInterval(interval);
        const final = POCKETS[Math.floor(Math.random() * POCKETS.length)];
        setResult(final);

        const won = final.color === choice;
        const multiplier = choice === "green" ? 14 : 2;
        placeBet("Ruleta", amount, won ? "win" : "lose", multiplier);
        setMessage(
          won
            ? `Cayó ${final.number} (${final.color}). ¡Acertaste! Paga x${multiplier}.`
            : `Cayó ${final.number} (${final.color}). Apostaste a ${choice}.`
        );
        setSpinning(false);
      }
    }, 100);
  };

  return (
    <div className="grid gap-8 md:grid-cols-2">
      <div className="rounded-lg border border-gold/20 bg-felt felt-texture p-8 text-center">
        <div
          className={`mx-auto flex h-32 w-32 items-center justify-center rounded-full text-4xl font-bold ${
            result ? COLOR_STYLES[result.color] : "border border-gold/30 text-paper/40"
          }`}
        >
          {result ? result.number : "?"}
        </div>

        <div className="mt-6 flex justify-center gap-3">
          {(["red", "black", "green"] as Choice[]).map((c) => (
            <button
              key={c}
              disabled={spinning}
              onClick={() => setChoice(c)}
              className={`rounded-md px-4 py-2 font-mono text-xs capitalize transition ${
                choice === c
                  ? COLOR_STYLES[c]
                  : "border border-paper/20 text-paper/60 hover:border-gold"
              }`}
            >
              {c === "green" ? "verde (x14)" : `${c} (x2)`}
            </button>
          ))}
        </div>

        {message && <p className="mt-5 font-mono text-sm text-gold">{message}</p>}
      </div>

      <BetInput onBet={spin} disabled={spinning} />
    </div>
  );
}
