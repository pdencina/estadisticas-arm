import { redirect } from "next/navigation";
import { getAllUsers, getCurrentUser } from "@/lib/queries/users";
import { getCampus } from "@/lib/queries/campus";
import { ROL_LABELS } from "@/lib/utils";
import { UserPlus, Shield } from "lucide-react";

export const revalidate = 60;

const initials = (n: string) => n.split(" ").slice(0,2).map(w=>w[0]).join("").toUpperCase();

const ROL_STYLE: Record<string, { bg: string; color: string }> = {
  admin_global: { bg: "#EFF6FF", color: "#1D4ED8" },
  admin_campus: { bg: "var(--arm-light)", color: "var(--arm)" },
  voluntario:   { bg: "#FFFBEB", color: "#B45309" },
};

const AV_COLORS = [
  { bg:"var(--arm-light)",  color:"var(--arm)"  },
  { bg:"var(--teal-light)", color:"var(--teal)" },
  { bg:"#FAECE7",           color:"#D85A30"     },
  { bg:"#EFF6FF",           color:"#1D4ED8"     },
];

const ROL_DESC: Record<string, string> = {
  admin_global: "Ve todos los campus, genera informes, gestiona usuarios y valida reportes.",
  admin_campus: "Ingresa y edita reportes de su campus asignado. Ve estadísticas propias.",
  voluntario:   "Solo puede ingresar datos del encuentro asignado por el administrador.",
};

export default async function UsuariosPage() {
  const user = await getCurrentUser();
  if (user?.rol !== "admin_global") redirect("/dashboard");

  const [users, campus] = await Promise.all([getAllUsers(), getCampus()]);
  const campusMap = Object.fromEntries(campus.map(c => [c.id, c.nombre]));

  return (
    <div className="page space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2>Usuarios y roles</h2>
          <p className="text-xs text-gray-400 mt-0.5">Gestión de accesos a la plataforma</p>
        </div>
        <button className="btn-primary"><UserPlus size={14}/>Invitar usuario</button>
      </div>

      {/* Roles */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-3">
          <Shield size={14} className="text-gray-400"/><h3>Niveles de acceso</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {Object.entries(ROL_LABELS).map(([rol, label]) => {
            const s = ROL_STYLE[rol];
            return (
              <div key={rol} className="p-3 rounded-lg bg-gray-50">
                <span className="badge text-[10px] mb-2" style={{ background:s.bg, color:s.color }}>{label}</span>
                <p className="text-xs text-gray-500 leading-relaxed">{ROL_DESC[rol]}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Users grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
        {users.map((u, i) => {
          const av = AV_COLORS[i % AV_COLORS.length];
          const rs = ROL_STYLE[u.rol];
          return (
            <div key={u.id} className="card p-4 flex items-center gap-3 hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                style={{ background: av.bg, color: av.color }}>
                {initials(u.nombre)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800 truncate">{u.nombre}</p>
                <p className="text-xs text-gray-400 truncate">{u.email}</p>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  <span className="badge text-[10px]" style={{ background:rs.bg, color:rs.color }}>
                    {ROL_LABELS[u.rol]}
                  </span>
                  {u.campus_id && <span className="badge badge-gray text-[10px]">{campusMap[u.campus_id] ?? "—"}</span>}
                  {!u.activo && <span className="badge badge-red text-[10px]">Inactivo</span>}
                </div>
              </div>
              <button className="btn-ghost text-xs shrink-0">Editar</button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
