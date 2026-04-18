"use client";
import { usePathname } from "next/navigation";
import { Bell } from "lucide-react";
import type { UserProfile } from "@/types";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const TITLES: Record<string, string> = {
  "/dashboard":     "Dashboard global",
  "/encuentros":    "Encuentros",
  "/nuevo-reporte": "Nuevo reporte",
  "/campus":        "Por campus",
  "/informes":      "Informes semanales",
  "/usuarios":      "Usuarios y roles",
};

export default function Topbar({ user: _user }: { user: UserProfile }) {
  const path = usePathname();
  const title = Object.entries(TITLES).find(([k]) =>
    k === "/dashboard" ? path === k : path.startsWith(k)
  )?.[1] ?? "ARM Stats";

  const semana = format(new Date(), "'Semana' w · MMMM yyyy", { locale: es });

  return (
    <header className="sticky top-0 z-20 bg-white/80 backdrop-blur border-b border-gray-100
                       px-6 py-3.5 flex items-center gap-4">
      <p className="text-sm font-semibold text-gray-900 flex-1">{title}</p>
      <span className="hidden sm:inline-flex text-xs font-medium px-3 py-1 rounded-full"
        style={{ background: "var(--teal-light)", color: "var(--teal)" }}>
        {semana}
      </span>
      <button className="btn-ghost p-2"><Bell size={15} /></button>
    </header>
  );
}
