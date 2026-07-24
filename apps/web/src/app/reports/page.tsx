"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  FileText,
  ShieldCheck,
} from "lucide-react";

import { AppHeader } from "@/components/nexus/app-header";

const teamData = [
  { name: "Equipe Alfa", compliance: 96.3, inspections: 57, nonconformities: 29 },
  { name: "Equipe Beta", compliance: 92.7, inspections: 50, nonconformities: 33 },
  { name: "Equipe Gama", compliance: 92.0, inspections: 29, nonconformities: 25 },
];

const fleetData = [
  { name: "Caminhonete 12", plate: "ABC1D23", compliance: 96.3, inspections: 57 },
  { name: "Caminhonete 08", plate: "DEF4G56", compliance: 92.7, inspections: 50 },
  { name: "Van 04", plate: "GHI7J89", compliance: 92.0, inspections: 29 },
];

export default function ReportsPage() {
  const [startDate, setStartDate] = useState("2026-07-20");
  const [endDate, setEndDate] = useState("2026-07-23");
  const [scope, setScope] = useState<"ALL" | "TEAMS" | "FLEET">("ALL");

  const visibleTeams = scope === "FLEET" ? [] : teamData;
  const visibleFleet = scope === "TEAMS" ? [] : fleetData;
  const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";
  const query = useMemo(
    () =>
      new URLSearchParams({
        start_date: startDate,
        end_date: endDate,
      }).toString(),
    [startDate, endDate]
  );

  const exportReport = (format: "xlsx" | "pdf") => {
    window.open(`${apiBase}/reports/operational.${format}?${query}`, "_blank");
  };

  return (
    <>
      <AppHeader
        pageTitle="Relatórios operacionais"
        breadcrumb={["Gestão", "Relatórios"]}
      />
      <main className="space-y-5 p-6">
        <section className="flex flex-col gap-4 border-b pb-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-6 w-6 text-nexus-blue-600" />
              <h1 className="text-xl font-bold text-text-primary">
                Conformidade por equipe e frota
              </h1>
            </div>
            <p className="mt-2 text-sm leading-6 text-text-secondary">
              Acompanhe volume de inspeções, aderência aos checklists e tratamento
              das não conformidades no período.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => exportReport("xlsx")}
              className="inline-flex items-center gap-2 rounded-md border border-emerald-300 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-800 hover:bg-emerald-100"
            >
              <FileSpreadsheet className="h-4 w-4" />
              Exportar Excel
              <Download className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => exportReport("pdf")}
              className="inline-flex items-center gap-2 rounded-md bg-nexus-blue-600 px-3 py-2 text-xs font-bold text-white hover:bg-nexus-blue-700"
            >
              <FileText className="h-4 w-4" />
              Exportar PDF
              <Download className="h-3.5 w-3.5" />
            </button>
          </div>
        </section>

        <section className="flex flex-wrap items-end gap-3 rounded-xl border bg-surface-card p-4">
          <label className="text-xs font-semibold text-text-secondary">
            Data inicial
            <input
              type="date"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
              className="mt-1 block rounded-md border bg-surface-page px-3 py-2 text-text-primary focus:outline-none focus:ring-2 focus:ring-nexus-blue-600"
            />
          </label>
          <label className="text-xs font-semibold text-text-secondary">
            Data final
            <input
              type="date"
              value={endDate}
              onChange={(event) => setEndDate(event.target.value)}
              className="mt-1 block rounded-md border bg-surface-page px-3 py-2 text-text-primary focus:outline-none focus:ring-2 focus:ring-nexus-blue-600"
            />
          </label>
          <label className="text-xs font-semibold text-text-secondary">
            Visão
            <select
              value={scope}
              onChange={(event) =>
                setScope(event.target.value as "ALL" | "TEAMS" | "FLEET")
              }
              className="mt-1 block min-w-48 rounded-md border bg-surface-page px-3 py-2 text-text-primary focus:outline-none focus:ring-2 focus:ring-nexus-blue-600"
            >
              <option value="ALL">Equipes e frota</option>
              <option value="TEAMS">Somente equipes</option>
              <option value="FLEET">Somente frota</option>
            </select>
          </label>
          <p className="ml-auto text-xs text-text-secondary">
            Período aplicado também às exportações
          </p>
        </section>

        <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <Metric
            label="Inspeções concluídas"
            value="136"
            detail="8 registros operacionais consolidados"
            icon={<CheckCircle2 className="h-5 w-5 text-emerald-700" />}
          />
          <Metric
            label="Conformidade geral"
            value="93,8%"
            detail="+1,6 p.p. contra o período anterior"
            icon={<ShieldCheck className="h-5 w-5 text-nexus-blue-600" />}
          />
          <Metric
            label="Não conformidades"
            value="87"
            detail="58 resolvidas no período"
            icon={<AlertTriangle className="h-5 w-5 text-amber-700" />}
          />
          <Metric
            label="NCs críticas"
            value="6"
            detail="Todas com responsável atribuído"
            icon={<AlertTriangle className="h-5 w-5 text-red-700" />}
          />
        </section>

        <section className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
          {visibleTeams.length > 0 && (
            <div className="rounded-xl border bg-surface-card">
              <div className="border-b px-5 py-4">
                <h2 className="text-sm font-bold text-text-primary">
                  Conformidade por equipe
                </h2>
                <p className="mt-1 text-xs text-text-secondary">
                  Percentual de itens conformes sobre os itens inspecionados.
                </p>
              </div>
              <div className="space-y-5 p-5">
                {visibleTeams.map((team) => (
                  <div key={team.name}>
                    <div className="mb-2 flex items-end justify-between gap-3">
                      <div>
                        <p className="text-sm font-bold text-text-primary">{team.name}</p>
                        <p className="text-[11px] text-text-secondary">
                          {team.inspections} inspeções · {team.nonconformities} NCs
                        </p>
                      </div>
                      <p className="text-lg font-bold text-nexus-blue-700">
                        {team.compliance.toLocaleString("pt-BR")}%
                      </p>
                    </div>
                    <div
                      className="h-3 overflow-hidden rounded-full bg-surface-muted"
                      role="img"
                      aria-label={`${team.name}: ${team.compliance}% de conformidade`}
                    >
                      <div
                        className="h-full rounded-full bg-nexus-blue-600"
                        style={{ width: `${team.compliance}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {visibleFleet.length > 0 && (
            <div className="overflow-hidden rounded-xl border bg-surface-card">
              <div className="border-b px-5 py-4">
                <h2 className="text-sm font-bold text-text-primary">
                  Desempenho da frota
                </h2>
                <p className="mt-1 text-xs text-text-secondary">
                  Comparativo dos veículos com inspeções no período.
                </p>
              </div>
              <table className="w-full text-left text-xs">
                <thead className="border-b bg-surface-subtle text-text-secondary">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Veículo</th>
                    <th className="px-4 py-3 text-center font-semibold">Inspeções</th>
                    <th className="px-4 py-3 text-right font-semibold">Conformidade</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {visibleFleet.map((vehicle) => (
                    <tr key={vehicle.plate}>
                      <td className="px-4 py-4">
                        <p className="font-bold text-text-primary">{vehicle.name}</p>
                        <p className="mt-1 font-mono text-[10px] text-text-secondary">
                          {vehicle.plate}
                        </p>
                      </td>
                      <td className="px-4 py-4 text-center font-semibold text-text-primary">
                        {vehicle.inspections}
                      </td>
                      <td className="px-4 py-4 text-right">
                        <span className="rounded bg-emerald-50 px-2 py-1 font-bold text-emerald-800">
                          {vehicle.compliance.toLocaleString("pt-BR")}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </>
  );
}

function Metric({
  label,
  value,
  detail,
  icon,
}: {
  label: string;
  value: string;
  detail: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border bg-surface-card p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold text-text-secondary">{label}</p>
        {icon}
      </div>
      <p className="mt-3 text-2xl font-bold text-text-primary">{value}</p>
      <p className="mt-1 text-[11px] text-text-secondary">{detail}</p>
    </div>
  );
}
