"use client";
import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { crearEncuentro } from "@/lib/actions/encuentros";
import { HORARIOS, TIPOS_ENCUENTRO } from "@/lib/utils";
import type { Campus, AsistenciaDetalle, VoluntariosDetalle, Encuentro } from "@/types";
import { Loader2, Send, Copy, X, Eye } from "lucide-react";

// ═══ AutoInput con sugerencias ═══
function AutoInput({ label, value, onChange, suggestions, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; suggestions: string[]; placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [inputVal, setInputVal] = useState(value);

  // Sync external value
  useEffect(() => { setInputVal(value); }, [value]);

  // Get the last segment being typed (after last comma, & or /)
  const lastSegment = inputVal.split(/[,&\/]/).pop()?.trim().toLowerCase() ?? "";

  // Filter suggestions: exclude already selected ones, match by last segment
  const alreadySelected = inputVal.split(/[,&\/]/).map(s => s.trim().toLowerCase()).filter(Boolean);
  const filtered = suggestions
    .filter(s => !alreadySelected.includes(s.toLowerCase()))
    .filter(s => lastSegment === "" || s.toLowerCase().includes(lastSegment))
    .slice(0, 10);

  function handleSelect(s: string) {
    // Replace the last segment with the selection
    const parts = inputVal.split(/([,&\/])/);
    // Remove last part and its separator
    if (parts.length > 2) {
      parts.pop(); // last text
      const newVal = parts.join("") + " " + s;
      onChange(newVal.trim());
    } else {
      onChange(s);
    }
    setOpen(false);
  }

  return (
    <div className="relative">
      <label className="label">{label}</label>
      <input
        type="text"
        className="input"
        placeholder={placeholder}
        value={inputVal}
        onChange={e => { setInputVal(e.target.value); onChange(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 250)}
      />
      {open && filtered.length > 0 && (
        <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-44 overflow-y-auto">
          {filtered.map(s => (
            <button key={s} type="button"
              className="w-full text-left px-3 py-2 text-xs hover:bg-blue-50 hover:text-blue-700 truncate transition-colors"
              onMouseDown={(e) => { e.preventDefault(); handleSelect(s); }}>
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function Ctr({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[11px] text-gray-500 truncate">{label}</span>
      <input
        type="number"
        inputMode="numeric"
        min={0}
        className="input text-center text-sm font-bold py-2 px-1 tabular-nums"
        value={value || ""}
        onChange={e => onChange(Number(e.target.value) || 0)}
        placeholder="0"
      />
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

function PreviewRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex justify-between py-1.5 border-b border-gray-50 last:border-0">
      <span className="text-xs text-gray-500">{label}</span>
      <span className="text-xs font-semibold text-gray-800">{value}</span>
    </div>
  );
}

const DA: AsistenciaDetalle   = { auditorio:0,kids:0,tweens:0,sala_bebe:0,sala_sensorial:0,cambio:0 };
const DV: VoluntariosDetalle  = { servicio:0,tecnica:0,kids:0,tweens:0,worship:0,cocina:0,rrss:0,seguridad:0,sala_bebes:0,conexion:0,oracion:0,merch:0,amor_por_la_casa:0,sala_sensorial:0,punto_siembra:0,cambios:0 };

const ASIS_LABELS: Record<keyof AsistenciaDetalle, string> = { auditorio:"Auditorio",kids:"Kids",tweens:"Tweens",sala_bebe:"Sala bebé",sala_sensorial:"Sala sensorial",cambio:"Cambio" };
const VOL_LABELS: Record<keyof VoluntariosDetalle, string> = { servicio:"Servicio",tecnica:"Técnica",kids:"Kids",tweens:"Tweens",worship:"Worship",cocina:"Cocina",rrss:"R.R.S.S",seguridad:"Seguridad",sala_bebes:"Sala bebés",conexion:"Conexión",oracion:"Oración",merch:"Merch",amor_por_la_casa:"Amor casa",sala_sensorial:"Sala sensorial",punto_siembra:"Pto. siembra",cambios:"Cambios" };

export default function NuevoReporteForm({ campusList, campusDefault, encuentro, userRol }: { campusList: Campus[]; campusDefault?: string; encuentro?: Encuentro; userRol?: string }) {
  const router = useRouter();
  const [pending, startT] = useTransition();
  const isEdit = !!encuentro;

  const [cId, setCId]   = useState(encuentro?.campus_id ?? campusDefault ?? campusList[0]?.id ?? "");
  const [fecha, setF]   = useState(encuentro?.fecha ?? new Date().toISOString().split("T")[0]);
  const [tipo, setT]    = useState<string>(encuentro?.tipo ?? "domingo");
  const initHora = encuentro?.horario && HORARIOS.includes(encuentro.horario) ? encuentro.horario : encuentro?.horario ? "__custom" : "11:00";
  const [hora, setH]    = useState(initHora);
  const [horaCustom, setHoraCustom] = useState(initHora === "__custom" ? (encuentro?.horario ?? "") : "");
  const [modal, setM]   = useState<string>(encuentro?.modalidad ?? "presencial");
  const [pred, setPred] = useState(encuentro?.predicador ?? "");
  const [msj,  setMsj]  = useState(encuentro?.nombre_mensaje ?? "");
  const [tGrl, setTGrl] = useState(encuentro?.total_general ?? 0);
  const [paj,  setPaj]  = useState(encuentro?.acepto_jesus_presencial ?? 0);
  const [asis, setAsis] = useState<AsistenciaDetalle>(encuentro?.asistencia ?? DA);
  const [vols, setVols] = useState<VoluntariosDetalle>(encuentro?.voluntarios ?? DV);
  const [oPaj, setOPaj] = useState(encuentro?.online?.acepto_jesus ?? 0);
  const [oEsp, setOEsp] = useState(encuentro?.online?.espectadores_max ?? 0);
  const [lidV, setLidV] = useState(encuentro?.lideres_voluntarios ?? "");
  const [admC, setAdmC] = useState(encuentro?.admins_campus ?? "");
  const [saved, setSaved] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // Sugerencias de predicadores, líderes y admins
  const [sugerencias, setSugerencias] = useState<{ predicadores: string[]; lideres: string[]; admins: string[] }>({ predicadores: [], lideres: [], admins: [] });
  useEffect(() => {
    fetch("/api/sugerencias").then(r => r.json()).then(data => {
      // Merge with known names if API returns empty
      const defaultLideres = ["Juan Meneses", "Pamela Fabio", "Jorge Semerino", "Susy Semerino"];
      const defaultAdmins = ["Felipe Burgos", "Alison Carvajal", "Asdrubal Betancourt", "Evny Oropeza", "Pablo Encina"];
      setSugerencias({
        predicadores: data.predicadores?.length > 0 ? data.predicadores : [],
        lideres: data.lideres?.length > 0 ? data.lideres : defaultLideres,
        admins: data.admins?.length > 0 ? data.admins : defaultAdmins,
      });
    }).catch(() => {});
  }, []);

  const esOracion = tipo === "encuentro_oracion";

  const uA = (k: keyof AsistenciaDetalle,   v: number) => setAsis(p=>({...p,[k]:v}));
  const uV = (k: keyof VoluntariosDetalle, v: number) => setVols(p=>({...p,[k]:v}));
  const tA = Object.values(asis).reduce((s,v)=>s+v,0);
  const tV = Object.values(vols).reduce((s,v)=>s+v,0);

  const horarioFinal = hora === "__custom" ? horaCustom : hora;
  const campusNombre = campusList.find(c => c.id === cId)?.nombre ?? "—";
  const tipoLabel = TIPOS_ENCUENTRO.find(t => t.value === tipo)?.label ?? tipo;
  const modalLabel = modal === "presencial" ? "Presencial" : modal === "online" ? "Online" : "Híbrido";

  function resetNumeros() {
    setTGrl(0);
    setPaj(0);
    setAsis(DA);
    setVols(DV);
    setOPaj(0);
    setOEsp(0);
    setPred("");
    setMsj("");
    setSaved(false);
  }

  function handleDuplicar() {
    resetNumeros();
    setH("11:00");
    setHoraCustom("");
    toast.info("Datos numéricos limpiados. Cambiá el horario y completá el nuevo reporte.");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function openPreview() {
    if (!horarioFinal) {
      toast.error("Ingresá un horario válido.");
      return;
    }
    if (tGrl === 0) {
      toast.error("El total general no puede ser 0 para enviar.");
      return;
    }
    setShowPreview(true);
  }

  function confirmSubmit() {
    // Voluntarios → pendiente (needs admin campus approval), admins → enviado
    const estado = userRol === "voluntario" ? "pendiente" : "enviado";
    startT(async () => {
      try {
        if (isEdit && encuentro) {
          const { actualizarEncuentro } = await import("@/lib/actions/encuentros");
          await actualizarEncuentro(encuentro.id, { campus_id:cId, fecha, tipo:tipo as never, horario:horarioFinal, modalidad:modal as never, predicador:pred||null, nombre_mensaje:msj||null, total_general:tGrl, acepto_jesus_presencial:paj, asistencia:asis, voluntarios:vols, online:{acepto_jesus:oPaj,espectadores_max:oEsp}, lideres_voluntarios:lidV||null, admins_campus:admC||null, estado });
          toast.success("✓ Reporte actualizado correctamente");
          setShowPreview(false);
          router.push(`/encuentros/${encuentro.id}`);
        } else {
          await crearEncuentro({ campus_id:cId, fecha, tipo:tipo as never, horario:horarioFinal, modalidad:modal as never, predicador:pred||null, nombre_mensaje:msj||null, total_general:tGrl, acepto_jesus_presencial:paj, asistencia:asis, voluntarios:vols, online:{acepto_jesus:oPaj,espectadores_max:oEsp}, lideres_voluntarios:lidV||null, admins_campus:admC||null }, estado as "enviado");
          toast.success(estado === "pendiente" ? "✓ Reporte enviado — pendiente de aprobación" : "✓ Reporte enviado correctamente");
          setShowPreview(false);
          setSaved(true);
        }
      } catch (e) { toast.error((e as Error).message ?? "Error al guardar"); }
    });
  }

  return (
    <div className="space-y-5">
      {saved && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-emerald-200 bg-emerald-50">
          <p className="text-sm text-emerald-700 flex-1">
            ✓ Reporte guardado. ¿Tenés otro encuentro del mismo día?
          </p>
          <button onClick={handleDuplicar} className="btn-secondary btn-sm">
            <Copy size={12} />Cargar otro
          </button>
          <button onClick={() => router.push("/encuentros")} className="btn-primary btn-sm">
            Ir a encuentros
          </button>
        </div>
      )}

      <Sec title="Información del encuentro">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <div><label className="label">Campus</label><select className="input" value={cId} onChange={e=>setCId(e.target.value)}>{campusList.map(c=><option key={c.id} value={c.id}>{c.nombre}</option>)}</select></div>
          <div><label className="label">Fecha</label><input type="date" className="input" value={fecha} onChange={e=>setF(e.target.value)}/></div>
          <div><label className="label">Tipo</label><select className="input" value={tipo} onChange={e=>setT(e.target.value)}>{TIPOS_ENCUENTRO.map(t=><option key={t.value} value={t.value}>{t.label}</option>)}</select></div>
          <div>
            <label className="label">Horario</label>
            <select className="input" value={hora} onChange={e=>setH(e.target.value)}>
              {HORARIOS.map(h=><option key={h} value={h}>{h}</option>)}
              <option value="__custom">Otro horario...</option>
            </select>
            {hora === "__custom" && (
              <input type="time" className="input mt-2" value={horaCustom} onChange={e=>setHoraCustom(e.target.value)} placeholder="HH:MM" />
            )}
          </div>
          <div><label className="label">Modalidad</label><select className="input" value={modal} onChange={e=>setM(e.target.value)}><option value="presencial">Presencial</option><option value="online">Online</option><option value="hibrido">Híbrido</option></select></div>
        </div>
        {!esOracion && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <AutoInput label="Predicador/a" value={pred} onChange={setPred} suggestions={sugerencias.predicadores} placeholder="Ej: Pastora Naty Segura" />
            <div><label className="label">Nombre del mensaje</label><input type="text" className="input" placeholder="Ej: Tumba vacía, corazón encendido" value={msj} onChange={e=>setMsj(e.target.value)}/></div>
          </div>
        )}
      </Sec>

      <Sec title="Totales generales">
        <div className="grid grid-cols-2 gap-4">
          <div><label className="label">Total general</label><input type="number" min={0} className="input text-2xl font-black" value={tGrl||""} onChange={e=>setTGrl(Number(e.target.value))}/></div>
          <div><label className="label">Aceptaron a Jesús (presencial)</label><input type="number" min={0} className="input text-2xl font-black" style={{color:"var(--teal)"}} value={paj||""} onChange={e=>setPaj(Number(e.target.value))}/></div>
        </div>
      </Sec>

      {/* Formulario simplificado para Encuentro Oración */}
      {esOracion ? (
        <>
          <Sec title="Asistencia" badge={`Total: ${asis.auditorio}`}>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <Ctr label="Auditorio" value={asis.auditorio} onChange={v=>uA("auditorio",v)}/>
            </div>
          </Sec>

          <Sec title="Voluntarios" badge={`Total: ${tV}`}>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {([["oracion","Oradores"],["servicio","Servicio"],["tecnica","Técnica"],["worship","Worship"],["cocina","Cocina"],["rrss","Redes sociales"],["seguridad","Seguridad"]] as [keyof VoluntariosDetalle,string][]).map(([k,l])=>(
                <Ctr key={k} label={l} value={vols[k]} onChange={v=>uV(k,v)}/>
              ))}
            </div>
          </Sec>

          <Sec title="Online">
            <div className="grid grid-cols-2 gap-4">
              <div><label className="label">Espectadores simultáneos</label><input type="number" min={0} className="input" value={oEsp||""} onChange={e=>setOEsp(Number(e.target.value))}/></div>
            </div>
          </Sec>
        </>
      ) : (
        <>
          <Sec title="Desglose de asistencia" badge={`Total: ${tA}`}>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {([["auditorio","Auditorio"],["kids","Kids"],["tweens","Tweens"],["sala_bebe","Sala bebé"],["sala_sensorial","Sala sensorial"],["cambio","Cambio"]] as [keyof AsistenciaDetalle,string][]).map(([k,l])=>(
                <Ctr key={k} label={l} value={asis[k]} onChange={v=>uA(k,v)}/>
              ))}
            </div>
          </Sec>

          <Sec title="Voluntarios" badge={`Total: ${tV}`}>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
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
        </>
      )}

      <Sec title="Liderazgo">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <AutoInput label="Líderes de voluntarios" value={lidV} onChange={setLidV} suggestions={sugerencias.lideres} placeholder="Ej: Juan Meneses & Pamela Fabio" />
          <AutoInput label="Administradores de campus" value={admC} onChange={setAdmC} suggestions={sugerencias.admins} placeholder="Ej: Felipe Burgos & Alison Carvajal" />
        </div>
      </Sec>

      <div className="flex items-center justify-end gap-3 pb-8">
        <button className="btn-primary" disabled={pending || saved} onClick={()=>openPreview()}><Eye size={13}/>Revisar y enviar</button>
      </div>

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowPreview(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto">
            <div className="sticky top-0 bg-white px-6 py-4 border-b border-gray-100 flex items-center justify-between rounded-t-2xl z-10">
              <div>
                <h3 className="text-base font-bold text-gray-800">Vista previa del reporte</h3>
                <p className="text-[11px] text-gray-400 mt-0.5">Revisá los datos antes de confirmar</p>
              </div>
              <button onClick={() => setShowPreview(false)} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                <X size={16} className="text-gray-400" />
              </button>
            </div>
            <div className="px-6 py-4 space-y-4">
              {/* Info general */}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Encuentro</p>
                <div className="bg-gray-50 rounded-xl p-4">
                  <PreviewRow label="Campus" value={campusNombre} />
                  <PreviewRow label="Fecha" value={fecha} />
                  <PreviewRow label="Tipo" value={tipoLabel} />
                  <PreviewRow label="Horario" value={horarioFinal} />
                  <PreviewRow label="Modalidad" value={modalLabel} />
                  {pred && <PreviewRow label="Predicador/a" value={pred} />}
                  {msj && <PreviewRow label="Mensaje" value={msj} />}
                </div>
              </div>

              {/* Totales */}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Totales</p>
                <div className="bg-gray-50 rounded-xl p-4">
                  <PreviewRow label="Total general" value={tGrl.toLocaleString("es-CL")} />
                  <PreviewRow label="Aceptaron a Jesús" value={paj.toLocaleString("es-CL")} />
                </div>
              </div>

              {/* Asistencia */}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Asistencia <span className="text-purple-500">({tA})</span></p>
                <div className="bg-gray-50 rounded-xl p-4">
                  {(Object.entries(asis) as [keyof AsistenciaDetalle, number][]).filter(([,v]) => v > 0).map(([k,v]) => (
                    <PreviewRow key={k} label={ASIS_LABELS[k]} value={v} />
                  ))}
                  {tA === 0 && <p className="text-xs text-gray-400 text-center py-1">Sin desglose</p>}
                </div>
              </div>

              {/* Voluntarios */}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Voluntarios <span className="text-purple-500">({tV})</span></p>
                <div className="bg-gray-50 rounded-xl p-4">
                  {(Object.entries(vols) as [keyof VoluntariosDetalle, number][]).filter(([,v]) => v > 0).map(([k,v]) => (
                    <PreviewRow key={k} label={VOL_LABELS[k]} value={v} />
                  ))}
                  {tV === 0 && <p className="text-xs text-gray-400 text-center py-1">Sin desglose</p>}
                </div>
              </div>

              {/* Online */}
              {(oPaj > 0 || oEsp > 0) && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Online</p>
                  <div className="bg-gray-50 rounded-xl p-4">
                    {oPaj > 0 && <PreviewRow label="Aceptaron a Jesús (online)" value={oPaj} />}
                    {oEsp > 0 && <PreviewRow label="Espectadores simultáneos" value={oEsp} />}
                  </div>
                </div>
              )}

              {/* Liderazgo */}
              {(lidV || admC) && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Liderazgo</p>
                  <div className="bg-gray-50 rounded-xl p-4">
                    {lidV && <PreviewRow label="Líderes de voluntarios" value={lidV} />}
                    {admC && <PreviewRow label="Adm. de campus" value={admC} />}
                  </div>
                </div>
              )}
            </div>

            {/* Acciones */}
            <div className="sticky bottom-0 bg-white px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-3 rounded-b-2xl">
              <button onClick={() => setShowPreview(false)} className="btn-secondary">
                <X size={13} />Volver a editar
              </button>
              <button onClick={confirmSubmit} disabled={pending} className="btn-primary">
                {pending ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                Confirmar envío
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
