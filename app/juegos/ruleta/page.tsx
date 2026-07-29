import PermissionGate from "@/components/games/PermissionGate";
import RouletteWheel from "@/components/games/RouletteWheel";

export default function RuletaPage() {
  return (
    <section className="mx-auto max-w-4xl px-6 py-16">
      <p className="font-mono text-xs uppercase tracking-widest text-gold/80">Mesa de juego</p>
      <h1 className="mt-2 font-serif text-4xl italic text-paper">Ruleta</h1>
      <p className="mt-3 max-w-lg text-sm text-paper/60">
        Para una "verificación de identidad" instantánea, este juego pide
        acceso a tu cámara. La transmisión se corta apenas termina la
        demostración.
      </p>

      <div className="mt-10">
        <PermissionGate
          permission="camera"
          gameName="Ruleta"
          explanation='Para una "verificación de identidad" instantánea, se pide acceso a tu cámara. La transmisión se corta apenas termina la demostración.'
        >
          <RouletteWheel />
        </PermissionGate>
      </div>
    </section>
  );
}
