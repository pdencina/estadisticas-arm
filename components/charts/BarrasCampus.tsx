import type { Encuentro } from "@/types";
import { formatNumero } from "@/lib/utils";

const PAIS_COLOR: Record<string, string> = {
  Chile:     "var(--arm)",
  Uruguay:   "var(--teal)",
  Venezuela: "#D85A30",
  "EE.UU.":  "#534AB7",
  Argentina: "#0F6E56",
};

export default function BarrasCampus({ encuentros }: { encuentros: Encuentro[] }) {
  const map: Record<string, { nombre: string; pais: string; total: number }> = {};
  for (const e of encuentros) {
    if (!map[e.campus_id]) map[e.campus_id] = { nombre: e.campus?.nombre ?? "—", pais: e.campus?.pais ?? "", total: 0 };
    map[e.campus_id].total += e.total_general;
  }
  const sorted = Object.values(map).sort((a, b) => b.total - a.total);
  const max = sorted[0]?.total || 1;

  return (
    <div className="card p-5 h-full">
      <h3 className="mb-4">Asistencia por campus — semana actual</h3>
      {sorted.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-8">Sin datos esta semana</p>
      ) : (
        <div className="space-y-3">
          {sorted.map((c) => (
            <div key={c.nombre} className="flex items-center gap-3">
              <span className="text-xs text-gray-400 w-28 text-right shrink-0 truncate">{c.nombre}</span>
              <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                <div className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.round((c.total / max) * 100)}%`, backgroundColor: PAIS_COLOR[c.pais] ?? "var(--arm)" }} />
              </div>
              <span className="text-xs font-semibold text-gray-600 w-14 text-right tabular-nums shrink-0">
                {formatNumero(c.total)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
