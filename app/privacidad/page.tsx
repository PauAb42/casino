const SECTIONS = [
  {
    title: "¿Qué datos pedimos y por qué?",
    body: "Este laboratorio solicita permisos reales del navegador (cámara, micrófono, ubicación, notificaciones, cookies, local storage) únicamente con fines educativos, dentro del contexto de cada juego. Nunca se piden fuera de una acción explícita del usuario.",
  },
  {
    title: "¿Dónde se guarda lo que autorizo?",
    body: "Todo vive en tu propio navegador (localStorage / estado de la aplicación). No existe un servidor que reciba, almacene o comparta tu cámara, micrófono o ubicación.",
  },
  {
    title: "¿Puedo revocar un permiso?",
    body: "Sí. Puedes revocarlo en cualquier momento desde la configuración de permisos de tu navegador. Rechazar o revocar nunca afecta tus fichas ni tu cuenta.",
  },
  {
    title: "¿Se vende o comparte algo?",
    body: "No. No hay terceros, publicidad ni monetización de datos en este proyecto. Es un ejercicio académico de concientización sobre privacidad digital.",
  },
];

export default function PrivacidadPage() {
  return (
    <section className="mx-auto max-w-3xl px-6 py-16">
      <p className="font-mono text-xs uppercase tracking-widest text-gold/80">Documento</p>
      <h1 className="mt-2 font-serif text-4xl italic text-paper">Aviso de privacidad</h1>
      <p className="mt-3 text-sm text-paper/60">
        Última actualización: proyecto académico, cuatrimestre en curso.
      </p>

      <div className="mt-10 space-y-8">
        {SECTIONS.map((s) => (
          <div key={s.title} className="border-b border-paper/10 pb-8">
            <h2 className="font-serif text-xl italic text-paper">{s.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-paper/70">{s.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
