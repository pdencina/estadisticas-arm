// @ts-nocheck
/**
 * Script de importación de datos desde CSV de Asana → tabla encuentros
 *
 * USO:
 *   1. Colocar el archivo CSV exportado de Asana en la carpeta scripts/ con nombre "asana-export.csv"
 *   2. Ejecutar: npx tsx scripts/import-asana.ts
 *
 * REQUISITOS:
 *   - Variables de entorno en .env.local:
 *     NEXT_PUBLIC_SUPABASE_URL=https://rehdngdxdejiudpeguex.supabase.co
 *     SUPABASE_SERVICE_ROLE_KEY=eyJ...
 *   - npm install csv-parse dotenv tsx (si no están instalados)
 *
 * OPCIONES (modificar abajo):
 *   - SOLO_REGISTRADO: si true, solo importa filas con estado "Registrado" (default: false = importa todo)
 *   - DESDE_FECHA: si se define, solo importa encuentros desde esa fecha (default: null = toda la historia)
 *   - DRY_RUN: si true, solo muestra lo que haría sin insertar (default: false)
 */

import { createClient } from "@supabase/supabase-js";
import { parse } from "csv-parse/sync";
import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";

// Cargar .env.local
dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

// ═══════════════════════════════════════════════════════════════
// CONFIGURACIÓN — Ajustar según necesidad
// ═══════════════════════════════════════════════════════════════
const SOLO_REGISTRADO = false;      // true = solo "Registrado", false = importa todo
const DESDE_FECHA: string | null = null;  // "2020-01-01" o null para toda la historia
const DRY_RUN = false;              // true = preview sin insertar
const CSV_FILE = path.resolve(__dirname, "asana-export.csv");
const BATCH_SIZE = 50;             // registros por lote de inserción

// ═══════════════════════════════════════════════════════════════
// MAPEO DE CAMPUS (nombre en CSV → nombre en BD)
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
  "Miami":          "",      // Saltar — campus ya no activo
  "Oriente":        "",      // Saltar — campus ya no activo
  "Otro":           "",      // Saltar — sin campus definido
};

// ═══════════════════════════════════════════════════════════════
// MAPEO DE TIPO DE ENCUENTRO
// En Asana, "Tipo de Encuentro" en realidad indica modalidad.
// El tipo real (domingo, miércoles, etc.) se infiere del día de la semana de la fecha.
// Excepciones: "Junta" y "Oración" son tipos específicos.
// ═══════════════════════════════════════════════════════════════
const TIPO_ESPECIAL_MAP: Record<string, string> = {
  "Junta":    "otro",
  "Oración":  "prayer_room",
  "Oracion":  "prayer_room",
};

// Inferir tipo por día de la semana
function inferirTipoPorDia(fecha: string): string {
  const d = new Date(fecha + "T12:00:00");
  const dia = d.getDay(); // 0=dom, 1=lun, 2=mar, 3=mie, 4=jue, 5=vie, 6=sab
  switch (dia) {
    case 0: return "domingo";
    case 3: return "miercoles";
    case 4: return "jueves";
    case 5: return "viernes";
    case 6: return "sabado";
    default: return "otro";
  }
}

// ═══════════════════════════════════════════════════════════════
// MAPEO DE MODALIDAD (valor en CSV → valor en BD)
// ═══════════════════════════════════════════════════════════════
const MODALIDAD_MAP: Record<string, string> = {
  "Presencial":                "presencial",
  "presencial":                "presencial",
  "Online":                    "online",
  "online":                    "online",
  "Híbrido":                   "hibrido",
  "Hibrido":                   "hibrido",
  "híbrido":                   "hibrido",
  "hibrido":                   "hibrido",
  "Presencial+Online":         "hibrido",
  "presencial+online":         "hibrido",
  "Encuentro Presencial+Online": "hibrido",
  "Encuentro Presencial":      "presencial",
  "Encuentro Online":          "online",
};

// ═══════════════════════════════════════════════════════════════
// TIPO PARA FILAS DEL CSV
// ═══════════════════════════════════════════════════════════════
type CsvRow = Record<string, string | undefined>;

// ═══════════════════════════════════════════════════════════════
// FUNCIONES AUXILIARES
// ═══════════════════════════════════════════════════════════════

function safeInt(val: string | undefined | null): number {
  if (!val || val.trim() === "") return 0;
  const n = parseInt(val.replace(/[.,\s]/g, ""), 10);
  return isNaN(n) ? 0 : Math.max(0, n);
}

function parseFecha(val: string | undefined | null): string | null {
  if (!val || val.trim() === "") return null;
  // Intentar varios formatos comunes de Asana
  const trimmed = val.trim();

  // yyyy-mm-dd
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;

  // dd/mm/yyyy
  const dmy = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (dmy) return `${dmy[3]}-${dmy[2].padStart(2, "0")}-${dmy[1].padStart(2, "0")}`;

  // mm/dd/yyyy (formato US)
  const mdy = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (mdy) {
    // Si el primer número > 12, es dd/mm/yyyy (ya procesado arriba)
    // Si no, asumir mm/dd/yyyy
    const m = parseInt(mdy[1]);
    if (m <= 12) return `${mdy[3]}-${mdy[1].padStart(2, "0")}-${mdy[2].padStart(2, "0")}`;
  }

  // yyyy/mm/dd
  const ymd = trimmed.match(/^(\d{4})\/(\d{2})\/(\d{2})$/);
  if (ymd) return `${ymd[1]}-${ymd[2]}-${ymd[3]}`;

  // Intentar Date.parse como último recurso
  const d = new Date(trimmed);
  if (!isNaN(d.getTime())) return d.toISOString().split("T")[0];

  return null;
}

function extraerHorario(nombre: string | undefined | null): string {
  if (!nombre) return "11:00";
  // Buscar patrón de hora: "10:00", "9:00", "19:30", etc.
  const match = nombre.match(/(\d{1,2}:\d{2})/);
  if (match) return match[1];
  return "11:00"; // default
}

// ═══════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════

async function main() {
  console.log("═══════════════════════════════════════════════════");
  console.log("  ARM Estadísticas · Importador desde Asana CSV");
  console.log("═══════════════════════════════════════════════════\n");

  // Validar archivo
  if (!fs.existsSync(CSV_FILE)) {
    console.error(`❌ No se encontró el archivo: ${CSV_FILE}`);
    console.error(`   Colocá el CSV exportado de Asana como: scripts/asana-export.csv`);
    process.exit(1);
  }

  // Validar env
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error("❌ Faltan variables de entorno NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY");
    console.error("   Verificá tu archivo .env.local");
    process.exit(1);
  }

  // Conectar a Supabase
  const supabase = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Obtener campus de la BD
  const { data: campusRows, error: campusErr } = await supabase.from("campus").select("id, nombre");
  if (campusErr || !campusRows) {
    console.error("❌ Error al obtener campus:", campusErr?.message);
    process.exit(1);
  }

  const campusLookup: Record<string, string> = {};
  for (const c of campusRows) {
    campusLookup[c.nombre.toLowerCase()] = c.id;
  }
  console.log(`✓ Campus en BD: ${campusRows.map(c => c.nombre).join(", ")}\n`);

  // Leer CSV
  const csvContent = fs.readFileSync(CSV_FILE, "utf-8");
  const records: CsvRow[] = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    bom: true, // manejar BOM de Excel
  });

  console.log(`✓ Filas en CSV: ${records.length}\n`);

  // Mostrar columnas detectadas
  if (records.length > 0) {
    console.log("  Columnas detectadas:");
    Object.keys(records[0] as object).forEach((col) => console.log(`    - "${col}"`));
    console.log("");
  }

  // Debug: valores únicos de "Tipo de Encuentro" y "Section/Column"
  const tipoVals = new Set<string>();
  const sectionVals = new Set<string>();
  for (const r of records) {
    if (r["Tipo de Encuentro"]) tipoVals.add(r["Tipo de Encuentro"]);
    if (r["Section/Column"]) sectionVals.add(r["Section/Column"]);
  }
  console.log("📋 Valores únicos 'Tipo de Encuentro':", [...tipoVals].join(", ") || "(vacío)");
  console.log("📋 Valores únicos 'Section/Column':", [...sectionVals].join(", ") || "(vacío)");
  console.log("");

  // Procesar filas
  const encuentros: any[] = [];
  const errores: string[] = [];
  let saltadas = 0;

  for (let i = 0; i < records.length; i++) {
    const row = records[i];
    const lineNum = i + 2; // +2 por header + 0-index

    // Filtrar por estado del CSV si corresponde
    if (SOLO_REGISTRADO) {
      const estadoCSV = row["Estado Registro"] || row["Estado"] || row["Status"] || row["Approval Status"] || "";
      if (!estadoCSV.toLowerCase().includes("registrado") && !estadoCSV.toLowerCase().includes("aprobado")) {
        saltadas++;
        continue;
      }
    }

    // Fecha
    const fecha = parseFecha(row["Due Date"] || row["Due date"] || row["Fecha"] || row["due_date"]);
    if (!fecha) {
      errores.push(`Línea ${lineNum}: Sin fecha válida (valor: "${row["Due Date"] || row["Fecha"] || ""}")`);
      saltadas++;
      continue;
    }

    // Filtro por fecha mínima
    if (DESDE_FECHA && fecha < DESDE_FECHA) {
      saltadas++;
      continue;
    }

    // Campus
    const campusCSV = row["Campus"] || row["campus"] || "";
    
    // Saltar filas con campus "Virtual" (encuentros online de COVID, sin campus físico)
    if (campusCSV.trim().toLowerCase() === "virtual") {
      saltadas++;
      continue;
    }

    const campusNombre = CAMPUS_MAP[campusCSV] !== undefined ? CAMPUS_MAP[campusCSV] : campusCSV;
    
    // Saltar si el campus está mapeado a vacío (ej: Miami — ya no activo)
    if (campusNombre === "") {
      saltadas++;
      continue;
    }

    const campusId = campusLookup[campusNombre.toLowerCase()];
    if (!campusId) {
      errores.push(`Línea ${lineNum}: Campus no encontrado: "${campusCSV}" → "${campusNombre}"`);
      saltadas++;
      continue;
    }

    // Tipo de encuentro — inferir del día o de campos especiales
    const tipoCSV = row["Tipo de Encuentro"] || "";
    let tipo: string;
    if (TIPO_ESPECIAL_MAP[tipoCSV] || TIPO_ESPECIAL_MAP[tipoCSV.trim()]) {
      tipo = TIPO_ESPECIAL_MAP[tipoCSV] || TIPO_ESPECIAL_MAP[tipoCSV.trim()];
    } else {
      tipo = inferirTipoPorDia(fecha);
    }

    // Modalidad — usar "Tipo de Encuentro" de Asana (que realmente indica modalidad) o "Modalidad"
    const modalCSV = row["Modalidad"] || row["Tipo de Encuentro"] || "Presencial";
    const modalidad = MODALIDAD_MAP[modalCSV] || MODALIDAD_MAP[modalCSV.trim()] || "presencial";

    // Horario (extraer del nombre de la tarea o campo dedicado)
    const horario = row["Horario"] || row["horario"] || extraerHorario(row["Name"] || row["Task Name"] || row["Nombre"]);

    // Campos numéricos — nombres ajustados al CSV real
    // Nota: " Asistencia Auditorio" tiene espacio al inicio en el CSV
    const asistencia_auditorio = safeInt(row[" Asistencia Auditorio"] || row["Asistencia Auditorio"] || row["Auditorio"]);
    const asistencia_kids = safeInt(row["Asistencia Kids"] || row["Kids"]);
    const asistencia_tweens = safeInt(row["Asistencia Tweens"] || row["Tweens"]);
    const asistencia_sala_bebe = safeInt(row["Asist. Sala bebé"] || row["Sala Bebé"] || row["Sala Bebe"] || row["sala_bebe"]);
    const asistencia_sala_sensorial = safeInt(row["Sala Sensorial"] || row["sala_sensorial"]);
    const asistencia_cambio = safeInt(row["Cambio Asistencia"] || row["cambio"]);

    const acepto_jesus_presencial = safeInt(row["Aceptaron a Jesús Presencial"] || row["Aceptaron a Jesus Presencial"] || row["PAJ Presencial"] || row["paj_presencial"]);
    const acepto_jesus_online = safeInt(row["Aceptaron a Jesús Online"] || row["Aceptaron a Jesus Online"] || row["PAJ Online"] || row["paj_online"]);
    const espectadores_max = safeInt(row["Espectadores a la vez"] || row["Espectadores"] || row["espectadores_max"]);

    // Voluntarios — nombres ajustados al CSV real
    const vol_servicio = safeInt(row["V. Servicio"] || row["Servicio"]);
    const vol_tecnica = safeInt(row["V. Técnica"] || row["V. Tecnica"] || row["Técnica"] || row["Tecnica"]);
    const vol_kids = safeInt(row["V. Kids"]);
    const vol_tweens = safeInt(row["V. Tweens"]);
    const vol_worship = safeInt(row["V. Worship"] || row["Worship"]);
    const vol_cocina = safeInt(row["V. Cocina"] || row["Cocina"]);
    const vol_rrss = safeInt(row["V. RRSS"] || row["RRSS"]);
    const vol_seguridad = safeInt(row["V. Seguridad"] || row["Seguridad"]);
    // "V. Sala de bebé" en el CSV real (no "V. Sala Bebés")
    const vol_sala_bebes = safeInt(row["V. Sala de bebé"] || row["V. Sala Bebés"] || row["V. Sala Bebes"]);
    // "V.Conexión" sin espacio en el CSV real
    const vol_conexion = safeInt(row["V.Conexión"] || row["V. Conexión"] || row["V.Conexion"] || row["V. Conexion"] || row["Conexión"]);
    const vol_oracion = safeInt(row["V. Oración"] || row["V. Oracion"] || row["Oración"]);
    const vol_merch = safeInt(row["V. Merch"] || row["Merch"]);
    const vol_amor = safeInt(row["V. Amor x la casa"] || row["V. Amor por la Casa"] || row["Amor por la Casa"]);
    // "V.Sensorial" sin espacio en el CSV real
    const vol_sala_sens = safeInt(row["V.Sensorial"] || row["V. Sala Sensorial"] || row["V. Sensorial"]);
    const vol_punto_siembra = safeInt(row["V. Punto Siembra"] || row["Punto Siembra"]);
    const vol_cambios = safeInt(row["V. Cambios"] || row["Cambios Voluntarios"]);
    const vol_info = safeInt(row["V. Info"]);
    const vol_proyecto_edu = safeInt(row["V. Proyecto educativo"]);

    // Total general
    let total_general = safeInt(row["Total General"] || row["total_general"]);
    if (total_general === 0) {
      // Calcular si no viene en el CSV
      total_general = asistencia_auditorio + asistencia_kids + asistencia_tweens +
        asistencia_sala_bebe + asistencia_sala_sensorial + asistencia_cambio;
    }

    // Predicador y mensaje
    const predicador = row["Predicador"] || row["predicador"] || null;
    const nombre_mensaje = row["Nombre Mensaje"] || row["Mensaje"] || row["nombre_mensaje"] || null;

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
        cambio: asistencia_cambio,
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
        punto_siembra: vol_punto_siembra,
        cambios: vol_cambios,
        info: vol_info,
        proyecto_educativo: vol_proyecto_edu,
      },
      online: {
        acepto_jesus: acepto_jesus_online,
        espectadores_max: espectadores_max,
      },
      estado: "enviado", // Datos históricos entran como enviados
    });
  }

  // Resumen de tipos detectados
  const tipoCount: Record<string, number> = {};
  encuentros.forEach(e => { tipoCount[e.tipo] = (tipoCount[e.tipo] || 0) + 1; });
  console.log("\n📊 Distribución de tipos:");
  Object.entries(tipoCount).sort((a, b) => b[1] - a[1]).forEach(([t, c]) => console.log(`   ${t}: ${c}`));

  // Resumen
  console.log("\n═══════════════════════════════════════════════════");
  console.log(`  Encuentros a importar: ${encuentros.length}`);
  console.log(`  Filas saltadas:        ${saltadas}`);
  console.log(`  Errores:               ${errores.length}`);
  console.log("═══════════════════════════════════════════════════\n");

  if (errores.length > 0) {
    console.log("⚠️  Primeros errores (máx 20):");
    errores.slice(0, 20).forEach((e) => console.log(`   ${e}`));
    console.log("");
  }

  if (encuentros.length === 0) {
    console.log("ℹ️  No hay registros para importar.");
    process.exit(0);
  }

  // Preview primeros 3
  console.log("📋 Preview (primeros 3 registros):");
  encuentros.slice(0, 3).forEach((e, i) => {
    console.log(`  [${i + 1}] ${e.fecha} | ${e.tipo} | ${e.horario} | Campus: ${campusRows.find(c => c.id === e.campus_id)?.nombre} | Total: ${e.total_general} | PAJ: ${e.acepto_jesus_presencial}`);
  });
  console.log("");

  if (DRY_RUN) {
    console.log("🔍 DRY RUN — No se insertaron registros.");
    console.log("   Cambiá DRY_RUN = false para ejecutar la importación.");
    process.exit(0);
  }

  // Insertar en lotes
  console.log(`⏳ Insertando ${encuentros.length} registros en lotes de ${BATCH_SIZE}...`);
  let insertados = 0;
  let fallos = 0;

  for (let i = 0; i < encuentros.length; i += BATCH_SIZE) {
    const batch = encuentros.slice(i, i + BATCH_SIZE);
    const { error } = await supabase.from("encuentros").insert(batch);

    if (error) {
      console.error(`  ❌ Error en lote ${Math.floor(i / BATCH_SIZE) + 1}: ${error.message}`);
      fallos += batch.length;
    } else {
      insertados += batch.length;
      process.stdout.write(`  ✓ ${insertados}/${encuentros.length}\r`);
    }
  }

  console.log("\n");
  console.log("═══════════════════════════════════════════════════");
  console.log(`  ✅ Importación completada`);
  console.log(`     Insertados: ${insertados}`);
  console.log(`     Fallos:     ${fallos}`);
  console.log("═══════════════════════════════════════════════════");
}

main().catch((err) => {
  console.error("Error fatal:", err);
  process.exit(1);
});
