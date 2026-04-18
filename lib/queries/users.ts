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
    .single();

  return (data as UserProfile) ?? null;
}

export async function getAllUsers(): Promise<UserProfile[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("user_profiles")
    .select("*, campus:campus_id(id,nombre,ciudad,pais)")
    .order("nombre");

  return (data as UserProfile[]) ?? [];
}
