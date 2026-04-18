import Link from "next/link";
import { formatFecha, formatNumero, TIPO_ENCUENTRO_LABELS } from "@/lib/utils";
import type { Encuentro } from "@/types";

const ESTADO: Record<string, { cls: string; label: string }> = {
  borrador: { cls: "badge-amber", label: "Borrador" },
  enviado:  { cls: "badge-green", label: "Enviado"  },
  validado: { cls: "badge-teal",  label: "Validado" },
};

export default function EncuentrosTable({ encuentros, showCampus = true }: { encuentros: Encuentro[]; showCampus?: boolean }) {
  if (!encuentros.length) return (
    <div className="py-12 text-center text-sm text-gray-400">Sin encuentros registrados</div>
  );

  return (
    <div className="overflow-x-auto">
      <table className="table">
        <thead>
          <tr>
            <th>Fecha</th>
            {showCampus && <th>Campus</th>}
            <th>Tipo</th>
            <th>Horario</th>
            <th>Predicador</th>
            <th className="text-right">Total</th>
            <th className="text-right">Auditorio</th>
            <th className="text-right">PAJ</th>
            <th>Estado</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {encuentros.map((e) => (
            <tr key={e.id}>
              <td className="text-gray-500 whitespace-nowrap">{formatFecha(e.fecha)}</td>
              {showCampus && (
                <td>
                  <span className="font-semibold text-gray-800">{e.campus?.nombre ?? "—"}</span>
                  <span className="text-xs text-gray-400 ml-1">{e.campus?.pais}</span>
                </td>
              )}
              <td className="whitespace-nowrap">{TIPO_ENCUENTRO_LABELS[e.tipo] ?? e.tipo}</td>
              <td className="text-gray-500">{e.horario}</td>
              <td className="text-gray-500 max-w-[140px] truncate">{e.predicador ?? "—"}</td>
              <td className="text-right font-semibold tabular-nums">{formatNumero(e.total_general)}</td>
              <td className="text-right text-gray-500 tabular-nums">{formatNumero(e.asistencia?.auditorio ?? 0)}</td>
              <td className="text-right font-bold tabular-nums" style={{ color: "var(--teal)" }}>
                {(e.acepto_jesus_presencial ?? 0) + (e.online?.acepto_jesus ?? 0)}
              </td>
              <td><span className={`badge ${ESTADO[e.estado]?.cls ?? "badge-gray"}`}>{ESTADO[e.estado]?.label ?? e.estado}</span></td>
              <td><Link href={`/encuentros/${e.id}`} className="text-xs text-gray-400 hover:text-gray-700">Ver →</Link></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
