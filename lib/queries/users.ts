import { createClient } from "@/lib/supabase/server";
import type { UserProfile } from "@/types";

export async function getCurrentUser(): Promise<UserProfile | null> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from("user_profiles")
    .select("*, campus:campus_id(id,nombre,ciudad,pais)")
    .eq("id", user.id)
    .maybeSingle();
  return (data as UserProfile) ?? null;
}

export async function getAllUsers(): Promise<UserProfile[]> {
  // Use admin client to bypass RLS and always see all users
  try {
    const { createAdminClient } = await import("@/lib/supabase/admin");
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("user_profiles")
      .select("*, campus:campus_id(id,nombre,ciudad,pais)")
      .order("nombre");
    return (data as UserProfile[]) ?? [];
  } catch {
    // Fallback to regular client if admin client not available
    const supabase = createClient();
    const { data } = await supabase
      .from("user_profiles")
      .select("*, campus:campus_id(id,nombre,ciudad,pais)")
      .order("nombre");
    return (data as UserProfile[]) ?? [];
  }
}
