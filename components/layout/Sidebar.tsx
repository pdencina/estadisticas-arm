"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Calendar, PlusCircle, Building2, FileText, Users, LogOut, ChevronRight, Star, Menu, X } from "lucide-react";
import { cn, ROL_LABELS, initials } from "@/lib/utils";
import { signOut } from "@/lib/actions/auth";
import type { UserProfile } from "@/types";

const NAV = [
  { sec: "Principal", items: [
    { href: "/dashboard",     icon: LayoutDashboard, label: "Dashboard"     },
    { href: "/encuentros",    icon: Calendar,        label: "Encuentros"    },
    { href: "/nuevo-reporte", icon: PlusCircle,      label: "Nuevo reporte" },
  ]},
  { sec: "Análisis", items: [
    { href: "/campus",   icon: Building2, label: "Por campus"        },
    { href: "/informes", icon: FileText,  label: "Informes semanales" },
    { href: "/pastor",   icon: Star,      label: "Vista Pastor", adminOnly: true },
  ]},
  { sec: "Admin", items: [
    { href: "/usuarios", icon: Users, label: "Usuarios y roles", adminOnly: true },
  ]},
];

export default function Sidebar({ user }: { user: UserProfile }) {
  const path = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed top-3 left-3 z-20 lg:hidden p-2 rounded-lg bg-white border border-gray-200 shadow-sm"
        aria-label="Abrir menú"
      >
        <Menu size={18} className="text-gray-600" />
      </button>

      {/* Overlay */}
      {open && <div className="sidebar-overlay" onClick={() => setOpen(false)} />}

      {/* Sidebar */}
      <aside className={cn("sidebar", open && "open")}>
        {/* Brand */}
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0" style={{ background: "var(--arm)" }}>AR</div>
          <div className="flex-1">
            <p className="text-sm font-bold text-gray-900 leading-tight">ARM Estadísticas</p>
            <p className="text-[10px] text-gray-400">arm global</p>
          </div>
          <button onClick={() => setOpen(false)} className="lg:hidden p-1 rounded text-gray-400 hover:text-gray-600">
            <X size={16} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-4">
          {NAV.map(({ sec, items }) => {
            const vis = items.filter(i => !("adminOnly" in i && i.adminOnly && user.rol !== "admin_global"));
            if (!vis.length) return null;
            return (
              <div key={sec}>
                <p className="nav-sec">{sec}</p>
                <ul className="space-y-0.5 mt-1">
                  {vis.map(item => {
                    const active = item.href === "/dashboard" ? path === "/dashboard" : path.startsWith(item.href);
                    return (
                      <li key={item.href}>
                        <Link href={item.href} onClick={() => setOpen(false)} className={cn("nav-link", active && "active")}>
                          <item.icon size={15} className={active ? "" : "text-gray-400"} />
                          <span>{item.label}</span>
                          {item.href === "/pastor" && !active && (
                            <span className="ml-auto badge badge-purple py-0 text-[9px]">Pastor</span>
                          )}
                          {active && <ChevronRight size={11} className="ml-auto opacity-40" />}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </nav>

        {/* User footer */}
        <div className="px-3 py-3 border-t border-gray-100">
          <div className="flex items-center gap-3 px-2 py-1.5 rounded-lg hover:bg-gray-50 transition-colors">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0" style={{ background: "var(--arm-l)", color: "var(--arm)" }}>
              {initials(user.nombre)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-gray-800 truncate">{user.nombre}</p>
              <p className="text-[10px] text-gray-400 truncate">{ROL_LABELS[user.rol]}{user.campus && ` · ${user.campus.nombre}`}</p>
            </div>
            <form action={signOut}>
              <button type="submit" className="text-gray-400 hover:text-gray-700 p-1 rounded transition-colors" title="Cerrar sesión">
                <LogOut size={13} />
              </button>
            </form>
          </div>
        </div>
      </aside>
    </>
  );
}
