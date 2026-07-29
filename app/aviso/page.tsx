const RULES = [
  "Usar únicamente entornos de laboratorio y dispositivos autorizados.",
  "No engañar a terceros ni recolectar datos sensibles reales.",
  "No ocultar la activación de cámara o micrófono.",
  "No almacenar contraseñas reales ni contenido privado.",
  "Documentar el consentimiento y explicar el propósito educativo.",
  "Cualquier uso fuera del laboratorio queda prohibido.",
];

export default function AvisoPage() {
  return (
    <section className="mx-auto max-w-3xl px-6 py-16">
      <span className="inline-block rounded-full border border-trust/40 bg-trust/10 px-4 py-1.5 font-mono text-[11px] uppercase tracking-wide text-trust">
        Ético · Controlado · Educativo · Con fines formativos
      </span>

      <h1 className="mt-5 font-serif text-4xl italic text-paper">
        No es un sitio malicioso
      </h1>
      <p className="mt-4 text-sm leading-relaxed text-paper/70">
        Casino Zero Trust es un laboratorio académico construido para el
        Proyecto Final de Desarrollo WEB Profesional. Simula la estética de
        un casino para hacer tangible una pregunta real: ¿qué puede saber
        un sitio WEB sobre ti si aceptas permisos sin leerlos? Cada permiso
        que se solicita es real, oficial y del navegador — nada se simula
        para engañar al usuario, todo se simula para enseñarle.
      </p>

      <h2 className="mt-10 font-serif text-2xl italic text-paper">
        Reglas éticas del laboratorio
      </h2>
      <ul className="mt-4 space-y-2 text-sm text-paper/70">
        {RULES.map((r) => (
          <li key={r} className="flex gap-2">
            <span className="text-gold">•</span>
            {r}
          </li>
        ))}
      </ul>
    </section>
  );
}
