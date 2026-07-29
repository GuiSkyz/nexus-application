"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { ChevronDown, LogOut, Settings, ShieldCheck, User } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { useAuth } from "./auth-provider";
import {
  ROLE_PERMISSIONS_MAP,
  RolePermissions,
  UserRole,
} from "@/types/checklist";

interface RoleContextType {
  activeRole: UserRole;
  activeUser: string;
  permissions: RolePermissions;
  setActiveRole: (role: UserRole) => void;
}

const RoleContext = createContext<RoleContextType | null>(null);

const roleLabels: Record<UserRole, string> = {
  TECNICO: "Técnico",
  SUPERVISOR: "Supervisor",
  COORDENADOR: "Coordenador",
  DIRETOR: "Diretor EHS",
  ADMIN: "Administrador",
  MASTER: "Master",
};

const simulatedRoles: UserRole[] = [
  "MASTER",
  "TECNICO",
  "SUPERVISOR",
  "COORDENADOR",
  "DIRETOR",
  "ADMIN",
];

export const useRole = () => {
  const context = useContext(RoleContext);
  if (!context) throw new Error("useRole deve ser usado dentro de RoleProvider.");
  return context;
};

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const realRole = user?.role || "TECNICO";
  const [activeRole, setActiveRoleState] = useState<UserRole>(realRole);

  useEffect(() => {
    setActiveRoleState(realRole);
  }, [realRole]);

  const value = useMemo<RoleContextType>(
    () => ({
      activeRole,
      activeUser: user?.name || "",
      permissions: ROLE_PERMISSIONS_MAP[activeRole],
      setActiveRole: (role) => {
        if (realRole === "MASTER") setActiveRoleState(role);
      },
    }),
    [activeRole, realRole, user?.name],
  );

  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
}

export function RoleSelector() {
  const { user, logout } = useAuth();
  const { activeRole, setActiveRole } = useRole();
  const [simulationOpen, setSimulationOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const router = useRouter();

  if (!user) return null;
  const isMaster = user.role === "MASTER";

  const signOut = async () => {
    await logout();
    router.replace("/login");
  };

  return (
    <div className="flex items-center gap-2">
      {isMaster && (
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setSimulationOpen((open) => !open);
              setAccountOpen(false);
            }}
            className="flex h-9 items-center gap-2 rounded-md border bg-surface-subtle px-3 text-xs font-semibold text-text-primary"
            aria-expanded={simulationOpen}
            aria-haspopup="menu"
          >
            <ShieldCheck className="h-4 w-4 text-nexus-blue-600" />
            <span className="hidden sm:inline text-text-secondary">
              Visualizar como
            </span>
            <span>{roleLabels[activeRole]}</span>
            <ChevronDown className="h-3.5 w-3.5 text-text-secondary" />
          </button>

          {simulationOpen && (
            <div
              role="menu"
              className="absolute right-0 z-50 mt-2 w-56 rounded-lg border bg-white p-2 shadow-overlay"
            >
              <p className="px-2 py-1.5 text-xs font-semibold text-text-secondary">
                Simulação exclusiva do Master
              </p>
              {simulatedRoles.map((role) => (
                <button
                  type="button"
                  role="menuitem"
                  key={role}
                  onClick={() => {
                    setActiveRole(role);
                    setSimulationOpen(false);
                  }}
                  className={`flex w-full items-center justify-between rounded-md px-2.5 py-2 text-left text-xs ${
                    role === activeRole
                      ? "bg-nexus-blue-50 font-bold text-nexus-blue-700"
                      : "text-text-primary hover:bg-surface-muted"
                  }`}
                >
                  {roleLabels[role]}
                  {role === activeRole && <span>Ativo</span>}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="relative">
        <button
          type="button"
          onClick={() => {
            setAccountOpen((open) => !open);
            setSimulationOpen(false);
          }}
          className="flex h-9 items-center gap-2 rounded-md px-2 text-left hover:bg-surface-muted"
          aria-expanded={accountOpen}
          aria-haspopup="menu"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-nexus-blue-50 text-nexus-blue-700">
            <User className="h-4 w-4" />
          </span>
          <span className="hidden max-w-40 sm:block">
            <span className="block truncate text-xs font-bold text-text-primary">
              {user.name}
            </span>
            <span className="block text-[11px] text-text-secondary">
              {roleLabels[user.role]}
            </span>
          </span>
          <ChevronDown className="h-3.5 w-3.5 text-text-secondary" />
        </button>

        {accountOpen && (
          <div
            role="menu"
            className="absolute right-0 z-50 mt-2 w-64 rounded-lg border bg-white p-2 shadow-overlay"
          >
            <div className="border-b px-2 py-2">
              <p className="truncate text-xs font-bold text-text-primary">
                {user.name}
              </p>
              <p className="mt-0.5 truncate text-xs text-text-secondary">
                {user.email}
              </p>
            </div>
            <Link
              href="/account"
              role="menuitem"
              onClick={() => setAccountOpen(false)}
              className="mt-1 flex items-center gap-2 rounded-md px-2.5 py-2 text-xs font-semibold text-text-primary hover:bg-surface-muted"
            >
              <Settings className="h-4 w-4 text-text-secondary" />
              Segurança da conta
            </Link>
            <button
              type="button"
              role="menuitem"
              onClick={() => void signOut()}
              className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-xs font-semibold text-danger-foreground hover:bg-danger-soft"
            >
              <LogOut className="h-4 w-4" />
              Sair
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
