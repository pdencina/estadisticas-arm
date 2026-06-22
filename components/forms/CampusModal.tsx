"use client";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { crearCampus, actualizarCampus } from "@/lib/actions/campus";
import { X, Loader2, Save } from "lucide-react";
import type { Campus } from "@/types";

const PAISES = ["Chile", "Uruguay", "Venezuela", "EE.UU.", "Argentina", "Colombia", "Perú", "México"];
const ZONAS: Record<string, string> = {
  Chile: "America/Santiago",
  Uruguay: "America/Montevideo",
  Venezuela: "America/Caracas",
  "EE.UU.": "America/Chicago",
  Argentina: "America/Argentina/Buenos_Aires",
  Colombia: "America/Bogota",
  Perú: "America/Lima",
  México: "America/Mexico_City",
};

interface Props {
  campus?: Campus | null;
  onClose: () => void;
}

export default function CampusModal({ campus, onClose }: Props) {
  const isEdit = !!campus;
  const [pending, startT] = useTransition();
  const [nombre, setNombre] = useState(campus?.nombre ?? "");
  const [ciudad, setCiudad] = useState(campus?.ciudad ?? "");
  const [pais, setPais] = useState(campus?.pais ?? "Chile");
  const [zona, setZona] = useState(campus?.zona_horaria ?? "America/Santiago");
  const [activo, setActivo] = useState(campus?.activo ?? true);

  function handlePaisChange(p: string) {
    setPais(p);
    setZona(ZONAS[p] ?? "America/Santiago");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nombre.trim() || !ciudad.trim()) {
      toast.error("Nombre y ciudad son obligatorios.");
      return;
    }
    startT(async () => {
      try {
        if (isEdit && campus) {
          await actualizarCampus(campus.id, nombre, ciudad, pais, zona, activo);
          toast.success("Campus actualizado");
        } else {
          await crearCampus(nombre, ciudad, pais, zona);
          toast.success("Campus creado exitosamente");
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
          <h3 className="text-base font-bold text-gray-800">{isEdit ? "Editar campus" : "Nuevo campus"}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <X size={16} className="text-gray-400" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label className="label">Nombre del campus</label>
            <input type="text" className="input" value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Ej: Stgo Centro" required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Ciudad</label>
              <input type="text" className="input" value={ciudad} onChange={e => setCiudad(e.target.value)} placeholder="Ej: Santiago" required />
            </div>
            <div>
              <label className="label">País</label>
              <select className="input" value={pais} onChange={e => handlePaisChange(e.target.value)}>
                {PAISES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="label">Zona horaria</label>
            <input type="text" className="input text-xs text-gray-500" value={zona} onChange={e => setZona(e.target.value)} />
          </div>
          {isEdit && (
            <div className="flex items-center gap-2">
              <input type="checkbox" id="campus-activo" checked={activo} onChange={e => setActivo(e.target.checked)} className="rounded border-gray-300" />
              <label htmlFor="campus-activo" className="text-sm text-gray-600">Campus activo</label>
            </div>
          )}
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary">Cancelar</button>
            <button type="submit" disabled={pending} className="btn-primary">
              {pending ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
              {isEdit ? "Guardar cambios" : "Crear campus"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
