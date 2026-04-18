import Link from "next/link";
import { getEncuentros } from "@/lib/queries/encuentros";
import { getCurrentUser } from "@/lib/queries/users";
import EncuentrosTable from "@/components/charts/EncuentrosTable";
import { PlusCircle } from "lucide-react";

export const revalidate = 60;

export default async function EncuentrosPage() {
  const user = await getCurrentUser();
  const campusId = user?.rol === "admin_global" ? undefined : user?.campus_id ?? undefined;
  const encuentros = await getEncuentros(campusId);

  const counts = {
    borrador: encuentros.filter(e => e.estado === "borrador").length,
    enviado:  encuentros.filter(e => e.estado === "enviado").length,
    validado: encuentros.filter(e => e.estado === "validado").length,
  };

  return (
    <div className="page space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2>Encuentros</h2>
          <p className="text-xs text-gray-400 mt-0.5">Historial completo de encuentros reportados</p>
        </div>
        <Link href="/nuevo-reporte" className="btn-primary"><PlusCircle size={14} />Nuevo reporte</Link>
      </div>

      <div className="flex flex-wrap gap-2">
        <span className="badge badge-gray">Total: {encuentros.length}</span>
        {counts.borrador > 0 && <span className="badge badge-amber">{counts.borrador} pendiente{counts.borrador !== 1 ? "s" : ""}</span>}
        {counts.enviado  > 0 && <span className="badge badge-green">{counts.enviado} enviado{counts.enviado !== 1 ? "s" : ""}</span>}
        {counts.validado > 0 && <span className="badge badge-teal">{counts.validado} validado{counts.validado !== 1 ? "s" : ""}</span>}
      </div>

      <div className="card overflow-hidden">
        <EncuentrosTable encuentros={encuentros} showCampus={!campusId} />
      </div>
    </div>
  );
}
