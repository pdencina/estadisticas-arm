import { getCampus } from "@/lib/queries/campus";
import { getCurrentUser } from "@/lib/queries/users";
import { getEncuentroById } from "@/lib/queries/encuentros";
import NuevoReporteForm from "@/components/forms/NuevoReporteForm";
import AuthLayout from "@/components/layout/AuthLayout";

export default async function Page({ searchParams }: { searchParams: { edit?: string } }) {
  const [user, cl] = await Promise.all([getCurrentUser(), getCampus()]);
  const disp = user?.rol === "admin_global" ? cl : cl.filter(c=>c.id===user?.campus_id);
  const encuentro = searchParams.edit ? await getEncuentroById(searchParams.edit) : null;
  const isEdit = !!encuentro;

  return (
    <AuthLayout>
      <div className="page max-w-3xl">
        <div className="mb-6">
          <h2 className="text-xl font-bold">{isEdit ? "Editar reporte" : "Nuevo reporte de encuentro"}</h2>
          <p className="text-xs text-gray-400 mt-0.5">{isEdit ? "Modificá los campos necesarios" : "Completa todos los campos"}</p>
        </div>
        <NuevoReporteForm campusList={disp} campusDefault={user?.campus_id??undefined} encuentro={encuentro ?? undefined} />
      </div>
    </AuthLayout>
  );
}
