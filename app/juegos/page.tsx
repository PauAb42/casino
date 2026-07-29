import Link from "next/link";

const GAMES = [
  {
    href: "/juegos/tragamonedas",
    name: "Tragamonedas",
    icon: "🎰",
    tagline: "Pide permiso de notificaciones",
  },
  {
    href: "/juegos/blackjack",
    name: "Blackjack",
    icon: "🃏",
    tagline: "Pide tu ubicación",
  },
  {
    href: "/juegos/ruleta",
    name: "Ruleta",
    icon: "🎡",
    tagline: "Pide acceso a tu cámara",
  },
];

export default function JuegosPage() {
  return (
    <section className="mx-auto max-w-5xl px-6 py-16">
      <p className="font-mono text-xs uppercase tracking-widest text-gold/80">Piso de juego</p>
      <h1 className="mt-2 font-serif text-4xl italic text-paper sm:text-5xl">
        Elige tu mesa
      </h1>
      <p className="mt-3 max-w-xl text-sm text-paper/60">
        Cada mesa pide un permiso real de tu navegador antes de dejarte
        jugar. Acepta o rechaza sin miedo: tus fichas están seguras de
        cualquier forma.
      </p>

      <div className="mt-10 grid gap-6 sm:grid-cols-3">
        {GAMES.map((game) => (
          <Link
            key={game.href}
            href={game.href}
            className="rounded-lg border border-gold/20 bg-felt felt-texture p-6 text-center transition hover:border-gold/60 hover:-translate-y-0.5"
          >
            <span className="text-4xl">{game.icon}</span>
            <h2 className="mt-4 font-serif text-2xl italic text-paper">{game.name}</h2>
            <p className="mt-1 font-mono text-xs text-gold/80">{game.tagline}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
