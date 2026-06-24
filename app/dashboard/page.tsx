import Link from "next/link";
import { redirect } from "next/navigation";
import { getDashboardKPIs, getEncuentrosSemanaActual, getEncuentrosPendientes, getContadorAlmas, getEstadisticasGlobales } from "@/lib/queries/encuentros";
import { getCampusConEstadisticas } from "@/lib/queries/campus";
import { getCurrentUser } from "@/lib/queries/users";
import { fmt, fmtDelta, deltaColor, TIPO_LABELS, fmtFecha, PAIS_COLOR, semanaActual } from "@/lib/utils";
import { Building2, PlusCircle, ArrowRight, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

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

  // Fecha actual formateada
  const hoy = new Date();
  const fechaHoy = format(hoy, "EEEE d 'de' MMMM, yyyy", { locale: es });
  const { lA, dA } = semanaActual();
  const fmtSemana = (iso: string) => iso.split("-").reverse().join("-");

  // Determinar si estamos en una semana incompleta (antes del domingo)
  const hoyDia = hoy.getDay(); // 0=dom, 1=lun...6=sab
  const semanaIncompleta = hoyDia !== 0; // si no es domingo, la semana está en curso

  return (
    <div className="page space-y-6">

      {/* Header con fecha */}
      <div>
        <p className="text-xs text-gray-400 capitalize">{fechaHoy}</p>
        <h1 className="text-xl font-bold text-gray-800 mt-0.5">Dashboard global</h1>
      </div>

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

      {/* ═══════ SEMANA ACTUAL ═══════ */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <h2 className="text-sm font-semibold text-gray-700">Semana actual</h2>
          <span className="text-[10px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{fmtSemana(lA)} al {fmtSemana(dA)}</span>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { label: "Total asistentes", val: sa.total_general, delta: d.total_general, border: "border-l-blue-500" },
            { label: "En auditorio", val: sa.total_auditorio, delta: d.total_auditorio, border: "border-l-emerald-500" },
            { label: "Aceptaron a Jesús", val: sa.total_paj, delta: d.total_paj, border: "border-l-orange-500" },
          ].map((k, i) => (
            <div key={i} className={`kpi-card border-l-4 ${k.border}`}>
              <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-2">{k.label}</p>
              <p className="text-3xl font-black tracking-tight">{fmt(k.val)}</p>
              {semanaIncompleta ? (
                <p className="text-xs mt-1.5 text-gray-400">Semana en curso</p>
              ) : (
                <p className={`text-xs mt-1.5 ${deltaColor(k.delta)}`}>{fmtDelta(k.delta)} <span className="text-gray-400 font-normal">vs sem. anterior</span></p>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Barras campus semana */}
      <div className="card p-5">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Asistencia por campus — semana actual</h3>
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

      {/* ═══════ ACUMULADOS ═══════ */}
      <section>
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Visión general</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Acumulado año */}
          <div className="card p-5">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Acumulado {globales.anio_actual.anio}</p>
            <div className="space-y-2">
              <div className="flex justify-between items-baseline">
                <span className="text-xs text-gray-500">Encuentros</span>
                <span className="text-lg font-black">{fmt(globales.anio_actual.encuentros)}</span>
              </div>
              <div className="flex justify-between items-baseline">
                <span className="text-xs text-gray-500">Asistentes</span>
                <span className="text-lg font-black">{fmt(globales.anio_actual.asistentes)}</span>
              </div>
              <div className="flex justify-between items-baseline">
                <span className="text-xs text-gray-500">PAJ</span>
                <span className="text-lg font-black" style={{ color: "var(--teal)" }}>{fmt(globales.anio_actual.paj)}</span>
              </div>
            </div>
          </div>

          {/* Histórico total */}
          <div className="card p-5">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Histórico total</p>
            <div className="space-y-2">
              <div className="flex justify-between items-baseline">
                <span className="text-xs text-gray-500">Encuentros</span>
                <span className="text-lg font-black">{fmt(globales.historico.encuentros)}</span>
              </div>
              <div className="flex justify-between items-baseline">
                <span className="text-xs text-gray-500">Asistentes</span>
                <span className="text-lg font-black">{fmt(globales.historico.asistentes)}</span>
              </div>
              <div className="flex justify-between items-baseline">
                <span className="text-xs text-gray-500">PAJ</span>
                <span className="text-lg font-black" style={{ color: "var(--teal)" }}>{fmt(globales.historico.paj)}</span>
              </div>
            </div>
          </div>

          {/* Contador de almas */}
          <div className="card p-5 flex flex-col items-center justify-center text-center relative overflow-hidden">
            <div className="absolute inset-0 opacity-5" style={{ background: "radial-gradient(circle, var(--arm) 0%, transparent 70%)" }} />
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2 z-10">Contador de almas</p>
            <p className="text-4xl font-black tracking-tight z-10" style={{ color: "var(--arm)" }}>{fmt(contador || globales.historico.paj)}</p>
            <p className="text-[10px] text-gray-400 mt-1 z-10">Personas que aceptaron a Jesús</p>
          </div>
        </div>
      </section>

      {/* ═══════ HISTÓRICO POR CAMPUS ═══════ */}
      {user?.rol === "admin_global" && Object.keys(globales.por_campus).length > 0 && (
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-700">Encuentros por campus — histórico total</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Campus</th>
                  <th className="text-right">Encuentros</th>
                  <th className="text-right">Asistentes</th>
                  <th className="text-right">PAJ</th>
                </tr>
              </thead>
              <tbody>
                {[...campusList].sort((a, b) => (globales.por_campus[b.id]?.asistentes ?? 0) - (globales.por_campus[a.id]?.asistentes ?? 0)).map(c => {
                  const stats = globales.por_campus[c.id];
                  if (!stats) return null;
                  return (
                    <tr key={c.id}>
                      <td><span className="font-semibold">{c.nombre}</span><span className="text-xs text-gray-400 ml-1">{c.pais}</span></td>
                      <td className="text-right font-bold tabular-nums">{fmt(stats.encuentros)}</td>
                      <td className="text-right tabular-nums text-gray-500">{fmt(stats.asistentes)}</td>
                      <td className="text-right font-black tabular-nums" style={{ color: "var(--teal)" }}>{fmt(stats.paj)}</td>
                    </tr>
                  );
                })}
                <tr className="border-t-2 border-gray-200 font-bold">
                  <td>Total global</td>
                  <td className="text-right tabular-nums">{fmt(globales.historico.encuentros)}</td>
                  <td className="text-right tabular-nums text-gray-500">{fmt(globales.historico.asistentes)}</td>
                  <td className="text-right tabular-nums" style={{ color: "var(--teal)" }}>{fmt(globales.historico.paj)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ═══════ ENCUENTROS SEMANA ═══════ */}
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
