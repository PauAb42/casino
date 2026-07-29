"use client";

import { useState } from "react";
import BetInput from "./BetInput";
import { useWalletStore } from "@/lib/walletStore";

const RANKS = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];

function drawCard(): { rank: string; value: number } {
  const rank = RANKS[Math.floor(Math.random() * RANKS.length)];
  const value = rank === "A" ? 11 : ["J", "Q", "K"].includes(rank) ? 10 : Number(rank);
  return { rank, value };
}

function handTotal(cards: { rank: string; value: number }[]): number {
  let total = cards.reduce((sum, c) => sum + c.value, 0);
  let aces = cards.filter((c) => c.rank === "A").length;
  while (total > 21 && aces > 0) {
    total -= 10;
    aces -= 1;
  }
  return total;
}

type Phase = "betting" | "playing" | "resolved";

export default function BlackjackTable() {
  const placeBet = useWalletStore((s) => s.placeBet);
  const [phase, setPhase] = useState<Phase>("betting");
  const [bet, setBet] = useState(0);
  const [player, setPlayer] = useState<{ rank: string; value: number }[]>([]);
  const [dealer, setDealer] = useState<{ rank: string; value: number }[]>([]);
  const [message, setMessage] = useState<string | null>(null);

  const startHand = (amount: number) => {
    setBet(amount);
    setPlayer([drawCard(), drawCard()]);
    setDealer([drawCard()]);
    setMessage(null);
    setPhase("playing");
  };

  const hit = () => {
    const newHand = [...player, drawCard()];
    setPlayer(newHand);
    if (handTotal(newHand) > 21) {
      resolve(newHand, dealer, "bust");
    }
  };

  const stand = () => {
    let dealerHand = [...dealer];
    while (handTotal(dealerHand) < 17) {
      dealerHand = [...dealerHand, drawCard()];
    }
    setDealer(dealerHand);
    resolve(player, dealerHand, "compare");
  };

  const resolve = (
    playerHand: typeof player,
    dealerHand: typeof dealer,
    mode: "bust" | "compare"
  ) => {
    const playerTotal = handTotal(playerHand);
    const dealerTotal = handTotal(dealerHand);

    let won: boolean;
    let text: string;

    if (mode === "bust") {
      won = false;
      text = `Te pasaste con ${playerTotal}. Pierdes la mano.`;
    } else if (dealerTotal > 21) {
      won = true;
      text = `La banca se pasó con ${dealerTotal}. ¡Ganaste!`;
    } else if (playerTotal > dealerTotal) {
      won = true;
      text = `Tú: ${playerTotal} vs Banca: ${dealerTotal}. ¡Ganaste!`;
    } else if (playerTotal === dealerTotal) {
      won = false;
      text = `Empate en ${playerTotal}. La banca se queda la apuesta.`;
    } else {
      won = false;
      text = `Tú: ${playerTotal} vs Banca: ${dealerTotal}. Pierdes.`;
    }

    placeBet("Blackjack", bet, won ? "win" : "lose", 2);
    setMessage(text);
    setPhase("resolved");
  };

  const playAgain = () => {
    setPlayer([]);
    setDealer([]);
    setMessage(null);
    setPhase("betting");
  };

  return (
    <div className="grid gap-8 md:grid-cols-2">
      <div className="rounded-lg border border-gold/20 bg-felt felt-texture p-8">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-paper/50">Banca</p>
          <div className="mt-2 flex gap-2 text-3xl">
            {dealer.map((c, i) => (
              <span key={i} className="rounded border border-gold/30 bg-void px-3 py-2">
                {c.rank}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-8">
          <p className="font-mono text-xs uppercase tracking-widest text-paper/50">Tú</p>
          <div className="mt-2 flex gap-2 text-3xl">
            {player.map((c, i) => (
              <span key={i} className="rounded border border-gold/30 bg-void px-3 py-2">
                {c.rank}
              </span>
            ))}
          </div>
          {player.length > 0 && (
            <p className="mt-2 font-mono text-xs text-paper/50">Total: {handTotal(player)}</p>
          )}
        </div>

        {phase === "playing" && (
          <div className="mt-6 flex gap-3">
            <button
              onClick={hit}
              className="rounded-md bg-gold px-4 py-2 font-mono text-xs font-semibold text-void hover:brightness-110"
            >
              Pedir carta
            </button>
            <button
              onClick={stand}
              className="rounded-md border border-paper/20 px-4 py-2 font-mono text-xs text-paper/80 hover:border-gold hover:text-gold"
            >
              Plantarse
            </button>
          </div>
        )}

        {message && <p className="mt-5 font-mono text-sm text-gold">{message}</p>}

        {phase === "resolved" && (
          <button
            onClick={playAgain}
            className="mt-5 rounded-md border border-gold/40 px-4 py-2 font-mono text-xs text-gold hover:bg-gold hover:text-void"
          >
            Jugar otra mano
          </button>
        )}
      </div>

      {phase === "betting" ? (
        <BetInput onBet={startHand} />
      ) : (
        <div className="rounded-lg border border-paper/10 bg-void/60 p-5 font-mono text-xs text-paper/50">
          Apuesta activa: <span className="text-gold">{bet} fichas</span>
          <p className="mt-2">Termina la mano para volver a apostar.</p>
        </div>
      )}
    </div>
  );
}
