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

  // Contar total
  const { count } = await supabase.from("encuentros").select("*", { count: "exact", head: true });
  console.log(`Total encuentros en BD: ${count}`);

  // Últimos 5
  const { data } = await supabase.from("encuentros").select("id,fecha,tipo,estado,total_general,campus_id").order("fecha", { ascending: false }).limit(5);
  console.log("\nÚltimos 5 encuentros:");
  data?.forEach(e => console.log(`  ${e.fecha} | ${e.tipo} | estado=${e.estado} | total=${e.total_general}`));

  // Contar por estado
  const { data: all } = await supabase.from("encuentros").select("estado");
  const estados: Record<string, number> = {};
  all?.forEach(r => { estados[r.estado] = (estados[r.estado] || 0) + 1; });
  console.log("\nPor estado:", estados);
}

main().catch(console.error);
