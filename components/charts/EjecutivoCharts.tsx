"use client";

import { fmt, TIPO_LABELS, PAIS_COLOR } from "@/lib/utils";
import type { AnioStats, MesStats, CampusRanking, TipoDistribucion, DiaHeatmap, PredicadorStats, Records, CampusAnioStats } from "@/lib/queries/ejecutivo";

// ═══════════════════════════════════════════════
// Tendencia mensual (últimos 18 meses)
// ═══════════════════════════════════════════════
export function TendenciaMensual({ data }: { data: MesStats[] }) {
  const maxAsist = Math.max(...data.map(d => d.asistentes), 1);
  const maxPaj = Math.max(...data.map(d => d.paj), 1);

  return (
    <div className="card p-5">
      <h3 className="text-sm font-semibold text-gray-700 mb-1">Tendencia mensual</h3>
      <p className="text-[10px] text-gray-400 mb-4">Asistentes totales · últimos 18 meses</p>
      <div className="flex items-end gap-1 h-32 mb-2">
        {data.map((m) => (
          <div key={m.mes} className="flex-1 flex flex-col items-center gap-0.5 group relative">
            <div className="absolute bottom-full mb-2 hidden group-hover:block bg-gray-900 text-white text-[9px] px-2 py-1 rounded whitespace-nowrap z-10">
              {m.label}: {fmt(m.asistentes)} asist · {fmt(m.paj)} PAJ · {m.encuentros} enc.
            </div>
            <div className="w-full rounded-t transition-all duration-300 hover:opacity-100"
              style={{ height: `${Math.max((m.asistentes / maxAsist) * 100, 3)}%`, backgroundColor: "var(--arm)", opacity: 0.6 }} />
          </div>
        ))}
      </div>
      <div className="flex gap-1">
        {data.map((m, i) => (
          <div key={m.mes} className="flex-1 text-center">
            {i % 3 === 0 && <span className="text-[8px] text-gray-400">{m.label}</span>}
          </div>
        ))}
      </div>
      <div className="mt-4 pt-3 border-t border-gray-100">
        <p className="text-[10px] text-gray-400 mb-2">PAJ mensual</p>
        <div className="flex items-end gap-1 h-12">
          {data.map((m) => (
            <div key={m.mes + "-paj"} className="flex-1 rounded-t group relative"
              style={{ height: `${Math.max((m.paj / maxPaj) * 100, 4)}%`, backgroundColor: "var(--teal)", opacity: 0.7 }}>
              <div className="absolute bottom-full mb-1 hidden group-hover:block bg-gray-900 text-white text-[9px] px-2 py-0.5 rounded whitespace-nowrap z-10">
                {m.label}: {fmt(m.paj)} PAJ
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════
// Tabla crecimiento por año
// ═══════════════════════════════════════════════
export function TablaAnual({ data }: { data: AnioStats[] }) {
  return (
    <div className="card overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100">
        <h3 className="text-sm font-semibold text-gray-700">Crecimiento por año</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="tbl">
          <thead>
            <tr>
              <th>Año</th>
              <th className="text-right">Encuentros</th>
              <th className="text-right">Asistentes</th>
              <th className="text-right">Auditorio</th>
              <th className="text-right">PAJ</th>
              <th className="text-right">Voluntarios</th>
              <th className="text-right">Prom/enc.</th>
              <th className="text-right">Δ Asist.</th>
            </tr>
          </thead>
          <tbody>
            {data.map((a, i) => {
              const prev = data[i - 1];
              const deltaPct = prev && prev.asistentes > 0
                ? Math.round(((a.asistentes - prev.asistentes) / prev.asistentes) * 100) : null;
              const prom = a.encuentros > 0 ? Math.round(a.asistentes / a.encuentros) : 0;
              return (
                <tr key={a.anio}>
                  <td className="font-bold">{a.anio}</td>
                  <td className="text-right tabular-nums">{fmt(a.encuentros)}</td>
                  <td className="text-right tabular-nums font-semibold">{fmt(a.asistentes)}</td>
                  <td className="text-right tabular-nums text-gray-500">{fmt(a.auditorio)}</td>
                  <td className="text-right tabular-nums font-black" style={{ color: "var(--teal)" }}>{fmt(a.paj)}</td>
                  <td className="text-right tabular-nums text-gray-400">{fmt(a.voluntarios)}</td>
                  <td className="text-right tabular-nums text-gray-400">{fmt(prom)}</td>
                  <td className="text-right tabular-nums">
                    {deltaPct !== null ? (
                      <span className={deltaPct >= 0 ? "text-emerald-500" : "text-red-500"}>
                        {deltaPct >= 0 ? "+" : ""}{deltaPct}%
                      </span>
                    ) : <span className="text-gray-300">—</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════
// Ranking campus (barras horizontales)
// ═══════════════════════════════════════════════
export function CampusBarras({ data }: { data: CampusRanking[] }) {
  const maxAsist = Math.max(...data.map(d => d.asistentes), 1);
  return (
    <div className="card p-5">
      <h3 className="text-sm font-semibold text-gray-700 mb-1">Ranking campus</h3>
      <p className="text-[10px] text-gray-400 mb-4">Total asistentes histórico</p>
      <div className="space-y-3">
        {data.map((c, i) => (
          <div key={c.campus_id}>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-gray-300 w-4">{i + 1}</span>
                <span className="text-xs font-semibold text-gray-700">{c.nombre}</span>
                <span className="text-[9px] text-gray-400">{c.pais}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold tabular-nums">{fmt(c.asistentes)}</span>
                <span className="text-[9px] text-gray-400 tabular-nums w-12 text-right">{fmt(c.encuentros)} enc.</span>
              </div>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
              <div className="h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.round((c.asistentes / maxAsist) * 100)}%`, backgroundColor: PAIS_COLOR[c.pais] ?? "var(--arm)" }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════
// Distribución por tipo de encuentro
// ═══════════════════════════════════════════════
const TIPO_COLOR: Record<string, string> = {
  domingo: "#1D4ED8", miercoles: "#7C3AED", jueves: "#059669",
  sabado: "#D97706", prayer_room: "#6B7280", otro: "#9CA3AF",
};

export function TipoDistribucionChart({ data }: { data: TipoDistribucion[] }) {
  const total = data.reduce((s, d) => s + d.encuentros, 0);
  return (
    <div className="card p-5">
      <h3 className="text-sm font-semibold text-gray-700 mb-1">Por tipo de encuentro</h3>
      <p className="text-[10px] text-gray-400 mb-4">Distribución sobre {fmt(total)} encuentros</p>
      <div className="w-full h-4 rounded-full overflow-hidden flex mb-4">
        {data.map(d => (
          <div key={d.tipo} className="h-full transition-all duration-300"
            style={{ width: `${d.porcentaje}%`, backgroundColor: TIPO_COLOR[d.tipo] ?? "#CBD5E1" }}
            title={`${TIPO_LABELS[d.tipo] ?? d.tipo}: ${d.porcentaje}%`} />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2">
        {data.filter(d => d.porcentaje > 0).map(d => (
          <div key={d.tipo} className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: TIPO_COLOR[d.tipo] ?? "#CBD5E1" }} />
            <span className="text-[10px] text-gray-600 flex-1">{TIPO_LABELS[d.tipo] ?? d.tipo}</span>
            <span className="text-[10px] font-bold text-gray-800 tabular-nums">{d.porcentaje}%</span>
            <span className="text-[9px] text-gray-400 tabular-nums">{fmt(d.encuentros)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════
// PAJ por campus (mini bars)
// ═══════════════════════════════════════════════
export function PajPorCampus({ data }: { data: CampusRanking[] }) {
  const sorted = [...data].sort((a, b) => b.paj - a.paj);
  const maxPaj = Math.max(...sorted.map(d => d.paj), 1);
  return (
    <div className="card p-5">
      <h3 className="text-sm font-semibold text-gray-700 mb-1">PAJ por campus</h3>
      <p className="text-[10px] text-gray-400 mb-4">Personas que aceptaron a Jesús — histórico</p>
      <div className="space-y-2.5">
        {sorted.map(c => (
          <div key={c.campus_id} className="flex items-center gap-3">
            <span className="text-[10px] text-gray-400 w-24 text-right truncate shrink-0">{c.nombre}</span>
            <div className="flex-1 bg-gray-100 rounded-full h-2.5 overflow-hidden">
              <div className="h-full rounded-full"
                style={{ width: `${Math.round((c.paj / maxPaj) * 100)}%`, background: "linear-gradient(90deg, var(--teal), #34D399)" }} />
            </div>
            <span className="text-xs font-black tabular-nums w-12 text-right" style={{ color: "var(--teal)" }}>{fmt(c.paj)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════
// Heatmap día de la semana
// ═══════════════════════════════════════════════
export function DiaHeatmapChart({ data }: { data: DiaHeatmap[] }) {
  const maxEnc = Math.max(...data.map(d => d.encuentros), 1);
  return (
    <div className="card p-5">
      <h3 className="text-sm font-semibold text-gray-700 mb-1">Actividad por día</h3>
      <p className="text-[10px] text-gray-400 mb-4">Distribución semanal de encuentros</p>
      <div className="space-y-2">
        {data.map(d => {
          const intensity = d.encuentros / maxEnc;
          return (
            <div key={d.dia} className="flex items-center gap-3">
              <span className="text-[10px] text-gray-500 w-20 text-right shrink-0">{d.label}</span>
              <div className="flex-1 bg-gray-100 rounded h-6 overflow-hidden relative">
                <div className="h-full rounded transition-all duration-500"
                  style={{ width: `${Math.round(intensity * 100)}%`, backgroundColor: `rgba(29, 78, 216, ${0.2 + intensity * 0.6})` }} />
                <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-gray-700">
                  {fmt(d.encuentros)} enc. · {fmt(d.paj)} PAJ
                </span>
              </div>
              <div className="text-right shrink-0 w-20">
                <span className="text-[10px] font-semibold tabular-nums">{fmt(d.asistentes)}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════
// Top predicadores
// ═══════════════════════════════════════════════
export function TopPredicadores({ data }: { data: PredicadorStats[] }) {
  if (data.length === 0) return null;
  return (
    <div className="card overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100">
        <h3 className="text-sm font-semibold text-gray-700">Top predicadores</h3>
        <p className="text-[10px] text-gray-400 mt-0.5">Mínimo 3 encuentros · ordenados por frecuencia</p>
      </div>
      <div className="overflow-x-auto">
        <table className="tbl">
          <thead>
            <tr>
              <th></th>
              <th>Predicador</th>
              <th className="text-right">Encuentros</th>
              <th className="text-right">Asistentes</th>
              <th className="text-right">PAJ</th>
              <th className="text-right">Prom.</th>
              <th className="text-right">Tasa conv.</th>
            </tr>
          </thead>
          <tbody>
            {data.map((p, i) => (
              <tr key={p.nombre}>
                <td className="text-[10px] text-gray-300 font-bold">{i + 1}</td>
                <td className="font-semibold text-sm">{p.nombre}</td>
                <td className="text-right tabular-nums">{fmt(p.encuentros)}</td>
                <td className="text-right tabular-nums text-gray-500">{fmt(p.asistentes)}</td>
                <td className="text-right tabular-nums font-black" style={{ color: "var(--teal)" }}>{fmt(p.paj)}</td>
                <td className="text-right tabular-nums text-gray-400">{fmt(p.promedio)}</td>
                <td className="text-right tabular-nums">
                  <span className={p.tasa_conversion > 2 ? "text-emerald-500 font-semibold" : "text-gray-400"}>
                    {p.tasa_conversion}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════
// Records / Hitos
// ═══════════════════════════════════════════════
export function RecordsCard({ records }: { records: Records }) {
  const items = [
    { label: "Máx. asistentes en un encuentro", ...records.max_asistentes, icon: "🏆" },
    { label: "Máx. PAJ en un encuentro", ...records.max_paj, icon: "⭐" },
    { label: "Máx. espectadores online", ...records.max_online, icon: "📺" },
  ].filter(r => r.valor > 0);
  if (items.length === 0) return null;
  return (
    <div className="card p-5">
      <h3 className="text-sm font-semibold text-gray-700 mb-4">Records históricos</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {items.map(r => (
          <div key={r.label} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50">
            <span className="text-xl">{r.icon}</span>
            <div>
              <p className="text-2xl font-black">{fmt(r.valor)}</p>
              <p className="text-[10px] text-gray-500 mt-0.5">{r.label}</p>
              <p className="text-[9px] text-gray-400 mt-0.5">{r.campus} · {r.fecha.split("-").reverse().join("-")}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════
// Campus crecimiento por año (tabla comparativa)
// ═══════════════════════════════════════════════
export function CampusCrecimientoAnual({ data }: { data: CampusAnioStats[] }) {
  if (data.length === 0) return null;
  const anios = Array.from(new Set(data.flatMap(c => c.por_anio.map(a => a.anio)))).sort();
  const aniosVis = anios.slice(-4);
  return (
    <div className="card overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100">
        <h3 className="text-sm font-semibold text-gray-700">Asistentes por campus y año</h3>
        <p className="text-[10px] text-gray-400 mt-0.5">Evolución de los últimos {aniosVis.length} años</p>
      </div>
      <div className="overflow-x-auto">
        <table className="tbl">
          <thead>
            <tr>
              <th>Campus</th>
              {aniosVis.map(a => (<th key={a} className="text-right">{a}</th>))}
              <th className="text-right">Δ último año</th>
            </tr>
          </thead>
          <tbody>
            {data.map(c => {
              const anioMap: Record<number, number> = {};
              c.por_anio.forEach(a => { anioMap[a.anio] = a.asistentes; });
              const last = aniosVis[aniosVis.length - 1];
              const prev = aniosVis[aniosVis.length - 2];
              const delta = (anioMap[last] && anioMap[prev] && anioMap[prev] > 0)
                ? Math.round(((anioMap[last] - anioMap[prev]) / anioMap[prev]) * 100) : null;
              return (
                <tr key={c.campus_id}>
                  <td className="font-semibold">{c.nombre}</td>
                  {aniosVis.map(a => (
                    <td key={a} className="text-right tabular-nums text-gray-600">
                      {anioMap[a] ? fmt(anioMap[a]) : <span className="text-gray-300">—</span>}
                    </td>
                  ))}
                  <td className="text-right tabular-nums">
                    {delta !== null ? (
                      <span className={`font-semibold ${delta >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                        {delta >= 0 ? "+" : ""}{delta}%
                      </span>
                    ) : <span className="text-gray-300">—</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
