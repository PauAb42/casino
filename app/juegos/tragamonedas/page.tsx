import PermissionGate from "@/components/games/PermissionGate";
import SlotMachine from "@/components/games/SlotMachine";

export default function TragamonedasPage() {
  return (
    <section className="mx-auto max-w-4xl px-6 py-16">
      <p className="font-mono text-xs uppercase tracking-widest text-gold/80">Mesa de juego</p>
      <h1 className="mt-2 font-serif text-4xl italic text-paper">Tragamonedas</h1>
      <p className="mt-3 max-w-lg text-sm text-paper/60">
        Para avisarte al instante cuando ganes, este juego pide permiso de
        notificaciones — el mismo permiso que muchos sitios reales usan
        para enviarte mensajes incluso con la pestaña cerrada.
      </p>

      <div className="mt-10">
        <PermissionGate
          permission="notifications"
          gameName="Tragamonedas"
          explanation='Para "avisarte cuando ganes" el juego pide permiso de notificaciones. En la vida real, ese mismo permiso permite enviarte mensajes aunque cierres la pestaña.'
        >
          <SlotMachine />
        </PermissionGate>
      </div>
    </section>
  );
}
