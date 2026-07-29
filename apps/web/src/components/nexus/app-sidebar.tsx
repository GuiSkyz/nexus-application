"use client";

import React from "react";
import { usePathname } from "next/navigation";
import {
  AlertTriangle,
  ClipboardCheck,
  FileBarChart,
  HardHat,
  LayoutDashboard,
  Settings,
  ShieldAlert,
  Truck,
} from "lucide-react";

interface NavItem {
  label: string;
  icon: React.ReactNode;
  href: string;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

const navigation: NavGroup[] = [
  {
    title: "Principal",
    items: [
      { label: "Dashboard", icon: <LayoutDashboard size={18} />, href: "/" },
    ],
  },
  {
    title: "Operacional",
    items: [
      { label: "Checklists", icon: <ClipboardCheck size={18} />, href: "/checklists" },
      { label: "Não conformidades", icon: <ShieldAlert size={18} />, href: "/incidents" },
      { label: "Veículos", icon: <Truck size={18} />, href: "/vehicles" },
      { label: "Técnicos", icon: <HardHat size={18} />, href: "/technicians" },
      { label: "APR", icon: <AlertTriangle size={18} />, href: "/apr" },
    ],
  },
  {
    title: "Gestão",
    items: [
      { label: "Relatórios", icon: <FileBarChart size={18} />, href: "/reports" },
      { label: "Configurações", icon: <Settings size={18} />, href: "/settings" },
    ],
  },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside
      className="fixed top-0 left-0 z-40 hidden h-screen w-[var(--sidebar-width)] flex-col lg:flex"
      style={{
        backgroundColor: "var(--nexus-navy-900)",
        borderRight: "1px solid rgba(255, 255, 255, 0.08)",
      }}
    >
      <div className="flex h-16 items-center px-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-nexus-blue-600 text-base font-black text-white">
            N
          </div>
          <div className="flex flex-col">
            <span className="text-[15px] font-bold leading-none tracking-tight text-white">
              NexusOps
            </span>
            <span className="mt-1 text-[10px] font-semibold text-nexus-cyan-500">
              Conformidade operacional
            </span>
          </div>
        </div>
      </div>

      <nav className="custom-scrollbar flex-1 space-y-6 overflow-y-auto px-3 py-4">
        {navigation.map((group) => (
          <div key={group.title}>
            <span className="mb-2.5 block px-2 text-[11px] font-semibold text-slate-400">
              {group.title}
            </span>
            <ul className="space-y-1">
              {group.items.map((item) => {
                const isActive = pathname === item.href;

                return (
                  <li key={item.label}>
                    <a
                      href={item.href}
                      className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-xs font-semibold transition-colors duration-150 ${
                        isActive
                          ? "bg-white/10 text-white"
                          : "text-slate-300 hover:bg-white/5 hover:text-white"
                      }`}
                    >
                      <span
                        className={`transition-colors ${
                          isActive
                            ? "text-nexus-cyan-500"
                            : "text-slate-400 group-hover:text-white"
                        }`}
                      >
                        {item.icon}
                      </span>
                      <span>{item.label}</span>
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
}
