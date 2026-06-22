import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/queries/users";
import { initials, ROL_LABELS } from "@/lib/utils";
import { signOut } from "@/lib/actions/auth";
import { LogOut, Mail, Building2, Shield } from "lucide-react";
import AuthLayout from "@/components/layout/AuthLayout";

export default async function PerfilPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <AuthLayout>
      <div className="page max-w-md mx-auto py-8 px-4">
      {/* Avatar & name */}
      <div className="flex flex-col items-center text-center mb-8">
        <div className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold mb-3" style={{ background: "var(--arm-l)", color: "var(--arm)" }}>
          {initials(user.nombre)}
        </div>
        <h1 className="text-lg font-bold text-gray-900">{user.nombre}</h1>
        <p className="text-xs text-gray-400 mt-0.5">{ROL_LABELS[user.rol]}</p>
      </div>

      {/* Info cards */}
      <div className="space-y-3">
        <div className="card p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: "var(--arm-l)" }}>
            <Mail size={15} style={{ color: "var(--arm)" }} />
          </div>
          <div>
            <p className="text-[10px] text-gray-400 uppercase tracking-wide">Email</p>
            <p className="text-sm font-medium text-gray-800">{user.email}</p>
          </div>
        </div>

        {user.campus && (
          <div className="card p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: "var(--teal-l)" }}>
              <Building2 size={15} style={{ color: "var(--teal)" }} />
            </div>
            <div>
              <p className="text-[10px] text-gray-400 uppercase tracking-wide">Campus</p>
              <p className="text-sm font-medium text-gray-800">{user.campus.nombre}</p>
              <p className="text-[11px] text-gray-400">{user.campus.ciudad}, {user.campus.pais}</p>
            </div>
          </div>
        )}

        <div className="card p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 bg-purple-50">
            <Shield size={15} className="text-purple-500" />
          </div>
          <div>
            <p className="text-[10px] text-gray-400 uppercase tracking-wide">Rol</p>
            <p className="text-sm font-medium text-gray-800">{ROL_LABELS[user.rol]}</p>
          </div>
        </div>
      </div>

      {/* Sign out */}
      <form action={signOut} className="mt-8">
        <button type="submit" className="w-full btn-secondary justify-center py-3 text-red-500 border-red-100 hover:bg-red-50">
          <LogOut size={14} />Cerrar sesión
        </button>
      </form>
    </div>
    </AuthLayout>
  );
}
