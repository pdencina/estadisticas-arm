"use server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/queries/users";
import { revalidatePath } from "next/cache";

export async function crearCampus(nombre: string, ciudad: string, pais: string, zonaHoraria: string) {
  const admin = await getCurrentUser();
  if (!admin || admin.rol !== "admin_global") throw new Error("Sin permisos.");

  const supabase = createClient();
  const { error } = await supabase.from("campus").insert({
    nombre,
    ciudad,
    pais,
    zona_horaria: zonaHoraria,
    activo: true,
  });

  if (error) throw new Error(error.message);
  revalidatePath("/usuarios");
  revalidatePath("/campus");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function actualizarCampus(id: string, nombre: string, ciudad: string, pais: string, zonaHoraria: string, activo: boolean) {
  const admin = await getCurrentUser();
  if (!admin || admin.rol !== "admin_global") throw new Error("Sin permisos.");

  const supabase = createClient();
  const { error } = await supabase
    .from("campus")
    .update({ nombre, ciudad, pais, zona_horaria: zonaHoraria, activo })
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath("/usuarios");
  revalidatePath("/campus");
  revalidatePath("/dashboard");
  return { success: true };
}
