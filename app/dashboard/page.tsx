import Link from "next/link";
import { redirect } from "next/navigation";
import { getDashboardKPIs, getEncuentrosSemanaActual, getEncuentrosPendientes, getContadorAlmas, getEstadisticasGlobales } from "@/lib/queries/encuentros";
import { getCampusConEstadisticas } from "@/lib/queries/campus";
import { getCurrentUser } from "@/lib/queries/users";
import { fmt, fmtDelta, deltaColor, TIPO_LABELS, fmtFecha, PAIS_COLOR } from "@/lib/utils";
import { Building2, PlusCircle, ArrowRight, AlertCircle } from "lucide-react";

export const revalidate = 60;

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (user?.rol === "voluntario") redirect("/nuevo-reporte");
  const cId = user?.rol === "admin_global" ? undefined : user?.campus_id ?? undefined;

  const [kpis, encuentros, pendientes, campusList, contador, globales] = await Promise.all([
    getDashboardKPIs(cId),
    getEncuentrosSemanaActual(cId),
    getEncuentrosPendientes(cId),
    getCampusConEstadisticas(),
    getContadorAlmas(),
    getEstadisticasGlobales(cId),
  ]);

  const { semana_actual: sa, diferencias: d } = kpis;
  const campusVis = user?.rol === "admin_global" ? campusList : campusList.filter(c => c.id === cId);
  const maxTotal = Math.max(...campusVis.map(c => c.semana_actual.total), 1);

  const ESTADO_BADGE: Record<string, string> = { pendiente: "badge-amber", enviado: "badge-green", validado: "badge-teal", borrador: "badge-amber" };
  const ESTADO_LABEL: Record<string, string> = { pendiente: "Pendiente", enviado: "Enviado", validado: "Validado", borrador: "Borrador" };

  return (
    <div className="page space-y-6">

      {/* Alert pendientes */}
      {pendientes.length > 0 && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-amber-200 bg-amber-50">
          <AlertCircle size={15} className="text-amber-600 shrink-0" />
          <p className="text-sm text-amber-700 flex-1">
            Hay <strong>{pendientes.length}</strong> reporte{pendientes.length !== 1 ? "s" : ""} pendiente{pendientes.length !== 1 ? "s" : ""} de aprobación.
          </p>
          <Link href="/encuentros" className="text-xs font-semibold text-amber-700 hover:underline">Ver →</Link>
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total asistentes",  val: sa.total_general,   delta: d.total_general,   color: "var(--arm)",  border: "border-l-blue-500" },
          { label: "En auditorio",       val: sa.total_auditorio, delta: d.total_auditorio, color: "var(--teal)", border: "border-l-emerald-500" },
          { label: "Aceptaron a Jesús",  val: sa.total_paj,       delta: d.total_paj,       color: "#D85A30",     border: "border-l-orange-500" },
          { label: "Contador de almas",  val: contador || globales.historico.paj, delta: null,        color: "var(--arm)",  border: "border-l-blue-500", accent: true },
        ].map((k, i) => (
          <div key={i} className={`kpi-card border-l-4 ${k.border} ${k.accent ? "ring-1 ring-blue-100" : ""}`}>
            <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-2">{k.label}</p>
            <p className="text-3xl font-black tracking-tight" style={{ color: k.accent ? k.color : "inherit" }}>{fmt(k.val)}</p>
            {k.delta !== null ? (
              <p className={`text-xs mt-1.5 ${deltaColor(k.delta)}`}>{fmtDelta(k.delta)} <span className="text-gray-400 font-normal">vs sem. anterior</span></p>
            ) : (
              <p className="text-xs mt-1.5 text-gray-400">Histórico total</p>
            )}
          </div>
        ))}
      </div>

      {/* Estadísticas globales */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Histórico total</h3>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Encuentros</p>
              <p className="text-2xl font-black mt-1">{fmt(globales.historico.encuentros)}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Asistentes</p>
              <p className="text-2xl font-black mt-1">{fmt(globales.historico.asistentes)}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Aceptaron a Jesús</p>
              <p className="text-2xl font-black mt-1" style={{ color: "var(--teal)" }}>{fmt(globales.historico.paj)}</p>
            </div>
          </div>
        </div>
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Acumulado {globales.anio_actual.anio}</h3>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Encuentros</p>
              <p className="text-2xl font-black mt-1">{fmt(globales.anio_actual.encuentros)}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Asistentes</p>
              <p className="text-2xl font-black mt-1">{fmt(globales.anio_actual.asistentes)}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Aceptaron a Jesús</p>
              <p className="text-2xl font-black mt-1" style={{ color: "var(--teal)" }}>{fmt(globales.anio_actual.paj)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Barras campus */}
        <div className="card p-5 xl:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-700">Asistencia por campus — semana actual</h3>
          </div>
          {campusVis.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">Sin datos esta semana</p>
          ) : (
            <div className="space-y-3">
              {[...campusVis].sort((a,b) => b.semana_actual.total - a.semana_actual.total).map(c => (
                <Link key={c.id} href={`/campus/${c.id}`} className="flex items-center gap-3 group">
                  <span className="text-xs text-gray-400 w-28 text-right shrink-0 truncate group-hover:text-gray-700 transition-colors">{c.nombre}</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.round((c.semana_actual.total / maxTotal) * 100)}%`, backgroundColor: PAIS_COLOR[c.pais] ?? "var(--arm)" }} />
                  </div>
                  <span className="text-xs font-semibold text-gray-600 w-14 text-right tabular-nums shrink-0">{fmt(c.semana_actual.total)}</span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Contador almas */}
        <div className="card p-6 flex flex-col items-center justify-center text-center relative overflow-hidden min-h-[160px]">
          <div className="absolute inset-0 opacity-5" style={{ background: "radial-gradient(circle, var(--arm) 0%, transparent 70%)" }} />
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2 z-10">Contador de almas</p>
          <p className="text-5xl font-black tracking-tight z-10" style={{ color: "var(--arm)" }}>{fmt(contador || globales.historico.paj)}</p>
          <p className="text-xs text-gray-400 mt-2 z-10">Personas que aceptaron a Jesús · histórico</p>
          <div className="absolute bottom-0 left-0 right-0 h-1 opacity-30" style={{ background: "var(--arm)" }} />
        </div>
      </div>

      {/* Encuentros semana */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-700">Encuentros esta semana</h3>
          <Link href="/nuevo-reporte" className="btn-primary btn-sm">
            <PlusCircle size={12} />Nuevo reporte
          </Link>
        </div>
        {encuentros.length === 0 ? (
          <div className="py-12 text-center">
            <Building2 size={28} className="mx-auto mb-2 text-gray-200" />
            <p className="text-sm text-gray-400">Sin encuentros reportados esta semana</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Fecha</th>
                  {!cId && <th>Campus</th>}
                  <th>Tipo</th>
                  <th>Predicador</th>
                  <th className="text-right">Total</th>
                  <th className="text-right">Audit.</th>
                  <th className="text-right">PAJ</th>
                  <th>Estado</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {encuentros.map(e => (
                  <tr key={e.id}>
                    <td className="text-gray-400 text-xs whitespace-nowrap">{fmtFecha(e.fecha)} · {e.horario}</td>
                    {!cId && <td><span className="font-semibold">{e.campus?.nombre}</span><span className="text-xs text-gray-400 ml-1">{e.campus?.pais}</span></td>}
                    <td className="text-xs">{TIPO_LABELS[e.tipo]}</td>
                    <td className="text-gray-500 max-w-[140px] truncate text-xs">{e.predicador ?? "—"}</td>
                    <td className="text-right font-bold tabular-nums">{fmt(e.total_general)}</td>
                    <td className="text-right tabular-nums text-gray-500">{fmt(e.asistencia?.auditorio ?? 0)}</td>
                    <td className="text-right font-black tabular-nums" style={{ color: "var(--teal)" }}>{(e.acepto_jesus_presencial??0)+(e.online?.acepto_jesus??0)}</td>
                    <td><span className={`badge ${ESTADO_BADGE[e.estado]}`}>{ESTADO_LABEL[e.estado]}</span></td>
                    <td><Link href={`/encuentros/${e.id}`} className="text-gray-300 hover:text-gray-600 transition-colors"><ArrowRight size={14}/></Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Campus cards */}
      {user?.rol === "admin_global" && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-700">Todos los campus</h3>
            <Link href="/campus" className="text-xs text-gray-400 hover:text-gray-700 flex items-center gap-1">Ver detalle <ArrowRight size={11}/></Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {campusList.slice(0,8).map(c => (
              <Link key={c.id} href={`/campus/${c.id}`} className="card p-4 hover:shadow-md transition-all hover:border-purple-200">
                <p className="text-xs font-bold text-gray-800 truncate mb-0.5">{c.nombre}</p>
                <p className="text-[10px] text-gray-400 mb-2">{c.pais}</p>
                <p className="text-xl font-black" style={{ color: PAIS_COLOR[c.pais] ?? "var(--arm)" }}>{fmt(c.semana_actual.total)}</p>
                <p className={`text-[10px] mt-0.5 ${deltaColor(c.diferencias.total)}`}>{fmtDelta(c.diferencias.total)}</p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
