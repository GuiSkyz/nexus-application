"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, Edit, Eye, Plus, Search, Trash2, Wrench } from "lucide-react";

import { AppHeader } from "@/components/nexus/app-header";
import { Dialog } from "@/components/nexus/dialog";
import { useRole } from "@/components/nexus/role-selector";
import { apiUrl, ApiClient } from "@/lib/apiClient";
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
  const [plan, setPlan] = useState({ description: "", dueDate: "" });
  const [feedback, setFeedback] = useState("");
  const [successDialog, setSuccessDialog] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Incident | null>(null);
  const [returnTarget, setReturnTarget] = useState<Incident | null>(null);
  const [returnNotes, setReturnNotes] = useState("");
  const [detailIncident, setDetailIncident] = useState<Incident | null>(null);

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
      const isNew = !editing?.id;
      await ApiClient.saveIncident({
        ...(editing || {}),
        ...(isNew ? { actionPlan: { ...plan, createdBy: "Gestão Operacional" } } : {}),
      });
      setEditing(null);
      setPlan({ description: "", dueDate: "" });
      await load();
      if (isNew) setSuccessDialog("Não conformidade aberta com sucesso. O plano de ação já foi enviado ao técnico responsável.");
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Não foi possível salvar.");
    }
  };

  const resolveIncident = async (incident: Incident) => {
    try {
      await ApiClient.resolveIncident(incident.id, { resolutionNotes: "Correção aprovada pela gestão." });
      await load();
      setSuccessDialog("Correção aprovada e não conformidade resolvida.");
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Não foi possível aprovar a correção.");
    }
  };

  const returnForCorrection = async () => {
    if (!returnTarget || !returnNotes.trim()) return;
    try {
      await ApiClient.reopenIncident(returnTarget.id, { resolutionNotes: returnNotes.trim() });
      setReturnTarget(null);
      setReturnNotes("");
      await load();
      setSuccessDialog("A não conformidade foi devolvida ao técnico com o ajuste solicitado.");
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Não foi possível devolver a não conformidade.");
    }
  };

  const deleteIncident = async () => {
    if (!deleteTarget) return;
    try {
      await ApiClient.deleteIncident(deleteTarget.id);
      setDeleteTarget(null);
      await load();
      setSuccessDialog("Não conformidade excluída com sucesso.");
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Não foi possível excluir a não conformidade.");
    }
  };

  const savePlan = async (event: FormEvent) => {
    event.preventDefault();
    if (!planIncident) return;
    try {
      await ApiClient.createActionPlan(planIncident.id, { ...plan, createdBy: "Gestão Operacional" });
      setPlanIncident(null);
      setPlan({ description: "", dueDate: "" });
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
          {!isTechnician && <button onClick={() => { setPlan({ description: "", dueDate: "" }); setEditing({ ...emptyIncident }); }} className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-nexus-blue-600 px-4 text-xs font-bold text-white hover:bg-nexus-blue-700">
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
                      <p className="mt-1">Responsável: {incident.actionPlan.assignedTo} · ID: {incident.actionPlan.assignedTechnicianId || "Legado"} · Prazo: {new Date(incident.actionPlan.dueDate).toLocaleString("pt-BR")}</p>
                      {incident.actionPlan.evidencePhotoUrl && <a href={apiUrl(incident.actionPlan.evidencePhotoUrl)} target="_blank" rel="noreferrer" className="mt-1 inline-block font-semibold text-nexus-blue-700">Ver foto enviada</a>}
                    </> : "Sem plano atribuído"}
                  </div>
                  <div className="flex gap-2">
                    <Badge value={incident.severity} danger={incident.severity === "CRITICA"} />
                    <Badge value={incident.status.replaceAll("_", " ")} />
                  </div>
                  {!isTechnician && <div className="flex justify-end gap-1">
                    <button onClick={() => setDetailIncident(incident)} className="rounded p-2 text-text-secondary hover:bg-surface-muted hover:text-nexus-blue-700" title="Visualizar não conformidade"><Eye className="h-4 w-4" /></button>
                    <button onClick={() => setEditing({ ...incident })} className="rounded p-2 text-text-secondary hover:bg-surface-muted" title="Editar"><Edit className="h-4 w-4" /></button>
                    {incident.status !== "RESOLVIDA" && <button onClick={() => setPlanIncident(incident)} className="rounded p-2 text-text-secondary hover:bg-warning-soft hover:text-warning-foreground" title="Plano de ação"><Wrench className="h-4 w-4" /></button>}
                    {incident.status === "EM_ANALISE" && <><button onClick={() => void resolveIncident(incident)} className="rounded p-2 text-text-secondary hover:bg-success-soft hover:text-success-foreground" title="Aprovar correção"><CheckCircle2 className="h-4 w-4" /></button><button onClick={() => { setReturnNotes(""); setReturnTarget(incident); }} className="rounded p-2 text-text-secondary hover:bg-danger-soft hover:text-danger-foreground" title="Devolver para ajuste"><AlertTriangle className="h-4 w-4" /></button></>}
                    <button onClick={() => setDeleteTarget(incident)} className="rounded p-2 text-text-secondary hover:bg-danger-soft hover:text-danger-foreground" title="Excluir"><Trash2 className="h-4 w-4" /></button>
                  </div>}
                </article>
              ))}
            </div>
          ) : <div className="py-16 text-center text-sm text-text-secondary">Nenhuma não conformidade encontrada.</div>}
        </section>
      </main>

      <Dialog open={Boolean(editing)} title={editing?.id ? "Editar não conformidade" : "Registrar não conformidade"} onClose={() => setEditing(null)} width="lg">
        {editing && (
          <form onSubmit={saveIncident} className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2">
              <Field label="Técnico cadastrado"><select required value={editing.technicianId || ""} onChange={(e) => setEditing({ ...editing, technicianId: e.target.value })}><option value="">Selecione o técnico responsável</option>{technicians.map((technician) => <option key={technician.id} value={technician.id}>{technician.fullName}</option>)}</select></Field>
              <Field label="Equipe"><input readOnly value={selectedTechnician?.teamName || editing.teamName || "Definida pelo cadastro"} className="bg-surface-muted text-text-secondary" /></Field>
              <Field label="Categoria"><input required value={editing.category || ""} onChange={(e) => setEditing({ ...editing, category: e.target.value })} /></Field>
              <Field label="Severidade"><select value={editing.severity} onChange={(e) => setEditing({ ...editing, severity: e.target.value as Incident["severity"] })}><option value="BAIXA">Baixa</option><option value="MEDIA">Média</option><option value="ALTA">Alta</option><option value="CRITICA">Crítica</option></select></Field>
            </div>
            <Field label="Desvio identificado"><input required value={editing.questionText || ""} onChange={(e) => setEditing({ ...editing, questionText: e.target.value })} /></Field>
            <Field label="Descrição"><textarea rows={3} value={editing.description || ""} onChange={(e) => setEditing({ ...editing, description: e.target.value })} /></Field>
            {!editing.id && <fieldset className="grid gap-3 rounded-lg border border-nexus-blue-100 bg-nexus-blue-50/40 p-4 md:grid-cols-2"><legend className="px-1 text-sm font-bold text-nexus-blue-800">Plano de ação</legend><Field label="Ação corretiva"><textarea required rows={3} value={plan.description} onChange={(e) => setPlan({ ...plan, description: e.target.value })} /></Field><Field label="Técnico responsável"><input readOnly value={selectedTechnician ? `${selectedTechnician.fullName} · ID ${selectedTechnician.id}` : "Selecione o técnico acima"} className="bg-surface-muted text-text-secondary" /></Field><Field label="Prazo"><input required type="datetime-local" value={plan.dueDate} onChange={(e) => setPlan({ ...plan, dueDate: e.target.value })} /></Field></fieldset>}
            <div className="flex justify-end gap-2"><button type="button" onClick={() => setEditing(null)} className="rounded-md border px-4 py-2 text-xs font-bold">Cancelar</button><button className="rounded-md bg-nexus-blue-600 px-4 py-2 text-xs font-bold text-white">Salvar</button></div>
          </form>
        )}
      </Dialog>

      <Dialog open={Boolean(planIncident)} title={`Plano de ação${planIncident ? ` · ${planIncident.id}` : ""}`} onClose={() => setPlanIncident(null)}>
          <form onSubmit={savePlan} className="space-y-4">
            <Field label="Ação corretiva"><textarea required rows={3} value={plan.description} onChange={(e) => setPlan({ ...plan, description: e.target.value })} /></Field>
            <Field label="Técnico responsável"><input readOnly value={planIncident?.technicianName || "Técnico da não conformidade"} className="bg-surface-muted text-text-secondary" /></Field>
            <Field label="Prazo"><input required type="datetime-local" value={plan.dueDate} onChange={(e) => setPlan({ ...plan, dueDate: e.target.value })} /></Field>
            <div className="flex justify-end gap-2"><button type="button" onClick={() => setPlanIncident(null)} className="rounded-md border px-4 py-2 text-xs font-bold">Cancelar</button><button className="rounded-md bg-nexus-blue-600 px-4 py-2 text-xs font-bold text-white">Atribuir plano</button></div>
          </form>
      </Dialog>
      <Dialog open={Boolean(detailIncident)} title={`Não conformidade${detailIncident ? ` · ${detailIncident.id}` : ""}`} onClose={() => setDetailIncident(null)} width="lg">
        {detailIncident && <div className="space-y-4 text-sm">
          <section className="space-y-1"><p className="font-semibold text-text-primary">Pergunta</p><p className="text-text-secondary">{detailIncident.questionText}</p></section>
          <section className="space-y-1"><p className="font-semibold text-text-primary">Descrição do desvio</p><p className="whitespace-pre-wrap text-text-secondary">{detailIncident.description || "Sem descrição informada."}</p></section>
          <section className="rounded-lg bg-surface-muted p-4"><p className="font-semibold text-text-primary">Plano de ação</p>{detailIncident.actionPlan ? <div className="mt-2 space-y-1 text-text-secondary"><p>{detailIncident.actionPlan.description}</p><p>Responsável: {detailIncident.actionPlan.assignedTo}</p><p>ID do técnico: {detailIncident.actionPlan.assignedTechnicianId || "Registro legado"}</p><p>Prazo: {new Date(detailIncident.actionPlan.dueDate).toLocaleString("pt-BR")}</p></div> : <p className="mt-2 text-text-secondary">Plano ainda não atribuído.</p>}</section>
          {detailIncident.actionPlan?.resolutionNotes && <section className="space-y-1"><p className="font-semibold text-text-primary">Descrição enviada pelo técnico</p><p className="whitespace-pre-wrap text-text-secondary">{detailIncident.actionPlan.resolutionNotes}</p></section>}
          {detailIncident.actionPlan?.evidencePhotoUrl && <section className="space-y-2"><p className="font-semibold text-text-primary">Foto da evidência</p><a href={apiUrl(detailIncident.actionPlan.evidencePhotoUrl)} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-lg border bg-surface-muted"><img src={apiUrl(detailIncident.actionPlan.evidencePhotoUrl)} alt={`Evidência da ${detailIncident.id}`} className="max-h-80 w-full object-contain" /></a><a href={apiUrl(detailIncident.actionPlan.evidencePhotoUrl)} target="_blank" rel="noreferrer" className="inline-block text-xs font-bold text-nexus-blue-700">Abrir foto em tamanho maior</a></section>}
        </div>}
      </Dialog>
      <Dialog open={Boolean(returnTarget)} title="Devolver para ajuste" onClose={() => setReturnTarget(null)}><p className="text-sm text-text-secondary">Informe o ajuste necessário para o técnico responsável.</p><textarea value={returnNotes} onChange={(event) => setReturnNotes(event.target.value)} rows={3} className="mt-3 w-full rounded-md border p-3 text-sm" placeholder="Descreva o ajuste solicitado" /><div className="mt-4 flex justify-end gap-2"><button type="button" onClick={() => setReturnTarget(null)} className="rounded-md border px-4 py-2 text-xs font-bold">Cancelar</button><button type="button" disabled={!returnNotes.trim()} onClick={() => void returnForCorrection()} className="rounded-md bg-danger-foreground px-4 py-2 text-xs font-bold text-white disabled:opacity-50">Devolver ao técnico</button></div></Dialog>
      <Dialog open={Boolean(deleteTarget)} title="Excluir não conformidade" onClose={() => setDeleteTarget(null)}><p className="text-sm text-text-secondary">Esta ação remove a NC e seu plano de ação. Deseja continuar?</p><div className="mt-5 flex justify-end gap-2"><button type="button" onClick={() => setDeleteTarget(null)} className="rounded-md border px-4 py-2 text-xs font-bold">Cancelar</button><button type="button" onClick={() => void deleteIncident()} className="rounded-md bg-danger-foreground px-4 py-2 text-xs font-bold text-white">Excluir</button></div></Dialog>
      <Dialog open={Boolean(successDialog)} title="Operação concluída" onClose={() => setSuccessDialog("")}><p className="text-sm text-text-secondary">{successDialog}</p><div className="mt-5 flex justify-end"><button type="button" onClick={() => setSuccessDialog("")} className="rounded-md bg-nexus-blue-600 px-4 py-2 text-xs font-bold text-white">Entendi</button></div></Dialog>
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
