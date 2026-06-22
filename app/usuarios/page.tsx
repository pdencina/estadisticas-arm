import { redirect } from "next/navigation";
import { getAllUsers, getCurrentUser } from "@/lib/queries/users";
import { getAllCampus } from "@/lib/queries/campus";
import AdminPanel from "@/components/forms/AdminPanel";

export const revalidate = 0;

export default async function UsuariosPage() {
  const user = await getCurrentUser();
  if (user?.rol !== "admin_global") redirect("/dashboard");

  let users: Awaited<ReturnType<typeof getAllUsers>> = [];
  let campus: Awaited<ReturnType<typeof getAllCampus>> = [];
  try {
    [users, campus] = await Promise.all([getAllUsers(), getAllCampus()]);
  } catch {
    // If queries fail, show empty state
  }

  return (
    <div className="page space-y-6">
      <div>
        <h2 className="text-xl font-bold">Administración</h2>
        <p className="text-xs text-gray-400 mt-0.5">Gestión de usuarios, roles y campus</p>
      </div>
      <AdminPanel users={users} campusList={campus} />
    </div>
  );
}
