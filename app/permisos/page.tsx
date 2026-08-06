"use client";

import { useEffect } from "react";
import AwarenessDashboard from "@/components/AwarenessDashboard";
import ChipRack from "@/components/ChipRack";
import CuestionarioDeRiesgos from "@/components/CuestionarioDeRiesgos";
import { useCatalogoStore } from "@/lib/catalogoStore";

/**
 * El final del recorrido: qué se recolectó, qué se puede retirar y qué aprendiste.
 *
 * Las respuestas de concientización se atribuyen a una sala, así que se cuelgan
 * de la primera del catálogo cuando no se viene de un juego concreto.
 */
export default function PermisosPage() {
  const juegos = useCatalogoStore((s) => s.juegos);
  const cargar = useCatalogoStore((s) => s.cargar);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const juegoDeReferencia = juegos.find((j) => j.slug === "tragamonedas") ?? juegos[0];

  return (
    <div className="py-8">
      <div className="mx-auto flex max-w-5xl justify-center px-6">
        <ChipRack />
      </div>
      <AwarenessDashboard />
      <CuestionarioDeRiesgos juegoId={juegoDeReferencia?.id ?? null} />
    </div>
  );
}
