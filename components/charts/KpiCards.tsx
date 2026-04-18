import { formatNumero, formatDelta, deltaClass } from "@/lib/utils";
import { Users, Headphones, Heart, TrendingUp } from "lucide-react";
import type { DashboardKPIs } from "@/types";

interface CardDef {
  label: string;
  value: number;
  delta: number | null;
  icon: React.ElementType;
  color: string;
  bg: string;
  accent: boolean;
}

export default function KpiCards({ kpis }: { kpis: DashboardKPIs }) {
  const { semana_actual: sa, diferencias: d } = kpis;

  const cards: CardDef[] = [
    { label: "Total asistentes",    value: sa.total_general,   delta: d.total_general,   icon: Users,      color: "var(--arm)",  bg: "var(--arm-light)",  accent: false },
    { label: "En auditorio",        value: sa.total_auditorio, delta: d.total_auditorio, icon: Headphones, color: "var(--teal)", bg: "var(--teal-light)", accent: false },
    { label: "Aceptaron a Jesús",   value: sa.total_paj,       delta: d.total_paj,       icon: Heart,      color: "#D85A30",     bg: "#FAECE7",           accent: false },
    { label: "Contador de almas",   value: 16384,              delta: null,              icon: TrendingUp, color: "var(--arm)",  bg: "var(--arm-light)",  accent: true  },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((c) => (
        <div key={c.label} className={`kpi-card ${c.accent ? "ring-1 ring-purple-200" : ""}`}>
          <div className="flex items-start justify-between mb-3">
            <p className="text-xs font-medium text-gray-400 leading-snug">{c.label}</p>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
              style={{ backgroundColor: c.bg }}>
              <c.icon size={15} style={{ color: c.color }} />
            </div>
          </div>
          <p className="text-2xl font-bold tracking-tight"
            style={{ color: c.accent ? c.color : "inherit" }}>
            {formatNumero(c.value)}
          </p>
          {c.delta !== null && (
            <p className={`text-xs mt-1.5 ${deltaClass(c.delta)}`}>
              {formatDelta(c.delta)}{" "}
              <span className="text-gray-400 font-normal">vs sem. anterior</span>
            </p>
          )}
          {c.accent && <p className="text-xs mt-1.5 text-gray-400">Acumulado 2026</p>}
        </div>
      ))}
    </div>
  );
}
