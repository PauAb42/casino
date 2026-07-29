import PermissionGate from "@/components/games/PermissionGate";
import BlackjackTable from "@/components/games/BlackjackTable";

export default function BlackjackPage() {
  return (
    <section className="mx-auto max-w-4xl px-6 py-16">
      <p className="font-mono text-xs uppercase tracking-widest text-gold/80">Mesa de juego</p>
      <h1 className="mt-2 font-serif text-4xl italic text-paper">Blackjack</h1>
      <p className="mt-3 max-w-lg text-sm text-paper/60">
        Para sugerirte una "mesa VIP cerca de ti", este juego pide tu
        ubicación exacta vía GPS/WiFi del navegador.
      </p>

      <div className="mt-10">
        <PermissionGate
          permission="location"
          gameName="Blackjack"
          explanation='Para sugerirte una "mesa VIP cerca de ti", el juego solicita tu ubicación exacta vía GPS/WiFi del navegador.'
        >
          <BlackjackTable />
        </PermissionGate>
      </div>
    </section>
  );
}
