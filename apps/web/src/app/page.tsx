"use client";

import React, { useEffect, useState, useCallback } from "react";
import { ApiClient } from "@/lib/apiClient";
import { ReadinessResponse } from "@/types/status";
import { AppHeader } from "@/components/nexus/app-header";
import { KpiCard } from "@/components/nexus/kpi-card";
import { StatusBadge } from "@/components/nexus/status-badge";
import {
  Activity,
  Database,
  HardDrive,
  Server,
  ClipboardCheck,
  AlertTriangle,
  Truck,
  RefreshCw,
  Shield,
  Smartphone,
} from "lucide-react";

function getOverallStatus(readiness: ReadinessResponse): "success" | "warning" | "danger" | "info" {
  if (readiness.status === "loading") return "info";
  if (readiness.status === "ready") return "success";
  // Parcialmente operacional
  const services = Object.values(readiness.services);
  const healthyCount = services.filter((s) => s === "healthy").length;
  if (healthyCount > 0 && healthyCount < services.length) return "warning";
  return "danger";
}

export default function DashboardPage() {
  const [readiness, setReadiness] = useState<ReadinessResponse>({
    status: "loading",
    services: {
      postgres: "unknown",
      redis: "unknown",
      minio: "unknown",
    },
  });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastChecked, setLastChecked] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    setIsRefreshing(true);
    const result = await ApiClient.checkReadiness();
    setReadiness(result);
    setLastChecked(new Date().toLocaleTimeString("pt-BR"));
    setIsRefreshing(false);
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const overallStatus = getOverallStatus(readiness);

  return (
    <>
      <AppHeader pageTitle="Dashboard" breadcrumb={["NexusOps", "Dashboard"]} />

      <main className="flex-1 p-6" style={{ backgroundColor: "var(--surface-page)" }}>
        {/* Resumo Operacional */}
        <section className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2
                className="text-lg font-semibold"
                style={{ color: "var(--text-primary)" }}
              >
                Resumo Operacional
              </h2>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                Visão geral da plataforma e serviços de infraestrutura
              </p>
            </div>
            <div className="flex items-center gap-3">
              {lastChecked && (
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                  Atualizado às {lastChecked}
                </span>
              )}
              <button
                onClick={fetchStatus}
                disabled={isRefreshing}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors duration-[140ms] disabled:opacity-50"
                style={{
                  backgroundColor: "var(--surface-card)",
                  border: "1px solid var(--border-default)",
                  borderRadius: "var(--radius-md)",
                  color: "var(--text-secondary)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "var(--border-strong)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "var(--border-default)";
                }}
              >
                <RefreshCw
                  size={13}
                  className={isRefreshing ? "animate-spin" : ""}
                />
                {isRefreshing ? "Verificando..." : "Atualizar"}
              </button>
            </div>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard
              label="Sistema"
              value={
                readiness.status === "loading"
                  ? "..."
                  : readiness.status === "ready"
                  ? "Online"
                  : "Offline"
              }
              context="Estado geral da plataforma"
              status={overallStatus}
              icon={<Activity size={16} />}
            />
            <KpiCard
              label="Inspeções Hoje"
              value="—"
              context="Módulo em implementação"
              status="neutral"
              icon={<ClipboardCheck size={16} />}
            />
            <KpiCard
              label="APRs Pendentes"
              value="—"
              context="Módulo em implementação"
              status="neutral"
              icon={<AlertTriangle size={16} />}
            />
            <KpiCard
              label="Veículos Ativos"
              value="—"
              context="Módulo em implementação"
              status="neutral"
              icon={<Truck size={16} />}
            />
          </div>
        </section>

        {/* Alerta de conectividade */}
        {readiness.errorDetail && (
          <div
            className="flex items-start gap-3 p-4 mb-6 text-sm"
            style={{
              backgroundColor: "var(--danger-soft)",
              border: "1px solid var(--danger)",
              borderRadius: "var(--radius-lg)",
              color: "var(--danger-foreground)",
            }}
          >
            <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Falha de conectividade</p>
              <p className="text-xs mt-0.5" style={{ opacity: 0.85 }}>
                {readiness.errorDetail}
              </p>
            </div>
          </div>
        )}

        {/* Status dos Serviços */}
        <section className="mb-6">
          <h3
            className="text-sm font-semibold mb-3"
            style={{ color: "var(--text-primary)" }}
          >
            Serviços de Infraestrutura
          </h3>
          <div
            className="grid grid-cols-1 lg:grid-cols-2 gap-3 p-5"
            style={{
              backgroundColor: "var(--surface-card)",
              border: "1px solid var(--border-default)",
              borderRadius: "var(--radius-lg)",
              boxShadow: "var(--shadow-sm)",
            }}
          >
            <StatusBadge
              label="API Gateway (FastAPI)"
              status={
                readiness.status === "loading"
                  ? "loading"
                  : readiness.status === "ready"
                  ? "ready"
                  : "unready"
              }
              description="Camada de acesso aos dados e regras de negócio"
            />
            <StatusBadge
              label="PostgreSQL 16"
              status={
                readiness.status === "loading"
                  ? "loading"
                  : readiness.services.postgres
              }
              description="Banco relacional — fonte oficial da verdade"
            />
            <StatusBadge
              label="Redis 7"
              status={
                readiness.status === "loading"
                  ? "loading"
                  : readiness.services.redis
              }
              description="Cache de permissões e filas assíncronas"
            />
            <StatusBadge
              label="MinIO Object Storage"
              status={
                readiness.status === "loading"
                  ? "loading"
                  : readiness.services.minio
              }
              description="Armazenamento de fotos, evidências e laudos"
            />
          </div>
        </section>

        {/* Módulos da Plataforma */}
        <section>
          <h3
            className="text-sm font-semibold mb-3"
            style={{ color: "var(--text-primary)" }}
          >
            Módulos da Plataforma
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div
              className="p-5"
              style={{
                backgroundColor: "var(--surface-card)",
                border: "1px solid var(--border-default)",
                borderRadius: "var(--radius-lg)",
                boxShadow: "var(--shadow-sm)",
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <Shield size={16} style={{ color: "var(--nexus-blue-600)" }} />
                <h4
                  className="text-sm font-medium"
                  style={{ color: "var(--text-primary)" }}
                >
                  Segurança e Contratos
                </h4>
              </div>
              <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                API First com contratos estritos via Pydantic v2 e autenticação JWT preparada. Logs estruturados em JSON com mascaramento.
              </p>
            </div>

            <div
              className="p-5"
              style={{
                backgroundColor: "var(--surface-card)",
                border: "1px solid var(--border-default)",
                borderRadius: "var(--radius-lg)",
                boxShadow: "var(--shadow-sm)",
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <Smartphone size={16} style={{ color: "var(--nexus-blue-600)" }} />
                <h4
                  className="text-sm font-medium"
                  style={{ color: "var(--text-primary)" }}
                >
                  Resiliência Offline-First
                </h4>
              </div>
              <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                Aplicativo React Native gera UUIDv4 localmente e mantém máquina de estados de sincronização para vistorias sem rede.
              </p>
            </div>

            <div
              className="p-5"
              style={{
                backgroundColor: "var(--surface-card)",
                border: "1px solid var(--border-default)",
                borderRadius: "var(--radius-lg)",
                boxShadow: "var(--shadow-sm)",
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <Database size={16} style={{ color: "var(--nexus-blue-600)" }} />
                <h4
                  className="text-sm font-medium"
                  style={{ color: "var(--text-primary)" }}
                >
                  Complementar ao MK Solutions
                </h4>
              </div>
              <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                O MK Solutions permanece como ERP oficial. O NexusOps gerencia exclusivamente a conformidade operacional em campo.
              </p>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
