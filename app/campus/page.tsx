import Link from "next/link";
import { getCampusConEstadisticas, getAllCampus } from "@/lib/queries/campus";
import { getEstadisticasGlobales } from "@/lib/queries/encuentros";
import { getCurrentUser } from "@/lib/queries/users";
import { fmt, fmtDelta, deltaColor, PAIS_COLOR } from "@/lib/utils";
import { Building2, ArrowRight, TrendingUp, TrendingDown, Minus } from "lucide-react";

export const revalidate = 60;

function StatBox({ label, value, delta, accent=false }: { label:string; value:number; delta:number; accent?:boolean }) {
  const Icon = delta>0?TrendingUp:delta<0?TrendingDown:Minus;
  return (
    <div className="bg-gray-50 rounded-lg p-3 text-center">
      <p className="text-[10px] uppercase tracking-wide text-gray-400 mb-1">{label}</p>
      <p className="text-lg font-black tabular-nums" style={accent?{color:"var(--teal)"}:{}}>{fmt(value)}</p>
      <div className={`flex items-center justify-center gap-0.5 mt-0.5 ${deltaColor(delta)}`}>
        <Icon size={9}/><span className="text-[10px] tabular-nums">{Math.abs(delta)}</span>
      </div>
    </div>
  );
}

export default async function CampusPage() {
  const [user, lista, allCampusList, globales] = await Promise.all([
    getCurrentUser(),
    getCampusConEstadisticas(),
    getAllCampus(),
    getEstadisticasGlobales(),
  ]);
  const vis = user?.rol==="admin_global" ? lista : lista.filter(c=>c.id===user?.campus_id);
  const inactivos = allCampusList.filter(c => !c.activo);

  return (
    <div className="page space-y-6">
      <div><h2 className="text-xl font-bold">Por campus</h2><p className="text-xs text-gray-400 mt-0.5">Semana actual vs anterior · Haz click para ver el detalle</p></div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {vis.map(c=>(
          <Link key={c.id} href={`/campus/${c.id}`} className="card p-5 hover:shadow-md transition-all hover:border-purple-200 block group">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{background:"var(--arm-l)"}}>
                <Building2 size={16} style={{color:"var(--arm)"}}/>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-800 truncate group-hover:text-purple-700 transition-colors">{c.nombre}</p>
                <p className="text-xs text-gray-400">{c.ciudad} · {c.pais}</p>
              </div>
              <ArrowRight size={13} className="text-gray-300 group-hover:text-purple-400 transition-colors mt-1 shrink-0"/>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <StatBox label="Total" value={c.semana_actual.total} delta={c.diferencias.total}/>
              <StatBox label="Audit." value={c.semana_actual.aud} delta={c.diferencias.aud}/>
              <StatBox label="PAJ" value={c.semana_actual.paj} delta={c.diferencias.paj} accent/>
            </div>
          </Link>
        ))}
        {vis.length===0&&<p className="col-span-3 text-center text-sm text-gray-400 py-16">Sin campus disponibles</p>}
      </div>

      {user?.rol==="admin_global"&&(
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100"><h3 className="text-sm font-semibold text-gray-700">Tabla comparativa global</h3></div>
          <div className="overflow-x-auto">
            <table className="tbl">
              <thead><tr><th>Campus</th><th>País</th><th className="text-right">Total</th><th className="text-right">Audit.</th><th className="text-right">PAJ</th><th className="text-right">Δ Total</th><th className="text-right">Δ Aud.</th><th className="text-right">Δ PAJ</th></tr></thead>
              <tbody>
                {[...vis].sort((a,b)=>b.semana_actual.total-a.semana_actual.total).map(c=>(
                  <tr key={c.id}>
                    <td><Link href={`/campus/${c.id}`} className="font-semibold hover:underline" style={{color:"var(--arm)"}}>{c.nombre}</Link></td>
                    <td className="text-gray-400">{c.pais}</td>
                    <td className="text-right font-bold tabular-nums">{fmt(c.semana_actual.total)}</td>
                    <td className="text-right tabular-nums text-gray-500">{fmt(c.semana_actual.aud)}</td>
                    <td className="text-right font-black tabular-nums" style={{color:"var(--teal)"}}>{c.semana_actual.paj}</td>
                    {[c.diferencias.total,c.diferencias.aud,c.diferencias.paj].map((d,i)=>(
                      <td key={i} className={`text-right text-xs font-semibold tabular-nums ${deltaColor(d)}`}>{fmtDelta(d)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Campus históricos (inactivos) */}
      {user?.rol==="admin_global" && inactivos.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Campus históricos</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {inactivos.map(c => {
              const stats = globales.por_campus[c.id];
              if (!stats || stats.encuentros === 0) return null;
              return (
                <Link key={c.id} href={`/campus/${c.id}`} className="card p-5 hover:shadow-md transition-all hover:border-gray-300 block group opacity-80">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 bg-gray-100">
                      <Building2 size={16} className="text-gray-400"/>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-600 truncate group-hover:text-gray-800 transition-colors">{c.nombre}</p>
                      <p className="text-xs text-gray-400">{c.ciudad} · {c.pais}</p>
                    </div>
                    <span className="text-[9px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-semibold">Histórico</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-gray-50 rounded-lg p-3 text-center">
                      <p className="text-[10px] uppercase tracking-wide text-gray-400 mb-1">Encuentros</p>
                      <p className="text-lg font-black tabular-nums">{fmt(stats.encuentros)}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3 text-center">
                      <p className="text-[10px] uppercase tracking-wide text-gray-400 mb-1">Asistentes</p>
                      <p className="text-lg font-black tabular-nums">{fmt(stats.asistentes)}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3 text-center">
                      <p className="text-[10px] uppercase tracking-wide text-gray-400 mb-1">PAJ</p>
                      <p className="text-lg font-black tabular-nums" style={{color:"var(--teal)"}}>{fmt(stats.paj)}</p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
