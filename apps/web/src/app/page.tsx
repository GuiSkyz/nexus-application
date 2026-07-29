"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardCheck,
  RefreshCw,
  ShieldAlert,
  Truck,
  Users,
} from "lucide-react";

import { AppHeader } from "@/components/nexus/app-header";
import { ApiClient } from "@/lib/apiClient";
import { StrategicDashboard } from "@/types/dashboard";

export default function DashboardPage() {
  const [data, setData] = useState<StrategicDashboard | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setData(await ApiClient.fetchStrategicDashboard());
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Não foi possível carregar o dashboard.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const maxActivity = useMemo(
    () => Math.max(1, ...(data?.activity.map((item) => item.inspections) ?? [1])),
    [data],
  );

  return (
    <>
      <AppHeader pageTitle="Visão geral da operação" breadcrumb={["Dashboard"]} />
      <main className="space-y-6 p-6">
        <section className="flex flex-col gap-3 border-b pb-5 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-xl font-bold text-text-primary">Dashboard estratégico</h1>
            <p className="mt-1 max-w-3xl text-sm leading-6 text-text-secondary">
              Indicadores consolidados de execução, conformidade, risco, equipes e frota.
            </p>
          </div>
          <button
            onClick={() => void load()}
            disabled={loading}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md border bg-white px-4 text-xs font-bold text-text-primary hover:bg-surface-subtle disabled:opacity-60"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Atualizar visão
          </button>
        </section>

        {error && (
          <div role="alert" className="rounded-lg bg-danger-soft px-4 py-3 text-sm font-semibold text-danger-foreground">
            {error}
          </div>
        )}

        {loading && !data ? (
          <DashboardSkeleton />
        ) : data ? (
          <>
            <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <Metric label="Inspeções em 30 dias" value={data.overview.inspectionsPeriod} detail={`${data.overview.inspectionsToday} realizadas hoje`} icon={<ClipboardCheck />} />
              <Metric label="Conformidade geral" value={`${data.overview.complianceRate.toLocaleString("pt-BR")}%`} detail={`${data.overview.resolutionRate.toLocaleString("pt-BR")}% das NCs resolvidas`} icon={<CheckCircle2 />} />
              <Metric label="Riscos em atenção" value={data.overview.openIncidents + data.overview.pendingAprs} detail={`${data.overview.criticalIncidents} críticas · ${data.overview.pendingAprs} APRs pendentes`} icon={<ShieldAlert />} tone="danger" />
              <Metric label="Capacidade operacional" value={data.overview.activeTechnicians} detail={`${data.overview.activeVehicles} veículos disponíveis`} icon={<Users />} />
            </section>

            <section className="grid gap-5 xl:grid-cols-[1.35fr_0.65fr]">
              <div className="rounded-xl border bg-surface-card">
                <div className="flex items-center justify-between border-b px-5 py-4">
                  <div>
                    <h2 className="text-sm font-bold text-text-primary">Ritmo de inspeções</h2>
                    <p className="mt-1 text-xs text-text-secondary">Últimos sete dias sincronizados.</p>
                  </div>
                  <span className="text-xs font-semibold text-text-secondary">Total diário</span>
                </div>
                <div className="flex h-64 items-end gap-3 px-5 pb-5 pt-8">
                  {data.activity.map((item) => (
                    <div key={item.date} className="flex h-full min-w-0 flex-1 flex-col justify-end">
                      <span className="mb-2 text-center text-xs font-bold text-text-primary">{item.inspections}</span>
                      <div
                        className="min-h-1 rounded-t-md bg-nexus-blue-600 transition-[height] duration-200"
                        style={{ height: `${Math.max(3, (item.inspections / maxActivity) * 100)}%` }}
                        aria-label={`${item.inspections} inspeções em ${item.date}`}
                      />
                      <span className="mt-2 truncate text-center text-[10px] text-text-secondary">
                        {new Date(`${item.date}T12:00:00`).toLocaleDateString("pt-BR", { weekday: "short" })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-xl bg-nexus-navy-900 p-5 text-white">
                <h2 className="text-sm font-bold">Capacidade e bloqueios</h2>
                <p className="mt-1 text-xs text-slate-300">Situação operacional neste momento.</p>
                <dl className="mt-6 space-y-4">
                  <Capacity label="Veículos disponíveis" value={data.overview.activeVehicles} icon={<Truck />} />
                  <Capacity label="Veículos indisponíveis" value={data.overview.unavailableVehicles} icon={<AlertTriangle />} warning />
                  <Capacity label="Planos vencidos" value={data.overview.overdueActions} icon={<ShieldAlert />} warning />
                </dl>
              </div>
            </section>

            <section className="overflow-hidden rounded-xl border bg-surface-card">
              <div className="border-b px-5 py-4">
                <h2 className="text-sm font-bold text-text-primary">Prioridades da gestão</h2>
                <p className="mt-1 text-xs text-text-secondary">Não conformidades abertas ordenadas por criticidade.</p>
              </div>
              {data.attention.length ? (
                <div className="divide-y">
                  {data.attention.map((item) => (
                    <a key={item.id} href="/incidents" className="grid gap-2 px-5 py-4 hover:bg-surface-subtle md:grid-cols-[110px_1fr_180px_140px] md:items-center">
                      <span className="font-mono text-xs font-bold text-nexus-blue-700">{item.id}</span>
                      <span className="text-sm font-semibold text-text-primary">{item.title}</span>
                      <span className="text-xs text-text-secondary">{item.owner} · {item.team}</span>
                      <span className={`justify-self-start rounded px-2 py-1 text-[10px] font-bold ${item.severity.includes("CR") ? "bg-danger-soft text-danger-foreground" : "bg-warning-soft text-warning-foreground"}`}>{item.severity}</span>
                    </a>
                  ))}
                </div>
              ) : (
                <p className="px-5 py-10 text-center text-sm text-text-secondary">Nenhuma prioridade aberta. A operação está sem NCs pendentes.</p>
              )}
            </section>
          </>
        ) : null}
      </main>
    </>
  );
}

function Metric({ label, value, detail, icon, tone = "default" }: { label: string; value: string | number; detail: string; icon: React.ReactNode; tone?: "default" | "danger" }) {
  return (
    <div className={`rounded-xl p-4 ${tone === "danger" ? "bg-danger-soft" : "border bg-surface-card"}`}>
      <div className="flex items-center justify-between gap-3">
        <p className={`text-xs font-semibold ${tone === "danger" ? "text-danger-foreground" : "text-text-secondary"}`}>{label}</p>
        <span className={tone === "danger" ? "text-danger-foreground" : "text-nexus-blue-600"}>{icon}</span>
      </div>
      <p className="mt-3 text-2xl font-bold text-text-primary">{value}</p>
      <p className="mt-1 text-[11px] text-text-secondary">{detail}</p>
    </div>
  );
}

function Capacity({ label, value, icon, warning = false }: { label: string; value: number; icon: React.ReactNode; warning?: boolean }) {
  return (
    <div className="flex items-center justify-between border-b border-white/10 pb-4 last:border-0">
      <dt className="flex items-center gap-2 text-xs text-slate-300"><span className={warning ? "text-amber-300" : "text-nexus-cyan-500"}>{icon}</span>{label}</dt>
      <dd className="text-xl font-bold">{value}</dd>
    </div>
  );
}

function DashboardSkeleton() {
  return <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 4 }).map((_, index) => <div key={index} className="skeleton h-32" />)}</div>;
}
