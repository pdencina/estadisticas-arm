// @ts-nocheck
/**
 * Script de verificación: Compara datos del CSV de Asana con lo importado en Supabase.
 * Muestra conteo de encuentros por campus (CSV vs BD) para detectar discrepancias.
 *
 * USO:
 *   npx tsx scripts/verificar-datos.ts
 */

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";
import * as fs from "fs";

dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

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
  "Miami": "(excluido)",
  "Oriente": "(excluido)",
  "Otro": "(excluido)",
  "Virtual": "(excluido)",
};

// CSV parser simple (maneja comillas)
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

async function main() {
  console.log("═══════════════════════════════════════════════════");
  console.log("  ARM Estadísticas · Verificación de datos");
  console.log("═══════════════════════════════════════════════════\n");

  // === PARTE 1: Analizar CSV ===
  const csvPath = path.resolve(__dirname, "asana-export.csv");
  const csvContent = fs.readFileSync(csvPath, "utf-8");
  const lines = csvContent.split("\n").filter(l => l.trim());
  const headers = parseCSVLine(lines[0]);

  const campusIdx = headers.findIndex(h => h.toLowerCase() === "campus");
  const dueIdx = headers.findIndex(h => h.toLowerCase() === "due date");
  const estadoRegIdx = headers.findIndex(h => h.toLowerCase().includes("estado registro"));
  const audIdx = headers.findIndex(h => h.toLowerCase().includes("asistencia auditorio"));
  const pajIdx = headers.findIndex(h => h.toLowerCase().includes("aceptaron a jesús presencial") || h.toLowerCase().includes("aceptaron a jesus presencial"));

  console.log(`📄 CSV: ${lines.length - 1} filas (sin header)`);
  console.log(`   Columna Campus: idx=${campusIdx}, Due Date: idx=${dueIdx}\n`);

  // Conteo CSV por campus
  const csvPorCampus: Record<string, { total: number; conFecha: number; conDatos: number }> = {};
  let csvSinFecha = 0;
  let csvSinCampus = 0;
  let csvExcluidos = 0;

  for (let i = 1; i < lines.length; i++) {
    const cols = parseCSVLine(lines[i]);
    const campus = cols[campusIdx] || "";
    const fecha = cols[dueIdx] || "";
    const aud = parseInt(cols[audIdx]?.replace(/[^\d]/g, "") || "0", 10);
    const paj = parseInt(cols[pajIdx]?.replace(/[^\d]/g, "") || "0", 10);

    if (!fecha) { csvSinFecha++; continue; }

    const campusNorm = CAMPUS_MAP[campus] !== undefined ? CAMPUS_MAP[campus] : campus;
    if (!campus) { csvSinCampus++; continue; }
    if (campusNorm === "(excluido)") { csvExcluidos++; continue; }

    if (!csvPorCampus[campusNorm]) csvPorCampus[campusNorm] = { total: 0, conFecha: 0, conDatos: 0 };
    csvPorCampus[campusNorm].total++;
    csvPorCampus[campusNorm].conFecha++;
    if (aud > 0 || paj > 0) csvPorCampus[campusNorm].conDatos++;
  }

  console.log("📊 CSV — Encuentros por campus (con fecha válida, campus activo):");
  let csvTotal = 0;
  Object.entries(csvPorCampus).sort((a, b) => b[1].total - a[1].total).forEach(([c, v]) => {
    console.log(`   ${c.padEnd(15)} ${String(v.total).padStart(5)} filas (${v.conDatos} con datos numéricos)`);
    csvTotal += v.total;
  });
  console.log(`   ${"─".repeat(40)}`);
  console.log(`   ${"TOTAL".padEnd(15)} ${String(csvTotal).padStart(5)} filas activas`);
  console.log(`\n   Sin fecha: ${csvSinFecha} | Sin campus: ${csvSinCampus} | Excluidos (Miami/Virtual/etc): ${csvExcluidos}\n`);

  // === PARTE 2: Analizar BD ===
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Obtener campus
  const { data: campusRows } = await supabase.from("campus").select("id, nombre");
  const campusNames: Record<string, string> = {};
  for (const c of campusRows ?? []) campusNames[c.id] = c.nombre;

  // Contar encuentros en BD por campus (paginar para superar límite de 1000)
  let bdRows: any[] = [];
  let offset = 0;
  const PAGE = 1000;
  while (true) {
    const { data, error } = await supabase.from("encuentros").select("campus_id, total_general, acepto_jesus_presencial, online, fecha").range(offset, offset + PAGE - 1);
    if (error) {
      console.error("❌ Error leyendo BD:", error.message);
      return;
    }
    if (!data || data.length === 0) break;
    bdRows.push(...data);
    if (data.length < PAGE) break;
    offset += PAGE;
  }
  console.log(`✓ Total registros leídos de BD: ${bdRows.length}\n`);

  const bdPorCampus: Record<string, { total: number; asistentes: number; paj: number }> = {};
  const bdPorAnio: Record<number, { encuentros: number; asistentes: number; paj: number }> = {};

  for (const row of (bdRows ?? []) as any[]) {
    const nombre = campusNames[row.campus_id] || "Desconocido";
    if (!bdPorCampus[nombre]) bdPorCampus[nombre] = { total: 0, asistentes: 0, paj: 0 };
    bdPorCampus[nombre].total++;
    bdPorCampus[nombre].asistentes += row.total_general ?? 0;
    bdPorCampus[nombre].paj += (row.acepto_jesus_presencial ?? 0) + (row.online?.acepto_jesus ?? 0);

    const year = parseInt(row.fecha?.substring(0, 4) || "0", 10);
    if (year) {
      if (!bdPorAnio[year]) bdPorAnio[year] = { encuentros: 0, asistentes: 0, paj: 0 };
      bdPorAnio[year].encuentros++;
      bdPorAnio[year].asistentes += row.total_general ?? 0;
      bdPorAnio[year].paj += (row.acepto_jesus_presencial ?? 0) + (row.online?.acepto_jesus ?? 0);
    }
  }

  console.log("📊 BD (Supabase) — Encuentros importados por campus:");
  let bdTotal = 0;
  Object.entries(bdPorCampus).sort((a, b) => b[1].total - a[1].total).forEach(([c, v]) => {
    console.log(`   ${c.padEnd(15)} ${String(v.total).padStart(5)} encuentros | ${String(v.asistentes).padStart(8)} asistentes | ${String(v.paj).padStart(5)} PAJ`);
    bdTotal += v.total;
  });
  console.log(`   ${"─".repeat(55)}`);
  const totalAsistentes = Object.values(bdPorCampus).reduce((s, v) => s + v.asistentes, 0);
  const totalPaj = Object.values(bdPorCampus).reduce((s, v) => s + v.paj, 0);
  console.log(`   ${"TOTAL".padEnd(15)} ${String(bdTotal).padStart(5)} encuentros | ${String(totalAsistentes).padStart(8)} asistentes | ${String(totalPaj).padStart(5)} PAJ`);

  console.log("\n📊 BD — Distribución por año:");
  Object.entries(bdPorAnio).sort((a, b) => parseInt(a[0]) - parseInt(b[0])).forEach(([year, v]) => {
    console.log(`   ${year}: ${String(v.encuentros).padStart(5)} encuentros | ${String(v.asistentes).padStart(8)} asistentes | ${String(v.paj).padStart(5)} PAJ`);
  });

  // === PARTE 3: Comparación ===
  console.log("\n═══════════════════════════════════════════════════");
  console.log("  COMPARACIÓN CSV vs BD");
  console.log("═══════════════════════════════════════════════════\n");
  console.log(`   ${"Campus".padEnd(15)} ${"CSV".padStart(5)} ${"BD".padStart(5)} ${"Dif".padStart(5)}`);
  console.log(`   ${"─".repeat(35)}`);

  const allCampus = new Set([...Object.keys(csvPorCampus), ...Object.keys(bdPorCampus)]);
  let totalDif = 0;
  [...allCampus].sort().forEach(c => {
    const csv = csvPorCampus[c]?.total ?? 0;
    const bd = bdPorCampus[c]?.total ?? 0;
    const dif = bd - csv;
    totalDif += Math.abs(dif);
    const marker = dif !== 0 ? " ⚠️" : " ✓";
    console.log(`   ${c.padEnd(15)} ${String(csv).padStart(5)} ${String(bd).padStart(5)} ${(dif >= 0 ? "+" : "") + dif}${marker}`);
  });
  console.log(`   ${"─".repeat(35)}`);
  console.log(`   ${"TOTAL".padEnd(15)} ${String(csvTotal).padStart(5)} ${String(bdTotal).padStart(5)} ${bdTotal - csvTotal >= 0 ? "+" : ""}${bdTotal - csvTotal}`);

  // Explicación de la diferencia
  const importSaltadas = csvTotal - bdTotal;
  if (importSaltadas > 0) {
    console.log(`\n💡 Hay ${importSaltadas} filas del CSV que no se importaron.`);
    console.log(`   Razones probables:`);
    console.log(`   - Tareas sin datos numéricos (total=0, paj=0) son saltadas por el script API`);
    console.log(`   - El CSV exporta TODAS las filas, la API filtra las vacías`);
  } else if (importSaltadas < 0) {
    console.log(`\n💡 Hay ${Math.abs(importSaltadas)} registros más en BD que en el CSV.`);
    console.log(`   Razones probables:`);
    console.log(`   - Se importaron reportes manuales además de los de API`);
  }

  console.log("\n═══════════════════════════════════════════════════");
  console.log("  FIN VERIFICACIÓN");
  console.log("═══════════════════════════════════════════════════");
}

main().catch(err => { console.error("Error:", err); process.exit(1); });
