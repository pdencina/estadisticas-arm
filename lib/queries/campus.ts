import { createClient } from "@/lib/supabase/server";
import type { Campus, CampusConStats } from "@/types";
import { semanaActual } from "@/lib/utils";

export async function getCampus(): Promise<Campus[]> {
  const supabase = createClient();
  const { data } = await supabase.from("campus").select("*").eq("activo", true).order("nombre");
  return (data as Campus[]) ?? [];
}

export async function getCampusById(id: string): Promise<Campus | null> {
  const supabase = createClient();
  const { data } = await supabase.from("campus").select("*").eq("id", id).single();
  return (data as Campus) ?? null;
}

type ERow = { campus_id: string; total_general: number; asistencia: { auditorio?: number } | null; acepto_jesus_presencial: number; online: { acepto_jesus?: number } | null };

function agrupar(arr: ERow[] | null) {
  const map: Record<string, { total: number; aud: number; paj: number }> = {};
  (arr ?? []).forEach(e => {
    if (!map[e.campus_id]) map[e.campus_id] = { total: 0, aud: 0, paj: 0 };
    map[e.campus_id].total += e.total_general ?? 0;
    map[e.campus_id].aud  += e.asistencia?.auditorio ?? 0;
    map[e.campus_id].paj  += (e.acepto_jesus_presencial ?? 0) + (e.online?.acepto_jesus ?? 0);
  });
  return map;
}

export async function getCampusConEstadisticas(): Promise<CampusConStats[]> {
  const supabase = createClient();
  const { lA, dA, lAn, dAn } = semanaActual();

  const [{ data: cl }, { data: act }, { data: ant }] = await Promise.all([
    supabase.from("campus").select("*").eq("activo", true).order("nombre"),
    supabase.from("encuentros").select("campus_id,total_general,asistencia,acepto_jesus_presencial,online").gte("fecha", lA).lte("fecha", dA).eq("estado", "enviado"),
    supabase.from("encuentros").select("campus_id,total_general,asistencia,acepto_jesus_presencial,online").gte("fecha", lAn).lte("fecha", dAn).eq("estado", "enviado"),
  ]);

  const mA = agrupar(act as ERow[] | null);
  const mAn = agrupar(ant as ERow[] | null);

  return (cl as Campus[] ?? []).map(c => {
    const a = mA[c.id] ?? { total: 0, aud: 0, paj: 0 };
    const an = mAn[c.id] ?? { total: 0, aud: 0, paj: 0 };
    return { ...c, semana_actual: a, semana_anterior: an, diferencias: { total: a.total - an.total, aud: a.aud - an.aud, paj: a.paj - an.paj } };
  });
}
