"use client";
import { useEffect, useRef } from "react";
import type { SemanaHistorica } from "@/types";

export default function PastorCharts({ historico }: { historico: SemanaHistorica[] }) {
  const r1 = useRef<HTMLCanvasElement>(null);
  const r2 = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!r1.current || !r2.current) return;
    // Wait for Chart.js CDN
    const init = () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const C = (window as any).Chart;
      if (!C) { setTimeout(init, 200); return; }

      const labels = historico.map(s => s.label);
      const totales = historico.map(s => s.total);
      const pajs    = historico.map(s => s.paj);

      const c1 = new C(r1.current, {
        type: "bar",
        data: { labels, datasets: [{ label: "Asistentes", data: totales, backgroundColor: "#EEEDFE", borderColor: "#7F77DD", borderWidth: 1.5, borderRadius: 5 }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, grid: { color: "rgba(0,0,0,0.04)" }, ticks: { font: { size: 11 } } }, x: { grid: { display: false }, ticks: { font: { size: 11 } } } } },
      });

      const c2 = new C(r2.current, {
        type: "line",
        data: { labels, datasets: [{ label: "PAJ", data: pajs, borderColor: "#1D9E75", backgroundColor: "rgba(29,158,117,0.07)", borderWidth: 2.5, pointRadius: 5, pointBackgroundColor: "#1D9E75", fill: true, tension: 0.35 }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, grid: { color: "rgba(0,0,0,0.04)" }, ticks: { font: { size: 11 } } }, x: { grid: { display: false }, ticks: { font: { size: 11 } } } } },
      });

      return () => { c1.destroy(); c2.destroy(); };
    };
    init();
  }, [historico]);

  return (
    <>
      <script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js" async />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-700">Asistencia — 8 semanas</h3>
            <span className="badge badge-purple text-[10px]">Total general</span>
          </div>
          <div style={{ position: "relative", height: 200 }}>
            <canvas ref={r1} role="img" aria-label="Gráfico barras asistencia semanal">
              {historico.map(s => `${s.label}: ${s.total}`).join(", ")}
            </canvas>
          </div>
        </div>
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-700">Aceptaron a Jesús — 8 semanas</h3>
            <span className="badge badge-teal text-[10px]">PAJ</span>
          </div>
          <div style={{ position: "relative", height: 200 }}>
            <canvas ref={r2} role="img" aria-label="Gráfico línea personas que aceptaron a Jesús">
              {historico.map(s => `${s.label}: ${s.paj}`).join(", ")}
            </canvas>
          </div>
        </div>
      </div>
    </>
  );
}
