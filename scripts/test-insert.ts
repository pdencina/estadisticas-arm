import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

async function main() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  // Obtener un campus_id real
  const { data: campus } = await supabase.from("campus").select("id,nombre").limit(1);
  if (!campus || campus.length === 0) { console.log("No hay campus"); return; }
  
  const campusId = campus[0].id;
  console.log(`Usando campus: ${campus[0].nombre} (${campusId})`);

  // Intentar insertar un encuentro de prueba
  const testRow = {
    campus_id: campusId,
    fecha: "2024-01-07",
    tipo: "domingo",
    horario: "11:00",
    modalidad: "presencial",
    predicador: "TEST IMPORT",
    nombre_mensaje: "Test de inserción",
    total_general: 100,
    acepto_jesus_presencial: 5,
    asistencia: { auditorio: 80, kids: 10, tweens: 5, sala_bebe: 3, sala_sensorial: 2, cambio: 0 },
    voluntarios: { servicio: 10, tecnica: 5, kids: 3, tweens: 2, worship: 4, cocina: 2, rrss: 1, seguridad: 2, sala_bebes: 1, conexion: 1, oracion: 1, merch: 0, amor_por_la_casa: 0, sala_sensorial: 0, punto_siembra: 0, cambios: 0 },
    online: { acepto_jesus: 2, espectadores_max: 50 },
    estado: "enviado",
  };

  console.log("\nInsertando registro de prueba...");
  const { data, error } = await supabase.from("encuentros").insert(testRow).select();
  
  if (error) {
    console.error("❌ Error:", error.message);
    console.error("   Code:", error.code);
    console.error("   Details:", error.details);
  } else {
    console.log("✅ Insertado:", data?.[0]?.id);
  }

  // Verificar conteo
  const { count } = await supabase.from("encuentros").select("*", { count: "exact", head: true });
  console.log(`\nTotal encuentros ahora: ${count}`);
}

main().catch(console.error);
