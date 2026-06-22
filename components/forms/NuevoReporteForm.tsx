"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { crearEncuentro } from "@/lib/actions/encuentros";
import { HORARIOS, TIPOS_ENCUENTRO } from "@/lib/utils";
import type { Campus, AsistenciaDetalle, VoluntariosDetalle } from "@/types";
import { Loader2, Save, Send } from "lucide-react";

function Ctr({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="ctr">
      <span className="text-xs text-gray-500 truncate pr-2">{label}</span>
      <div className="flex items-center gap-1.5 shrink-0">
        <button type="button" className="ctr-btn" onClick={() => onChange(Math.max(0, value - 1))}>−</button>
        <span className="text-sm font-black w-7 text-center tabular-nums">{value}</span>
        <button type="button" className="ctr-btn" onClick={() => onChange(value + 1)}>+</button>
      </div>
    </div>
  );
}

function Sec({ title, badge, children }: { title: string; badge?: string; children: React.ReactNode }) {
  return (
    <div className="card overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
        <h3 className="text-sm font-semibold text-gray-700">{title}</h3>
        {badge && <span className="badge badge-purple text-[10px]">{badge}</span>}
      </div>
      <div className="p-5 space-y-4">{children}</div>
    </div>
  );
}

const DA: AsistenciaDetalle   = { auditorio:0,kids:0,tweens:0,sala_bebe:0,sala_sensorial:0,cambio:0 };
const DV: VoluntariosDetalle  = { servicio:0,tecnica:0,kids:0,tweens:0,worship:0,cocina:0,rrss:0,seguridad:0,sala_bebes:0,conexion:0,oracion:0,merch:0,amor_por_la_casa:0,sala_sensorial:0,punto_siembra:0,cambios:0 };

export default function NuevoReporteForm({ campusList, campusDefault }: { campusList: Campus[]; campusDefault?: string }) {
  const router = useRouter();
  const [pending, startT] = useTransition();
  const [cId, setCId]   = useState(campusDefault ?? campusList[0]?.id ?? "");
  const [fecha, setF]   = useState(new Date().toISOString().split("T")[0]);
  const [tipo, setT]    = useState("domingo");
  const [hora, setH]    = useState("11:00");
  const [modal, setM]   = useState("presencial");
  const [pred, setPred] = useState("");
  const [msj,  setMsj]  = useState("");
  const [tGrl, setTGrl] = useState(0);
  const [paj,  setPaj]  = useState(0);
  const [asis, setAsis] = useState<AsistenciaDetalle>(DA);
  const [vols, setVols] = useState<VoluntariosDetalle>(DV);
  const [oPaj, setOPaj] = useState(0);
  const [oEsp, setOEsp] = useState(0);
  const [lidV, setLidV] = useState("");
  const [admC, setAdmC] = useState("");

  const uA = (k: keyof AsistenciaDetalle,   v: number) => setAsis(p=>({...p,[k]:v}));
  const uV = (k: keyof VoluntariosDetalle, v: number) => setVols(p=>({...p,[k]:v}));
  const tA = Object.values(asis).reduce((s,v)=>s+v,0);
  const tV = Object.values(vols).reduce((s,v)=>s+v,0);

  function submit(estado: "borrador" | "enviado") {
    startT(async () => {
      try {
        await crearEncuentro({ campus_id:cId, fecha, tipo:tipo as never, horario:hora, modalidad:modal as never, predicador:pred||null, nombre_mensaje:msj||null, total_general:tGrl, acepto_jesus_presencial:paj, asistencia:asis, voluntarios:vols, online:{acepto_jesus:oPaj,espectadores_max:oEsp}, lideres_voluntarios:lidV||null, admins_campus:admC||null }, estado);
        toast.success(estado==="enviado" ? "✓ Reporte enviado correctamente" : "Borrador guardado");
        router.push("/encuentros");
      } catch (e) { toast.error((e as Error).message ?? "Error al guardar"); }
    });
  }

  return (
    <div className="space-y-5">
      <Sec title="Información del encuentro">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div><label className="label">Campus</label><select className="input" value={cId} onChange={e=>setCId(e.target.value)}>{campusList.map(c=><option key={c.id} value={c.id}>{c.nombre}</option>)}</select></div>
          <div><label className="label">Fecha</label><input type="date" className="input" value={fecha} onChange={e=>setF(e.target.value)}/></div>
          <div><label className="label">Tipo</label><select className="input" value={tipo} onChange={e=>setT(e.target.value)}>{TIPOS_ENCUENTRO.map(t=><option key={t.value} value={t.value}>{t.label}</option>)}</select></div>
          <div><label className="label">Horario</label><select className="input" value={hora} onChange={e=>setH(e.target.value)}>{HORARIOS.map(h=><option key={h} value={h}>{h}</option>)}</select></div>
          <div><label className="label">Modalidad</label><select className="input" value={modal} onChange={e=>setM(e.target.value)}><option value="presencial">Presencial</option><option value="online">Online</option><option value="hibrido">Híbrido</option></select></div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div><label className="label">Predicador/a</label><input type="text" className="input" placeholder="Ej: Pastora Naty Segura" value={pred} onChange={e=>setPred(e.target.value)}/></div>
          <div><label className="label">Nombre del mensaje</label><input type="text" className="input" placeholder="Ej: Tumba vacía, corazón encendido" value={msj} onChange={e=>setMsj(e.target.value)}/></div>
        </div>
      </Sec>

      <Sec title="Totales generales">
        <div className="grid grid-cols-2 gap-4">
          <div><label className="label">Total general</label><input type="number" min={0} className="input text-2xl font-black" value={tGrl||""} onChange={e=>setTGrl(Number(e.target.value))}/></div>
          <div><label className="label">Aceptaron a Jesús (presencial)</label><input type="number" min={0} className="input text-2xl font-black" style={{color:"var(--teal)"}} value={paj||""} onChange={e=>setPaj(Number(e.target.value))}/></div>
        </div>
      </Sec>

      <Sec title="Desglose de asistencia" badge={`Total: ${tA}`}>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {([["auditorio","Auditorio"],["kids","Kids"],["tweens","Tweens"],["sala_bebe","Sala bebé"],["sala_sensorial","Sala sensorial"],["cambio","Cambio"]] as [keyof AsistenciaDetalle,string][]).map(([k,l])=>(
            <Ctr key={k} label={l} value={asis[k]} onChange={v=>uA(k,v)}/>
          ))}
        </div>
      </Sec>

      <Sec title="Voluntarios" badge={`Total: ${tV}`}>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {([["servicio","Servicio"],["tecnica","Técnica"],["kids","Kids"],["tweens","Tweens"],["worship","Worship"],["cocina","Cocina"],["rrss","R.R.S.S"],["seguridad","Seguridad"],["sala_bebes","Sala bebés"],["conexion","Conexión"],["oracion","Oración"],["merch","Merch"],["amor_por_la_casa","Amor casa"],["sala_sensorial","Sala sensorial"],["punto_siembra","Pto. siembra"],["cambios","Cambios"]] as [keyof VoluntariosDetalle,string][]).map(([k,l])=>(
            <Ctr key={k} label={l} value={vols[k]} onChange={v=>uV(k,v)}/>
          ))}
        </div>
      </Sec>

      <Sec title="Online">
        <div className="grid grid-cols-2 gap-4">
          <div><label className="label">Aceptaron a Jesús (online)</label><input type="number" min={0} className="input" value={oPaj||""} onChange={e=>setOPaj(Number(e.target.value))}/></div>
          <div><label className="label">Espectadores simultáneos</label><input type="number" min={0} className="input" value={oEsp||""} onChange={e=>setOEsp(Number(e.target.value))}/></div>
        </div>
      </Sec>

      <Sec title="Liderazgo">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div><label className="label">Líderes de voluntarios</label><input type="text" className="input" placeholder="Ej: Jorge y Susy" value={lidV} onChange={e=>setLidV(e.target.value)}/></div>
          <div><label className="label">Administradores de campus</label><input type="text" className="input" placeholder="Ej: Mario y Mirta" value={admC} onChange={e=>setAdmC(e.target.value)}/></div>
        </div>
      </Sec>

      <div className="flex items-center justify-end gap-3 pb-8">
        <button className="btn-secondary" disabled={pending} onClick={()=>submit("borrador")}><Save size={13}/>Guardar borrador</button>
        <button className="btn-primary" disabled={pending} onClick={()=>submit("enviado")}>{pending?<Loader2 size={13} className="animate-spin"/>:<Send size={13}/>}Enviar reporte</button>
      </div>
    </div>
  );
}
