import { createClient } from "@/lib/supabase/server";
import type { Campus, CampusConStats } from "@/types";

export async function getCampus(): Promise<Campus[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("campus")
    .select("*")
    .eq("activo", true)
    .order("nombre");
  return (data as Campus[]) ?? [];
}

function semanaActual() {
  const ahora = new Date();
  const dia = ahora.getDay() || 7;
  const lunes = new Date(ahora);
  lunes.setDate(ahora.getDate() - dia + 1);
  const domingo = new Date(lunes);
  domingo.setDate(lunes.getDate() + 6);
  const lunesAnt = new Date(lunes);
  lunesAnt.setDate(lunes.getDate() - 7);
  const domingoAnt = new Date(lunesAnt);
  domingoAnt.setDate(lunesAnt.getDate() + 6);
  const fmt = (d: Date) => d.toISOString().split("T")[0];
  return { lunesAct: fmt(lunes), domAct: fmt(domingo), lunesAnt: fmt(lunesAnt), domAnt: fmt(domingoAnt) };
}

type ERow = {
  campus_id: string;
  total_general: number;
  asistencia: { auditorio?: number } | null;
  acepto_jesus_presencial: number;
  online: { acepto_jesus?: number } | null;
};

function agrupar(arr: ERow[] | null) {
  const map: Record<string, { total: number; aud: number; paj: number }> = {};
  (arr ?? []).forEach((e) => {
    if (!map[e.campus_id]) map[e.campus_id] = { total: 0, aud: 0, paj: 0 };
    map[e.campus_id].total += e.total_general ?? 0;
    map[e.campus_id].aud  += e.asistencia?.auditorio ?? 0;
    map[e.campus_id].paj  += (e.acepto_jesus_presencial ?? 0) + (e.online?.acepto_jesus ?? 0);
  });
  return map;
}

export async function getCampusConEstadisticas(): Promise<CampusConStats[]> {
  const supabase = createClient();
  const { lunesAct, domAct, lunesAnt, domAnt } = semanaActual();

  const [{ data: campusList }, { data: actual }, { data: anterior }] = await Promise.all([
    supabase.from("campus").select("*").eq("activo", true).order("nombre"),
    supabase.from("encuentros")
      .select("campus_id,total_general,asistencia,acepto_jesus_presencial,online")
      .gte("fecha", lunesAct).lte("fecha", domAct).eq("estado", "enviado"),
    supabase.from("encuentros")
      .select("campus_id,total_general,asistencia,acepto_jesus_presencial,online")
      .gte("fecha", lunesAnt).lte("fecha", domAnt).eq("estado", "enviado"),
  ]);

  const mapAct = agrupar(actual as ERow[] | null);
  const mapAnt = agrupar(anterior as ERow[] | null);

  return (campusList as Campus[] ?? []).map((c) => {
    const a  = mapAct[c.id] ?? { total: 0, aud: 0, paj: 0 };
    const an = mapAnt[c.id] ?? { total: 0, aud: 0, paj: 0 };
    return {
      ...c,
      semana_actual:   a,
      semana_anterior: an,
      diferencias: { total: a.total - an.total, aud: a.aud - an.aud, paj: a.paj - an.paj },
    };
  });
}
