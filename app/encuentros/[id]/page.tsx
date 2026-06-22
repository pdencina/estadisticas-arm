import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getEncuentroById } from "@/lib/queries/encuentros";
import { getCurrentUser } from "@/lib/queries/users";
import { validarEncuentro } from "@/lib/actions/encuentros";
import { fmt, fmtFecha, TIPO_LABELS, MODALIDAD_LABELS } from "@/lib/utils";
import { ArrowLeft, CheckCircle, Clock, Shield } from "lucide-react";

interface Props { params: { id: string } }

const ECFG = {
  borrador: { cls: "badge-amber", icon: Clock,       lbl: "Borrador" },
  enviado:  { cls: "badge-green", icon: CheckCircle, lbl: "Enviado"  },
  validado: { cls: "badge-teal",  icon: Shield,      lbl: "Validado" },
} as const;

const LBL: Record<string,string> = { auditorio:"Auditorio",kids:"Kids",tweens:"Tweens",sala_bebe:"Sala bebé",sala_sensorial:"Sala sensorial",cambio:"Cambio",servicio:"Servicio",tecnica:"Técnica",worship:"Worship",cocina:"Cocina",rrss:"RRSS",seguridad:"Seguridad",sala_bebes:"Sala bebés",conexion:"Conexión",oracion:"Oración",merch:"Merch",amor_por_la_casa:"Amor casa",punto_siembra:"Pto. siembra",cambios:"Cambios" };

export default async function Page({ params }: Props) {
  const [user, enc] = await Promise.all([getCurrentUser(), getEncuentroById(params.id).catch(()=>null)]);
  if (!enc) notFound();
  if (user?.rol !== "admin_global" && enc.campus_id !== user?.campus_id) redirect("/encuentros");

  const cfg = ECFG[enc.estado];
  const Icon = cfg.icon;
  const tV = Object.values(enc.voluntarios??{}).reduce((s,v)=>s+(v as number),0);
  const paj = (enc.acepto_jesus_presencial??0)+(enc.online?.acepto_jesus??0);

  async function validar() {
    "use server";
    await validarEncuentro(params.id);
    redirect(`/encuentros/${params.id}`);
  }

  return (
    <div className="page max-w-3xl space-y-5">
      <div>
        <Link href="/encuentros" className="btn-ghost text-xs mb-3 inline-flex"><ArrowLeft size={12}/>Volver</Link>
        <div className="flex flex-wrap items-start gap-3">
          <div className="flex-1">
            <h2 className="text-xl font-bold">{TIPO_LABELS[enc.tipo]} · {enc.horario}</h2>
            <p className="text-xs text-gray-400 mt-0.5">{enc.campus?.nombre} · {fmtFecha(enc.fecha)}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`badge ${cfg.cls} flex items-center gap-1`}><Icon size={10}/>{cfg.lbl}</span>
            {user?.rol==="admin_global"&&enc.estado==="enviado"&&(
              <form action={validar}><button className="btn-primary btn-sm"><Shield size={11}/>Validar</button></form>
            )}
          </div>
        </div>
      </div>

      <div className="card p-5">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Información</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
          {[["Modalidad",MODALIDAD_LABELS[enc.modalidad]],["Predicador",enc.predicador??"—"],["Mensaje",enc.nombre_mensaje??"—"],["Líderes vol.",enc.lideres_voluntarios??"—"],["Admins",enc.admins_campus??"—"]].map(([l,v])=>(
            <div key={l}><p className="text-[10px] uppercase tracking-wide text-gray-400 mb-0.5">{l}</p><p className="text-sm font-semibold text-gray-800 truncate">{v}</p></div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="kpi-card text-center"><p className="text-xs text-gray-400 mb-1">Total general</p><p className="text-3xl font-black">{fmt(enc.total_general)}</p></div>
        <div className="kpi-card text-center"><p className="text-xs text-gray-400 mb-1">Auditorio</p><p className="text-3xl font-black">{fmt(enc.asistencia?.auditorio??0)}</p></div>
        <div className="kpi-card text-center"><p className="text-xs text-gray-400 mb-1">PAJ</p><p className="text-3xl font-black" style={{color:"var(--teal)"}}>{paj}</p></div>
      </div>

      <div className="card p-5">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Desglose asistencia</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {Object.entries(enc.asistencia??{}).map(([k,v])=>(
            <div key={k} className="flex items-center justify-between px-3 py-2 rounded-lg bg-gray-50 text-sm">
              <span className="text-xs text-gray-500">{LBL[k]??k}</span><span className="font-black tabular-nums">{v as number}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="card p-5">
        <div className="flex items-center justify-between mb-3"><h3 className="text-sm font-semibold text-gray-700">Voluntarios</h3><span className="badge badge-purple text-[10px]">Total: {tV}</span></div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {Object.entries(enc.voluntarios??{}).map(([k,v])=>(
            <div key={k} className="flex items-center justify-between px-3 py-2 rounded-lg bg-gray-50 text-sm">
              <span className="text-xs text-gray-500">{LBL[k]??k}</span><span className="font-black tabular-nums">{v as number}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="card p-5">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Online</h3>
        <div className="grid grid-cols-2 gap-4">
          <div><p className="text-[10px] uppercase tracking-wide text-gray-400 mb-0.5">PAJ online</p><p className="text-xl font-black" style={{color:"var(--teal)"}}>{enc.online?.acepto_jesus??0}</p></div>
          <div><p className="text-[10px] uppercase tracking-wide text-gray-400 mb-0.5">Espectadores</p><p className="text-xl font-black">{enc.online?.espectadores_max??0}</p></div>
        </div>
      </div>

      <div className="flex justify-end pb-8">
        <Link href={`/nuevo-reporte?edit=${params.id}`} className="btn-secondary">Editar reporte</Link>
      </div>
    </div>
  );
}
