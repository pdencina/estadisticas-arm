import { getDashboardKPIs, getEncuentrosSemanaActual, getEncuentrosPendientes } from "@/lib/queries/encuentros";
import { getCurrentUser } from "@/lib/queries/users";
import KpiCards from "@/components/charts/KpiCards";
import BarrasCampus from "@/components/charts/BarrasCampus";
import ContadorAlmas from "@/components/charts/ContadorAlmas";
import EncuentrosTable from "@/components/charts/EncuentrosTable";

export const revalidate = 60;

export default async function DashboardPage() {
  const user = await getCurrentUser();
  const campusId = user?.rol === "admin_global" ? undefined : user?.campus_id ?? undefined;

  const [kpis, encuentros, pendientes] = await Promise.all([
    getDashboardKPIs(campusId),
    getEncuentrosSemanaActual(campusId),
    getEncuentrosPendientes(),
  ]);

  return (
    <div className="page space-y-6">
      <KpiCards kpis={kpis} />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <BarrasCampus encuentros={encuentros} />
        </div>
        <ContadorAlmas total={16384} />
      </div>

      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3>Encuentros esta semana</h3>
          {pendientes.length > 0 && (
            <span className="badge badge-amber">
              {pendientes.length} pendiente{pendientes.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>
        <EncuentrosTable encuentros={encuentros} showCampus={!campusId} />
      </div>
    </div>
  );
}
