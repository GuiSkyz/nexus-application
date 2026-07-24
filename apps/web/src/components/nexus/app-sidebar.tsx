"use client";

import React, { useState } from "react";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ClipboardCheck,
  AlertTriangle,
  Truck,
  FileBarChart,
  Settings,
  ChevronLeft,
  ChevronRight,
  Activity,
  HardHat,
  ShieldAlert,
} from "lucide-react";

interface NavItem {
  label: string;
  icon: React.ReactNode;
  href: string;
  badge?: string;
  badgeColor?: string;
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
      { label: "Status do Sistema", icon: <Activity size={18} />, href: "/status" },
    ],
  },
  {
    title: "Operacional",
    items: [
      { label: "Checklists", icon: <ClipboardCheck size={18} />, href: "/checklists" },
      { label: "Não Conformidades", icon: <ShieldAlert size={18} />, href: "/incidents", badge: "2", badgeColor: "bg-red-500 text-white" },
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
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  return (
    <aside
      className="fixed top-0 left-0 h-screen flex flex-col z-40 transition-all duration-200 ease-in-out shadow-2xl"
      style={{
        width: collapsed ? "var(--sidebar-width-collapsed)" : "var(--sidebar-width)",
        backgroundColor: "var(--nexus-navy-900)",
        borderRight: "1px solid rgba(255, 255, 255, 0.08)",
      }}
    >
      {/* Brand Header */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-nexus-blue-600 to-nexus-cyan-500 flex items-center justify-center font-black text-white text-base shadow-md shadow-nexus-blue-600/30 flex-shrink-0">
            N
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="font-bold text-[15px] text-white tracking-tight leading-none">
                NexusOps
              </span>
              <span className="text-[10px] font-semibold text-nexus-cyan-500 mt-1 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Cross Connection
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-6 custom-scrollbar">
        {navigation.map((group) => (
          <div key={group.title}>
            {!collapsed && (
              <span className="block text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mb-2.5 px-2">
                {group.title}
              </span>
            )}
            <ul className="space-y-1">
              {group.items.map((item) => {
                const isActive = pathname === item.href;

                return (
                  <li key={item.label}>
                    <a
                      href={item.href}
                      className={`flex items-center justify-between px-3 py-2.5 text-xs font-semibold rounded-lg transition-all duration-150 group ${
                        isActive
                          ? "bg-gradient-to-r from-nexus-cyan-500/20 to-nexus-blue-600/10 text-white shadow-sm border-l-2 border-nexus-cyan-500"
                          : "text-slate-300 hover:bg-white/5 hover:text-white"
                      }`}
                      title={collapsed ? item.label : undefined}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`transition-colors ${isActive ? "text-nexus-cyan-500" : "text-slate-400 group-hover:text-white"}`}>
                          {item.icon}
                        </span>
                        {!collapsed && <span>{item.label}</span>}
                      </div>

                      {!collapsed && item.badge && (
                        <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${item.badgeColor}`}>
                          {item.badge}
                        </span>
                      )}
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Collapse Toggle Footer */}
      <div className="p-3 border-t border-white/10 bg-nexus-navy-950/40">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-center gap-2 py-2 text-xs font-semibold text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-all"
          aria-label={collapsed ? "Expandir sidebar" : "Recolher sidebar"}
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          {!collapsed && <span>Recolher Menu</span>}
        </button>
      </div>
    </aside>
  );
}
