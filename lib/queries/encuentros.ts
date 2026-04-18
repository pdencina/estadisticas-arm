import { createClient } from "@/lib/supabase/server";
import type { Encuentro, DashboardKPIs } from "@/types";

const SELECT = "*, campus:campus_id(id,nombre,ciudad,pais)";

function semanas() {
  const ahora = new Date();
  const dia = ahora.getDay() || 7;
  const lunes = new Date(ahora); lunes.setDate(ahora.getDate() - dia + 1);
  const domingo = new Date(lunes); domingo.setDate(lunes.getDate() + 6);
  const lunesAnt = new Date(lunes); lunesAnt.setDate(lunes.getDate() - 7);
  const domAnt = new Date(lunesAnt); domAnt.setDate(lunesAnt.getDate() + 6);
  const fmt = (d: Date) => d.toISOString().split("T")[0];
  return { lA: fmt(lunes), dA: fmt(domingo), lAn: fmt(lunesAnt), dAn: fmt(domAnt) };
}

export async function getEncuentros(campusId?: string): Promise<Encuentro[]> {
  const supabase = createClient();
  let q = supabase.from("encuentros").select(SELECT)
    .order("fecha", { ascending: false }).order("horario", { ascending: true });
  if (campusId) q = q.eq("campus_id", campusId);
  const { data } = await q;
  return (data as Encuentro[]) ?? [];
}

export async function getEncuentroById(id: string): Promise<Encuentro> {
  const supabase = createClient();
  const { data, error } = await supabase.from("encuentros").select(SELECT).eq("id", id).single();
  if (error) throw new Error(error.message);
  return data as Encuentro;
}

export async function getEncuentrosPendientes(): Promise<Encuentro[]> {
  const supabase = createClient();
  const { data } = await supabase.from("encuentros").select(SELECT)
    .eq("estado", "borrador").order("fecha", { ascending: false });
  return (data as Encuentro[]) ?? [];
}

export async function getEncuentrosSemanaActual(campusId?: string): Promise<Encuentro[]> {
  const supabase = createClient();
  const { lA, dA } = semanas();
  let q = supabase.from("encuentros").select(SELECT).gte("fecha", lA).lte("fecha", dA);
  if (campusId) q = q.eq("campus_id", campusId);
  const { data } = await q;
  return (data as Encuentro[]) ?? [];
}

export async function getDashboardKPIs(campusId?: string): Promise<DashboardKPIs> {
  const supabase = createClient();
  const { lA, dA, lAn, dAn } = semanas();

  type Row = {
    total_general: number;
    asistencia: { auditorio?: number } | null;
    acepto_jesus_presencial: number;
    online: { acepto_jesus?: number } | null;
  };

  let qAct = supabase.from("encuentros")
    .select("total_general,asistencia,acepto_jesus_presencial,online")
    .gte("fecha", lA).lte("fecha", dA).eq("estado", "enviado");
  let qAnt = supabase.from("encuentros")
    .select("total_general,asistencia,acepto_jesus_presencial,online")
    .gte("fecha", lAn).lte("fecha", dAn).eq("estado", "enviado");

  if (campusId) { qAct = qAct.eq("campus_id", campusId); qAnt = qAnt.eq("campus_id", campusId); }

  const [{ data: act }, { data: ant }] = await Promise.all([qAct, qAnt]);

  const sum = (rows: Row[] | null) => ({
    total_general:   (rows ?? []).reduce((s, r) => s + (r.total_general ?? 0), 0),
    total_auditorio: (rows ?? []).reduce((s, r) => s + (r.asistencia?.auditorio ?? 0), 0),
    total_paj:       (rows ?? []).reduce((s, r) => s + (r.acepto_jesus_presencial ?? 0) + (r.online?.acepto_jesus ?? 0), 0),
  });

  const sa  = sum(act as Row[] | null);
  const san = sum(ant as Row[] | null);

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
