"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  FileSignature,
  LockKeyhole,
  MapPin,
  ShieldCheck,
  X,
  XCircle,
} from "lucide-react";

import { AppHeader } from "@/components/nexus/app-header";
import { useRole } from "@/components/nexus/role-selector";

type AprStatus = "PENDING_AUTHORIZATION" | "AUTHORIZED" | "REJECTED";
type RiskLevel = "BAIXO" | "MEDIO" | "ALTO" | "CRITICO";

interface AprRecord {
  id: string;
  serviceOrder: string;
  activity: string;
  standard: "NR-35" | "NR-10";
  technician: string;
  team: string;
  location: string;
  plannedStart: string;
  maximumRisk: RiskLevel;
  residualRisk: RiskLevel;
  status: AprStatus;
  submittedAt: string;
  authorizedBy?: string;
  authorizedAt?: string;
  decisionNotes?: string;
}

const initialAprs: AprRecord[] = [
  {
    id: "APR-2026-184",
    serviceOrder: "OS-8849",
    activity: "Instalação FTTH em fachada",
    standard: "NR-35",
    technician: "João Souza",
    team: "Equipe Alfa",
    location: "Av. Paulista, 1500 · São Paulo/SP",
    plannedStart: "2026-07-23T15:00:00",
    maximumRisk: "CRITICO",
    residualRisk: "ALTO",
    status: "PENDING_AUTHORIZATION",
    submittedAt: "2026-07-23T14:26:00",
  },
  {
    id: "APR-2026-181",
    serviceOrder: "OS-8811",
    activity: "Manutenção em caixa de distribuição",
    standard: "NR-10",
    technician: "Carlos Silva",
    team: "Equipe Beta",
    location: "Rua das Flores, 42 · São Paulo/SP",
    plannedStart: "2026-07-23T13:30:00",
    maximumRisk: "ALTO",
    residualRisk: "MEDIO",
    status: "AUTHORIZED",
    submittedAt: "2026-07-23T12:54:00",
    authorizedBy: "Juliana Lima",
    authorizedAt: "2026-07-23T13:04:00",
    decisionNotes: "Bloqueio e teste de ausência de tensão confirmados.",
  },
  {
    id: "APR-2026-176",
    serviceOrder: "OS-8790",
    activity: "Lançamento de cabo em poste",
    standard: "NR-35",
    technician: "Marcos Oliveira",
    team: "Equipe Gama",
    location: "Rod. Anhanguera, km 18 · Osasco/SP",
    plannedStart: "2026-07-23T10:00:00",
    maximumRisk: "CRITICO",
    residualRisk: "CRITICO",
    status: "REJECTED",
    submittedAt: "2026-07-23T09:18:00",
    authorizedBy: "Juliana Lima",
    authorizedAt: "2026-07-23T09:24:00",
    decisionNotes: "Vento acima do limite operacional. Reprogramar atividade.",
  },
];

const riskStyles: Record<RiskLevel, string> = {
  BAIXO: "bg-emerald-50 text-emerald-800 border-emerald-200",
  MEDIO: "bg-amber-50 text-amber-800 border-amber-200",
  ALTO: "bg-orange-50 text-orange-800 border-orange-200",
  CRITICO: "bg-red-50 text-red-800 border-red-200",
};

const statusLabels: Record<AprStatus, string> = {
  PENDING_AUTHORIZATION: "Aguardando autorização",
  AUTHORIZED: "Autorizada",
  REJECTED: "Rejeitada",
};

export default function AprPage() {
  const { activeRole, activeUser } = useRole();
  const [aprs, setAprs] = useState(initialAprs);
  const [selectedApr, setSelectedApr] = useState<AprRecord | null>(null);
  const [decisionNotes, setDecisionNotes] = useState("");
  const [signatureConfirmed, setSignatureConfirmed] = useState(false);
  const [statusFilter, setStatusFilter] = useState<AprStatus | "ALL">("ALL");

  const canAuthorize = ["SUPERVISOR", "COORDENADOR", "DIRETOR", "ADMIN"].includes(
    activeRole
  );
  const filteredAprs = useMemo(
    () =>
      statusFilter === "ALL"
        ? aprs
        : aprs.filter((apr) => apr.status === statusFilter),
    [aprs, statusFilter]
  );
  const pendingCount = aprs.filter(
    (apr) => apr.status === "PENDING_AUTHORIZATION"
  ).length;
  const authorizedCount = aprs.filter((apr) => apr.status === "AUTHORIZED").length;

  const openDecision = (apr: AprRecord) => {
    setSelectedApr(apr);
    setDecisionNotes("");
    setSignatureConfirmed(false);
  };

  const decide = (decision: "AUTHORIZED" | "REJECTED") => {
    if (!selectedApr || !signatureConfirmed || decisionNotes.trim().length < 3) {
      return;
    }
    const decidedAt = new Date().toISOString();
    setAprs((current) =>
      current.map((apr) =>
        apr.id === selectedApr.id
          ? {
              ...apr,
              status: decision,
              authorizedBy: activeUser,
              authorizedAt: decidedAt,
              decisionNotes,
            }
          : apr
      )
    );
    setSelectedApr(null);
  };

  return (
    <>
      <AppHeader pageTitle="APR e autorizações" breadcrumb={["Operacional", "APR"]} />
      <main className="p-6 space-y-5">
        <section className="flex flex-col gap-4 border-b pb-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-6 w-6 text-nexus-blue-600" />
              <h1 className="text-xl font-bold text-text-primary">
                Liberação de atividades de alto risco
              </h1>
            </div>
            <p className="mt-2 text-sm leading-6 text-text-secondary">
              Valide riscos, controles e assinaturas antes de liberar trabalhos
              enquadrados nas normas NR-35 e NR-10.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-800">
            <LockKeyhole className="h-4 w-4" />
            Sem autorização, o início permanece bloqueado
          </div>
        </section>

        <section className="flex flex-wrap items-center gap-x-8 gap-y-3 border-b pb-4">
          <div>
            <p className="text-xs text-text-secondary">Pendentes agora</p>
            <p className="mt-1 text-2xl font-bold text-red-700">{pendingCount}</p>
          </div>
          <div>
            <p className="text-xs text-text-secondary">Autorizadas hoje</p>
            <p className="mt-1 text-2xl font-bold text-emerald-700">{authorizedCount}</p>
          </div>
          <div className="min-w-[220px]">
            <p className="text-xs text-text-secondary">Perfil em operação</p>
            <p className="mt-1 text-sm font-semibold text-text-primary">{activeUser}</p>
          </div>
          {!canAuthorize && (
            <p className="text-xs font-semibold text-amber-700">
              Este perfil pode consultar, mas não autorizar.
            </p>
          )}
        </section>

        <section className="flex items-center justify-between gap-4">
          <h2 className="text-sm font-bold text-text-primary">Fila operacional</h2>
          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value as AprStatus | "ALL")
            }
            className="rounded-md border bg-surface-card px-3 py-2 text-xs font-semibold text-text-primary focus:outline-none focus:ring-2 focus:ring-nexus-blue-600"
          >
            <option value="ALL">Todos os status</option>
            <option value="PENDING_AUTHORIZATION">Aguardando autorização</option>
            <option value="AUTHORIZED">Autorizadas</option>
            <option value="REJECTED">Rejeitadas</option>
          </select>
        </section>

        <section className="overflow-hidden rounded-xl border bg-surface-card">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-left text-xs">
              <thead className="border-b bg-surface-subtle text-text-secondary">
                <tr>
                  <th className="px-4 py-3 font-semibold">APR / Ordem</th>
                  <th className="px-4 py-3 font-semibold">Atividade</th>
                  <th className="px-4 py-3 font-semibold">Responsável</th>
                  <th className="px-4 py-3 font-semibold">Risco</th>
                  <th className="px-4 py-3 font-semibold">Início previsto</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 text-right font-semibold">Decisão</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredAprs.map((apr) => (
                  <tr key={apr.id} className="hover:bg-surface-subtle">
                    <td className="px-4 py-4">
                      <p className="font-mono font-bold text-nexus-blue-600">{apr.id}</p>
                      <p className="mt-1 font-semibold text-text-primary">
                        {apr.serviceOrder} · {apr.standard}
                      </p>
                    </td>
                    <td className="px-4 py-4">
                      <p className="font-semibold text-text-primary">{apr.activity}</p>
                      <p className="mt-1 flex items-center gap-1 text-text-secondary">
                        <MapPin className="h-3 w-3" />
                        {apr.location}
                      </p>
                    </td>
                    <td className="px-4 py-4">
                      <p className="font-semibold text-text-primary">{apr.technician}</p>
                      <p className="mt-1 text-text-secondary">{apr.team}</p>
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex rounded border px-2 py-1 font-bold ${riskStyles[apr.maximumRisk]}`}
                      >
                        {apr.maximumRisk}
                      </span>
                      <p className="mt-1 text-[11px] text-text-secondary">
                        Residual: {apr.residualRisk}
                      </p>
                    </td>
                    <td className="px-4 py-4 text-text-primary">
                      {new Date(apr.plannedStart).toLocaleString("pt-BR", {
                        day: "2-digit",
                        month: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="px-4 py-4">
                      <StatusBadge status={apr.status} />
                      {apr.authorizedBy && (
                        <p className="mt-2 max-w-[190px] text-[10px] leading-4 text-text-secondary">
                          {apr.authorizedBy}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-4 text-right">
                      {apr.status === "PENDING_AUTHORIZATION" ? (
                        <button
                          disabled={!canAuthorize}
                          onClick={() => openDecision(apr)}
                          className="inline-flex items-center gap-1.5 rounded-md bg-nexus-blue-600 px-3 py-2 font-bold text-white hover:bg-nexus-blue-700 disabled:cursor-not-allowed disabled:opacity-45"
                        >
                          <FileSignature className="h-3.5 w-3.5" />
                          Revisar e decidir
                        </button>
                      ) : (
                        <span className="text-text-secondary">
                          Decisão registrada
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      {selectedApr && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="apr-decision-title"
            className="w-full max-w-xl rounded-xl bg-surface-card p-6 shadow-overlay"
          >
            <div className="flex items-start justify-between gap-4 border-b pb-4">
              <div>
                <h2 id="apr-decision-title" className="text-lg font-bold text-text-primary">
                  Autorizar início da atividade
                </h2>
                <p className="mt-1 text-xs text-text-secondary">
                  {selectedApr.id} · {selectedApr.serviceOrder}
                </p>
              </div>
              <button
                onClick={() => setSelectedApr(null)}
                className="rounded-md p-2 text-text-secondary hover:bg-surface-muted"
                aria-label="Fechar"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="my-4 grid grid-cols-2 gap-3 text-xs">
              <div className="rounded-lg bg-surface-subtle p-3">
                <p className="text-text-secondary">Risco inicial</p>
                <p className="mt-1 font-bold text-red-700">{selectedApr.maximumRisk}</p>
              </div>
              <div className="rounded-lg bg-surface-subtle p-3">
                <p className="text-text-secondary">Risco após controles</p>
                <p className="mt-1 font-bold text-amber-700">{selectedApr.residualRisk}</p>
              </div>
            </div>

            <label className="block text-xs font-bold text-text-primary">
              Parecer do supervisor
              <textarea
                rows={4}
                value={decisionNotes}
                onChange={(event) => setDecisionNotes(event.target.value)}
                className="mt-2 w-full rounded-lg border bg-surface-page p-3 font-normal leading-5 focus:outline-none focus:ring-2 focus:ring-nexus-blue-600"
                placeholder="Registre a conferência dos controles ou o motivo da rejeição."
              />
            </label>

            <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-lg border bg-surface-subtle p-3 text-xs text-text-primary">
              <input
                type="checkbox"
                checked={signatureConfirmed}
                onChange={(event) => setSignatureConfirmed(event.target.checked)}
                className="mt-0.5 h-4 w-4"
              />
              <span>
                <b>Assinar decisão como {activeUser}.</b>
                <span className="mt-1 block text-text-secondary">
                  O sistema registrará identidade, data, hora e conteúdo do parecer.
                </span>
              </span>
            </label>

            <div className="mt-5 flex flex-wrap justify-end gap-2 border-t pt-4">
              <button
                onClick={() => decide("REJECTED")}
                disabled={!signatureConfirmed || decisionNotes.trim().length < 3}
                className="inline-flex items-center gap-1.5 rounded-md border border-red-300 px-4 py-2 text-xs font-bold text-red-700 hover:bg-red-50 disabled:opacity-45"
              >
                <XCircle className="h-4 w-4" />
                Rejeitar e bloquear
              </button>
              <button
                onClick={() => decide("AUTHORIZED")}
                disabled={!signatureConfirmed || decisionNotes.trim().length < 3}
                className="inline-flex items-center gap-1.5 rounded-md bg-emerald-700 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-800 disabled:opacity-45"
              >
                <CheckCircle2 className="h-4 w-4" />
                Autorizar atividade
              </button>
            </div>
          </section>
        </div>
      )}
    </>
  );
}

function StatusBadge({ status }: { status: AprStatus }) {
  const config = {
    PENDING_AUTHORIZATION: {
      icon: <Clock3 className="h-3.5 w-3.5" />,
      className: "bg-amber-50 text-amber-800 border-amber-200",
    },
    AUTHORIZED: {
      icon: <CheckCircle2 className="h-3.5 w-3.5" />,
      className: "bg-emerald-50 text-emerald-800 border-emerald-200",
    },
    REJECTED: {
      icon: <AlertTriangle className="h-3.5 w-3.5" />,
      className: "bg-red-50 text-red-800 border-red-200",
    },
  }[status];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-bold ${config.className}`}
    >
      {config.icon}
      {statusLabels[status]}
    </span>
  );
}
