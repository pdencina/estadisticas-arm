"use client";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { PlusCircle, Loader2 } from "lucide-react";
import { generarInformeSemanal } from "@/lib/actions/informes";

export default function GenerarInformeBtn() {
  const [pending, start] = useTransition();
  const router = useRouter();

  function handleClick() {
    if (!confirm("¿Generar/actualizar el informe de la semana actual?")) return;
    start(async () => {
      try {
        await generarInformeSemanal();
        router.refresh();
      } catch (e: any) {
        alert("Error: " + (e.message || "No se pudo generar el informe"));
      }
    });
  }

  return (
    <button className="btn-primary" disabled={pending} onClick={handleClick}>
      {pending ? <Loader2 size={13} className="animate-spin" /> : <PlusCircle size={13} />}
      {pending ? "Generando..." : "Generar informe semanal"}
    </button>
  );
}
