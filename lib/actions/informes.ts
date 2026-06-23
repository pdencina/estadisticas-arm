"use server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/queries/users";
import { semanaActual } from "@/lib/utils";
import { revalidatePath } from "next/cache";

export async function generarInformeSemanal() {
  const supabase = createClient();
  const user = await getCurrentUser();
  if (!user || user.rol !== "admin_global") throw new Error("Sin permisos.");

  const { lA, dA } = semanaActual();

  // Check if already exists for this week
  const { data: existing } = await supabase
    .from("informes_semanales")
    .select("id")
    .eq("semana_inicio", lA)
    .maybeSingle();

  // Get all encounters for the week
  const PAGE = 1000;
  let allEnc: any[] = [];
  let offset = 0;
  while (true) {
    const { data } = await supabase
      .from("encuentros")
      .select("campus_id, total_general, asistencia, acepto_jesus_presencial, online, campus:campus_id(id,nombre)")
      .gte("fecha", lA)
      .lte("fecha", dA)
      .in("estado", ["enviado", "validado"])
      .range(offset, offset + PAGE - 1);
    if (!data || data.length === 0) break;
    allEnc.push(...data);
    if (data.length < PAGE) break;
    offset += PAGE;
  }

  // Totals
  const total_general = allEnc.reduce((s, e) => s + (e.total_general ?? 0), 0);
  const total_auditorio = allEnc.reduce((s, e) => s + (e.asistencia?.auditorio ?? 0), 0);
  const total_paj = allEnc.reduce((s, e) => s + (e.acepto_jesus_presencial ?? 0) + (e.online?.acepto_jesus ?? 0), 0);

  // Get previous week's contador
  const { data: prevInforme } = await supabase
    .from("informes_semanales")
    .select("contador_almas")
    .order("semana_inicio", { ascending: false })
    .limit(1)
    .maybeSingle();

  const contador_almas = (prevInforme?.contador_almas ?? 0) + total_paj;

  // Per campus breakdown
  const campusMap: Record<string, { nombre: string; total: number; aud: number; paj: number }> = {};
  for (const e of allEnc) {
    const cid = e.campus_id;
    const cname = (e.campus as any)?.nombre ?? "?";
    if (!campusMap[cid]) campusMap[cid] = { nombre: cname, total: 0, aud: 0, paj: 0 };
    campusMap[cid].total += e.total_general ?? 0;
    campusMap[cid].aud += e.asistencia?.auditorio ?? 0;
    campusMap[cid].paj += (e.acepto_jesus_presencial ?? 0) + (e.online?.acepto_jesus ?? 0);
  }

  // Get previous week data for deltas
  const hoy = new Date();
  const dia = hoy.getDay() || 7;
  const lunes = new Date(hoy); lunes.setDate(hoy.getDate() - dia + 1);
  const lunesAnt = new Date(lunes); lunesAnt.setDate(lunes.getDate() - 7);
  const domAnt = new Date(lunesAnt); domAnt.setDate(lunesAnt.getDate() + 6);
  const lAnStr = lunesAnt.toISOString().split("T")[0];
  const dAnStr = domAnt.toISOString().split("T")[0];

  let prevEnc: any[] = [];
  offset = 0;
  while (true) {
    const { data } = await supabase
      .from("encuentros")
      .select("campus_id, total_general, asistencia, acepto_jesus_presencial, online")
      .gte("fecha", lAnStr)
      .lte("fecha", dAnStr)
      .in("estado", ["enviado", "validado"])
      .range(offset, offset + PAGE - 1);
    if (!data || data.length === 0) break;
    prevEnc.push(...data);
    if (data.length < PAGE) break;
    offset += PAGE;
  }

  const prevCampus: Record<string, { total: number; aud: number; paj: number }> = {};
  for (const e of prevEnc) {
    const cid = e.campus_id;
    if (!prevCampus[cid]) prevCampus[cid] = { total: 0, aud: 0, paj: 0 };
    prevCampus[cid].total += e.total_general ?? 0;
    prevCampus[cid].aud += e.asistencia?.auditorio ?? 0;
    prevCampus[cid].paj += (e.acepto_jesus_presencial ?? 0) + (e.online?.acepto_jesus ?? 0);
  }

  const datos_por_campus = Object.entries(campusMap).map(([cid, stats]) => {
    const prev = prevCampus[cid] ?? { total: 0, aud: 0, paj: 0 };
    return {
      campus_id: cid,
      campus_nombre: stats.nombre,
      total_general: stats.total,
      total_auditorio: stats.aud,
      total_paj: stats.paj,
      diferencia_general: stats.total - prev.total,
      diferencia_auditorio: stats.aud - prev.aud,
      diferencia_paj: stats.paj - prev.paj,
    };
  });

  // Calculate week number
  const startOfYear = new Date(hoy.getFullYear(), 0, 1);
  const semana_numero = Math.ceil(((lunes.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7);

  const record = {
    semana_inicio: lA,
    semana_fin: dA,
    anio: hoy.getFullYear(),
    semana_numero,
    total_general,
    total_auditorio,
    total_paj,
    contador_almas,
    datos_por_campus,
    generado_por: user.id,
  };

  if (existing) {
    // Update existing
    const { error } = await supabase
      .from("informes_semanales")
      .update(record)
      .eq("id", existing.id);
    if (error) throw new Error(error.message);
  } else {
    // Insert new
    const { error } = await supabase
      .from("informes_semanales")
      .insert(record);
    if (error) throw new Error(error.message);
  }

  revalidatePath("/informes");
  revalidatePath("/dashboard");
  return { success: true };
}
