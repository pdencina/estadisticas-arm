import { createClient } from "@/lib/supabase/server";
import { formatNumero } from "@/lib/utils";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { FileText, Download } from "lucide-react";
import type { InformeSemanal } from "@/types";
import GenerarInformeBtn from "@/components/forms/GenerarInformeBtn";

export const revalidate = 60;

async function getInformes(): Promise<InformeSemanal[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("informes_semanales").select("*")
    .order("semana_inicio", { ascending: false }).limit(20);
  return (data as InformeSemanal[]) ?? [];
}

export default async function InformesPage() {
  const informes = await getInformes();

  return (
    <div className="page space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2>Informes semanales</h2>
          <p className="text-xs text-gray-400 mt-0.5">Resumen consolidado por semana — todos los campus</p>
        </div>
        <GenerarInformeBtn />
      </div>

      <div className="space-y-4">
        {informes.map(inf => <InformeCard key={inf.id} informe={inf} />)}
        {informes.length === 0 && (
          <div className="card p-12 text-center">
            <FileText size={32} className="mx-auto mb-3 text-gray-200" />
            <p className="text-sm text-gray-400">Aún no hay informes generados</p>
          </div>
        )}
      </div>
    </div>
  );
}

function InformeCard({ informe }: { informe: InformeSemanal }) {
  const ini = format(parseISO(informe.semana_inicio), "dd MMM", { locale: es });
  const fin = format(parseISO(informe.semana_fin), "dd MMM yyyy", { locale: es });

  return (
    <div className="card overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex flex-wrap items-center gap-3">
        <div className="flex-1">
          <p className="text-sm font-bold text-gray-800">
            Semana {informe.semana_numero} · {format(parseISO(informe.semana_inicio), "MMMM yyyy", { locale: es })}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">{ini} – {fin}</p>
        </div>
        <button className="btn-secondary text-xs py-1.5 px-3"><Download size={12}/>Descargar PDF</button>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-gray-100">
        {[
          { label: "Total asistentes",  value: informe.total_general,   color: undefined },
          { label: "En auditorio",      value: informe.total_auditorio, color: undefined },
          { label: "Aceptaron a Jesús", value: informe.total_paj,       color: "var(--teal)" },
          { label: "Contador de almas", value: informe.contador_almas,  color: "var(--arm)"  },
        ].map(s => (
          <div key={s.label} className="px-5 py-4 text-center">
            <p className="text-xs text-gray-400 mb-1">{s.label}</p>
            <p className="text-xl font-black tabular-nums" style={s.color ? { color: s.color } : {}}>
              {formatNumero(s.value)}
            </p>
          </div>
        ))}
      </div>
      {(informe.datos_por_campus?.length ?? 0) > 0 && (
        <div className="px-5 pb-4 overflow-x-auto">
          <table className="table text-xs">
            <thead>
              <tr><th>Campus</th><th className="text-right">Total</th><th className="text-right">Aud.</th><th className="text-right">PAJ</th><th className="text-right">Δ</th></tr>
            </thead>
            <tbody>
              {informe.datos_por_campus.map(c => (
                <tr key={c.campus_id}>
                  <td className="font-semibold">{c.campus_nombre}</td>
                  <td className="text-right tabular-nums">{formatNumero(c.total_general)}</td>
                  <td className="text-right tabular-nums text-gray-400">{formatNumero(c.total_auditorio)}</td>
                  <td className="text-right tabular-nums font-bold" style={{color:"var(--teal)"}}>{c.total_paj}</td>
                  <td className={`text-right tabular-nums font-semibold text-xs ${c.diferencia_general>0?"text-emerald-500":c.diferencia_general<0?"text-red-500":"text-gray-400"}`}>
                    {c.diferencia_general>0?"↑":c.diferencia_general<0?"↓":"="} {Math.abs(c.diferencia_general)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
