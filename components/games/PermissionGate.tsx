"use client";

import Link from "next/link";
import { useState } from "react";
import { useAuthStore } from "@/lib/authStore";
import { PermissionKey, useZeroTrustStore } from "@/lib/store";
import PermissionModal from "@/components/PermissionModal";

interface PermissionGateProps {
  permission: PermissionKey;
  gameName: string;
  explanation: string;
  children: React.ReactNode;
}

export default function PermissionGate({
  permission,
  gameName,
  explanation,
  children,
}: PermissionGateProps) {
  const user = useAuthStore((s) => s.user);
  const status = useZeroTrustStore((s) => s.permissions[permission]);
  const [modalOpen, setModalOpen] = useState(false);

  if (!user) {
    return (
      <div className="mx-auto max-w-md rounded-lg border border-gold/20 bg-felt/60 felt-texture p-8 text-center">
        <p className="font-serif text-2xl italic text-paper">Necesitas una cuenta</p>
        <p className="mt-2 text-sm text-paper/60">
          Crea una cuenta ficticia para recibir tus fichas de bienvenida y
          empezar a jugar.
        </p>
        <div className="mt-5 flex justify-center gap-3">
          <Link
            href="/registro"
            className="rounded-md bg-gold px-5 py-2 font-mono text-xs font-semibold text-void hover:brightness-110"
          >
            Crear cuenta
          </Link>
          <Link
            href="/login"
            className="rounded-md border border-paper/20 px-5 py-2 font-mono text-xs text-paper/80 hover:border-gold hover:text-gold"
          >
            Entrar
          </Link>
        </div>
      </div>
    );
  }

  if (status !== "granted") {
    return (
      <div className="mx-auto max-w-md rounded-lg border border-gold/20 bg-felt/60 felt-texture p-8 text-center">
        <p className="font-serif text-2xl italic text-paper">{gameName}</p>
        <p className="mt-2 text-sm text-paper/60">{explanation}</p>
        <button
          onClick={() => setModalOpen(true)}
          className="mt-5 rounded-md bg-gold px-5 py-2.5 font-mono text-xs font-semibold text-void hover:brightness-110"
        >
          Ver solicitud de permiso
        </button>
        {status === "denied" && (
          <p className="mt-3 font-mono text-[11px] text-alert">
            Rechazaste este permiso antes. Puedes intentarlo de nuevo cuando
            quieras — rechazar nunca te penaliza.
          </p>
        )}

        {modalOpen && (
          <PermissionModal
            permission={permission}
            gameName={gameName}
            explanation={explanation}
            onClose={() => setModalOpen(false)}
          />
        )}
      </div>
    );
  }

  return <>{children}</>;
}
