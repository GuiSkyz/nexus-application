"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, Edit, Plus, Search, Trash2, Wrench } from "lucide-react";

import { AppHeader } from "@/components/nexus/app-header";
import { useRole } from "@/components/nexus/role-selector";
import { ApiClient } from "@/lib/apiClient";
import { Incident } from "@/types/incident";
import { Technician } from "@/types/technician";

const emptyIncident: Partial<Incident> = {
  inspectionTitle: "Registro manual",
  contextType: "ACTIVITY",
  technicianId: "",
  questionText: "",
  category: "OPERACIONAL",
  severity: "MEDIA",
  status: "ABERTA",
  description: "",
};

export default function IncidentsPage() {
  const { activeRole } = useRole();
  const isTechnician = activeRole === "TECNICO";
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [severityFilter, setSeverityFilter] = useState("ALL");
  const [editing, setEditing] = useState<Partial<Incident> | null>(null);
  const [planIncident, setPlanIncident] = useState<Incident | null>(null);
  const [plan, setPlan] = useState({ description: "", assignedTo: "", dueDate: "" });
  const [feedback, setFeedback] = useState("");

  const load = useCallback(async () => {
    try {
      const [records, registeredTechnicians] = await Promise.all([
        ApiClient.fetchIncidents(),
        ApiClient.fetchTechnicians(),
      ]);
      setIncidents(records);
      setTechnicians(registeredTechnicians.filter((technician) => technician.isActive));
      setFeedback("");
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Falha ao carregar não conformidades.");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const visible = useMemo(
    () =>
      incidents.filter((incident) => {
        if (statusFilter !== "ALL" && incident.status !== statusFilter) return false;
        if (severityFilter !== "ALL" && incident.severity !== severityFilter) return false;
        const search = query.toLowerCase();
        return !search || `${incident.id} ${incident.questionText} ${incident.technicianName} ${incident.teamName}`.toLowerCase().includes(search);
      }),
    [incidents, query, severityFilter, statusFilter],
  );

  const saveIncident = async (event: FormEvent) => {
    event.preventDefault();
    try {
      await ApiClient.saveIncident(editing || {});
      setEditing(null);
      await load();
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Não foi possível salvar.");
    }
  };

  const savePlan = async (event: FormEvent) => {
    event.preventDefault();
    if (!planIncident) return;
    try {
      await ApiClient.createActionPlan(planIncident.id, { ...plan, createdBy: "Gestão Operacional" });
      setPlanIncident(null);
      setPlan({ description: "", assignedTo: "", dueDate: "" });
      await load();
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Não foi possível salvar o plano.");
    }
  };

  const selectedTechnician = technicians.find(
    (technician) => technician.id === editing?.technicianId,
  );

  return (
    <>
      <AppHeader pageTitle="Não conformidades" breadcrumb={["Operacional", "Não conformidades"]} />
      <main className="space-y-5 p-6">
        <section className="flex flex-col gap-4 border-b pb-5 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-xl font-bold text-text-primary">Tratamento de não conformidades</h1>
            <p className="mt-1 text-sm text-text-secondary">Registre desvios, atribua responsáveis e acompanhe a resolução.</p>
          </div>
          {!isTechnician && <button onClick={() => setEditing({ ...emptyIncident })} className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-nexus-blue-600 px-4 text-xs font-bold text-white hover:bg-nexus-blue-700">
            <Plus className="h-4 w-4" /> Registrar NC
          </button>}
        </section>

        {feedback && <div role="alert" className="rounded-lg bg-danger-soft px-4 py-3 text-sm font-semibold text-danger-foreground">{feedback}</div>}

        <section className="grid gap-3 md:grid-cols-4">
          <Summary label="Abertas" value={incidents.filter((item) => item.status === "ABERTA").length} />
          <Summary label="Em plano de ação" value={incidents.filter((item) => item.status === "PLANO_DE_ACAO").length} />
          <Summary label="Críticas" value={incidents.filter((item) => item.severity === "CRITICA").length} danger />
          <Summary label="Resolvidas" value={incidents.filter((item) => item.status === "RESOLVIDA").length} success />
        </section>

        <section className="flex flex-col gap-3 rounded-xl border bg-surface-card p-4 md:flex-row">
          <label className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-text-muted" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} className="h-10 w-full rounded-md border pl-9 pr-3 text-sm" placeholder="Buscar NC, técnico ou equipe" />
          </label>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="h-10 rounded-md border bg-white px-3 text-xs font-semibold">
            <option value="ALL">Todos os status</option><option value="ABERTA">Aberta</option><option value="EM_ANALISE">Em análise</option><option value="PLANO_DE_ACAO">Plano de ação</option><option value="RESOLVIDA">Resolvida</option>
          </select>
          <select value={severityFilter} onChange={(event) => setSeverityFilter(event.target.value)} className="h-10 rounded-md border bg-white px-3 text-xs font-semibold">
            <option value="ALL">Todas as severidades</option><option value="CRITICA">Crítica</option><option value="ALTA">Alta</option><option value="MEDIA">Média</option><option value="BAIXA">Baixa</option>
          </select>
        </section>

        <section className="overflow-hidden rounded-xl border bg-surface-card">
          {visible.length ? (
            <div className="divide-y">
              {visible.map((incident) => (
                <article key={incident.id} className="grid gap-3 px-5 py-4 xl:grid-cols-[120px_1fr_180px_150px_auto] xl:items-center">
                  <span className="font-mono text-xs font-bold text-nexus-blue-700">{incident.id}</span>
                  <div>
                    <h2 className="text-sm font-bold text-text-primary">{incident.questionText}</h2>
                    <p className="mt-1 text-xs text-text-secondary">{incident.technicianName} · {incident.teamName} · {incident.category}</p>
                  </div>
                  <div className="text-xs text-text-secondary">
                    {incident.actionPlan ? <>
                      <p className="font-semibold text-text-primary">{incident.actionPlan.description}</p>
                      <p className="mt-1">Responsável: {incident.actionPlan.assignedTo} · Prazo: {new Date(incident.actionPlan.dueDate).toLocaleString("pt-BR")}</p>
                    </> : "Sem plano atribuído"}
                  </div>
                  <div className="flex gap-2">
                    <Badge value={incident.severity} danger={incident.severity === "CRITICA"} />
                    <Badge value={incident.status.replaceAll("_", " ")} />
                  </div>
                  {!isTechnician && <div className="flex justify-end gap-1">
                    <button onClick={() => setEditing({ ...incident })} className="rounded p-2 text-text-secondary hover:bg-surface-muted" title="Editar"><Edit className="h-4 w-4" /></button>
                    {incident.status !== "RESOLVIDA" && <button onClick={() => setPlanIncident(incident)} className="rounded p-2 text-text-secondary hover:bg-warning-soft hover:text-warning-foreground" title="Plano de ação"><Wrench className="h-4 w-4" /></button>}
                    {incident.status === "EM_ANALISE" && <><button onClick={() => void ApiClient.resolveIncident(incident.id, { resolutionNotes: "Correção aprovada pela gestão." }).then(load)} className="rounded p-2 text-text-secondary hover:bg-success-soft hover:text-success-foreground" title="Aprovar correção"><CheckCircle2 className="h-4 w-4" /></button><button onClick={() => { const notes = window.prompt("Informe o ajuste necessário para o técnico."); if (notes?.trim()) void ApiClient.reopenIncident(incident.id, { resolutionNotes: notes.trim() }).then(load); }} className="rounded p-2 text-text-secondary hover:bg-danger-soft hover:text-danger-foreground" title="Devolver para ajuste"><AlertTriangle className="h-4 w-4" /></button></>}
                    <button onClick={() => window.confirm("Excluir esta não conformidade?") && void ApiClient.deleteIncident(incident.id).then(load)} className="rounded p-2 text-text-secondary hover:bg-danger-soft hover:text-danger-foreground" title="Excluir"><Trash2 className="h-4 w-4" /></button>
                  </div>}
                </article>
              ))}
            </div>
          ) : <div className="py-16 text-center text-sm text-text-secondary">Nenhuma não conformidade encontrada.</div>}
        </section>
      </main>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <form onSubmit={saveIncident} className="w-full max-w-2xl space-y-4 rounded-xl bg-white p-6 shadow-overlay">
            <h2 className="text-base font-bold text-text-primary">{editing.id ? "Editar não conformidade" : "Registrar não conformidade"}</h2>
            <div className="grid gap-3 md:grid-cols-2">
              <Field label="Técnico cadastrado"><select required value={editing.technicianId || ""} onChange={(e) => setEditing({ ...editing, technicianId: e.target.value })}><option value="">Selecione o técnico responsável</option>{technicians.map((technician) => <option key={technician.id} value={technician.id}>{technician.fullName} · {technician.employeeCode || "Sem matrícula"}</option>)}</select></Field>
              <Field label="Equipe"><input readOnly value={selectedTechnician?.teamName || editing.teamName || "Definida pelo cadastro"} className="bg-surface-muted text-text-secondary" /></Field>
              <Field label="Categoria"><input required value={editing.category || ""} onChange={(e) => setEditing({ ...editing, category: e.target.value })} /></Field>
              <Field label="Severidade"><select value={editing.severity} onChange={(e) => setEditing({ ...editing, severity: e.target.value as Incident["severity"] })}><option value="BAIXA">Baixa</option><option value="MEDIA">Média</option><option value="ALTA">Alta</option><option value="CRITICA">Crítica</option></select></Field>
            </div>
            <Field label="Desvio identificado"><input required value={editing.questionText || ""} onChange={(e) => setEditing({ ...editing, questionText: e.target.value })} /></Field>
            <Field label="Descrição"><textarea rows={3} value={editing.description || ""} onChange={(e) => setEditing({ ...editing, description: e.target.value })} /></Field>
            <div className="flex justify-end gap-2"><button type="button" onClick={() => setEditing(null)} className="rounded-md border px-4 py-2 text-xs font-bold">Cancelar</button><button className="rounded-md bg-nexus-blue-600 px-4 py-2 text-xs font-bold text-white">Salvar</button></div>
          </form>
        </div>
      )}

      {planIncident && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <form onSubmit={savePlan} className="w-full max-w-lg space-y-4 rounded-xl bg-white p-6 shadow-overlay">
            <h2 className="text-base font-bold">Plano de ação · {planIncident.id}</h2>
            <Field label="Ação corretiva"><textarea required rows={3} value={plan.description} onChange={(e) => setPlan({ ...plan, description: e.target.value })} /></Field>
            <Field label="Responsável"><input required value={plan.assignedTo} onChange={(e) => setPlan({ ...plan, assignedTo: e.target.value })} /></Field>
            <Field label="Prazo"><input required type="datetime-local" value={plan.dueDate} onChange={(e) => setPlan({ ...plan, dueDate: e.target.value })} /></Field>
            <div className="flex justify-end gap-2"><button type="button" onClick={() => setPlanIncident(null)} className="rounded-md border px-4 py-2 text-xs font-bold">Cancelar</button><button className="rounded-md bg-nexus-blue-600 px-4 py-2 text-xs font-bold text-white">Atribuir plano</button></div>
          </form>
        </div>
      )}
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactElement }) {
  return <label className="block text-xs font-semibold text-text-secondary">{label}<span className="[&>*]:mt-1 [&>*]:h-10 [&>*]:w-full [&>*]:rounded-md [&>*]:border [&>*]:px-3 [&>textarea]:h-auto [&>textarea]:py-2">{children}</span></label>;
}
function Summary({ label, value, danger, success }: { label: string; value: number; danger?: boolean; success?: boolean }) {
  return <div className={`rounded-xl p-4 ${danger ? "bg-danger-soft" : success ? "bg-success-soft" : "border bg-white"}`}><p className="text-xs font-semibold text-text-secondary">{label}</p><p className="mt-2 text-2xl font-bold text-text-primary">{value}</p></div>;
}
function Badge({ value, danger }: { value: string; danger?: boolean }) {
  return <span className={`rounded px-2 py-1 text-[10px] font-bold ${danger ? "bg-danger-soft text-danger-foreground" : "bg-surface-muted text-text-secondary"}`}>{value}</span>;
}
