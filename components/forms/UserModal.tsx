"use client";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { invitarUsuario, actualizarUsuario } from "@/lib/actions/users";
import { X, Loader2, Save } from "lucide-react";
import type { UserProfile, Campus } from "@/types";

interface Props {
  user?: UserProfile | null;
  campusList: Campus[];
  onClose: () => void;
}

export default function UserModal({ user, campusList, onClose }: Props) {
  const isEdit = !!user;
  const [pending, startT] = useTransition();
  const [nombre, setNombre] = useState(user?.nombre ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [rol, setRol] = useState<string>(user?.rol ?? "voluntario");
  const [campusId, setCampusId] = useState(user?.campus_id ?? "");
  const [activo, setActivo] = useState(user?.activo ?? true);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nombre.trim() || !email.trim()) {
      toast.error("Nombre y email son obligatorios.");
      return;
    }
    startT(async () => {
      try {
        if (isEdit && user) {
          await actualizarUsuario(user.id, nombre, rol, campusId || null, activo);
          toast.success("Usuario actualizado");
        } else {
          await invitarUsuario(email, nombre, rol, campusId || null);
          toast.success("Usuario creado exitosamente");
        }
        onClose();
      } catch (err) {
        toast.error((err as Error).message ?? "Error al guardar");
      }
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-base font-bold text-gray-800">{isEdit ? "Editar usuario" : "Nuevo usuario"}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <X size={16} className="text-gray-400" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label className="label">Nombre completo</label>
            <input type="text" className="input" value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Ej: Mario Muñoz" required />
          </div>
          <div>
            <label className="label">Email</label>
            <input type="email" className="input" value={email} onChange={e => setEmail(e.target.value)} placeholder="correo@armglobal.com" required disabled={isEdit} />
            {isEdit && <p className="text-[10px] text-gray-400 mt-1">El email no se puede cambiar</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Rol</label>
              <select className="input" value={rol} onChange={e => setRol(e.target.value)}>
                <option value="admin_global">Admin Global</option>
                <option value="admin_campus">Admin Campus</option>
                <option value="voluntario">Voluntario</option>
              </select>
            </div>
            <div>
              <label className="label">Campus</label>
              <select className="input" value={campusId} onChange={e => setCampusId(e.target.value)}>
                <option value="">Sin asignar</option>
                {campusList.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
              </select>
            </div>
          </div>
          {isEdit && (
            <div className="flex items-center gap-2">
              <input type="checkbox" id="activo" checked={activo} onChange={e => setActivo(e.target.checked)} className="rounded border-gray-300" />
              <label htmlFor="activo" className="text-sm text-gray-600">Usuario activo</label>
            </div>
          )}
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary">Cancelar</button>
            <button type="submit" disabled={pending} className="btn-primary">
              {pending ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
              {isEdit ? "Guardar cambios" : "Crear usuario"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
