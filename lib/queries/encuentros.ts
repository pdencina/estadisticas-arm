import { createClient } from "@/lib/supabase/server";
import type { Encuentro, DashboardKPIs, SemanaHistorica } from "@/types";
import { semanaActual } from "@/lib/utils";
import { format, subWeeks, startOfWeek, endOfWeek } from "date-fns";
import { es } from "date-fns/locale";

const SEL = "*, campus:campus_id(id,nombre,ciudad,pais)";

type ERow = { total_general: number; asistencia: { auditorio?: number } | null; acepto_jesus_presencial: number; online: { acepto_jesus?: number } | null };

function sumarKPIs(rows: ERow[] | null) {
  return {
    total_general:   (rows ?? []).reduce((s, r) => s + (r.total_general ?? 0), 0),
    total_auditorio: (rows ?? []).reduce((s, r) => s + (r.asistencia?.auditorio ?? 0), 0),
    total_paj:       (rows ?? []).reduce((s, r) => s + (r.acepto_jesus_presencial ?? 0) + (r.online?.acepto_jesus ?? 0), 0),
  };
}

export async function getEncuentros(campusId?: string): Promise<Encuentro[]> {
  const supabase = createClient();
  let q = supabase.from("encuentros").select(SEL).order("fecha", { ascending: false }).order("horario", { ascending: true });
  if (campusId) q = q.eq("campus_id", campusId);
  const { data } = await q;
  return (data as Encuentro[]) ?? [];
}

export async function getEncuentroById(id: string): Promise<Encuentro | null> {
  const supabase = createClient();
  const { data } = await supabase.from("encuentros").select(SEL).eq("id", id).maybeSingle();
  return (data as Encuentro) ?? null;
}

export async function getEncuentrosPendientes(campusId?: string): Promise<Encuentro[]> {
  const supabase = createClient();
  let q = supabase.from("encuentros").select(SEL).eq("estado", "pendiente").order("fecha", { ascending: false });
  if (campusId) q = q.eq("campus_id", campusId);
  const { data } = await q;
  return (data as Encuentro[]) ?? [];
}

export async function getEncuentrosSemanaActual(campusId?: string): Promise<Encuentro[]> {
  const supabase = createClient();
  const { lA, dA } = semanaActual();
  let q = supabase.from("encuentros").select(SEL).gte("fecha", lA).lte("fecha", dA).order("fecha").order("horario");
  if (campusId) q = q.eq("campus_id", campusId);
  const { data } = await q;
  return (data as Encuentro[]) ?? [];
}

export async function getDashboardKPIs(campusId?: string): Promise<DashboardKPIs> {
  const supabase = createClient();
  const { lA, dA, lAn, dAn } = semanaActual();

  let qA = supabase.from("encuentros").select("total_general,asistencia,acepto_jesus_presencial,online").gte("fecha", lA).lte("fecha", dA).eq("estado", "enviado");
  let qAn = supabase.from("encuentros").select("total_general,asistencia,acepto_jesus_presencial,online").gte("fecha", lAn).lte("fecha", dAn).eq("estado", "enviado");
  if (campusId) { qA = qA.eq("campus_id", campusId); qAn = qAn.eq("campus_id", campusId); }

  const [{ data: act }, { data: ant }] = await Promise.all([qA, qAn]);
  const sa = sumarKPIs(act as ERow[] | null);
  const san = sumarKPIs(ant as ERow[] | null);

  return {
    semana_actual:   sa,
    semana_anterior: san,
    diferencias: {
      total_general:   sa.total_general   - san.total_general,
      total_auditorio: sa.total_auditorio - san.total_auditorio,
      total_paj:       sa.total_paj       - san.total_paj,
    },
  };
}

export async function getHistoricoSemanal(campusId?: string, nSemanas = 8): Promise<SemanaHistorica[]> {
  const supabase = createClient();
  const hoy = new Date();
  const result: SemanaHistorica[] = [];

  for (let i = nSemanas - 1; i >= 0; i--) {
    const fecha = subWeeks(hoy, i);
    const inicio = format(startOfWeek(fecha, { weekStartsOn: 1 }), "yyyy-MM-dd");
    const fin    = format(endOfWeek(fecha,   { weekStartsOn: 1 }), "yyyy-MM-dd");
    const label  = format(fecha, "d MMM", { locale: es });

    let q = supabase.from("encuentros").select("total_general,acepto_jesus_presencial,online").gte("fecha", inicio).lte("fecha", fin).eq("estado", "enviado");
    if (campusId) q = q.eq("campus_id", campusId);
    const { data } = await q;

    const rows = (data as ERow[]) ?? [];
    result.push({
      label,
      inicio,
      total: rows.reduce((s, r) => s + (r.total_general ?? 0), 0),
      paj:   rows.reduce((s, r) => s + (r.acepto_jesus_presencial ?? 0) + (r.online?.acepto_jesus ?? 0), 0),
    });
  }

  return result;
}

export async function getContadorAlmas(): Promise<number> {
  const supabase = createClient();
  const { data } = await supabase.from("informes_semanales").select("contador_almas").order("semana_inicio", { ascending: false }).limit(1).maybeSingle();
  return (data as { contador_almas?: number } | null)?.contador_almas ?? 0;
}

export async function getEstadisticasGlobales(campusId?: string) {
  const supabase = createClient();
  const anioActual = new Date().getFullYear();

  // Total histórico (todos los años)
  let qAll = supabase.from("encuentros").select("total_general,acepto_jesus_presencial,online").in("estado", ["enviado", "validado"]);
  if (campusId) qAll = qAll.eq("campus_id", campusId);

  // Total año actual
  let qYear = supabase.from("encuentros").select("total_general,acepto_jesus_presencial,online").in("estado", ["enviado", "validado"]).gte("fecha", `${anioActual}-01-01`).lte("fecha", `${anioActual}-12-31`);
  if (campusId) qYear = qYear.eq("campus_id", campusId);

  const [{ data: all }, { data: year }] = await Promise.all([qAll, qYear]);

  const rowsAll = (all as ERow[]) ?? [];
  const rowsYear = (year as ERow[]) ?? [];

  return {
    historico: {
      encuentros: rowsAll.length,
      asistentes: rowsAll.reduce((s, r) => s + (r.total_general ?? 0), 0),
      paj: rowsAll.reduce((s, r) => s + (r.acepto_jesus_presencial ?? 0) + (r.online?.acepto_jesus ?? 0), 0),
    },
    anio_actual: {
      anio: anioActual,
      encuentros: rowsYear.length,
      asistentes: rowsYear.reduce((s, r) => s + (r.total_general ?? 0), 0),
      paj: rowsYear.reduce((s, r) => s + (r.acepto_jesus_presencial ?? 0) + (r.online?.acepto_jesus ?? 0), 0),
    },
  };
}
