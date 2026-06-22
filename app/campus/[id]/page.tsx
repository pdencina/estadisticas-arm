import { notFound } from "next/navigation";
import Link from "next/link";
import { getCampusById } from "@/lib/queries/campus";
import { getEncuentros, getHistoricoSemanal } from "@/lib/queries/encuentros";
import { getCurrentUser } from "@/lib/queries/users";
import { fmt, fmtFecha, fmtDelta, deltaColor, TIPO_LABELS } from "@/lib/utils";
import { ArrowLeft, Building2, ArrowRight } from "lucide-react";

interface Props { params: { id: string } }

export default async function CampusDetallePage({ params }: Props) {
  const [user, campus, encuentros, historico] = await Promise.all([
    getCurrentUser(),
    getCampusById(params.id),
    getEncuentros(params.id),
    getHistoricoSemanal(params.id, 12),
  ]);

  if (!campus) notFound();
  if (user?.rol !== "admin_global" && user?.campus_id !== params.id) notFound();

  const total    = encuentros.reduce((s,e)=>s+e.total_general,0);
  const totalPaj = encuentros.reduce((s,e)=>s+(e.acepto_jesus_presencial??0)+(e.online?.acepto_jesus??0),0);
  const totalAud = encuentros.reduce((s,e)=>s+(e.asistencia?.auditorio??0),0);

  return (
    <div className="page space-y-5">
      <div>
        <Link href="/campus" className="btn-ghost text-xs mb-3 inline-flex"><ArrowLeft size={12}/>Volver a campus</Link>
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{background:"var(--arm-l)"}}>
            <Building2 size={22} style={{color:"var(--arm)"}}/>
          </div>
          <div>
            <h2 className="text-xl font-bold">{campus.nombre}</h2>
            <p className="text-sm text-gray-400 mt-0.5">{campus.ciudad} · {campus.pais}</p>
          </div>
        </div>
      </div>

      {/* KPIs acumulados */}
      <div className="grid grid-cols-3 gap-4">
        <div className="kpi-card text-center"><p className="text-xs text-gray-400 mb-1">Total acumulado</p><p className="text-3xl font-black">{fmt(total)}</p><p className="text-xs text-gray-400 mt-1">{encuentros.length} encuentros</p></div>
        <div className="kpi-card text-center"><p className="text-xs text-gray-400 mb-1">Auditorio acum.</p><p className="text-3xl font-black">{fmt(totalAud)}</p></div>
        <div className="kpi-card text-center"><p className="text-xs text-gray-400 mb-1">PAJ acumulado</p><p className="text-3xl font-black" style={{color:"var(--teal)"}}>{fmt(totalPaj)}</p></div>
      </div>

      {/* Historial semanal */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100"><h3 className="text-sm font-semibold text-gray-700">Historial semanal — últimas 12 semanas</h3></div>
        <div className="overflow-x-auto">
          <table className="tbl">
            <thead><tr><th>Semana</th><th className="text-right">Total</th><th className="text-right">Auditorio</th><th className="text-right">PAJ</th><th className="text-right">Δ vs anterior</th></tr></thead>
            <tbody>
              {historico.map((s,i)=>{
                const prev = historico[i+1];
                const delta = prev ? s.total - prev.total : 0;
                return (
                  <tr key={s.inicio}>
                    <td className="text-xs text-gray-500">{fmtFecha(s.inicio)}</td>
                    <td className="text-right font-bold tabular-nums">{fmt(s.total)}</td>
                    <td className="text-right tabular-nums text-gray-400">—</td>
                    <td className="text-right font-black tabular-nums" style={{color:"var(--teal)"}}>{s.paj}</td>
                    <td className={`text-right text-xs font-semibold tabular-nums ${prev?deltaColor(delta):"text-gray-300"}`}>{prev?fmtDelta(delta):"—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Últimos encuentros */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100"><h3 className="text-sm font-semibold text-gray-700">Últimos encuentros</h3></div>
        <div className="overflow-x-auto">
          <table className="tbl">
            <thead><tr><th>Fecha</th><th>Tipo</th><th>Predicador</th><th className="text-right">Total</th><th className="text-right">PAJ</th><th/></tr></thead>
            <tbody>
              {encuentros.slice(0,20).map(e=>(
                <tr key={e.id}>
                  <td className="text-gray-400 text-xs whitespace-nowrap">{fmtFecha(e.fecha)} · {e.horario}</td>
                  <td className="text-xs">{TIPO_LABELS[e.tipo]}</td>
                  <td className="text-gray-500 max-w-[140px] truncate text-xs">{e.predicador??"—"}</td>
                  <td className="text-right font-bold tabular-nums">{fmt(e.total_general)}</td>
                  <td className="text-right font-black tabular-nums" style={{color:"var(--teal)"}}>{(e.acepto_jesus_presencial??0)+(e.online?.acepto_jesus??0)}</td>
                  <td><Link href={`/encuentros/${e.id}`} className="text-gray-300 hover:text-gray-600"><ArrowRight size={13}/></Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
