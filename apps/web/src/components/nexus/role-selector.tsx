"use client";

import React, { createContext, useContext, useState } from "react";
import { UserRole, ROLE_PERMISSIONS_MAP, RolePermissions } from "@/types/checklist";
import { ShieldCheck, ChevronDown, User } from "lucide-react";

interface RoleContextType {
  activeRole: UserRole;
  activeUser: string;
  permissions: RolePermissions;
  setActiveRole: (role: UserRole) => void;
}

const RoleContext = createContext<RoleContextType>({
  activeRole: "COORDENADOR",
  activeUser: "Roberto Alcantara (Coordenador)",
  permissions: ROLE_PERMISSIONS_MAP.COORDENADOR,
  setActiveRole: () => {},
});

export const useRole = () => useContext(RoleContext);

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const [activeRole, setActiveRoleState] = useState<UserRole>("COORDENADOR");

  const getUserName = (role: UserRole) => {
    switch (role) {
      case "TECNICO":
        return "Carlos Silva (Técnico de Campo)";
      case "SUPERVISOR":
        return "Juliana Lima (Supervisora Operacional)";
      case "COORDENADOR":
        return "Roberto Alcantara (Coordenador)";
      case "DIRETOR":
        return "Mariana Souza (Diretora EHS)";
      case "ADMIN":
        return "Administrador do Sistema";
    }
  };

  const value: RoleContextType = {
    activeRole,
    activeUser: getUserName(activeRole),
    permissions: ROLE_PERMISSIONS_MAP[activeRole],
    setActiveRole: (role: UserRole) => setActiveRoleState(role),
  };

  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
}

export function RoleSelector() {
  const { activeRole, activeUser, setActiveRole } = useRole();
  const [isOpen, setIsOpen] = useState(false);

  const roles: { role: UserRole; label: string; badgeBg: string; badgeColor: string }[] = [
    { role: "TECNICO", label: "Técnico de Campo", badgeBg: "var(--surface-muted)", badgeColor: "var(--text-secondary)" },
    { role: "SUPERVISOR", label: "Supervisor", badgeBg: "var(--info-soft)", badgeColor: "var(--info-foreground)" },
    { role: "COORDENADOR", label: "Coordenador", badgeBg: "var(--success-soft)", badgeColor: "var(--success-foreground)" },
    { role: "DIRETOR", label: "Diretor EHS", badgeBg: "var(--warning-soft)", badgeColor: "var(--warning-foreground)" },
    { role: "ADMIN", label: "Administrador", badgeBg: "var(--danger-soft)", badgeColor: "var(--danger-foreground)" },
  ];

  const activeConfig = roles.find((r) => r.role === activeRole) || roles[2];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium transition-all duration-[140ms]"
        style={{
          backgroundColor: "var(--surface-subtle)",
          border: "1px solid var(--border-default)",
          borderRadius: "var(--radius-md)",
          color: "var(--text-primary)",
        }}
        aria-label="Simulador de Perfil RBAC"
      >
        <ShieldCheck size={14} style={{ color: "var(--nexus-blue-600)" }} />
        <span style={{ color: "var(--text-muted)" }}>Perfil Simulação:</span>
        <span
          className="px-2 py-0.5 font-semibold text-[11px]"
          style={{
            backgroundColor: activeConfig.badgeBg,
            color: activeConfig.badgeColor,
            borderRadius: "var(--radius-sm)",
          }}
        >
          {activeConfig.label}
        </span>
        <ChevronDown size={12} style={{ color: "var(--text-muted)" }} />
      </button>

      {isOpen && (
        <div
          className="absolute right-0 mt-2 w-64 p-2 shadow-xl border z-50 animate-in fade-in zoom-in-95 duration-100"
          style={{
            backgroundColor: "var(--surface-card)",
            borderColor: "var(--border-default)",
            borderRadius: "var(--radius-lg)",
            boxShadow: "var(--shadow-overlay)",
          }}
        >
          <div className="px-2 py-1.5 border-b mb-1" style={{ borderColor: "var(--border-default)" }}>
            <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
              Simular Perfil de Acesso (RBAC)
            </p>
            <p className="text-xs mt-0.5 font-medium" style={{ color: "var(--text-primary)" }}>
              {activeUser}
            </p>
          </div>

          <div className="space-y-0.5">
            {roles.map((item) => (
              <button
                key={item.role}
                onClick={() => {
                  setActiveRole(item.role);
                  setIsOpen(false);
                }}
                className="w-full flex items-center justify-between px-2.5 py-1.5 text-xs rounded-md transition-colors"
                style={{
                  backgroundColor: item.role === activeRole ? "var(--surface-muted)" : "transparent",
                  color: "var(--text-primary)",
                }}
              >
                <div className="flex items-center gap-2">
                  <User size={13} style={{ color: item.role === activeRole ? "var(--nexus-blue-600)" : "var(--text-muted)" }} />
                  <span className={item.role === activeRole ? "font-bold" : "font-normal"}>{item.label}</span>
                </div>
                {item.role === activeRole && (
                  <span className="text-[10px] font-mono px-1.5 py-0.5 bg-blue-500/10 text-blue-600 rounded">Ativo</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
