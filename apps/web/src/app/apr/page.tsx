"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, Clock, Eye, ShieldCheck, Trash2, XCircle } from "lucide-react";

import { AppHeader } from "@/components/nexus/app-header";
import { useRole } from "@/components/nexus/role-selector";
import { ApiClient } from "@/lib/apiClient";
import { AprRecord, AprStatus, RiskLevel } from "@/types/apr";

export default function AprPage() {
  const { activeUser } = useRole();
  const [aprs, setAprs] = useState<AprRecord[]>([]);
  const [selected, setSelected] = useState<AprRecord | null>(null);
  const [decision, setDecision] = useState<"authorize" | "reject" | null>(null);
  const [notes, setNotes] = useState("");
  const [filter, setFilter] = useState<AprStatus | "ALL">("ALL");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      setAprs(await ApiClient.fetchAprs());
      setError("");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Falha ao carregar APRs.");
    }
  }, []);

  useEffect(() => { void load(); }, [load]);
  const visible = useMemo(() => filter === "ALL" ? aprs : aprs.filter((item) => item.status === filter), [aprs, filter]);

  const submitDecision = async (event: FormEvent) => {
    event.preventDefault();
    if (!selected || !decision) return;
    try {
      await ApiClient.decideApr(selected.id, decision, activeUser, notes);
      setDecision(null);
      setSelected(null);
      setNotes("");
      await load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "A decisão não foi aplicada.");
    }
  };

  return (
    <>
      <AppHeader pageTitle="APR" breadcrumb={["Operacional", "Análise Preliminar de Risco"]} />
      <main className="space-y-5 p-6">
        <section className="border-b pb-5"><h1 className="text-xl font-bold text-text-primary">Autorizações de atividade</h1><p className="mt-1 text-sm text-text-secondary">Avalie riscos residuais antes de liberar o início do serviço.</p></section>
        {error && <div role="alert" className="rounded-lg bg-danger-soft px-4 py-3 text-sm font-semibold text-danger-foreground">{error}</div>}
        <section className="grid gap-3 md:grid-cols-4">
          <Summary label="Pendentes" value={aprs.filter((item) => item.status === "PENDING_AUTHORIZATION").length} icon={<Clock />} />
          <Summary label="Autorizadas" value={aprs.filter((item) => item.status === "AUTHORIZED").length} icon={<CheckCircle2 />} />
          <Summary label="Rejeitadas" value={aprs.filter((item) => item.status === "REJECTED").length} icon={<XCircle />} />
          <Summary label="Risco alto/crítico" value={aprs.filter((item) => ["ALTO", "CRITICO"].includes(item.maximumResidualRiskLevel)).length} icon={<AlertTriangle />} danger />
        </section>
        <div className="flex flex-wrap gap-1 rounded-xl border bg-white p-3">
          {(["ALL", "PENDING_AUTHORIZATION", "AUTHORIZED", "REJECTED"] as const).map((value) => <button key={value} onClick={() => setFilter(value)} className={`rounded-md px-3 py-2 text-xs font-bold ${filter === value ? "bg-nexus-navy-900 text-white" : "text-text-secondary hover:bg-surface-muted"}`}>{statusLabel(value)}</button>)}
        </div>
        <section className="overflow-hidden rounded-xl border bg-white">
          {visible.length ? <div className="divide-y">{visible.map((apr) => (
            <article key={apr.id} className="grid gap-3 px-5 py-4 xl:grid-cols-[150px_1fr_180px_150px_auto] xl:items-center">
              <div><p className="font-mono text-xs font-bold text-nexus-blue-700">{apr.serviceOrderNumber}</p><p className="mt-1 text-[10px] text-text-secondary">{new Date(apr.plannedStart).toLocaleString("pt-BR")}</p></div>
              <div><h2 className="text-sm font-bold text-text-primary">{apr.activityType.replaceAll("_", " ")} · {apr.location}</h2><p className="mt-1 text-xs text-text-secondary">{apr.technicianName} · {apr.teamName}</p></div>
              <div><p className="text-xs font-semibold text-text-secondary">Risco residual</p><RiskBadge level={apr.maximumResidualRiskLevel} /></div>
              <StatusBadge status={apr.status} />
              <div className="flex justify-end gap-1"><button onClick={() => setSelected(apr)} title="Visualizar" className="rounded p-2 text-text-secondary hover:bg-surface-muted"><Eye className="h-4 w-4" /></button>{apr.status !== "AUTHORIZED" && <button onClick={() => window.confirm("Excluir esta APR?") && void ApiClient.deleteApr(apr.id).then(load)} title="Excluir" className="rounded p-2 text-text-secondary hover:bg-danger-soft hover:text-danger-foreground"><Trash2 className="h-4 w-4" /></button>}</div>
            </article>
          ))}</div> : <p className="py-16 text-center text-sm text-text-secondary">Nenhuma APR neste filtro.</p>}
        </section>
      </main>

      {selected && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"><div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-xl bg-white p-6 shadow-overlay">
        <div className="flex items-start justify-between"><div><h2 className="text-lg font-bold">{selected.serviceOrderNumber} · {selected.activityType}</h2><p className="mt-1 text-sm text-text-secondary">{selected.location}</p></div><button onClick={() => { setSelected(null); setDecision(null); }} className="rounded p-2 text-text-secondary">Fechar</button></div>
        <dl className="mt-5 grid gap-3 rounded-lg bg-surface-subtle p-4 md:grid-cols-3"><Info label="Técnico" value={selected.technicianName} /><Info label="Equipe" value={selected.teamName} /><Info label="Contato de emergência" value={selected.emergencyContact} /><Info label="Condição climática" value={selected.weatherConditions} /><Info label="EPIs" value={selected.requiredPpe.join(", ")} /><Info label="Início previsto" value={new Date(selected.plannedStart).toLocaleString("pt-BR")} /></dl>
        <h3 className="mt-6 text-sm font-bold">Matriz de riscos</h3>
        <div className="mt-2 divide-y rounded-lg border">{selected.risks.map((risk, index) => <div key={`${risk.hazard}-${index}`} className="grid gap-3 p-4 md:grid-cols-[1fr_120px_120px]"><div><p className="text-sm font-bold">{risk.hazard}</p><p className="mt-1 text-xs text-text-secondary">Controles: {risk.controls.join(", ")}</p></div><div><p className="text-[10px] font-semibold text-text-secondary">INICIAL</p><RiskBadge level={risk.level} /></div><div><p className="text-[10px] font-semibold text-text-secondary">RESIDUAL</p><RiskBadge level={risk.residualLevel} /></div></div>)}</div>
        {selected.status === "PENDING_AUTHORIZATION" && !decision && <div className="mt-6 flex justify-end gap-2"><button onClick={() => setDecision("reject")} className="rounded-md border border-red-300 px-4 py-2 text-xs font-bold text-red-700">Rejeitar</button><button onClick={() => setDecision("authorize")} className="rounded-md bg-nexus-blue-600 px-4 py-2 text-xs font-bold text-white">Autorizar atividade</button></div>}
        {decision && <form onSubmit={submitDecision} className="mt-6 space-y-3 rounded-lg bg-surface-subtle p-4"><label className="text-xs font-semibold text-text-secondary">Justificativa da decisão<textarea required minLength={3} rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} className="mt-1 w-full rounded-md border bg-white p-3 text-sm" /></label><div className="flex justify-end gap-2"><button type="button" onClick={() => setDecision(null)} className="rounded-md border px-4 py-2 text-xs font-bold">Cancelar</button><button className={`rounded-md px-4 py-2 text-xs font-bold text-white ${decision === "authorize" ? "bg-nexus-blue-600" : "bg-red-600"}`}>Confirmar {decision === "authorize" ? "autorização" : "rejeição"}</button></div></form>}
      </div></div>}
    </>
  );
}

function statusLabel(status: AprStatus | "ALL") { return ({ ALL: "Todas", PENDING_AUTHORIZATION: "Pendentes", AUTHORIZED: "Autorizadas", REJECTED: "Rejeitadas", DRAFT: "Rascunhos", CANCELLED: "Canceladas" })[status]; }
function Summary({ label, value, icon, danger }: { label: string; value: number; icon: React.ReactNode; danger?: boolean }) { return <div className={`rounded-xl p-4 ${danger ? "bg-danger-soft" : "border bg-white"}`}><div className="flex items-center justify-between text-text-secondary"><p className="text-xs font-semibold">{label}</p>{icon}</div><p className="mt-3 text-2xl font-bold text-text-primary">{value}</p></div>; }
function RiskBadge({ level }: { level: RiskLevel }) { const classes = level === "CRITICO" ? "bg-danger-soft text-danger-foreground" : level === "ALTO" ? "bg-warning-soft text-warning-foreground" : level === "MEDIO" ? "bg-info-soft text-info-foreground" : "bg-success-soft text-success-foreground"; return <span className={`mt-1 inline-block rounded px-2 py-1 text-[10px] font-bold ${classes}`}>{level}</span>; }
function StatusBadge({ status }: { status: AprStatus }) { const label = statusLabel(status); return <span className="justify-self-start rounded bg-surface-muted px-2 py-1 text-[10px] font-bold text-text-secondary">{label}</span>; }
function Info({ label, value }: { label: string; value: string }) { return <div><dt className="text-[10px] font-semibold text-text-secondary">{label}</dt><dd className="mt-1 text-xs font-bold text-text-primary">{value}</dd></div>; }
