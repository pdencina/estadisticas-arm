import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/queries/users";
import Sidebar from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar user={user} />
      <div className="main-content">
        <Topbar user={user} />
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}