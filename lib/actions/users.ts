"use server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/queries/users";
import { revalidatePath } from "next/cache";

export async function invitarUsuario(email: string, nombre: string, rol: string, campusId: string | null) {
  try {
    const admin = await getCurrentUser();
    if (!admin || admin.rol !== "admin_global") return { success: false, error: "Sin permisos." };

    const supabaseAdmin = createAdminClient();

    // Create user via admin API
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: email.split("@")[0] + "2026!",
      email_confirm: true,
      user_metadata: { nombre, rol },
    });

    if (error) {
      // If user already exists, just update their profile
      if (error.message.includes("already been registered") || error.message.includes("already exists")) {
        const { data: existingUser } = await supabaseAdmin
          .from("user_profiles")
          .select("id")
          .eq("email", email)
          .maybeSingle();

        if (existingUser) {
          const { error: updateErr } = await supabaseAdmin
            .from("user_profiles")
            .update({ nombre, rol, campus_id: campusId, activo: true })
            .eq("id", existingUser.id);
          if (updateErr) return { success: false, error: updateErr.message };
          revalidatePath("/usuarios");
          return { success: true, message: "Usuario actualizado" };
        }
      }
      return { success: false, error: error.message };
    }

    // Update profile with role and campus
    if (data.user) {
      const { error: profileErr } = await supabaseAdmin
        .from("user_profiles")
        .upsert({
          id: data.user.id,
          email,
          nombre,
          rol,
          campus_id: campusId,
          activo: true,
        });
      if (profileErr) return { success: false, error: profileErr.message };
    }

    revalidatePath("/usuarios");
    return { success: true, message: "Usuario creado exitosamente" };
  } catch (e) {
    return { success: false, error: (e as Error).message ?? "Error inesperado" };
  }
}

export async function actualizarUsuario(userId: string, nombre: string, rol: string, campusId: string | null, activo: boolean) {
  const admin = await getCurrentUser();
  if (!admin || admin.rol !== "admin_global") throw new Error("Sin permisos.");

  const supabaseAdmin = createAdminClient();
  const { error } = await supabaseAdmin
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

  const supabaseAdmin = createAdminClient();
  
  // Deactivate instead of delete for safety
  const { error } = await supabaseAdmin
    .from("user_profiles")
    .update({ activo: false })
    .eq("id", userId);

  if (error) throw new Error(error.message);
  revalidatePath("/usuarios");
  return { success: true };
}
