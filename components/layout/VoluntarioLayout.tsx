"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { PlusCircle, ClipboardList, User, LogOut } from "lucide-react";
import { cn, initials } from "@/lib/utils";
import { signOut } from "@/lib/actions/auth";
import type { UserProfile } from "@/types";

const TABS = [
  { href: "/nuevo-reporte", icon: PlusCircle,    label: "Nuevo reporte" },
  { href: "/encuentros",    icon: ClipboardList, label: "Esta semana"   },
  { href: "/perfil",        icon: User,          label: "Mi perfil"     },
];

export default function VoluntarioLayout({ user, children }: { user: UserProfile; children: React.ReactNode }) {
  const path = usePathname();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0" style={{ background: "var(--arm)" }}>AR</div>
        <div className="flex-1">
          <p className="text-sm font-bold text-gray-900 leading-tight">ARM Estadísticas</p>
          <p className="text-[10px] text-gray-400">{user.campus?.nombre ?? "Sin campus"}</p>
        </div>
        <form action={signOut}>
          <button type="submit" className="text-gray-400 hover:text-gray-700 p-2 rounded-lg transition-colors" title="Cerrar sesión">
            <LogOut size={16} />
          </button>
        </form>
      </header>

      {/* Content */}
      <main className="flex-1 pb-20">
        {children}
      </main>

      {/* Bottom tab bar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-2 py-2 flex items-center justify-around z-30">
        {TABS.map(tab => {
          const active = tab.href === "/nuevo-reporte"
            ? path === "/nuevo-reporte"
            : path.startsWith(tab.href);
          return (
            <Link key={tab.href} href={tab.href} className={cn(
              "flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-xl transition-colors",
              active ? "text-purple-600" : "text-gray-400 hover:text-gray-600"
            )}>
              <tab.icon size={18} strokeWidth={active ? 2.5 : 2} />
              <span className={cn("text-[10px]", active && "font-semibold")}>{tab.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
