"use server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/queries/users";
import { revalidatePath } from "next/cache";

export async function invitarUsuario(email: string, nombre: string, rol: string, campusId: string | null) {
  const admin = await getCurrentUser();
  if (!admin || admin.rol !== "admin_global") throw new Error("Sin permisos.");

  const supabase = createClient();

  // Create user via admin API (invites the user)
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: { nombre, rol },
  });

  if (error) {
    // If user already exists, just update their profile
    if (error.message.includes("already been registered")) {
      const { data: existingUsers } = await supabase
        .from("user_profiles")
        .select("id")
        .eq("email", email)
        .maybeSingle();

      if (existingUsers) {
        const { error: updateErr } = await supabase
          .from("user_profiles")
          .update({ nombre, rol, campus_id: campusId, activo: true })
          .eq("id", existingUsers.id);
        if (updateErr) throw new Error(updateErr.message);
        revalidatePath("/usuarios");
        return { success: true, message: "Usuario actualizado" };
      }
    }
    throw new Error(error.message);
  }

  // Update profile with role and campus
  if (data.user) {
    const { error: profileErr } = await supabase
      .from("user_profiles")
      .upsert({
        id: data.user.id,
        email,
        nombre,
        rol,
        campus_id: campusId,
        activo: true,
      });
    if (profileErr) throw new Error(profileErr.message);
  }

  revalidatePath("/usuarios");
  return { success: true, message: "Usuario creado exitosamente" };
}

export async function actualizarUsuario(userId: string, nombre: string, rol: string, campusId: string | null, activo: boolean) {
  const admin = await getCurrentUser();
  if (!admin || admin.rol !== "admin_global") throw new Error("Sin permisos.");

  const supabase = createClient();
  const { error } = await supabase
    .from("user_profiles")
    .update({ nombre, rol, campus_id: campusId, activo })
    .eq("id", userId);

  if (error) throw new Error(error.message);
  revalidatePath("/usuarios");
  return { success: true };
}

export async function eliminarUsuario(userId: string) {
  const admin = await getCurrentUser();
  if (!admin || admin.rol !== "admin_global") throw new Error("Sin permisos.");
  if (admin.id === userId) throw new Error("No podés eliminarte a vos mismo.");

  const supabase = createClient();
  
  // Deactivate instead of delete for safety
  const { error } = await supabase
    .from("user_profiles")
    .update({ activo: false })
    .eq("id", userId);

  if (error) throw new Error(error.message);
  revalidatePath("/usuarios");
  return { success: true };
}
