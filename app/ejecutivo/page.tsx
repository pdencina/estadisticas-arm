import { redirect } from "next/navigation";
import { getEjecutivoData } from "@/lib/queries/ejecutivo";
import { getContadorAlmas } from "@/lib/queries/encuentros";
import { getCurrentUser } from "@/lib/queries/users";
import { fmt } from "@/lib/utils";
import {
  TendenciaMensual, TablaAnual, CampusBarras, TipoDistribucionChart,
  PajPorCampus, DiaHeatmapChart, TopPredicadores, RecordsCard, CampusCrecimientoAnual,
} from "@/components/charts/EjecutivoCharts";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export const revalidate = 300;

export default async function EjecutivoPage() {
  const user = await getCurrentUser();
  if (!user || user.rol !== "admin_global") redirect("/dashboard");

  const [data, contador] = await Promise.all([
    getEjecutivoData(),
    getContadorAlmas(),
  ]);

  const { totales, por_anio, por_mes, campus_ranking, por_tipo, por_dia,
    top_predicadores, records, campus_por_anio, crecimiento_yoy } = data;
  const hoy = format(new Date(), "EEEE d 'de' MMMM, yyyy", { locale: es });
  const primerAnio = totales.primer_registro.substring(0, 4);

  return (
    <div className="page space-y-6">
      {/* Header */}
      <div>
        <p className="text-xs text-gray-400 capitalize">{hoy}</p>
        <h1 className="text-xl font-bold text-gray-800 mt-0.5">Vista ejecutiva</h1>
        <p className="text-xs text-gray-400 mt-1">
          Datos desde {primerAnio} · {campus_ranking.length} campus · Tasa conversión: {totales.tasa_conversion}%
        </p>
      </div>

      {/* GRANDES NÚMEROS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="kpi-card border-l-4 border-l-blue-500">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Encuentros</p>
          <p className="text-3xl font-black tracking-tight">{fmt(totales.encuentros)}</p>
          <p className="text-[10px] text-gray-400 mt-1">Total histórico</p>
        </div>
        <div className="kpi-card border-l-4 border-l-emerald-500">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Asistentes</p>
          <p className="text-3xl font-black tracking-tight">{fmt(totales.asistentes)}</p>
          <p className="text-[10px] text-gray-400 mt-1">Acumulado total</p>
        </div>
        <div className="kpi-card border-l-4 border-l-orange-500">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">PAJ</p>
          <p className="text-3xl font-black tracking-tight" style={{ color: "var(--teal)" }}>
            {fmt(contador || totales.paj)}
          </p>
          <p className="text-[10px] text-gray-400 mt-1">Personas que aceptaron a Jesús</p>
        </div>
        <div className="kpi-card border-l-4 border-l-purple-500">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Promedio / enc.</p>
          <p className="text-3xl font-black tracking-tight">{fmt(totales.promedio_por_encuentro)}</p>
          <p className="text-[10px] text-gray-400 mt-1">Asistentes por encuentro</p>
        </div>
      </div>

      {/* CRECIMIENTO YoY */}
      {(crecimiento_yoy.encuentros_pct !== 0 || crecimiento_yoy.asistentes_pct !== 0) && (
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">
            Crecimiento vs año anterior ({new Date().getFullYear() - 1} → {new Date().getFullYear()})
          </h3>
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "Encuentros", pct: crecimiento_yoy.encuentros_pct },
              { label: "Asistentes", pct: crecimiento_yoy.asistentes_pct },
              { label: "PAJ", pct: crecimiento_yoy.paj_pct },
            ].map(item => (
              <div key={item.label} className="text-center">
                <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wide mb-1">{item.label}</p>
                <p className={`text-2xl font-black ${item.pct >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                  {item.pct >= 0 ? "+" : ""}{item.pct}%
                </p>
              </div>
            ))}
          </div>
          <p className="text-[9px] text-gray-300 mt-3 text-center">Comparación parcial — el año actual aún no ha terminado</p>
        </div>
      )}

      {/* RECORDS */}
      <RecordsCard records={records} />

      {/* TENDENCIA MENSUAL */}
      <TendenciaMensual data={por_mes} />

      {/* GRID: RANKING + TIPOS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <CampusBarras data={campus_ranking} />
        <TipoDistribucionChart data={por_tipo} />
      </div>

      {/* GRID: PAJ + HEATMAP */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <PajPorCampus data={campus_ranking} />
        <DiaHeatmapChart data={por_dia} />
      </div>

      {/* TOP PREDICADORES */}
      <TopPredicadores data={top_predicadores} />

      {/* CAMPUS POR AÑO */}
      <CampusCrecimientoAnual data={campus_por_anio} />

      {/* TABLA ANUAL */}
      <TablaAnual data={por_anio} />

      {/* MÉTRICAS COMPLEMENTARIAS */}
      <div className="card p-5">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Métricas complementarias</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-[10px] text-gray-400 uppercase font-bold">Auditorio total</p>
            <p className="text-lg font-black mt-1">{fmt(totales.auditorio)}</p>
          </div>
          <div>
            <p className="text-[10px] text-gray-400 uppercase font-bold">Espectadores online</p>
            <p className="text-lg font-black mt-1">{fmt(totales.online)}</p>
          </div>
          <div>
            <p className="text-[10px] text-gray-400 uppercase font-bold">Voluntarios movilizados</p>
            <p className="text-lg font-black mt-1">{fmt(totales.voluntarios)}</p>
          </div>
          <div>
            <p className="text-[10px] text-gray-400 uppercase font-bold">Tasa conversión</p>
            <p className="text-lg font-black mt-1" style={{ color: "var(--teal)" }}>{totales.tasa_conversion}%</p>
            <p className="text-[9px] text-gray-400">PAJ / asistentes</p>
          </div>
        </div>
      </div>

    </div>
  );
}
