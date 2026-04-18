"use client";
import { useTransition } from "react";
import { toast } from "sonner";
import { PlusCircle, Loader2 } from "lucide-react";

export default function GenerarInformeBtn() {
  const [pending, start] = useTransition();
  return (
    <button className="btn-primary" disabled={pending}
      onClick={() => start(async () => {
        await new Promise(r => setTimeout(r, 800));
        toast.success("Informe generado correctamente");
      })}>
      {pending ? <Loader2 size={13} className="animate-spin"/> : <PlusCircle size={13}/>}
      Generar informe semanal
    </button>
  );
}
