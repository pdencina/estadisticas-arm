import { createClient } from "@/lib/supabase/server";

export async function getCurrentUser() {
  try {
    const supabase = createClient();

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) return null;

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (profileError) {
      console.error("Error profile:", profileError);
      return null;
    }

    return profile;
  } catch (error) {
    console.error("ERROR getCurrentUser:", error);
    return null;
  }
}

export async function getAllUsers() {
  try {
    const supabase = createClient();

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("ERROR getAllUsers:", error);
      return [];
    }

    return data ?? [];
  } catch (error) {
    console.error("ERROR getAllUsers:", error);
    return [];
  }
}