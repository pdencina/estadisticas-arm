"use client";

import { Trash2 } from "lucide-react";
import { useTransition } from "react";

export default function EliminarEncuentroBtn({ action }: { action: () => Promise<void> }) {
  const [pending, startTransition] = useTransition();

  function handleClick() {
    if (!confirm("¿Estás seguro de eliminar este encuentro? Esta acción no se puede deshacer.")) return;
    startTransition(async () => { await action(); });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      className="btn-ghost text-red-500 hover:bg-red-50 hover:text-red-700 text-xs flex items-center gap-1.5 disabled:opacity-50"
    >
      <Trash2 size={12}/>{pending ? "Eliminando..." : "Eliminar"}
    </button>
  );
}
