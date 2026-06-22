import { getDashboardKPIs, getEncuentrosSemanaActual, getHistoricoSemanal, getContadorAlmas } from "@/lib/queries/encuentros";
import { getCampusConEstadisticas } from "@/lib/queries/campus";
import { fmt, fmtDelta, deltaColor, fmtFecha, PAIS_COLOR } from "@/lib/utils";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import PastorCharts from "@/components/charts/PastorCharts";

export const revalidate = 0;

export default async function PastorPage() {
  const [kpis, encuentros, campusList, historico, contador] = await Promise.all([
    getDashboardKPIs(),
    getEncuentrosSemanaActual(),
    getCampusConEstadisticas(),
    getHistoricoSemanal(undefined, 8),
    getContadorAlmas(),
  ]);

  const { semana_actual: sa, diferencias: d } = kpis;
  const hoy = format(new Date(), "EEEE d 'de' MMMM yyyy", { locale: es });
  const totalContador = contador || sa.total_paj;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-6 py-4 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-bold shadow-sm" style={{ background: "var(--arm)" }}>AR</div>
            <div>
              <p className="text-sm font-bold text-gray-900">arm global · Vista Pastor</p>
              <p className="text-xs text-gray-400 capitalize">{hoy}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Actualización en tiempo real
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-6 space-y-6">

        {/* ── HERO: Contador de Almas ── */}
        <div className="rounded-2xl p-10 text-center relative overflow-hidden" style={{ background: "var(--arm-l)" }}>
          <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "#534AB7" }}>
            Contador de almas · 2026
          </p>
          <p className="text-8xl font-black tracking-tight leading-none mb-3" style={{ color: "var(--arm)" }}>
            {fmt(totalContador)}
          </p>
          <p className="text-sm font-medium" style={{ color: "#534AB7" }}>
            Personas que aceptaron a Jesús este año
          </p>
          {d.total_paj !== 0 && (
            <div className="mt-4 inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold" style={{ background: "white", color: "var(--arm)" }}>
              {d.total_paj > 0 ? "↑" : "↓"} {fmt(Math.abs(d.total_paj))} esta semana
            </div>
          )}
          <div className="absolute bottom-0 left-0 right-0 h-1.5 opacity-40" style={{ background: "var(--arm)" }} />
        </div>

        {/* ── KPIs semana ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Total asistentes",  val: sa.total_general,   delta: d.total_general,   color: "var(--arm)",  bg: "var(--arm-l)" },
            { label: "En auditorio",       val: sa.total_auditorio, delta: d.total_auditorio, color: "#534AB7",     bg: "#EEEDFE"      },
            { label: "Aceptaron a Jesús",  val: sa.total_paj,       delta: d.total_paj,       color: "var(--teal)", bg: "var(--teal-l)" },
            { label: "Campus activos",     val: campusList.filter(c=>c.semana_actual.total>0).length, delta: 0, color: "#D85A30", bg: "#FAECE7" },
          ].map((k,i) => (
            <div key={i} className="kpi-card">
              <p className="text-xs font-medium text-gray-400 mb-2">{k.label}</p>
              <p className="text-3xl font-black" style={{ color: k.color }}>{fmt(k.val)}</p>
              {k.delta !== 0 && (
                <p className={`text-xs mt-1.5 ${deltaColor(k.delta)}`}>{fmtDelta(k.delta)} vs sem. anterior</p>
              )}
            </div>
          ))}
        </div>

        {/* ── Gráficos históricos ── */}
        <PastorCharts historico={historico} />

        {/* ── Tabla campus ── */}
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-700">Resumen por campus — semana actual</h3>
            <span className="badge badge-purple text-[10px]">{campusList.length} campus</span>
          </div>
          <div className="overflow-x-auto">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Campus</th><th>País</th>
                  <th className="text-right">Asistentes</th>
                  <th className="text-right">Auditorio</th>
                  <th className="text-right">PAJ</th>
                  <th className="text-right">vs ant.</th>
                </tr>
              </thead>
              <tbody>
                {[...campusList].sort((a,b)=>b.semana_actual.total-a.semana_actual.total).map(c=>(
                  <tr key={c.id}>
                    <td className="font-bold">{c.nombre}</td>
                    <td><span className="badge badge-gray text-[10px]">{c.pais}</span></td>
                    <td className="text-right font-bold tabular-nums text-base">{fmt(c.semana_actual.total)}</td>
                    <td className="text-right tabular-nums text-gray-500">{fmt(c.semana_actual.aud)}</td>
                    <td className="text-right font-black tabular-nums text-lg" style={{ color: "var(--teal)" }}>{c.semana_actual.paj}</td>
                    <td className={`text-right text-sm font-semibold tabular-nums ${deltaColor(c.diferencias.total)}`}>{fmtDelta(c.diferencias.total)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={2} className="font-black">Total global</td>
                  <td className="text-right font-black tabular-nums text-lg">{fmt(sa.total_general)}</td>
                  <td className="text-right font-black tabular-nums text-gray-600">{fmt(sa.total_auditorio)}</td>
                  <td className="text-right font-black tabular-nums text-xl" style={{ color: "var(--teal)" }}>{sa.total_paj}</td>
                  <td className={`text-right font-black tabular-nums ${deltaColor(d.total_general)}`}>{fmtDelta(d.total_general)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* ── Encuentros semana ── */}
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-700">Encuentros reportados esta semana</h3>
          </div>
          {encuentros.filter(e=>e.estado!=="pendiente").length === 0 ? (
            <div className="py-8 text-center text-sm text-gray-400">Sin encuentros reportados aún</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="tbl">
                <thead>
                  <tr><th>Campus</th><th>Día</th><th>Predicador</th><th>Mensaje</th><th className="text-right">Total</th><th className="text-right">PAJ</th></tr>
                </thead>
                <tbody>
                  {encuentros.filter(e=>e.estado!=="pendiente").sort((a,b)=>new Date(b.fecha).getTime()-new Date(a.fecha).getTime()).map(e=>(
                    <tr key={e.id}>
                      <td><span className="font-semibold">{e.campus?.nombre}</span></td>
                      <td className="text-gray-500 text-xs capitalize">{format(parseISO(e.fecha),"EEEE d MMM",{locale:es})} · {e.horario}</td>
                      <td className="text-gray-600 max-w-[140px] truncate text-xs">{e.predicador ?? "—"}</td>
                      <td className="text-gray-400 max-w-[180px] truncate text-xs italic">{e.nombre_mensaje ?? "—"}</td>
                      <td className="text-right font-bold tabular-nums">{fmt(e.total_general)}</td>
                      <td className="text-right font-black tabular-nums text-lg" style={{ color: "var(--teal)" }}>{(e.acepto_jesus_presencial??0)+(e.online?.acepto_jesus??0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-gray-300 pb-4">arm global · estadisticas-arm.vercel.app/pastor</p>
      </div>
    </div>
  );
}
