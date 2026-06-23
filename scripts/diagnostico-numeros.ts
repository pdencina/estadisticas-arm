// @ts-nocheck
/**
 * Script de diagnóstico: compara encuentros en Asana vs BD
 * Muestra conteo por campus, por año, y global
 *
 * USO:
 *   npx tsx scripts/diagnostico-numeros.ts
 */

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

const ASANA_PROJECT_ID = "1185873534171121";
const ASANA_BASE = "https://app.asana.com/api/1.0";
const PAT = process.env.ASANA_PAT!;

const CAMPUS_MAP: Record<string, string> = {
  "Santiago": "Stgo Centro",
  "Stgo Centro": "Stgo Centro",
  "Santiago Centro": "Stgo Centro",
  "Puente Alto": "Puente Alto",
  "Punta Arenas": "Punta Arenas",
  "Concepción": "Concepción",
  "Concepcion": "Concepción",
  "Montevideo": "Montevideo",
  "Maracaibo": "Maracaibo",
  "Katy Texas": "Katy Texas",
  "Katy": "Katy Texas",
  "La Plata": "La Plata",
  "Miami": "__skip__",
  "Oriente": "__skip__",
  "Otro": "__skip__",
  "Virtual": "__skip__",
};

async function asanaFetch(url: string) {
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${PAT}` },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Asana API ${res.status}: ${body}`);
  }
  return res.json();
}

function getCF(task: any, name: string): string | number | null {
  const cf = task.custom_fields?.find((f: any) =>
    f.name?.trim().toLowerCase() === name.trim().toLowerCase()
  );
  if (!cf) return null;
  if (cf.type === "enum" && cf.enum_value) return cf.enum_value.name;
  if (cf.type === "number") return cf.number_value ?? 0;
  if (cf.type === "text") return cf.text_value ?? null;
  if (cf.type === "multi_enum" && cf.multi_enum_values?.length > 0) {
    return cf.multi_enum_values.map((v: any) => v.name).join(", ");
  }
  return cf.display_value ?? null;
}

function getNumCF(task: any, name: string): number {
  const val = getCF(task, name);
  if (val === null || val === undefined) return 0;
  if (typeof val === "number") return Math.max(0, val);
  const n = parseInt(String(val).replace(/[.,\s]/g, ""), 10);
  return isNaN(n) ? 0 : Math.max(0, n);
}

async function main() {
  console.log("═══════════════════════════════════════════════════");
  console.log("  DIAGNÓSTICO: Asana vs Base de Datos");
  console.log("═══════════════════════════════════════════════════\n");

  // ─── PARTE 1: Contar en Asana ───
  console.log("⏳ Descargando tareas de Asana...");
  const allTasks: any[] = [];
  const fields = "gid,name,due_on,custom_fields";
  let url: string | null = `${ASANA_BASE}/projects/${ASANA_PROJECT_ID}/tasks?opt_fields=${fields}&limit=100`;
  let page = 0;

  while (url) {
    const data = await asanaFetch(url);
    allTasks.push(...data.data);
    page++;
    process.stdout.write(`  Página ${page} (${allTasks.length} tareas)\r`);
    url = data.next_page?.uri ?? null;
  }
  console.log(`\n✓ Total tareas en Asana: ${allTasks.length}\n`);

  // Clasificar tareas de Asana
  const asanaPorCampus: Record<string, number> = {};
  const asanaPorAnio: Record<string, number> = {};
  const asanaPorCampusAnio: Record<string, Record<string, number>> = {};
  let asanaTotal = 0;
  let sinFecha = 0;
  let sinCampus = 0;
  let campusSkipped = 0;
  let sinDatos = 0;
  let campusDesconocido: Record<string, number> = {};

  for (const task of allTasks) {
    const fecha = task.due_on;
    if (!fecha) { sinFecha++; continue; }

    const campusCSV = String(getCF(task, "Campus") ?? "").trim();
    if (!campusCSV) { sinCampus++; continue; }

    const campusNombre = CAMPUS_MAP[campusCSV] !== undefined ? CAMPUS_MAP[campusCSV] : campusCSV;
    if (campusNombre === "__skip__") { campusSkipped++; continue; }

    // Verificar si tiene datos
    const auditorio = getNumCF(task, "Asistencia Auditorio");
    const kids = getNumCF(task, "Asistencia Kids");
    const tweens = getNumCF(task, "Asistencia Tweens");
    const salaBebe = getNumCF(task, "Asist. Sala bebé");
    const paj = getNumCF(task, "Aceptaron a Jesús Presencial");
    const pajOnline = getNumCF(task, "Aceptaron a Jesús Online");
    const espectadores = getNumCF(task, "Espectadores a la vez");
    const volServicio = getNumCF(task, "V. Servicio");
    const volTecnica = getNumCF(task, "V. Técnica");
    const volKids = getNumCF(task, "V. Kids");
    const volTweens = getNumCF(task, "V. Tweens");
    const volWorship = getNumCF(task, "V. Worship");
    const volCocina = getNumCF(task, "V. Cocina");

    const totalCheck = auditorio + kids + tweens + salaBebe + paj + pajOnline + espectadores +
      volServicio + volTecnica + volKids + volTweens + volWorship + volCocina;

    if (totalCheck === 0) { sinDatos++; continue; }

    const anio = fecha.substring(0, 4);

    // Verificar si campus es conocido
    if (!["Stgo Centro", "Puente Alto", "Punta Arenas", "Concepción", "Montevideo", "Maracaibo", "Katy Texas", "La Plata"].includes(campusNombre)) {
      campusDesconocido[campusNombre] = (campusDesconocido[campusNombre] || 0) + 1;
      continue;
    }

    asanaPorCampus[campusNombre] = (asanaPorCampus[campusNombre] || 0) + 1;
    asanaPorAnio[anio] = (asanaPorAnio[anio] || 0) + 1;
    if (!asanaPorCampusAnio[campusNombre]) asanaPorCampusAnio[campusNombre] = {};
    asanaPorCampusAnio[campusNombre][anio] = (asanaPorCampusAnio[campusNombre][anio] || 0) + 1;
    asanaTotal++;
  }

  console.log("─── ASANA: Encuentros válidos por campus (global) ───");
  const campusOrder = Object.entries(asanaPorCampus).sort((a, b) => b[1] - a[1]);
  for (const [c, n] of campusOrder) {
    console.log(`  ${c.padEnd(15)} ${String(n).padStart(5)}`);
  }
  console.log(`  ${"TOTAL".padEnd(15)} ${String(asanaTotal).padStart(5)}`);

  console.log("\n─── ASANA: Encuentros por año ───");
  const anioOrder = Object.keys(asanaPorAnio).sort();
  for (const a of anioOrder) {
    console.log(`  ${a}: ${asanaPorAnio[a]}`);
  }

  console.log("\n─── ASANA: Encuentros por campus y año ───");
  const allAnios = [...new Set(Object.values(asanaPorCampusAnio).flatMap(v => Object.keys(v)))].sort();
  const header = "Campus".padEnd(15) + allAnios.map(a => a.padStart(6)).join("") + "  TOTAL".padStart(7);
  console.log(`  ${header}`);
  for (const [campus, anios] of Object.entries(asanaPorCampusAnio).sort()) {
    const cols = allAnios.map(a => String(anios[a] || 0).padStart(6)).join("");
    const total = Object.values(anios).reduce((s, n) => s + n, 0);
    console.log(`  ${campus.padEnd(15)}${cols}${String(total).padStart(7)}`);
  }

  console.log(`\n─── ASANA: Tareas excluidas ───`);
  console.log(`  Sin fecha:           ${sinFecha}`);
  console.log(`  Sin campus:          ${sinCampus}`);
  console.log(`  Campus inactivos:    ${campusSkipped} (Miami/Oriente/Virtual/Otro)`);
  console.log(`  Sin datos numéricos: ${sinDatos}`);
  if (Object.keys(campusDesconocido).length > 0) {
    console.log(`  Campus desconocido:`);
    for (const [c, n] of Object.entries(campusDesconocido)) {
      console.log(`    "${c}": ${n}`);
    }
  }

  // ─── PARTE 2: Contar en la BD ───
  console.log("\n\n═══════════════════════════════════════════════════");
  console.log("  BASE DE DATOS (Supabase)");
  console.log("═══════════════════════════════════════════════════\n");

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Obtener campus
  const { data: campusRows } = await supabase.from("campus").select("id, nombre");
  const campusNameById: Record<string, string> = {};
  for (const c of campusRows ?? []) campusNameById[c.id] = c.nombre;

  // Todos los encuentros
  const { data: allEnc, count: totalCount } = await supabase
    .from("encuentros")
    .select("campus_id, fecha, total_general, acepto_jesus_presencial, online, estado", { count: "exact" });

  const rows = allEnc ?? [];
  console.log(`Total registros en BD: ${rows.length}\n`);

  const bdPorCampus: Record<string, number> = {};
  const bdPorAnio: Record<string, number> = {};
  const bdPorCampusAnio: Record<string, Record<string, number>> = {};

  for (const r of rows) {
    const campus = campusNameById[r.campus_id] || "??";
    const anio = r.fecha?.substring(0, 4) || "????";

    bdPorCampus[campus] = (bdPorCampus[campus] || 0) + 1;
    bdPorAnio[anio] = (bdPorAnio[anio] || 0) + 1;
    if (!bdPorCampusAnio[campus]) bdPorCampusAnio[campus] = {};
    bdPorCampusAnio[campus][anio] = (bdPorCampusAnio[campus][anio] || 0) + 1;
  }

  console.log("─── BD: Encuentros por campus (global) ───");
  const bdCampusOrder = Object.entries(bdPorCampus).sort((a, b) => b[1] - a[1]);
  for (const [c, n] of bdCampusOrder) {
    console.log(`  ${c.padEnd(15)} ${String(n).padStart(5)}`);
  }
  console.log(`  ${"TOTAL".padEnd(15)} ${String(rows.length).padStart(5)}`);

  console.log("\n─── BD: Encuentros por año ───");
  const bdAnioOrder = Object.keys(bdPorAnio).sort();
  for (const a of bdAnioOrder) {
    console.log(`  ${a}: ${bdPorAnio[a]}`);
  }

  // ─── PARTE 3: Comparación ───
  console.log("\n\n═══════════════════════════════════════════════════");
  console.log("  COMPARACIÓN Asana vs BD");
  console.log("═══════════════════════════════════════════════════\n");

  const allCampusNames = [...new Set([...Object.keys(asanaPorCampus), ...Object.keys(bdPorCampus)])].sort();
  console.log(`  ${"Campus".padEnd(15)} ${"Asana".padStart(7)} ${"BD".padStart(7)} ${"Diff".padStart(7)}`);
  console.log(`  ${"-".repeat(40)}`);
  for (const c of allCampusNames) {
    const a = asanaPorCampus[c] || 0;
    const b = bdPorCampus[c] || 0;
    const diff = b - a;
    const marker = diff !== 0 ? " ⚠️" : " ✓";
    console.log(`  ${c.padEnd(15)} ${String(a).padStart(7)} ${String(b).padStart(7)} ${String(diff).padStart(7)}${marker}`);
  }
  const diffTotal = rows.length - asanaTotal;
  console.log(`  ${"-".repeat(40)}`);
  console.log(`  ${"TOTAL".padEnd(15)} ${String(asanaTotal).padStart(7)} ${String(rows.length).padStart(7)} ${String(diffTotal).padStart(7)}${diffTotal !== 0 ? " ⚠️" : " ✓"}`);

  // Resumen por año
  console.log(`\n  ${"Año".padEnd(6)} ${"Asana".padStart(7)} ${"BD".padStart(7)} ${"Diff".padStart(7)}`);
  console.log(`  ${"-".repeat(30)}`);
  const allYears = [...new Set([...Object.keys(asanaPorAnio), ...Object.keys(bdPorAnio)])].sort();
  for (const y of allYears) {
    const a = asanaPorAnio[y] || 0;
    const b = bdPorAnio[y] || 0;
    const diff = b - a;
    console.log(`  ${y.padEnd(6)} ${String(a).padStart(7)} ${String(b).padStart(7)} ${String(diff).padStart(7)}${diff !== 0 ? " ⚠️" : " ✓"}`);
  }

  // Nota sobre el filtro
  console.log("\n\n═══════════════════════════════════════════════════");
  console.log("  NOTA");
  console.log("═══════════════════════════════════════════════════");
  console.log("  El import script filtra:");
  console.log("  - Tareas sin fecha (due_on = null)");
  console.log("  - Tareas sin campus o campus inactivo (Miami, Oriente, Virtual, Otro)");
  console.log("  - Tareas donde TODOS los campos numéricos = 0");
  console.log("  Si los números no cuadran con tu expectativa,");
  console.log("  puede ser por tareas en Asana que no tienen datos");
  console.log("  o tienen campus que no están en la BD.");
  console.log("═══════════════════════════════════════════════════");
}

main().catch((err) => {
  console.error("Error fatal:", err);
  process.exit(1);
});
