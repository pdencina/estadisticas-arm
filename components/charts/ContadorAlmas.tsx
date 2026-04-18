import { formatNumero } from "@/lib/utils";

export default function ContadorAlmas({ total }: { total: number }) {
  return (
    <div className="card p-6 flex flex-col items-center justify-center text-center relative overflow-hidden min-h-[180px]">
      <div className="absolute inset-0 opacity-5"
        style={{ background: "radial-gradient(circle at 50% 50%, var(--arm) 0%, transparent 70%)" }} />
      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2 z-10">
        Contador de almas
      </p>
      <p className="text-5xl font-black tracking-tight z-10" style={{ color: "var(--arm)" }}>
        {formatNumero(total)}
      </p>
      <p className="text-xs text-gray-400 mt-2 z-10">Personas que aceptaron a Jesús · 2026</p>
      <div className="absolute bottom-0 left-0 right-0 h-1 rounded-b-xl opacity-30"
        style={{ backgroundColor: "var(--arm)" }} />
    </div>
  );
}
