import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-white/5 bg-[#0B0E14] px-8 py-8 mt-auto">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-gray-500">
        <p>
          &copy; {new Date().getFullYear()} Royal Casino. Todos los derechos reservados.
        </p>
        <div className="flex gap-4">
          <Link href="/terminos" className="hover:text-white transition-colors">Términos y Condiciones</Link>
          <Link href="/privacidad" className="hover:text-white transition-colors">Política de Privacidad</Link>
          <Link href="/juego-responsable" className="hover:text-white transition-colors">Juego Responsable</Link>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-8 h-8 rounded-full border border-gray-600 flex items-center justify-center font-bold text-gray-400">18+</span>
          <p>Juega con responsabilidad.</p>
        </div>
      </div>
    </footer>
  );
}