import { createClient } from "@/lib/supabase/server";
import { fmt, fmtDelta, deltaColor } from "@/lib/utils";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { FileText, Download, PlusCircle } from "lucide-react";
import type { InformeSemanal } from "@/types";
import GenerarInformeBtn from "@/components/forms/GenerarInformeBtn";

export const revalidate = 60;

async function getInformes(): Promise<InformeSemanal[]> {
  const supabase = createClient();
  const { data } = await supabase.from("informes_semanales").select("*").order("semana_inicio", { ascending: false }).limit(20);
  return (data as InformeSemanal[]) ?? [];
}

export default async function InformesPage() {
  const informes = await getInformes();
  return (
    <div className="page space-y-5">
      <div className="flex items-center justify-between">
        <div><h2 className="text-xl font-bold">Informes semanales</h2><p className="text-xs text-gray-400 mt-0.5">Resumen consolidado por semana</p></div>
        <GenerarInformeBtn />
      </div>
      <div className="space-y-4">
        {informes.map(inf => {
          const ini = format(parseISO(inf.semana_inicio), "dd MMM", { locale: es });
          const fin = format(parseISO(inf.semana_fin), "dd MMM yyyy", { locale: es });
          return (
            <div key={inf.id} className="card overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex flex-wrap items-center gap-3">
                <div className="flex-1">
                  <p className="text-sm font-bold text-gray-800">Semana {inf.semana_numero} · {format(parseISO(inf.semana_inicio), "MMMM yyyy", { locale: es })}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{ini} – {fin}</p>
                </div>
                <button className="btn-secondary btn-sm"><Download size={12}/>Descargar PDF</button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-gray-100">
                {[
                  { label: "Total asistentes",  val: inf.total_general,   color: undefined },
                  { label: "En auditorio",       val: inf.total_auditorio, color: undefined },
                  { label: "Aceptaron a Jesús",  val: inf.total_paj,       color: "var(--teal)" },
                  { label: "Contador de almas",  val: inf.contador_almas,  color: "var(--arm)" },
                ].map(s => (
                  <div key={s.label} className="px-5 py-4 text-center">
                    <p className="text-xs text-gray-400 mb-1">{s.label}</p>
                    <p className="text-xl font-black tabular-nums" style={s.color ? { color: s.color } : {}}>{fmt(s.val)}</p>
                  </div>
                ))}
              </div>
              {(inf.datos_por_campus?.length ?? 0) > 0 && (
                <div className="px-5 pb-4 overflow-x-auto border-t border-gray-50">
                  <table className="tbl text-xs mt-3">
                    <thead><tr><th>Campus</th><th className="text-right">Total</th><th className="text-right">Aud.</th><th className="text-right">PAJ</th><th className="text-right">Δ</th></tr></thead>
                    <tbody>
                      {inf.datos_por_campus.map(c => (
                        <tr key={c.campus_id}>
                          <td className="font-semibold">{c.campus_nombre}</td>
                          <td className="text-right tabular-nums">{fmt(c.total_general)}</td>
                          <td className="text-right tabular-nums text-gray-400">{fmt(c.total_auditorio)}</td>
                          <td className="text-right font-black tabular-nums" style={{color:"var(--teal)"}}>{c.total_paj}</td>
                          <td className={`text-right font-semibold tabular-nums ${deltaColor(c.diferencia_general)}`}>{fmtDelta(c.diferencia_general)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })}
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
