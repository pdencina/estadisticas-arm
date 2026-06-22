import { getCampus } from "@/lib/queries/campus";
import { getCurrentUser } from "@/lib/queries/users";
import NuevoReporteForm from "@/components/forms/NuevoReporteForm";
export default async function Page() {
  const [user, cl] = await Promise.all([getCurrentUser(), getCampus()]);
  const disp = user?.rol === "admin_global" ? cl : cl.filter(c=>c.id===user?.campus_id);
  return (
    <div className="page max-w-3xl">
      <div className="mb-6"><h2 className="text-xl font-bold">Nuevo reporte de encuentro</h2><p className="text-xs text-gray-400 mt-0.5">Completa todos los campos</p></div>
      <NuevoReporteForm campusList={disp} campusDefault={user?.campus_id??undefined}/>
    </div>
  );
}
