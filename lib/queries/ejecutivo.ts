import { createClient } from "@/lib/supabase/server";

type RawRow = {
  campus_id: string;
  fecha: string;
  tipo: string;
  total_general: number;
  acepto_jesus_presencial: number;
  asistencia: { auditorio?: number } | null;
  online: { acepto_jesus?: number; espectadores_max?: number } | null;
  voluntarios: Record<string, number> | null;
};

async function fetchAllEncuentros(campusId?: string): Promise<RawRow[]> {
  const supabase = createClient();
  const PAGE = 1000;
  const all: RawRow[] = [];
  let offset = 0;

  while (true) {
    let q = supabase
      .from("encuentros")
      .select("campus_id,fecha,tipo,total_general,acepto_jesus_presencial,asistencia,online,voluntarios")
      .in("estado", ["enviado", "validado"])
      .range(offset, offset + PAGE - 1);
    if (campusId) q = q.eq("campus_id", campusId);
    const { data } = await q;
    if (!data || data.length === 0) break;
    all.push(...(data as RawRow[]));
    if (data.length < PAGE) break;
    offset += PAGE;
  }
  return all;
}

// ══════════════════════════════════════════════
// Estadísticas por año
// ══════════════════════════════════════════════
export interface AnioStats {
  anio: number;
  encuentros: number;
  asistentes: number;
  auditorio: number;
  paj: number;
  online: number;
  voluntarios: number;
}

// ══════════════════════════════════════════════
// Estadísticas por mes (para tendencia)
// ══════════════════════════════════════════════
export interface MesStats {
  mes: string; // "2024-01"
  label: string; // "Ene 24"
  encuentros: number;
  asistentes: number;
  paj: number;
}

// ══════════════════════════════════════════════
// Campus ranking
// ══════════════════════════════════════════════
export interface CampusRanking {
  campus_id: string;
  nombre: string;
  pais: string;
  encuentros: number;
  asistentes: number;
  paj: number;
  promedio_por_encuentro: number;
}

// ══════════════════════════════════════════════
// Distribución por tipo
// ══════════════════════════════════════════════
export interface TipoDistribucion {
  tipo: string;
  encuentros: number;
  asistentes: number;
  paj: number;
  porcentaje: number;
}

// ══════════════════════════════════════════════
// Datos completos del ejecutivo
// ══════════════════════════════════════════════
export interface EjecutivoData {
  totales: {
    encuentros: number;
    asistentes: number;
    paj: number;
    auditorio: number;
    voluntarios: number;
    online: number;
    promedio_por_encuentro: number;
    primer_registro: string;
  };
  por_anio: AnioStats[];
  por_mes: MesStats[]; // últimos 18 meses
  campus_ranking: CampusRanking[];
  por_tipo: TipoDistribucion[];
  crecimiento_yoy: {
    encuentros_pct: number;
    asistentes_pct: number;
    paj_pct: number;
  };
}

const MESES_CORTO = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

function sumarVoluntarios(v: Record<string, number> | null): number {
  if (!v) return 0;
  return Object.values(v).reduce((s, n) => s + (typeof n === "number" ? n : 0), 0);
}

export async function getEjecutivoData(campusId?: string): Promise<EjecutivoData> {
  const supabase = createClient();
  const rows = await fetchAllEncuentros(campusId);

  // Campus lookup
  const { data: campusRows } = await supabase.from("campus").select("id,nombre,pais").eq("activo", true);
  const campusMap: Record<string, { nombre: string; pais: string }> = {};
  for (const c of campusRows ?? []) campusMap[c.id] = { nombre: c.nombre, pais: c.pais };

  // Totales
  let totalAsistentes = 0, totalPaj = 0, totalAuditorio = 0, totalVoluntarios = 0, totalOnline = 0;
  let primerFecha = "9999-12-31";

  // Agrupaciones
  const porAnio: Record<number, AnioStats> = {};
  const porMes: Record<string, MesStats> = {};
  const porCampus: Record<string, { encuentros: number; asistentes: number; paj: number }> = {};
  const porTipo: Record<string, { encuentros: number; asistentes: number; paj: number }> = {};

  for (const r of rows) {
    const paj = (r.acepto_jesus_presencial ?? 0) + (r.online?.acepto_jesus ?? 0);
    const aud = r.asistencia?.auditorio ?? 0;
    const vol = sumarVoluntarios(r.voluntarios);
    const onl = r.online?.espectadores_max ?? 0;

    totalAsistentes += r.total_general;
    totalPaj += paj;
    totalAuditorio += aud;
    totalVoluntarios += vol;
    totalOnline += onl;
    if (r.fecha < primerFecha) primerFecha = r.fecha;

    // Por año
    const anio = parseInt(r.fecha.substring(0, 4));
    if (!porAnio[anio]) porAnio[anio] = { anio, encuentros: 0, asistentes: 0, auditorio: 0, paj: 0, online: 0, voluntarios: 0 };
    porAnio[anio].encuentros++;
    porAnio[anio].asistentes += r.total_general;
    porAnio[anio].auditorio += aud;
    porAnio[anio].paj += paj;
    porAnio[anio].online += onl;
    porAnio[anio].voluntarios += vol;

    // Por mes
    const mesKey = r.fecha.substring(0, 7);
    if (!porMes[mesKey]) {
      const m = parseInt(mesKey.substring(5, 7)) - 1;
      const y = mesKey.substring(2, 4);
      porMes[mesKey] = { mes: mesKey, label: `${MESES_CORTO[m]} ${y}`, encuentros: 0, asistentes: 0, paj: 0 };
    }
    porMes[mesKey].encuentros++;
    porMes[mesKey].asistentes += r.total_general;
    porMes[mesKey].paj += paj;

    // Por campus
    if (!porCampus[r.campus_id]) porCampus[r.campus_id] = { encuentros: 0, asistentes: 0, paj: 0 };
    porCampus[r.campus_id].encuentros++;
    porCampus[r.campus_id].asistentes += r.total_general;
    porCampus[r.campus_id].paj += paj;

    // Por tipo
    if (!porTipo[r.tipo]) porTipo[r.tipo] = { encuentros: 0, asistentes: 0, paj: 0 };
    porTipo[r.tipo].encuentros++;
    porTipo[r.tipo].asistentes += r.total_general;
    porTipo[r.tipo].paj += paj;
  }

  // Ranking campus
  const campusRanking: CampusRanking[] = Object.entries(porCampus)
    .map(([cid, stats]) => ({
      campus_id: cid,
      nombre: campusMap[cid]?.nombre ?? "?",
      pais: campusMap[cid]?.pais ?? "?",
      ...stats,
      promedio_por_encuentro: stats.encuentros > 0 ? Math.round(stats.asistentes / stats.encuentros) : 0,
    }))
    .sort((a, b) => b.asistentes - a.asistentes);

  // Distribución por tipo
  const tipoArr: TipoDistribucion[] = Object.entries(porTipo)
    .map(([tipo, stats]) => ({
      tipo,
      ...stats,
      porcentaje: rows.length > 0 ? Math.round((stats.encuentros / rows.length) * 100) : 0,
    }))
    .sort((a, b) => b.encuentros - a.encuentros);

  // Crecimiento YoY
  const anioActual = new Date().getFullYear();
  const statsActual = porAnio[anioActual];
  const statsAnterior = porAnio[anioActual - 1];
  const pct = (a: number, b: number) => b > 0 ? Math.round(((a - b) / b) * 100) : 0;

  const crecimiento = {
    encuentros_pct: statsActual && statsAnterior ? pct(statsActual.encuentros, statsAnterior.encuentros) : 0,
    asistentes_pct: statsActual && statsAnterior ? pct(statsActual.asistentes, statsAnterior.asistentes) : 0,
    paj_pct: statsActual && statsAnterior ? pct(statsActual.paj, statsAnterior.paj) : 0,
  };

  // Últimos 18 meses para tendencia
  const mesesOrdenados = Object.values(porMes).sort((a, b) => a.mes.localeCompare(b.mes));
  const ultimos18 = mesesOrdenados.slice(-18);

  return {
    totales: {
      encuentros: rows.length,
      asistentes: totalAsistentes,
      paj: totalPaj,
      auditorio: totalAuditorio,
      voluntarios: totalVoluntarios,
      online: totalOnline,
      promedio_por_encuentro: rows.length > 0 ? Math.round(totalAsistentes / rows.length) : 0,
      primer_registro: primerFecha,
    },
    por_anio: Object.values(porAnio).sort((a, b) => a.anio - b.anio),
    por_mes: ultimos18,
    campus_ranking: campusRanking,
    por_tipo: tipoArr,
    crecimiento_yoy: crecimiento,
  };
}
