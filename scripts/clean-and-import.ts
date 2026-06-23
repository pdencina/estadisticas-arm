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

  // Borrar el registro de prueba (predicador = "TEST IMPORT")
  const { error } = await supabase.from("encuentros").delete().eq("predicador", "TEST IMPORT");
  if (error) console.error("Error borrando test:", error.message);
  else console.log("✓ Registro de prueba eliminado");

  // Verificar
  const { count } = await supabase.from("encuentros").select("*", { count: "exact", head: true });
  console.log(`Total encuentros: ${count}`);
}

main().catch(console.error);
