"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Calendar, PlusCircle, Building2, FileText, Users, LogOut, ChevronRight } from "lucide-react";
import { cn, ROL_LABELS } from "@/lib/utils";
import { signOut } from "@/lib/actions/auth";
import type { UserProfile } from "@/types";

const NAV = [
  { section: "Principal", items: [
    { href: "/dashboard",     icon: LayoutDashboard, label: "Dashboard"     },
    { href: "/encuentros",    icon: Calendar,        label: "Encuentros"    },
    { href: "/nuevo-reporte", icon: PlusCircle,      label: "Nuevo reporte" },
  ]},
  { section: "Análisis", items: [
    { href: "/campus",   icon: Building2, label: "Por campus"         },
    { href: "/informes", icon: FileText,  label: "Informes semanales" },
  ]},
  { section: "Admin", items: [
    { href: "/usuarios", icon: Users, label: "Usuarios y roles", adminOnly: true },
  ]},
];

const initials = (n: string) => n.split(" ").slice(0,2).map(w=>w[0]).join("").toUpperCase();

export default function Sidebar({ user }: { user: UserProfile }) {
  const path = usePathname();

  return (
    <aside className="sidebar">
      {/* Brand */}
      <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0"
          style={{ backgroundColor: "var(--arm)" }}>AR</div>
        <div>
          <p className="text-sm font-bold text-gray-900">ARM Stats</p>
          <p className="text-[10px] text-gray-400">arm global</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-4">
        {NAV.map(({ section, items }) => {
          const visible = items.filter(i => !("adminOnly" in i && i.adminOnly && user.rol !== "admin_global"));
          if (!visible.length) return null;
          return (
            <div key={section}>
              <p className="nav-section-label">{section}</p>
              <ul className="space-y-0.5 mt-1">
                {visible.map(item => {
                  const active = item.href === "/dashboard" ? path === "/dashboard" : path.startsWith(item.href);
                  return (
                    <li key={item.href}>
                      <Link href={item.href} className={cn("nav-link", active && "active")}>
                        <item.icon size={16} className={active ? "" : "text-gray-400"} />
                        <span>{item.label}</span>
                        {active && <ChevronRight size={12} className="ml-auto opacity-40" />}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </nav>

      {/* User */}
      <div className="px-3 py-3 border-t border-gray-100">
        <div className="flex items-center gap-3 px-2 py-1.5">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
            style={{ background: "var(--arm-light)", color: "var(--arm)" }}>
            {initials(user.nombre)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-gray-800 truncate">{user.nombre}</p>
            <p className="text-[10px] text-gray-400 truncate">
              {ROL_LABELS[user.rol]}{user.campus && ` · ${user.campus.nombre}`}
            </p>
          </div>
          <form action={signOut}>
            <button type="submit" className="text-gray-400 hover:text-gray-600 p-1" title="Salir">
              <LogOut size={13} />
            </button>
          </form>
        </div>
      </div>
    </aside>
  );
}
