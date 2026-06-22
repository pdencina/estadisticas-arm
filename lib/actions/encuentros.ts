"use server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/queries/users";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { NuevoEncuentroForm } from "@/types";

export async function crearEncuentro(form: NuevoEncuentroForm, estado: "pendiente" | "enviado" = "enviado") {
  const supabase = createClient();
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.rol !== "admin_global" && form.campus_id !== user.campus_id) {
    throw new Error("No tienes permiso para reportar este campus.");
  }
  const { data, error } = await supabase.from("encuentros").insert({ ...form, estado, reportado_por: user.id }).select().single();
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard");
  revalidatePath("/encuentros");
  revalidatePath("/pastor");
  return data;
}

export async function actualizarEncuentro(id: string, updates: Partial<NuevoEncuentroForm> & { estado?: string }) {
  const supabase = createClient();
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const { error } = await supabase.from("encuentros").update({ ...updates, updated_at: new Date().toISOString() }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard");
  revalidatePath("/encuentros");
  revalidatePath(`/encuentros/${id}`);
  revalidatePath("/pastor");
}

export async function validarEncuentro(id: string) {
  const supabase = createClient();
  const user = await getCurrentUser();
  if (!user || user.rol !== "admin_global") throw new Error("Sin permisos.");
  const { error } = await supabase.from("encuentros").update({ estado: "validado", updated_at: new Date().toISOString() }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/encuentros");
  revalidatePath("/pastor");
}

export async function aprobarEncuentro(id: string) {
  const supabase = createClient();
  const user = await getCurrentUser();
  if (!user || (user.rol !== "admin_global" && user.rol !== "admin_campus")) throw new Error("Sin permisos.");
  // Admin campus can only approve encounters from their campus
  if (user.rol === "admin_campus") {
    const { data: enc } = await supabase.from("encuentros").select("campus_id").eq("id", id).maybeSingle();
    if (enc?.campus_id !== user.campus_id) throw new Error("No podés aprobar reportes de otro campus.");
  }
  const { error } = await supabase.from("encuentros").update({ estado: "enviado", updated_at: new Date().toISOString() }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard");
  revalidatePath("/encuentros");
  revalidatePath(`/encuentros/${id}`);
  revalidatePath("/pastor");
}

export async function eliminarEncuentro(id: string) {
  const supabase = createClient();
  const user = await getCurrentUser();
  if (!user || user.rol !== "admin_global") throw new Error("Sin permisos.");
  const { error } = await supabase.from("encuentros").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/encuentros");
}
