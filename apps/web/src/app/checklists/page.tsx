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
} from "lucide-react";

import { AppHeader } from "@/components/nexus/app-header";
import { useRole } from "@/components/nexus/role-selector";
import { ApiClient } from "@/lib/apiClient";
import { ChecklistStatus, ChecklistTemplate } from "@/types/checklist";

const statusLabel: Record<ChecklistStatus, string> = {
  draft: "Rascunho",
  published: "Publicado",
  archived: "Arquivado",
};

export default function ChecklistsPage() {
  const { permissions } = useRole();
  const [templates, setTemplates] = useState<ChecklistTemplate[]>([]);
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<"all" | ChecklistStatus>("all");
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setTemplates(await ApiClient.fetchChecklists());
    } catch (error) {
      setFeedback({ type: "error", text: error instanceof Error ? error.message : "Falha ao carregar checklists." });
    } finally {
      setLoading(false);
    }
  }, []);

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
            <a href="/checklists/builder" className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-nexus-blue-600 px-4 text-xs font-bold text-white hover:bg-nexus-blue-700">
              <Plus className="h-4 w-4" /> Novo checklist
            </a>
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
                    <p className="mt-1 text-xs text-text-secondary">{template.category} · v{template.version} · {template.sections.length} seções</p>
                  </div>
                  <span className={`justify-self-start rounded px-2 py-1 text-[10px] font-bold ${template.status === "published" ? "bg-success-soft text-success-foreground" : template.status === "archived" ? "bg-surface-muted text-text-secondary" : "bg-warning-soft text-warning-foreground"}`}>
                    {statusLabel[template.status]}
                  </span>
                  <span className="text-xs text-text-secondary">{template.usageCount} utilizações</span>
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
      </main>
    </>
  );
}
