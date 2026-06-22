import Link from "next/link";
import { getEncuentros, getEncuentrosSemanaActual } from "@/lib/queries/encuentros";
import { getCurrentUser } from "@/lib/queries/users";
import { fmt, fmtFecha, TIPO_LABELS } from "@/lib/utils";
import { PlusCircle, ArrowRight } from "lucide-react";
import AuthLayout from "@/components/layout/AuthLayout";
export const revalidate = 60;
const EB: Record<string,string> = { pendiente:"badge-amber", enviado:"badge-green", validado:"badge-teal", borrador:"badge-amber" };
const EL: Record<string,string> = { pendiente:"Pendiente", enviado:"Enviado", validado:"Validado", borrador:"Borrador" };
export default async function Page() {
  const user = await getCurrentUser();
  const cId = user?.rol==="admin_global"?undefined:user?.campus_id??undefined;
  const isVol = user?.rol === "voluntario";
  const enc = isVol ? await getEncuentrosSemanaActual(cId) : await getEncuentros(cId);
  const cnts={p:enc.filter(e=>e.estado==="pendiente").length,e:enc.filter(e=>e.estado==="enviado").length,v:enc.filter(e=>e.estado==="validado").length};
  return (
    <AuthLayout>
      <div className="page space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">{isVol ? "Reportes esta semana" : "Encuentros"}</h2>
            <p className="text-xs text-gray-400 mt-0.5">{isVol ? `${user?.campus?.nombre ?? "Tu campus"}` : "Historial de encuentros reportados"}</p>
          </div>
          <Link href="/nuevo-reporte" className="btn-primary"><PlusCircle size={13}/>Nuevo reporte</Link>
        </div>
        {!isVol && (
          <div className="flex flex-wrap gap-2">
            <span className="badge badge-gray">Total: {enc.length}</span>
            {cnts.p>0&&<span className="badge badge-amber">{cnts.p} pendiente{cnts.p!==1?"s":""}</span>}
            {cnts.e>0&&<span className="badge badge-green">{cnts.e} enviado{cnts.e!==1?"s":""}</span>}
            {cnts.v>0&&<span className="badge badge-teal">{cnts.v} validado{cnts.v!==1?"s":""}</span>}
          </div>
        )}
        <div className="card overflow-hidden">
          {enc.length===0?(<div className="py-12 text-center text-sm text-gray-400">{isVol ? "No hay reportes esta semana aún" : "Sin encuentros"}</div>):(
            <div className="overflow-x-auto"><table className="tbl">
              <thead><tr><th>Fecha</th>{!cId&&<th>Campus</th>}<th>Tipo</th><th>Predicador</th><th className="text-right">Total</th><th className="text-right">PAJ</th><th>Estado</th><th/></tr></thead>
              <tbody>{enc.map(e=>(
                <tr key={e.id}>
                  <td className="text-gray-400 text-xs whitespace-nowrap">{fmtFecha(e.fecha)} · {e.horario}</td>
                  {!cId&&<td><span className="font-semibold">{e.campus?.nombre}</span><span className="text-xs text-gray-400 ml-1">{e.campus?.pais}</span></td>}
                  <td className="text-xs">{TIPO_LABELS[e.tipo]}</td>
                  <td className="text-gray-500 max-w-[130px] truncate text-xs">{e.predicador??"—"}</td>
                  <td className="text-right font-bold tabular-nums">{fmt(e.total_general)}</td>
                  <td className="text-right font-black tabular-nums" style={{color:"var(--teal)"}}>{(e.acepto_jesus_presencial??0)+(e.online?.acepto_jesus??0)}</td>
                  <td><span className={`badge ${EB[e.estado]}`}>{EL[e.estado]}</span></td>
                  <td><Link href={`/encuentros/${e.id}`} className="text-gray-300 hover:text-gray-600"><ArrowRight size={14}/></Link></td>
                </tr>
              ))}</tbody>
            </table></div>
          )}
        </div>
      </div>
    </AuthLayout>
  );
}
