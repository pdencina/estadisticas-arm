"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { crearEncuentro } from "@/lib/actions/encuentros";
import { HORARIOS, TIPOS_ENCUENTRO } from "@/lib/utils";
import type { Campus, AsistenciaDetalle, VoluntariosDetalle } from "@/types";
import { Loader2, Save, Send } from "lucide-react";

/* ── Counter ── */
function Counter({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="counter">
      <span className="text-xs text-gray-500 truncate pr-2">{label}</span>
      <div className="flex items-center gap-1.5 shrink-0">
        <button type="button" className="counter-btn" onClick={() => onChange(Math.max(0, value - 1))}>−</button>
        <span className="text-sm font-bold w-7 text-center tabular-nums">{value}</span>
        <button type="button" className="counter-btn" onClick={() => onChange(value + 1)}>+</button>
      </div>
    </div>
  );
}

/* ── Section card ── */
function Section({ title, badge, children }: { title: string; badge?: string; children: React.ReactNode }) {
  return (
    <div className="card overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
        <h3>{title}</h3>
        {badge && <span className="badge badge-purple text-[10px]">{badge}</span>}
      </div>
      <div className="p-5 space-y-4">{children}</div>
    </div>
  );
}

const DEF_ASISTENCIA: AsistenciaDetalle = { auditorio:0,kids:0,tweens:0,sala_bebe:0,sala_sensorial:0,cambio:0 };
const DEF_VOLUNTARIOS: VoluntariosDetalle = { servicio:0,tecnica:0,kids:0,tweens:0,worship:0,cocina:0,rrss:0,seguridad:0,sala_bebes:0,conexion:0,oracion:0,merch:0,amor_por_la_casa:0,sala_sensorial:0,punto_siembra:0,cambios:0 };

export default function NuevoReporteForm({ campusList, campusDefault }: { campusList: Campus[]; campusDefault?: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [campusId,      setCampusId]      = useState(campusDefault ?? campusList[0]?.id ?? "");
  const [fecha,         setFecha]         = useState(new Date().toISOString().split("T")[0]);
  const [tipo,          setTipo]          = useState("domingo");
  const [horario,       setHorario]       = useState("11:00");
  const [modalidad,     setModalidad]     = useState("presencial");
  const [predicador,    setPredicador]    = useState("");
  const [mensaje,       setMensaje]       = useState("");
  const [totalGral,     setTotalGral]     = useState(0);
  const [paj,           setPaj]           = useState(0);
  const [asistencia,    setAsistencia]    = useState<AsistenciaDetalle>(DEF_ASISTENCIA);
  const [voluntarios,   setVoluntarios]   = useState<VoluntariosDetalle>(DEF_VOLUNTARIOS);
  const [onlinePaj,     setOnlinePaj]     = useState(0);
  const [onlineEsp,     setOnlineEsp]     = useState(0);
  const [lideresVol,    setLideresVol]    = useState("");
  const [admsCampus,    setAdmsCampus]    = useState("");

  const updA = (k: keyof AsistenciaDetalle, v: number) => setAsistencia(p => ({ ...p, [k]: v }));
  const updV = (k: keyof VoluntariosDetalle, v: number) => setVoluntarios(p => ({ ...p, [k]: v }));
  const totalVols = Object.values(voluntarios).reduce((s, v) => s + v, 0);
  const totalAsis = Object.values(asistencia).reduce((s, v) => s + v, 0);

  function submit(estado: "borrador" | "enviado") {
    startTransition(async () => {
      try {
        await crearEncuentro({
          campus_id: campusId, fecha, tipo: tipo as never, horario,
          modalidad: modalidad as never, predicador: predicador || null,
          nombre_mensaje: mensaje || null, total_general: totalGral,
          acepto_jesus_presencial: paj, asistencia, voluntarios,
          online: { acepto_jesus: onlinePaj, espectadores_max: onlineEsp },
          lideres_voluntarios: lideresVol || null, admins_campus: admsCampus || null,
        }, estado);
        toast.success(estado === "enviado" ? "Reporte enviado ✓" : "Borrador guardado");
        router.push("/encuentros");
      } catch (e) {
        toast.error((e as Error).message ?? "Error al guardar");
      }
    });
  }

  return (
    <div className="space-y-5">
      {/* Info general */}
      <Section title="Información del encuentro">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div><label className="label">Campus</label>
            <select className="input" value={campusId} onChange={e => setCampusId(e.target.value)}>
              {campusList.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </select></div>
          <div><label className="label">Fecha</label>
            <input type="date" className="input" value={fecha} onChange={e => setFecha(e.target.value)} /></div>
          <div><label className="label">Tipo</label>
            <select className="input" value={tipo} onChange={e => setTipo(e.target.value)}>
              {TIPOS_ENCUENTRO.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select></div>
          <div><label className="label">Horario</label>
            <select className="input" value={horario} onChange={e => setHorario(e.target.value)}>
              {HORARIOS.map(h => <option key={h} value={h}>{h}</option>)}
            </select></div>
          <div><label className="label">Modalidad</label>
            <select className="input" value={modalidad} onChange={e => setModalidad(e.target.value)}>
              <option value="presencial">Presencial</option>
              <option value="online">Online</option>
              <option value="hibrido">Híbrido</option>
            </select></div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div><label className="label">Predicador/a</label>
            <input type="text" className="input" placeholder="Ej: Pastora Naty Segura"
              value={predicador} onChange={e => setPredicador(e.target.value)} /></div>
          <div><label className="label">Nombre del mensaje</label>
            <input type="text" className="input" placeholder="Ej: Tumba vacía, corazón encendido"
              value={mensaje} onChange={e => setMensaje(e.target.value)} /></div>
        </div>
      </Section>

      {/* Totales */}
      <Section title="Totales generales">
        <div className="grid grid-cols-2 gap-4">
          <div><label className="label">Total general</label>
            <input type="number" min={0} className="input text-xl font-bold"
              value={totalGral || ""} onChange={e => setTotalGral(Number(e.target.value))} /></div>
          <div><label className="label">Aceptaron a Jesús (presencial)</label>
            <input type="number" min={0} className="input text-xl font-bold"
              style={{ color: "var(--teal)" }}
              value={paj || ""} onChange={e => setPaj(Number(e.target.value))} /></div>
        </div>
      </Section>

      {/* Asistencia */}
      <Section title="Desglose de asistencia" badge={`Total: ${totalAsis}`}>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {([["auditorio","Auditorio"],["kids","Kids"],["tweens","Tweens"],["sala_bebe","Sala bebé"],["sala_sensorial","Sala sensorial"],["cambio","Cambio"]] as [keyof AsistenciaDetalle, string][]).map(([k,l]) => (
            <Counter key={k} label={l} value={asistencia[k]} onChange={v => updA(k,v)} />
          ))}
        </div>
      </Section>

      {/* Voluntarios */}
      <Section title="Voluntarios" badge={`Total: ${totalVols}`}>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {([["servicio","Servicio"],["tecnica","Técnica"],["kids","Kids"],["tweens","Tweens"],["worship","Worship"],["cocina","Cocina"],["rrss","R.R.S.S"],["seguridad","Seguridad"],["sala_bebes","Sala bebés"],["conexion","Conexión"],["oracion","Oración"],["merch","Merch"],["amor_por_la_casa","Amor casa"],["sala_sensorial","Sala sensorial"],["punto_siembra","Pto. siembra"],["cambios","Cambios"]] as [keyof VoluntariosDetalle, string][]).map(([k,l]) => (
            <Counter key={k} label={l} value={voluntarios[k]} onChange={v => updV(k,v)} />
          ))}
        </div>
      </Section>

      {/* Online */}
      <Section title="Online">
        <div className="grid grid-cols-2 gap-4">
          <div><label className="label">Aceptaron a Jesús (online)</label>
            <input type="number" min={0} className="input" value={onlinePaj||""} onChange={e=>setOnlinePaj(Number(e.target.value))} /></div>
          <div><label className="label">Espectadores simultáneos</label>
            <input type="number" min={0} className="input" value={onlineEsp||""} onChange={e=>setOnlineEsp(Number(e.target.value))} /></div>
        </div>
      </Section>

      {/* Liderazgo */}
      <Section title="Liderazgo">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div><label className="label">Líderes de voluntarios</label>
            <input type="text" className="input" placeholder="Ej: Jorge y Susy"
              value={lideresVol} onChange={e=>setLideresVol(e.target.value)} /></div>
          <div><label className="label">Administradores de campus</label>
            <input type="text" className="input" placeholder="Ej: Mario y Mirta"
              value={admsCampus} onChange={e=>setAdmsCampus(e.target.value)} /></div>
        </div>
      </Section>

      {/* Acciones */}
      <div className="flex items-center justify-end gap-3 pb-8">
        <button className="btn-secondary" disabled={pending} onClick={() => submit("borrador")}>
          <Save size={13}/>Guardar borrador
        </button>
        <button className="btn-primary" disabled={pending} onClick={() => submit("enviado")}>
          {pending ? <Loader2 size={13} className="animate-spin"/> : <Send size={13}/>}
          Enviar reporte
        </button>
      </div>
    </div>
  );
}
