import { createClient } from "@supabase/supabase-js";

// Admin client with service_role key — only for server-side admin operations
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceKey) {
    throw new Error("La clave de servicio no está configurada. Agregá SUPABASE_SERVICE_ROLE_KEY en las variables de entorno de Vercel.");
  }

  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
