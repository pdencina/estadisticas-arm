"use client";
import { useState } from "react";
import { UserPlus, Building2, Shield, Edit2, MapPin } from "lucide-react";
import { ROL_LABELS, initials } from "@/lib/utils";
import type { UserProfile, Campus } from "@/types";
import UserModal from "./UserModal";
import CampusModal from "./CampusModal";

const RS: Record<string, { bg: string; color: string }> = {
  admin_global: { bg: "#EFF6FF", color: "#1D4ED8" },
  admin_campus: { bg: "var(--arm-l)", color: "var(--arm)" },
  voluntario:   { bg: "#FFFBEB", color: "#B45309" },
};
const AV = [
  { bg: "var(--arm-l)", color: "var(--arm)" },
  { bg: "var(--teal-l)", color: "var(--teal)" },
  { bg: "#FAECE7", color: "#D85A30" },
  { bg: "#EFF6FF", color: "#1D4ED8" },
];
const RD: Record<string, string> = {
  admin_global: "Ve todos los campus, genera informes, gestiona usuarios y valida reportes.",
  admin_campus: "Ingresa y edita reportes de su campus. Ve estadísticas propias.",
  voluntario:   "Solo puede ingresar datos del encuentro asignado.",
};

interface Props {
  users: UserProfile[];
  campusList: Campus[];
}

export default function AdminPanel({ users, campusList }: Props) {
  const [tab, setTab] = useState<"usuarios" | "campus">("usuarios");
  const [userModal, setUserModal] = useState<{ open: boolean; user?: UserProfile | null }>({ open: false });
  const [campusModal, setCampusModal] = useState<{ open: boolean; campus?: Campus | null }>({ open: false });

  const cm = Object.fromEntries(campusList.map(c => [c.id, c.nombre]));

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-xl w-fit">
        <button
          onClick={() => setTab("usuarios")}
          className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${tab === "usuarios" ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-700"}`}
        >
          <span className="flex items-center gap-1.5"><Shield size={12} />Usuarios</span>
        </button>
        <button
          onClick={() => setTab("campus")}
          className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${tab === "campus" ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-700"}`}
        >
          <span className="flex items-center gap-1.5"><Building2 size={12} />Campus</span>
        </button>
      </div>

      {/* USUARIOS TAB */}
      {tab === "usuarios" && (
        <>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-700">{users.length} usuarios registrados</p>
            </div>
            <button onClick={() => setUserModal({ open: true, user: null })} className="btn-primary">
              <UserPlus size={13} />Nuevo usuario
            </button>
          </div>

          {/* Roles explanation */}
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-3"><Shield size={14} className="text-gray-400" /><h3 className="text-sm font-semibold text-gray-700">Niveles de acceso</h3></div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {Object.entries(ROL_LABELS).map(([rol, label]) => {
                const s = RS[rol];
                return (
                  <div key={rol} className="p-3 rounded-lg bg-gray-50">
                    <span className="badge text-[10px] mb-2" style={{ background: s.bg, color: s.color }}>{label}</span>
                    <p className="text-xs text-gray-500 leading-relaxed">{RD[rol]}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Users list */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {users.map((u, i) => {
              const av = AV[i % AV.length];
              const rs = RS[u.rol];
              return (
                <div key={u.id} className="card p-4 flex items-center gap-3 hover:shadow-md transition-shadow">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold shrink-0" style={{ background: av.bg, color: av.color }}>
                    {initials(u.nombre)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{u.nombre}</p>
                    <p className="text-xs text-gray-400 truncate">{u.email}</p>
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      <span className="badge text-[10px]" style={{ background: rs.bg, color: rs.color }}>{ROL_LABELS[u.rol]}</span>
                      {u.campus_id && <span className="badge badge-gray text-[10px]">{cm[u.campus_id] ?? "—"}</span>}
                      {!u.activo && <span className="badge text-[10px] bg-red-50 text-red-600">Inactivo</span>}
                    </div>
                  </div>
                  <button onClick={() => setUserModal({ open: true, user: u })} className="btn-ghost p-2 rounded-lg shrink-0" title="Editar">
                    <Edit2 size={13} className="text-gray-400" />
                  </button>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* CAMPUS TAB */}
      {tab === "campus" && (
        <>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-700">{campusList.length} campus registrados</p>
            </div>
            <button onClick={() => setCampusModal({ open: true, campus: null })} className="btn-primary">
              <Building2 size={13} />Nuevo campus
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {campusList.map(c => (
              <div key={c.id} className={`card p-4 hover:shadow-md transition-shadow ${!c.activo ? "opacity-50" : ""}`}>
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="text-sm font-bold text-gray-800">{c.nombre}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <MapPin size={10} className="text-gray-400" />
                      <p className="text-xs text-gray-400">{c.ciudad}, {c.pais}</p>
                    </div>
                  </div>
                  <button onClick={() => setCampusModal({ open: true, campus: c })} className="btn-ghost p-2 rounded-lg shrink-0" title="Editar">
                    <Edit2 size={13} className="text-gray-400" />
                  </button>
                </div>
                <div className="flex items-center gap-2 mt-3">
                  <span className="text-[10px] text-gray-400">{c.zona_horaria}</span>
                  {!c.activo && <span className="badge text-[10px] bg-red-50 text-red-600">Inactivo</span>}
                  {c.activo && <span className="badge text-[10px] bg-emerald-50 text-emerald-600">Activo</span>}
                </div>
                <p className="text-[10px] text-gray-400 mt-1">
                  {users.filter(u => u.campus_id === c.id && u.activo).length} usuario{users.filter(u => u.campus_id === c.id && u.activo).length !== 1 ? "s" : ""} asignado{users.filter(u => u.campus_id === c.id && u.activo).length !== 1 ? "s" : ""}
                </p>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Modals */}
      {userModal.open && (
        <UserModal user={userModal.user} campusList={campusList} onClose={() => setUserModal({ open: false })} />
      )}
      {campusModal.open && (
        <CampusModal campus={campusModal.campus} onClose={() => setCampusModal({ open: false })} />
      )}
    </div>
  );
}
