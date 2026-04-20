import { createClient } from "@/lib/supabase/server";

export async function getCurrentUser() {
  try {
    const supabase = createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    console.log("AUTH USER:", user?.id, user?.email);
    console.log("AUTH ERROR:", authError);

    if (authError || !user) return null;

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    console.log("PROFILE:", profile);
    console.log("PROFILE ERROR:", profileError);

    if (profileError || !profile) return null;

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