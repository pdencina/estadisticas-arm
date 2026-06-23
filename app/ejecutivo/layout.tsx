import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/queries/users";
import Sidebar from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";

export default async function EjecutivoLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.rol !== "admin_global") redirect("/dashboard");

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar user={user} />
      <div className="page-wrap">
        <Topbar />
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
