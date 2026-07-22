"use client";

import React, { useEffect, useState, useCallback } from "react";
import { ApiClient } from "@/lib/apiClient";
import { ReadinessResponse } from "@/types/status";
import { StatusBadge } from "@/components/StatusBadge";

export default function HomePage() {
  const [readiness, setReadiness] = useState<ReadinessResponse>({
    status: "loading",
    services: {
      postgres: "unknown",
      redis: "unknown",
      minio: "unknown",
    },
  });
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchStatus = useCallback(async () => {
    setIsRefreshing(true);
    const result = await ApiClient.checkReadiness();
    setReadiness(result);
    setIsRefreshing(false);
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  return (
    <div className="max-w-4xl mx-auto w-full space-y-10">
      <div className="text-center space-y-4">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold uppercase tracking-wider">
          <span>Operational Compliance Platform</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
          Fundação da Plataforma <span className="bg-gradient-to-r from-emerald-400 to-teal-500 bg-clip-text text-transparent">NexusOps</span>
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto text-base">
          Sistema especializado em inspeções operacionais, saídas de frotas e Análise Preliminar de Risco (APR). Operando com arquitetura Clean Architecture, API First e resiliência Offline-First.
        </p>
      </div>

      <div className="glass-panel rounded-2xl p-6 md:p-8 space-y-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-border/40 pb-4">
          <div>
            <h2 className="text-lg font-bold">Status do Ecossistema em Tempo Real</h2>
            <p className="text-xs text-muted-foreground">Verificação ativa contra a API FastAPI e serviços de infraestrutura</p>
          </div>
          <button
            onClick={fetchStatus}
            disabled={isRefreshing}
            className="px-4 py-2 rounded-lg bg-secondary hover:bg-secondary/80 text-secondary-foreground text-xs font-semibold transition-all duration-200 disabled:opacity-50 flex items-center space-x-2 border border-border"
          >
            <span>{isRefreshing ? "Verificando..." : "Atualizar Status"}</span>
          </button>
        </div>

        {readiness.errorDetail && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-mono">
            <strong>Aviso de Conectividade:</strong> {readiness.errorDetail}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <StatusBadge
            label="API Gateway & FastAPI"
            status={readiness.status === "loading" ? "loading" : readiness.status === "ready" ? "ready" : "unready"}
            description="Camada única autorizada de acesso à infraestrutura"
          />
          <StatusBadge
            label="PostgreSQL 16"
            status={readiness.status === "loading" ? "loading" : readiness.services.postgres}
            description="Fonte Oficial da Verdade (Relacional/Transacional)"
          />
          <StatusBadge
            label="Redis 7"
            status={readiness.status === "loading" ? "loading" : readiness.services.redis}
            description="Cache RBAC, Filas Assíncronas e Revogação JWT"
          />
          <StatusBadge
            label="MinIO Object Storage"
            status={readiness.status === "loading" ? "loading" : readiness.services.minio}
            description="Armazenamento de Fotos, Evidências e Laudos PDF"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
        <div className="p-5 rounded-xl bg-card border border-border/60 space-y-2">
          <h3 className="font-semibold text-foreground flex items-center space-x-2">
            <span>🛡️ Segurança & Contratos</span>
          </h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            API First com contratos estritos via Pydantic v2 e autenticação JWT preparada. Logs mascarados estruturados em JSON.
          </p>
        </div>
        <div className="p-5 rounded-xl bg-card border border-border/60 space-y-2">
          <h3 className="font-semibold text-foreground flex items-center space-x-2">
            <span>📱 Resiliência Offline-First</span>
          </h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Aplicativo React Native (Expo) gera UUIDv4 localmente e mantem máquina de estados de sincronização para vistorias em áreas sem rede.
          </p>
        </div>
        <div className="p-5 rounded-xl bg-card border border-border/60 space-y-2">
          <h3 className="font-semibold text-foreground flex items-center space-x-2">
            <span>🏢 Complementar ao MK</span>
          </h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            O MK Solutions permanece como ERP oficial para finanças e faturamento. O NexusOps gerencia a conformidade em campo.
          </p>
        </div>
      </div>
    </div>
  );
}
