import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/queries/users";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <div style={{ padding: 20 }}>
        <h2>No se pudo obtener el usuario</h2>
        <p>Revisa logs de Vercel para ver AUTH USER / PROFILE ERROR</p>
      </div>
    );
  }

  return <>{children}</>;
}