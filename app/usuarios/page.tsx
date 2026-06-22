import { redirect } from "next/navigation";
import { getAllUsers, getCurrentUser } from "@/lib/queries/users";
import { getCampus } from "@/lib/queries/campus";
import { ROL_LABELS, initials } from "@/lib/utils";
import { UserPlus, Shield } from "lucide-react";

export const revalidate = 60;

const RS: Record<string,{bg:string;color:string}> = {
  admin_global: { bg:"#EFF6FF", color:"#1D4ED8" },
  admin_campus: { bg:"var(--arm-l)", color:"var(--arm)" },
  voluntario:   { bg:"#FFFBEB", color:"#B45309" },
};
const AV = [
  {bg:"var(--arm-l)",color:"var(--arm)"},
  {bg:"var(--teal-l)",color:"var(--teal)"},
  {bg:"#FAECE7",color:"#D85A30"},
  {bg:"#EFF6FF",color:"#1D4ED8"},
];
const RD: Record<string,string> = {
  admin_global: "Ve todos los campus, genera informes, gestiona usuarios y valida reportes.",
  admin_campus: "Ingresa y edita reportes de su campus. Ve estadísticas propias.",
  voluntario:   "Solo puede ingresar datos del encuentro asignado.",
};

export default async function UsuariosPage() {
  const user = await getCurrentUser();
  if (user?.rol !== "admin_global") redirect("/dashboard");
  const [users, campus] = await Promise.all([getAllUsers(), getCampus()]);
  const cm = Object.fromEntries(campus.map(c=>[c.id,c.nombre]));

  return (
    <div className="page space-y-6">
      <div className="flex items-center justify-between">
        <div><h2 className="text-xl font-bold">Usuarios y roles</h2><p className="text-xs text-gray-400 mt-0.5">Gestión de accesos a la plataforma</p></div>
        <button className="btn-primary"><UserPlus size={13}/>Invitar usuario</button>
      </div>
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-4"><Shield size={14} className="text-gray-400"/><h3 className="text-sm font-semibold text-gray-700">Niveles de acceso</h3></div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {Object.entries(ROL_LABELS).map(([rol,label])=>{
            const s=RS[rol];
            return (
              <div key={rol} className="p-3 rounded-lg bg-gray-50">
                <span className="badge text-[10px] mb-2" style={{background:s.bg,color:s.color}}>{label}</span>
                <p className="text-xs text-gray-500 leading-relaxed">{RD[rol]}</p>
              </div>
            );
          })}
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
        {users.map((u,i)=>{
          const av=AV[i%AV.length]; const rs=RS[u.rol];
          return (
            <div key={u.id} className="card p-4 flex items-center gap-3 hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold shrink-0" style={{background:av.bg,color:av.color}}>{initials(u.nombre)}</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800 truncate">{u.nombre}</p>
                <p className="text-xs text-gray-400 truncate">{u.email}</p>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  <span className="badge text-[10px]" style={{background:rs.bg,color:rs.color}}>{ROL_LABELS[u.rol]}</span>
                  {u.campus_id&&<span className="badge badge-gray text-[10px]">{cm[u.campus_id]??"—"}</span>}
                  {!u.activo&&<span className="badge badge-red text-[10px]">Inactivo</span>}
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
