import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getEncuentroById } from "@/lib/queries/encuentros";
import { getCurrentUser } from "@/lib/queries/users";
import { validarEncuentro } from "@/lib/actions/encuentros";
import { formatFecha, formatNumero, TIPO_ENCUENTRO_LABELS, MODALIDAD_LABELS } from "@/lib/utils";
import { ArrowLeft, CheckCircle, Clock, Shield } from "lucide-react";

interface Props { params: { id: string } }

const ESTADO_CFG = {
  borrador: { cls: "badge-amber", icon: Clock,        label: "Borrador" },
  enviado:  { cls: "badge-green", icon: CheckCircle,  label: "Enviado"  },
  validado: { cls: "badge-teal",  icon: Shield,       label: "Validado" },
} as const;

const LABEL_MAP: Record<string, string> = {
  auditorio:"Auditorio",kids:"Kids",tweens:"Tweens",sala_bebe:"Sala bebé",
  sala_sensorial:"Sala sensorial",cambio:"Cambio",servicio:"Servicio",
  tecnica:"Técnica",worship:"Worship",cocina:"Cocina",rrss:"RRSS",
  seguridad:"Seguridad",sala_bebes:"Sala bebés",conexion:"Conexión",
  oracion:"Oración",merch:"Merch",amor_por_la_casa:"Amor casa",
  punto_siembra:"Pto. siembra",cambios:"Cambios",
};

export default async function EncuentroDetailPage({ params }: Props) {
  const [user, encuentro] = await Promise.all([
    getCurrentUser(),
    getEncuentroById(params.id).catch(() => null),
  ]);

  if (!encuentro) notFound();
  if (user?.rol !== "admin_global" && encuentro.campus_id !== user?.campus_id) redirect("/encuentros");

  const cfg = ESTADO_CFG[encuentro.estado];
  const Icon = cfg.icon;
  const totalVols = Object.values(encuentro.voluntarios ?? {}).reduce((s, v) => s + (v as number), 0);

  async function validar() {
    "use server";
    await validarEncuentro(params.id);
    redirect(`/encuentros/${params.id}`);
  }

  return (
    <div className="page max-w-3xl space-y-5">
      <div>
        <Link href="/encuentros" className="btn-ghost text-xs mb-3 inline-flex">
          <ArrowLeft size={12} />Volver
        </Link>
        <div className="flex flex-wrap items-start gap-3">
          <div className="flex-1">
            <h2>{TIPO_ENCUENTRO_LABELS[encuentro.tipo]} · {encuentro.horario}</h2>
            <p className="text-xs text-gray-400 mt-0.5">{encuentro.campus?.nombre} · {formatFecha(encuentro.fecha)}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`badge ${cfg.cls} flex items-center gap-1`}><Icon size={10}/>{cfg.label}</span>
            {user?.rol === "admin_global" && encuentro.estado === "enviado" && (
              <form action={validar}>
                <button className="btn-primary text-xs py-1.5 px-3"><Shield size={11}/>Validar</button>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="card p-5">
        <h3 className="mb-4">Información del encuentro</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
          <F label="Modalidad"      value={MODALIDAD_LABELS[encuentro.modalidad]} />
          <F label="Predicador"     value={encuentro.predicador ?? "—"} />
          <F label="Mensaje"        value={encuentro.nombre_mensaje ?? "—"} />
          <F label="Líderes vol."   value={encuentro.lideres_voluntarios ?? "—"} />
          <F label="Admins campus"  value={encuentro.admins_campus ?? "—"} />
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4">
        <div className="kpi-card text-center">
          <p className="text-xs text-gray-400 mb-1">Total general</p>
          <p className="text-3xl font-black">{formatNumero(encuentro.total_general)}</p>
        </div>
        <div className="kpi-card text-center">
          <p className="text-xs text-gray-400 mb-1">Auditorio</p>
          <p className="text-3xl font-black">{formatNumero(encuentro.asistencia?.auditorio ?? 0)}</p>
        </div>
        <div className="kpi-card text-center">
          <p className="text-xs text-gray-400 mb-1">Aceptaron a Jesús</p>
          <p className="text-3xl font-black" style={{ color: "var(--teal)" }}>
            {(encuentro.acepto_jesus_presencial ?? 0) + (encuentro.online?.acepto_jesus ?? 0)}
          </p>
        </div>
      </div>

      {/* Asistencia */}
      <div className="card p-5">
        <h3 className="mb-4">Desglose de asistencia</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {Object.entries(encuentro.asistencia ?? {}).map(([k, v]) => (
            <Stat key={k} label={LABEL_MAP[k] ?? k} value={v as number} />
          ))}
        </div>
      </div>

      {/* Voluntarios */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3>Voluntarios</h3>
          <span className="badge badge-purple">Total: {totalVols}</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {Object.entries(encuentro.voluntarios ?? {}).map(([k, v]) => (
            <Stat key={k} label={LABEL_MAP[k] ?? k} value={v as number} />
          ))}
        </div>
      </div>

      {/* Online */}
      <div className="card p-5">
        <h3 className="mb-4">Online</h3>
        <div className="grid grid-cols-2 gap-4">
          <F label="Aceptaron a Jesús"       value={String(encuentro.online?.acepto_jesus ?? 0)} />
          <F label="Espectadores simultáneos" value={String(encuentro.online?.espectadores_max ?? 0)} />
        </div>
      </div>

      <div className="flex justify-end pb-8">
        <Link href={`/nuevo-reporte?edit=${params.id}`} className="btn-secondary">Editar reporte</Link>
      </div>
    </div>
  );
}

function F({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wide text-gray-400 mb-0.5">{label}</p>
      <p className="text-sm font-semibold text-gray-800">{value}</p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-gray-50 text-sm">
      <span className="text-xs text-gray-500">{label}</span>
      <span className="font-bold tabular-nums">{value}</span>
    </div>
  );
}
