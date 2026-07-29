"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, BarChart3, CheckCircle2, Download, FileSpreadsheet, FileText, RefreshCw } from "lucide-react";

import { AppHeader } from "@/components/nexus/app-header";
import { API_BASE_URL, ApiClient } from "@/lib/apiClient";
import { OperationalReport } from "@/types/report";

const today = new Date().toISOString().slice(0, 10);
const thirtyDaysAgo = new Date(Date.now() - 29 * 86400000).toISOString().slice(0, 10);

export default function ReportsPage() {
  const [startDate, setStartDate] = useState(thirtyDaysAgo);
  const [endDate, setEndDate] = useState(today);
  const [scope, setScope] = useState<"ALL" | "TEAMS" | "FLEET">("ALL");
  const [report, setReport] = useState<OperationalReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setReport(await ApiClient.fetchOperationalReport(startDate, endDate));
      setError("");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Falha ao gerar relatório.");
    } finally {
      setLoading(false);
    }
  }, [endDate, startDate]);

  useEffect(() => { void load(); }, [load]);

  const exportReport = (format: "xlsx" | "pdf") => {
    const query = new URLSearchParams({ start_date: startDate, end_date: endDate });
    window.open(`${API_BASE_URL}/reports/operational.${format}?${query}`, "_blank", "noopener,noreferrer");
  };

  return (
    <>
      <AppHeader pageTitle="Relatórios" breadcrumb={["Gestão", "Relatórios"]} />
      <main className="space-y-5 p-6">
        <section className="flex flex-col gap-4 border-b pb-5 lg:flex-row lg:items-end lg:justify-between">
          <div><div className="flex items-center gap-2"><BarChart3 className="h-6 w-6 text-nexus-blue-600" /><h1 className="text-xl font-bold text-text-primary">Conformidade por equipe e frota</h1></div><p className="mt-2 text-sm text-text-secondary">Dados consolidados diretamente das inspeções e não conformidades registradas.</p></div>
          <div className="flex gap-2"><button onClick={() => exportReport("xlsx")} className="inline-flex h-10 items-center gap-2 rounded-md border border-emerald-300 bg-emerald-50 px-3 text-xs font-bold text-emerald-800"><FileSpreadsheet className="h-4 w-4" /> Excel <Download className="h-3.5 w-3.5" /></button><button onClick={() => exportReport("pdf")} className="inline-flex h-10 items-center gap-2 rounded-md bg-nexus-blue-600 px-3 text-xs font-bold text-white"><FileText className="h-4 w-4" /> PDF <Download className="h-3.5 w-3.5" /></button></div>
        </section>
        {error && <div role="alert" className="rounded-lg bg-danger-soft px-4 py-3 text-sm font-semibold text-danger-foreground">{error}</div>}
        <section className="flex flex-wrap items-end gap-3 rounded-xl border bg-white p-4">
          <Field label="Data inicial"><input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} /></Field>
          <Field label="Data final"><input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} /></Field>
          <Field label="Visão"><select value={scope} onChange={(e) => setScope(e.target.value as typeof scope)}><option value="ALL">Equipes e frota</option><option value="TEAMS">Somente equipes</option><option value="FLEET">Somente frota</option></select></Field>
          <button onClick={() => void load()} disabled={loading} className="ml-auto inline-flex h-10 items-center gap-2 rounded-md border px-4 text-xs font-bold disabled:opacity-60"><RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Atualizar</button>
        </section>
        {loading && !report ? <div className="skeleton h-80" /> : report ? <>
          <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            <Metric label="Inspeções" value={report.overall.inspections} icon={<CheckCircle2 />} />
            <Metric label="Conformidade" value={`${report.overall.complianceRate.toLocaleString("pt-BR")}%`} icon={<CheckCircle2 />} />
            <Metric label="Não conformidades" value={report.overall.nonconformities} icon={<AlertTriangle />} />
            <Metric label="NCs críticas" value={report.overall.criticalNonconformities} icon={<AlertTriangle />} danger />
            <Metric label="Taxa de resolução" value={`${report.overall.resolutionRate.toLocaleString("pt-BR")}%`} icon={<CheckCircle2 />} />
          </section>
          <section className="grid gap-5 xl:grid-cols-2">
            {scope !== "FLEET" && <ReportTable title="Desempenho por equipe" rows={report.teams} empty="Nenhuma inspeção de equipe no período." />}
            {scope !== "TEAMS" && <ReportTable title="Desempenho da frota" rows={report.fleet} empty="Nenhuma inspeção de veículo no período." />}
          </section>
        </> : null}
      </main>
    </>
  );
}

function ReportTable({ title, rows, empty }: { title: string; rows: OperationalReport["teams"]; empty: string }) {
  return <div className="overflow-hidden rounded-xl border bg-white"><div className="border-b px-5 py-4"><h2 className="text-sm font-bold">{title}</h2></div>{rows.length ? <table className="w-full text-left text-xs"><thead className="bg-surface-subtle text-text-secondary"><tr><th className="px-4 py-3">Nome</th><th className="px-4 py-3 text-center">Inspeções</th><th className="px-4 py-3 text-center">NCs</th><th className="px-4 py-3 text-right">Conformidade</th></tr></thead><tbody className="divide-y">{rows.map((row) => <tr key={row.name}><td className="px-4 py-4 font-bold text-text-primary">{row.name}</td><td className="px-4 py-4 text-center">{row.inspections}</td><td className="px-4 py-4 text-center">{row.nonconformities}</td><td className="px-4 py-4 text-right font-bold text-nexus-blue-700">{row.complianceRate.toLocaleString("pt-BR")}%</td></tr>)}</tbody></table> : <p className="px-5 py-12 text-center text-sm text-text-secondary">{empty}</p>}</div>;
}
function Field({ label, children }: { label: string; children: React.ReactElement }) { return <label className="text-xs font-semibold text-text-secondary">{label}<span className="[&>*]:mt-1 [&>*]:h-10 [&>*]:rounded-md [&>*]:border [&>*]:bg-white [&>*]:px-3">{children}</span></label>; }
function Metric({ label, value, icon, danger }: { label: string; value: number | string; icon: React.ReactNode; danger?: boolean }) { return <div className={`rounded-xl p-4 ${danger ? "bg-danger-soft" : "border bg-white"}`}><div className="flex justify-between text-text-secondary"><p className="text-xs font-semibold">{label}</p>{icon}</div><p className="mt-3 text-2xl font-bold">{value}</p></div>; }
