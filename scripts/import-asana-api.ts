// @ts-nocheck
/**
 * Script de importación desde Asana API → tabla encuentros
 * Usa la API REST de Asana para leer custom fields con precisión (sin pérdida del CSV)
 *
 * USO:
 *   npx tsx scripts/import-asana-api.ts
 *
 * REQUISITOS en .env.local:
 *   ASANA_PAT=2/...
 *   NEXT_PUBLIC_SUPABASE_URL=...
 *   SUPABASE_SERVICE_ROLE_KEY=...
 */

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

// ═══════════════════════════════════════════════════════════════
// CONFIGURACIÓN
// ═══════════════════════════════════════════════════════════════
const ASANA_PROJECT_ID = "1185873534171121";
const DRY_RUN = false;          // true = solo preview, false = insertar
const LIMPIAR_ANTES = true;    // true = borra encuentros importados antes de insertar
const BATCH_SIZE = 50;

// ═══════════════════════════════════════════════════════════════
// MAPEOS
// ═══════════════════════════════════════════════════════════════
const CAMPUS_MAP: Record<string, string> = {
  "Santiago":        "Stgo Centro",
  "Stgo Centro":    "Stgo Centro",
  "Santiago Centro": "Stgo Centro",
  "Puente Alto":    "Puente Alto",
  "Punta Arenas":   "Punta Arenas",
  "Concepción":     "Concepción",
  "Concepcion":     "Concepción",
  "Montevideo":     "Montevideo",
  "Maracaibo":      "Maracaibo",
  "Katy Texas":     "Katy Texas",
  "Katy":           "Katy Texas",
  "La Plata":       "La Plata",
  "Miami":          "",
  "Oriente":        "",
  "Otro":           "",
  "Virtual":        "",
};

function inferirTipoPorDia(fecha: string): string {
  const d = new Date(fecha + "T12:00:00");
  const dia = d.getDay();
  switch (dia) {
    case 0: return "domingo";
    case 3: return "miercoles";
    case 4: return "jueves";
    case 5: return "otro";
    case 6: return "sabado";
    default: return "otro";
  }
}

// ═══════════════════════════════════════════════════════════════
// ASANA API HELPERS
// ═══════════════════════════════════════════════════════════════
const ASANA_BASE = "https://app.asana.com/api/1.0";
const PAT = process.env.ASANA_PAT!;

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

async function getProjectTasks(): Promise<any[]> {
  const allTasks: any[] = [];
  let nextPage: string | null = null;
  const fields = "gid,name,due_on,custom_fields,memberships";
  let url = `${ASANA_BASE}/projects/${ASANA_PROJECT_ID}/tasks?opt_fields=${fields}&limit=100`;

  console.log("⏳ Descargando tareas de Asana...");
  let page = 0;

  while (url) {
    const data = await asanaFetch(url);
    allTasks.push(...data.data);
    page++;
    process.stdout.write(`  Página ${page} (${allTasks.length} tareas)\r`);

    if (data.next_page?.uri) {
      url = data.next_page.uri;
    } else {
      url = null as any;
    }
  }

  console.log(`\n✓ Total tareas descargadas: ${allTasks.length}\n`);
  return allTasks;
}

// ═══════════════════════════════════════════════════════════════
// EXTRAER CUSTOM FIELD POR NOMBRE
// ═══════════════════════════════════════════════════════════════
function getCF(task: any, name: string): string | number | null {
  const cf = task.custom_fields?.find((f: any) =>
    f.name?.trim().toLowerCase() === name.trim().toLowerCase()
  );
  if (!cf) return null;

  // Enum field
  if (cf.type === "enum" && cf.enum_value) return cf.enum_value.name;
  // Number field
  if (cf.type === "number") return cf.number_value ?? 0;
  // Text field
  if (cf.type === "text") return cf.text_value ?? null;
  // Multi-enum
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

function getEnumCF(task: any, name: string): string {
  const val = getCF(task, name);
  return val ? String(val).trim() : "";
}

function getTextCF(task: any, name: string): string | null {
  const val = getCF(task, name);
  return val ? String(val).trim() : null;
}

// ═══════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════
async function main() {
  console.log("═══════════════════════════════════════════════════");
  console.log("  ARM Estadísticas · Importador desde Asana API");
  console.log("═══════════════════════════════════════════════════\n");

  if (!PAT) {
    console.error("❌ Falta ASANA_PAT en .env.local");
    process.exit(1);
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  if (!supabaseUrl || !supabaseKey) {
    console.error("❌ Faltan variables de Supabase en .env.local");
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Obtener campus de la BD
  const { data: campusRows } = await supabase.from("campus").select("id, nombre");
  const campusLookup: Record<string, string> = {};
  for (const c of campusRows ?? []) {
    campusLookup[c.nombre.toLowerCase()] = c.id;
  }
  console.log(`✓ Campus en BD: ${(campusRows ?? []).map(c => c.nombre).join(", ")}\n`);

  // Descargar tareas
  const tasks = await getProjectTasks();

  // Explorar custom fields del primer task para debug
  if (tasks.length > 0 && tasks[0].custom_fields) {
    console.log("📋 Custom fields detectados:");
    tasks[0].custom_fields.forEach((cf: any) => {
      console.log(`   - "${cf.name}" (${cf.type})`);
    });
    console.log("");
  }

  // Procesar tareas
  const encuentros: any[] = [];
  const errores: string[] = [];
  let saltadas = 0;

  for (const task of tasks) {
    // Fecha
    const fecha = task.due_on;
    if (!fecha) {
      saltadas++;
      continue;
    }

    // Campus
    const campusCSV = getEnumCF(task, "Campus");
    if (!campusCSV) { saltadas++; continue; }

    const campusNombre = CAMPUS_MAP[campusCSV] !== undefined ? CAMPUS_MAP[campusCSV] : campusCSV;
    if (campusNombre === "") { saltadas++; continue; }

    const campusId = campusLookup[campusNombre.toLowerCase()];
    if (!campusId) {
      errores.push(`Task "${task.name}": Campus no encontrado: "${campusCSV}" → "${campusNombre}"`);
      saltadas++;
      continue;
    }

    // Estado del registro
    const estadoReg = getEnumCF(task, "Estado Registro");
    // Saltar tareas sin datos (Sin iniciar, etc.)
    // Pero incluir Registrado y Pendiente que tengan fecha

    // Tipo
    const tipoAsana = getEnumCF(task, "Tipo de Encuentro");
    let tipo: string;
    if (tipoAsana.toLowerCase().includes("oración") || tipoAsana.toLowerCase().includes("oracion")) {
      tipo = "prayer_room";
    } else if (tipoAsana.toLowerCase().includes("junta")) {
      tipo = "otro";
    } else {
      tipo = inferirTipoPorDia(fecha);
    }

    // Modalidad (de "Tipo de Encuentro" o "Modalidad")
    const modalidadField = getEnumCF(task, "Modalidad");
    const tipoField = tipoAsana;
    let modalidad = "presencial";
    if (modalidadField) {
      if (modalidadField.toLowerCase().includes("online") && modalidadField.toLowerCase().includes("presencial")) modalidad = "hibrido";
      else if (modalidadField.toLowerCase().includes("online")) modalidad = "online";
      else if (modalidadField.toLowerCase().includes("híbrid") || modalidadField.toLowerCase().includes("hibrid")) modalidad = "hibrido";
    } else if (tipoField) {
      if (tipoField.toLowerCase().includes("presencial+online") || tipoField.toLowerCase().includes("presencial + online")) modalidad = "hibrido";
      else if (tipoField.toLowerCase().includes("online")) modalidad = "online";
    }

    // Horario (intentar extraer del nombre de la tarea)
    let horario = "11:00";
    const horaMatch = task.name?.match(/(\d{1,2}:\d{2})/);
    if (horaMatch) horario = horaMatch[1];

    // Campos numéricos — la API con trim() en getCF ya maneja espacios
    const asistencia_auditorio = getNumCF(task, "Asistencia Auditorio");
    const asistencia_kids = getNumCF(task, "Asistencia Kids");
    const asistencia_tweens = getNumCF(task, "Asistencia Tweens");
    const asistencia_sala_bebe = getNumCF(task, "Asist. Sala bebé");
    const asistencia_sala_sensorial = 0;

    const acepto_jesus_presencial = getNumCF(task, "Aceptaron a Jesús Presencial");
    const acepto_jesus_online = getNumCF(task, "Aceptaron a Jesús Online");
    const espectadores_max = getNumCF(task, "Espectadores a la vez");

    // Voluntarios
    const vol_servicio = getNumCF(task, "V. Servicio");
    const vol_tecnica = getNumCF(task, "V. Técnica");
    const vol_kids = getNumCF(task, "V. Kids");
    const vol_tweens = getNumCF(task, "V. Tweens");
    const vol_worship = getNumCF(task, "V. Worship");
    const vol_cocina = getNumCF(task, "V. Cocina");
    const vol_rrss = getNumCF(task, "V. RRSS");
    const vol_seguridad = getNumCF(task, "V. Seguridad");
    const vol_sala_bebes = getNumCF(task, "V. Sala de bebé");
    const vol_conexion = getNumCF(task, "V.Conexión");
    const vol_oracion = getNumCF(task, "V. Oración");
    const vol_merch = getNumCF(task, "V. Merch");
    const vol_amor = getNumCF(task, "V. Amor x la casa");
    const vol_sala_sens = getNumCF(task, "V.Sensorial"); // text field, getNumCF lo parsea
    const vol_info = getNumCF(task, "V. Info");
    const vol_proyecto_edu = getNumCF(task, "V. Proyecto educativo");

    // Total general
    // Total general (incluye espectadores online para cuadrar con el informe semanal)
    let total_general = asistencia_auditorio + asistencia_kids + asistencia_tweens +
      asistencia_sala_bebe + asistencia_sala_sensorial +
      vol_servicio + vol_tecnica + vol_kids + vol_tweens + vol_worship +
      vol_cocina + vol_rrss + vol_seguridad + vol_sala_bebes + vol_conexion +
      vol_oracion + vol_merch + vol_amor + vol_sala_sens + vol_info + vol_proyecto_edu +
      espectadores_max;

    // Si todo es 0 y no tiene datos, saltar
    if (total_general === 0 && acepto_jesus_presencial === 0 && acepto_jesus_online === 0) {
      saltadas++;
      continue;
    }

    // Predicador y mensaje
    const predicador = getEnumCF(task, "Predicador") || getCF(task, "Predicador") as string || null;
    const nombre_mensaje = getEnumCF(task, "Nombre Mensaje") || getCF(task, "Nombre Mensaje") as string || null;

    encuentros.push({
      campus_id: campusId,
      fecha,
      tipo,
      horario,
      modalidad,
      predicador: predicador || null,
      nombre_mensaje: nombre_mensaje || null,
      total_general,
      acepto_jesus_presencial,
      asistencia: {
        auditorio: asistencia_auditorio,
        kids: asistencia_kids,
        tweens: asistencia_tweens,
        sala_bebe: asistencia_sala_bebe,
        sala_sensorial: asistencia_sala_sensorial,
        cambio: 0,
      },
      voluntarios: {
        servicio: vol_servicio,
        tecnica: vol_tecnica,
        kids: vol_kids,
        tweens: vol_tweens,
        worship: vol_worship,
        cocina: vol_cocina,
        rrss: vol_rrss,
        seguridad: vol_seguridad,
        sala_bebes: vol_sala_bebes,
        conexion: vol_conexion,
        oracion: vol_oracion,
        merch: vol_merch,
        amor_por_la_casa: vol_amor,
        sala_sensorial: vol_sala_sens,
        info: vol_info,
        proyecto_educativo: vol_proyecto_edu,
        cambios: 0,
        punto_siembra: 0,
      },
      online: {
        acepto_jesus: acepto_jesus_online,
        espectadores_max: espectadores_max,
      },
      estado: "enviado",
    });
  }

  // Distribución de tipos
  const tipoCount: Record<string, number> = {};
  encuentros.forEach(e => { tipoCount[e.tipo] = (tipoCount[e.tipo] || 0) + 1; });

  console.log("📊 Distribución de tipos:");
  Object.entries(tipoCount).sort((a, b) => b[1] - a[1]).forEach(([t, c]) => console.log(`   ${t}: ${c}`));

  console.log("\n═══════════════════════════════════════════════════");
  console.log(`  Encuentros a importar: ${encuentros.length}`);
  console.log(`  Tareas saltadas:       ${saltadas}`);
  console.log(`  Errores:               ${errores.length}`);
  console.log("═══════════════════════════════════════════════════\n");

  if (errores.length > 0) {
    console.log("⚠️  Primeros errores (máx 10):");
    errores.slice(0, 10).forEach(e => console.log(`   ${e}`));
    console.log("");
  }

  if (encuentros.length === 0) {
    console.log("ℹ️  No hay registros para importar.");
    process.exit(0);
  }

  // Preview
  console.log("📋 Preview (primeros 5):");
  encuentros.slice(0, 5).forEach((e, i) => {
    const cName = (campusRows ?? []).find(c => c.id === e.campus_id)?.nombre;
    console.log(`  [${i + 1}] ${e.fecha} | ${e.tipo} | ${e.horario} | ${cName} | Total: ${e.total_general} | Aud: ${e.asistencia.auditorio} | PAJ: ${e.acepto_jesus_presencial}`);
  });
  console.log("");

  if (DRY_RUN) {
    console.log("🔍 DRY RUN — No se insertaron registros.");
    console.log("   Cambiá DRY_RUN = false para ejecutar la importación.");
    process.exit(0);
  }

  // Limpiar datos anteriores
  if (LIMPIAR_ANTES) {
    console.log("🗑️  Limpiando encuentros importados anteriormente...");
    // Borrar todos los que NO fueron creados manualmente por un usuario (reportado_por = null)
    const { error: delErr, count } = await supabase
      .from("encuentros")
      .delete()
      .is("reportado_por", null)
      .select("*", { count: "exact", head: true });

    // Actually delete
    const { error: delErr2 } = await supabase
      .from("encuentros")
      .delete()
      .is("reportado_por", null);

    if (delErr2) {
      console.error("❌ Error limpiando:", delErr2.message);
    } else {
      console.log("✓ Encuentros anteriores eliminados\n");
    }
  }

  // Insertar
  console.log(`⏳ Insertando ${encuentros.length} registros en lotes de ${BATCH_SIZE}...`);
  let insertados = 0;
  let fallos = 0;

  for (let i = 0; i < encuentros.length; i += BATCH_SIZE) {
    const batch = encuentros.slice(i, i + BATCH_SIZE);
    const { data, error } = await supabase.from("encuentros").insert(batch).select("id");

    if (error) {
      console.error(`  ❌ Lote ${Math.floor(i / BATCH_SIZE) + 1}: ${error.message}`);
      // Intentar uno por uno
      for (const row of batch) {
        const { error: e2 } = await supabase.from("encuentros").insert(row).select("id");
        if (e2) fallos++;
        else insertados++;
      }
    } else {
      insertados += data?.length ?? batch.length;
      process.stdout.write(`  ✓ ${insertados}/${encuentros.length}\r`);
    }
  }

  console.log(`\n\n═══════════════════════════════════════════════════`);
  console.log(`  ✅ Importación completada`);
  console.log(`     Insertados: ${insertados}`);
  console.log(`     Fallos:     ${fallos}`);
  console.log(`═══════════════════════════════════════════════════`);
}

main().catch((err) => {
  console.error("Error fatal:", err);
  process.exit(1);
});
