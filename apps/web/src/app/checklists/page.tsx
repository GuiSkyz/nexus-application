"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Archive,
  CheckCircle2,
  ClipboardCheck,
  Copy,
  Edit,
  Plus,
  Search,
  Send,
  Trash2,
  Users,
} from "lucide-react";

import { AppHeader } from "@/components/nexus/app-header";
import { useRole } from "@/components/nexus/role-selector";
import { ApiClient } from "@/lib/apiClient";
import { ChecklistStatus, ChecklistTemplate } from "@/types/checklist";
import { Technician } from "@/types/technician";

const statusLabel: Record<ChecklistStatus, string> = {
  draft: "Rascunho",
  published: "Publicado",
  archived: "Arquivado",
};

const categoryLabel: Record<string, string> = {
  INSTALACAO_MANUTENCAO: "Instalação & Manutenção",
  INFRAESTRUTURA: "Infraestrutura",
};

export default function ChecklistsPage() {
  const { permissions } = useRole();
  const [templates, setTemplates] = useState<ChecklistTemplate[]>([]);
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<"all" | ChecklistStatus>("all");
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [isAssignmentOpen, setIsAssignmentOpen] = useState(false);
  const [selectedChecklistId, setSelectedChecklistId] = useState("");
  const [selectedTechnicianIds, setSelectedTechnicianIds] = useState<string[]>([]);
  const [assignmentFilter, setAssignmentFilter] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const checklistData = await ApiClient.fetchChecklists();
      setTemplates(checklistData);
      if (permissions.canCreate) {
        const technicianData = await ApiClient.fetchTechnicians();
        setTechnicians(technicianData.filter((technician) => technician.isActive));
      }
    } catch (error) {
      setFeedback({ type: "error", text: error instanceof Error ? error.message : "Falha ao carregar checklists." });
    } finally {
      setLoading(false);
    }
  }, [permissions.canCreate]);

  useEffect(() => {
    void load();
  }, [load]);

  const visible = useMemo(
    () =>
      templates.filter((template) => {
        if (tab !== "all" && template.status !== tab) return false;
        const search = query.trim().toLowerCase();
        return !search || `${template.title} ${template.category}`.toLowerCase().includes(search);
      }),
    [query, tab, templates],
  );

  const act = async (action: () => Promise<unknown>, message: string) => {
    try {
      await action();
      await load();
      setFeedback({ type: "success", text: message });
    } catch (error) {
      setFeedback({ type: "error", text: error instanceof Error ? error.message : "A operação não foi concluída." });
    }
  };

  const publishedTemplates = templates.filter((template) => template.status === "published" && template.distributionScope === "INDIVIDUAL");
  const selectedChecklist = publishedTemplates.find((template) => template.id === selectedChecklistId);

  const toggleTechnician = (id: string) => {
    setSelectedTechnicianIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  };

  const openAssignment = () => {
    setSelectedChecklistId((current) => current || publishedTemplates[0]?.id || "");
    setSelectedTechnicianIds([]);
    setAssignmentFilter("");
    setIsAssignmentOpen(true);
  };

  const applyAssignment = async () => {
    if (!selectedChecklistId || !selectedTechnicianIds.length) {
      setFeedback({ type: "error", text: "Selecione um checklist publicado e pelo menos um técnico." });
      return;
    }
    try {
      await ApiClient.assignChecklistToTechnicians(selectedChecklistId, selectedTechnicianIds);
      await load();
      setIsAssignmentOpen(false);
      setFeedback({
        type: "success",
        text: `Checklist \"${selectedChecklist?.title}\" atribuído a ${selectedTechnicianIds.length} técnico(s).`,
      });
    } catch (error) {
      setFeedback({ type: "error", text: error instanceof Error ? error.message : "Não foi possível atribuir o checklist." });
    }
  };

  const teamsAndSpecialties = [...new Set(technicians.flatMap((technician) => [technician.teamName, technician.specialty]).filter(Boolean))] as string[];
  const visibleTechnicians = technicians.filter((technician) =>
    technician.operationalCategory === selectedChecklist?.category &&
    (!assignmentFilter || technician.teamName === assignmentFilter || technician.specialty === assignmentFilter),
  );
  return (
    <>
      <AppHeader pageTitle="Checklists" breadcrumb={["Operacional", "Checklists"]} />
      <main className="space-y-5 p-6">
        <section className="flex flex-col gap-4 border-b pb-5 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-xl font-bold text-text-primary">Biblioteca de checklists</h1>
            <p className="mt-1 text-sm text-text-secondary">Crie, revise, publique e preserve versões operacionais.</p>
          </div>
          {permissions.canCreate && (
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={openAssignment} disabled={!publishedTemplates.length || !technicians.length} className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-nexus-blue-600 px-4 text-xs font-bold text-nexus-blue-700 hover:bg-nexus-blue-50 disabled:cursor-not-allowed disabled:opacity-50">
                <Users className="h-4 w-4" /> Atribuir em lote
              </button>
              <a href="/checklists/builder" className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-nexus-blue-600 px-4 text-xs font-bold text-white hover:bg-nexus-blue-700">
                <Plus className="h-4 w-4" /> Novo checklist
              </a>
            </div>
          )}
        </section>

        {feedback && (
          <div role="status" className={`rounded-lg px-4 py-3 text-sm font-semibold ${feedback.type === "success" ? "bg-success-soft text-success-foreground" : "bg-danger-soft text-danger-foreground"}`}>
            {feedback.text}
          </div>
        )}

        <section className="flex flex-col gap-3 rounded-xl border bg-surface-card p-4 md:flex-row md:items-center">
          <label className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-text-muted" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por nome ou categoria" className="h-10 w-full rounded-md border pl-9 pr-3 text-sm outline-none focus:border-nexus-blue-600" />
          </label>
          <div className="flex flex-wrap gap-1" role="tablist">
            {(["all", "draft", "published", "archived"] as const).map((value) => (
              <button key={value} onClick={() => setTab(value)} className={`rounded-md px-3 py-2 text-xs font-bold ${tab === value ? "bg-nexus-navy-900 text-white" : "text-text-secondary hover:bg-surface-muted"}`}>
                {value === "all" ? "Todos" : statusLabel[value]}
              </button>
            ))}
          </div>
        </section>

        <section className="overflow-hidden rounded-xl border bg-surface-card">
          {loading ? (
            <div className="space-y-2 p-5">{Array.from({ length: 4 }).map((_, index) => <div className="skeleton h-16" key={index} />)}</div>
          ) : visible.length ? (
            <div className="divide-y">
              {visible.map((template) => (
                <article key={template.id} className="grid gap-4 px-5 py-4 lg:grid-cols-[1fr_150px_130px_auto] lg:items-center">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <ClipboardCheck className="h-4 w-4 shrink-0 text-nexus-blue-600" />
                      <h2 className="truncate text-sm font-bold text-text-primary">{template.title}</h2>
                    </div>
                    <p className="mt-1 text-xs text-text-secondary">{categoryLabel[template.category] || template.category} · v{template.version} · {template.sections.length} seções</p>
                  </div>
                  <span className={`justify-self-start rounded px-2 py-1 text-[10px] font-bold ${template.status === "published" ? "bg-success-soft text-success-foreground" : template.status === "archived" ? "bg-surface-muted text-text-secondary" : "bg-warning-soft text-warning-foreground"}`}>
                    {statusLabel[template.status]}
                  </span>
                  <span className="text-xs text-text-secondary">{template.assignedTechnicianCount} técnico(s) · {template.usageCount} utilizações</span>
                  <div className="flex items-center justify-end gap-1">
                    {template.status === "draft" && permissions.canEditDraft && <a href={`/checklists/builder?id=${template.id}`} title="Editar" className="rounded p-2 text-text-secondary hover:bg-surface-muted hover:text-nexus-blue-700"><Edit className="h-4 w-4" /></a>}
                    {template.status === "draft" && permissions.canPublish && <button title="Publicar" onClick={() => void act(() => ApiClient.publishChecklist(template.id), "Checklist publicado.")} className="rounded p-2 text-text-secondary hover:bg-success-soft hover:text-success-foreground"><Send className="h-4 w-4" /></button>}
                    {permissions.canCreate && <button title="Duplicar" onClick={() => void act(() => ApiClient.duplicateChecklist(template.id), "Cópia criada como rascunho.")} className="rounded p-2 text-text-secondary hover:bg-surface-muted"><Copy className="h-4 w-4" /></button>}
                    {template.status === "published" && permissions.canArchive && <button title="Arquivar" onClick={() => void act(() => ApiClient.archiveChecklist(template.id), "Checklist arquivado.")} className="rounded p-2 text-text-secondary hover:bg-warning-soft hover:text-warning-foreground"><Archive className="h-4 w-4" /></button>}
                    {template.status !== "published" && template.usageCount === 0 && permissions.canDelete && <button title="Excluir" onClick={() => window.confirm("Excluir este checklist?") && void act(() => ApiClient.deleteChecklist(template.id), "Checklist excluído.")} className="rounded p-2 text-text-secondary hover:bg-danger-soft hover:text-danger-foreground"><Trash2 className="h-4 w-4" /></button>}
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="py-16 text-center">
              <CheckCircle2 className="mx-auto h-8 w-8 text-text-muted" />
              <p className="mt-3 text-sm font-bold text-text-primary">Nenhum checklist encontrado</p>
              <p className="mt-1 text-xs text-text-secondary">Ajuste os filtros ou crie o primeiro template.</p>
            </div>
          )}
        </section>

        {isAssignmentOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true" aria-labelledby="assignment-title">
            <div className="w-full max-w-lg rounded-xl border bg-surface-card p-6 shadow-overlay">
              <div className="flex items-start justify-between gap-4 border-b pb-4">
                <div>
                  <h2 id="assignment-title" className="text-base font-bold text-text-primary">Atribuir checklist em lote</h2>
                  <p className="mt-1 text-xs text-text-secondary">O checklist será disponibilizado aos técnicos selecionados no aplicativo de campo.</p>
                </div>
                <button type="button" onClick={() => setIsAssignmentOpen(false)} className="rounded p-1 text-text-secondary hover:bg-surface-muted" aria-label="Fechar">×</button>
              </div>

              <div className="mt-4 space-y-4">
                <label className="block text-xs font-bold text-text-primary">
                  Checklist publicado
                  <select value={selectedChecklistId} onChange={(event) => { setSelectedChecklistId(event.target.value); setSelectedTechnicianIds([]); }} className="mt-1.5 h-10 w-full rounded-md border bg-white px-3 text-sm font-normal">
                    {publishedTemplates.map((template) => <option key={template.id} value={template.id}>{template.title} · {categoryLabel[template.category] || template.category} · v{template.version}</option>)}
                  </select>
                </label>

                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-xs font-bold text-text-primary">Técnicos ({selectedTechnicianIds.length} selecionado(s))</p>
                    <button type="button" onClick={() => setSelectedTechnicianIds(visibleTechnicians.every((technician) => selectedTechnicianIds.includes(technician.id)) ? selectedTechnicianIds.filter((id) => !visibleTechnicians.some((technician) => technician.id === id)) : [...new Set([...selectedTechnicianIds, ...visibleTechnicians.map((technician) => technician.id)])])} className="text-xs font-bold text-nexus-blue-700 hover:underline">
                      {visibleTechnicians.every((technician) => selectedTechnicianIds.includes(technician.id)) ? "Desmarcar visíveis" : "Selecionar visíveis"}
                    </button>
                  </div>
                  <select value={assignmentFilter} onChange={(event) => setAssignmentFilter(event.target.value)} className="mb-2 h-9 w-full rounded-md border bg-white px-3 text-xs">
                    <option value="">Todas as equipes e especialidades</option>
                    {teamsAndSpecialties.map((value) => <option key={value} value={value}>{value}</option>)}
                  </select>
                  <div className="max-h-60 space-y-1 overflow-y-auto rounded-md border bg-surface-subtle p-2">
                    {visibleTechnicians.map((technician) => (
                      <label key={technician.id} className="flex cursor-pointer items-center gap-3 rounded-md bg-surface-card px-3 py-2.5 hover:bg-nexus-blue-50">
                        <input type="checkbox" checked={selectedTechnicianIds.includes(technician.id)} onChange={() => toggleTechnician(technician.id)} className="h-4 w-4 rounded border" />
                        <span className="min-w-0"><span className="block truncate text-sm font-semibold text-text-primary">{technician.fullName}</span><span className="block truncate text-xs text-text-secondary">{technician.teamName || technician.specialty || "Sem equipe"}</span></span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-5 flex justify-end gap-2 border-t pt-4">
                <button type="button" onClick={() => setIsAssignmentOpen(false)} className="h-10 rounded-md border px-4 text-xs font-bold text-text-secondary hover:bg-surface-muted">Cancelar</button>
                <button type="button" onClick={() => void applyAssignment()} className="inline-flex h-10 items-center gap-2 rounded-md bg-nexus-blue-600 px-4 text-xs font-bold text-white hover:bg-nexus-blue-700"><Users className="h-4 w-4" /> Atribuir checklist</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
