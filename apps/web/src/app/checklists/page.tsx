"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { AppHeader } from "@/components/nexus/app-header";
import { useRole } from "@/components/nexus/role-selector";
import { MockChecklistService } from "@/lib/mockChecklists";
import { ChecklistTemplate, AuditLog, ChecklistStatus } from "@/types/checklist";
import {
  FileText,
  Plus,
  Search,
  Filter,
  History,
  Lock,
  Copy,
  Archive,
  Trash2,
  Send,
  Edit,
  Eye,
  CheckCircle2,
  AlertCircle,
  ShieldAlert,
} from "lucide-react";

export default function ChecklistsPage() {
  const { activeRole, activeUser, permissions } = useRole();
  const [templates, setTemplates] = useState<ChecklistTemplate[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "draft" | "published" | "archived">("all");
  const [selectedAuditLogModal, setSelectedAuditLogModal] = useState(false);
  const [versionHistoryModal, setVersionHistoryModal] = useState<ChecklistTemplate[] | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const loadData = () => {
    const list = MockChecklistService.getTemplates();
    const logs = MockChecklistService.getAuditLogs();
    setTemplates(list);
    setAuditLogs(logs);
  };

  useEffect(() => {
    loadData();
  }, []);

  const showNotification = (type: "success" | "error", text: string) => {
    setFeedbackMessage({ type, text });
    setTimeout(() => setFeedbackMessage(null), 4000);
  };

  // Operações controladas por regras de negócio e RBAC
  const handlePublish = (templateId: string) => {
    try {
      MockChecklistService.publishTemplate(templateId, activeUser, activeRole);
      loadData();
      showNotification("success", "Checklist publicado com sucesso e liberado para o aplicativo mobile.");
    } catch (e: any) {
      showNotification("error", e.message || "Erro ao publicar.");
    }
  };

  const handleCreateNewVersion = (publishedId: string) => {
    try {
      const draft = MockChecklistService.createDraftFromPublished(publishedId, activeUser, activeRole);
      loadData();
      showNotification(
        "success",
        `Nova versão v${draft.version}.0 criada como Rascunho. A versão anterior permanece imutável e ativa.`
      );
    } catch (e: any) {
      showNotification("error", e.message || "Erro ao gerar versão.");
    }
  };

  const handleArchive = (templateId: string) => {
    try {
      MockChecklistService.archiveTemplate(templateId, activeUser, activeRole);
      loadData();
      showNotification("success", "Checklist arquivado. Não estará mais disponível para novas inspeções.");
    } catch (e: any) {
      showNotification("error", e.message || "Erro ao arquivar.");
    }
  };

  const handleDuplicate = (templateId: string) => {
    try {
      const clone = MockChecklistService.duplicateTemplate(templateId, activeUser, activeRole);
      loadData();
      showNotification("success", `Duplicado com sucesso: ${clone.title}`);
    } catch (e: any) {
      showNotification("error", e.message || "Erro ao duplicar.");
    }
  };

  const handleDelete = (templateId: string) => {
    try {
      MockChecklistService.deleteTemplate(templateId, activeUser, activeRole);
      loadData();
      showNotification("success", "Checklist excluído definitivamente do sistema.");
    } catch (e: any) {
      showNotification("error", e.message || "Erro ao excluir.");
    }
  };

  // Filtragem de dados
  const filteredTemplates = templates.filter((t) => {
    // Filtro RBAC: Técnico só vê publicados
    if (!permissions.canReadDrafts && t.status !== "published") {
      return false;
    }
    // Filtro por Tab
    if (activeTab !== "all" && t.status !== activeTab) {
      return false;
    }
    // Filtro de Busca
    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase();
      return (
        t.title.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q) ||
        t.templateId.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const draftCount = templates.filter((t) => t.status === "draft").length;
  const publishedCount = templates.filter((t) => t.status === "published").length;
  const archivedCount = templates.filter((t) => t.status === "archived").length;

  return (
    <>
      <AppHeader pageTitle="Templates de Checklist" breadcrumb={["NexusOps", "Checklists"]} />

      <main className="flex-1 p-6" style={{ backgroundColor: "var(--surface-page)" }}>
        {/* Banner de Feedback (Success / Error) */}
        {feedbackMessage && (
          <div
            className="flex items-center justify-between p-4 mb-6 text-xs font-medium animate-in fade-in slide-in-from-top-2 duration-150"
            style={{
              backgroundColor: feedbackMessage.type === "success" ? "var(--success-soft)" : "var(--danger-soft)",
              border: `1px solid ${feedbackMessage.type === "success" ? "var(--success)" : "var(--danger)"}`,
              color: feedbackMessage.type === "success" ? "var(--success-foreground)" : "var(--danger-foreground)",
              borderRadius: "var(--radius-lg)",
            }}
          >
            <div className="flex items-center gap-2">
              {feedbackMessage.type === "success" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
              <span>{feedbackMessage.text}</span>
            </div>
            <button onClick={() => setFeedbackMessage(null)} className="font-bold underline">
              Fechar
            </button>
          </div>
        )}

        {/* Resumo do Perfil RBAC Ativo */}
        <div
          className="flex items-center justify-between p-4 mb-6 text-xs"
          style={{
            backgroundColor: "var(--surface-card)",
            border: "1px solid var(--border-default)",
            borderRadius: "var(--radius-lg)",
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center font-bold"
              style={{ backgroundColor: "var(--nexus-blue-50)", color: "var(--nexus-blue-600)" }}
            >
              RBAC
            </div>
            <div>
              <p className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>
                Perfil Atual: <span className="underline">{activeRole}</span> ({activeUser})
              </p>
              <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                {activeRole === "TECNICO" && "Visualização e execução exclusiva de checklists publicados."}
                {activeRole === "SUPERVISOR" && "Leitura de rascunhos e publicados sem permissão de alteração."}
                {activeRole === "COORDENADOR" && "Criação, edição de rascunhos, versionamento, publicação e arquivamento."}
                {(activeRole === "DIRETOR" || activeRole === "ADMIN") &&
                  "Acesso total incluindo exclusão condicional de rascunhos nunca publicados."}
              </p>
            </div>
          </div>
          <button
            onClick={() => setSelectedAuditLogModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-colors"
            style={{
              backgroundColor: "var(--surface-muted)",
              border: "1px solid var(--border-default)",
              color: "var(--text-secondary)",
            }}
          >
            <History size={14} />
            <span>Auditoria ({auditLogs.length})</span>
          </button>
        </div>

        {/* KPIs de Status */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
          <div
            className="p-4 flex items-center justify-between"
            style={{
              backgroundColor: "var(--surface-card)",
              border: "1px solid var(--border-default)",
              borderRadius: "var(--radius-lg)",
            }}
          >
            <div>
              <p className="text-xs uppercase font-medium" style={{ color: "var(--text-muted)" }}>
                Total de Templates
              </p>
              <p className="text-2xl font-bold mt-1" style={{ color: "var(--text-primary)" }}>
                {templates.length}
              </p>
            </div>
            <FileText size={20} style={{ color: "var(--text-muted)" }} />
          </div>

          <div
            className="p-4 flex items-center justify-between"
            style={{
              backgroundColor: "var(--surface-card)",
              border: "1px solid var(--border-default)",
              borderRadius: "var(--radius-lg)",
            }}
          >
            <div>
              <p className="text-xs uppercase font-medium" style={{ color: "var(--text-muted)" }}>
                Rascunhos (Drafts)
              </p>
              <p className="text-2xl font-bold mt-1" style={{ color: "var(--nexus-blue-600)" }}>
                {draftCount}
              </p>
            </div>
            <Edit size={20} style={{ color: "var(--nexus-blue-600)" }} />
          </div>

          <div
            className="p-4 flex items-center justify-between"
            style={{
              backgroundColor: "var(--surface-card)",
              border: "1px solid var(--border-default)",
              borderRadius: "var(--radius-lg)",
            }}
          >
            <div>
              <p className="text-xs uppercase font-medium" style={{ color: "var(--text-muted)" }}>
                Publicados (Mobile)
              </p>
              <p className="text-2xl font-bold mt-1" style={{ color: "var(--success)" }}>
                {publishedCount}
              </p>
            </div>
            <CheckCircle2 size={20} style={{ color: "var(--success)" }} />
          </div>

          <div
            className="p-4 flex items-center justify-between"
            style={{
              backgroundColor: "var(--surface-card)",
              border: "1px solid var(--border-default)",
              borderRadius: "var(--radius-lg)",
            }}
          >
            <div>
              <p className="text-xs uppercase font-medium" style={{ color: "var(--text-muted)" }}>
                Arquivados
              </p>
              <p className="text-2xl font-bold mt-1" style={{ color: "var(--text-muted)" }}>
                {archivedCount}
              </p>
            </div>
            <Archive size={20} style={{ color: "var(--text-muted)" }} />
          </div>
        </div>

        {/* Tabela Operacional */}
        <div
          style={{
            backgroundColor: "var(--surface-card)",
            border: "1px solid var(--border-default)",
            borderRadius: "var(--radius-lg)",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          {/* Barra Superior: Busca, Tabs e Ação Criar */}
          <div className="p-4 border-b flex flex-col md:flex-row md:items-center justify-between gap-4" style={{ borderColor: "var(--border-default)" }}>
            {/* Tabs por status */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-md text-xs font-medium" style={{ backgroundColor: "var(--surface-muted)" }}>
              <button
                onClick={() => setActiveTab("all")}
                className={`px-3 py-1.5 rounded transition-all ${activeTab === "all" ? "bg-white shadow text-slate-900 font-bold" : "text-slate-600"}`}
              >
                Todos ({templates.length})
              </button>
              {permissions.canReadDrafts && (
                <button
                  onClick={() => setActiveTab("draft")}
                  className={`px-3 py-1.5 rounded transition-all ${activeTab === "draft" ? "bg-white shadow text-slate-900 font-bold" : "text-slate-600"}`}
                >
                  Rascunhos ({draftCount})
                </button>
              )}
              <button
                onClick={() => setActiveTab("published")}
                className={`px-3 py-1.5 rounded transition-all ${activeTab === "published" ? "bg-white shadow text-slate-900 font-bold" : "text-slate-600"}`}
              >
                Publicados ({publishedCount})
              </button>
              {permissions.canReadDrafts && (
                <button
                  onClick={() => setActiveTab("archived")}
                  className={`px-3 py-1.5 rounded transition-all ${activeTab === "archived" ? "bg-white shadow text-slate-900 font-bold" : "text-slate-600"}`}
                >
                  Arquivados ({archivedCount})
                </button>
              )}
            </div>

            <div className="flex items-center gap-3">
              {/* Campo de Busca */}
              <div className="relative">
                <Search size={14} className="absolute left-3 top-2.5" style={{ color: "var(--text-muted)" }} />
                <input
                  type="text"
                  placeholder="Buscar por título ou categoria..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-3 py-1.5 text-xs border rounded-md w-64 outline-none transition-colors"
                  style={{
                    backgroundColor: "var(--surface-page)",
                    borderColor: "var(--border-default)",
                    color: "var(--text-primary)",
                  }}
                />
              </div>

              {/* Botão Novo Checklist (Apenas se permissão canCreate) */}
              {permissions.canCreate ? (
                <Link
                  href="/checklists/builder"
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors"
                  style={{
                    backgroundColor: "var(--nexus-blue-600)",
                    color: "#ffffff",
                    borderRadius: "var(--radius-md)",
                  }}
                >
                  <Plus size={14} />
                  <span>Novo Checklist</span>
                </Link>
              ) : (
                <button
                  disabled
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md opacity-50 cursor-not-allowed"
                  style={{
                    backgroundColor: "var(--surface-muted)",
                    color: "var(--text-muted)",
                  }}
                  title="Seu perfil não possui permissão para criar checklists"
                >
                  <Lock size={14} />
                  <span>Novo Checklist</span>
                </button>
              )}
            </div>
          </div>

          {/* Tabela de Templates */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead
                className="uppercase tracking-wider font-semibold border-b text-[11px]"
                style={{ backgroundColor: "var(--surface-subtle)", color: "var(--text-muted)", borderColor: "var(--border-default)" }}
              >
                <tr>
                  <th className="py-3 px-4">Template / Título</th>
                  <th className="py-3 px-4">Categoria</th>
                  <th className="py-3 px-4">Versão</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-center">Usos em Campo</th>
                  <th className="py-3 px-4">Criado por</th>
                  <th className="py-3 px-4 text-right">Ações Acessíveis</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: "var(--border-default)" }}>
                {filteredTemplates.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center" style={{ color: "var(--text-muted)" }}>
                      <FileText size={32} className="mx-auto mb-2 opacity-50" />
                      <p className="font-semibold text-sm text-slate-700">Nenhum checklist encontrado</p>
                      <p className="text-xs">Não existem templates com os filtros selecionados ou permissão ativa.</p>
                    </td>
                  </tr>
                ) : (
                  filteredTemplates.map((template) => (
                    <tr key={template.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3.5 px-4 font-semibold" style={{ color: "var(--text-primary)" }}>
                        <div className="flex flex-col">
                          <span>{template.title}</span>
                          <span className="text-[10px] font-mono font-normal" style={{ color: "var(--text-muted)" }}>
                            ID: {template.templateId}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4" style={{ color: "var(--text-secondary)" }}>
                        <span className="px-2 py-0.5 rounded bg-slate-100 font-medium">
                          {template.category}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-mono font-bold text-xs" style={{ color: "var(--nexus-blue-600)" }}>
                          v{template.version}.0
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        {template.status === "draft" && (
                          <span className="px-2.5 py-0.5 rounded text-[11px] font-semibold" style={{ backgroundColor: "var(--info-soft)", color: "var(--info-foreground)" }}>
                            Rascunho
                          </span>
                        )}
                        {template.status === "published" && (
                          <span className="px-2.5 py-0.5 rounded text-[11px] font-semibold" style={{ backgroundColor: "var(--success-soft)", color: "var(--success-foreground)" }}>
                            Publicado
                          </span>
                        )}
                        {template.status === "archived" && (
                          <span className="px-2.5 py-0.5 rounded text-[11px] font-semibold" style={{ backgroundColor: "var(--surface-muted)", color: "var(--text-muted)" }}>
                            Arquivado
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold" style={{ color: "var(--text-primary)" }}>
                        {template.usageCount}
                      </td>
                      <td className="py-3.5 px-4 text-[11px]" style={{ color: "var(--text-muted)" }}>
                        {template.createdBy}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* 1. EDITAR RASCUNHO (Apenas se draft e canEditDraft) */}
                          {template.status === "draft" && permissions.canEditDraft && (
                            <Link
                              href={`/checklists/builder?id=${template.id}`}
                              className="p-1.5 rounded hover:bg-slate-100 text-blue-600 transition-colors"
                              title="Editar rascunho"
                            >
                              <Edit size={15} />
                            </Link>
                          )}

                          {/* 2. CRIAR NOVA VERSÃO DE PUBLICADO (Apenas se published e canCreateNewVersion) */}
                          {template.status === "published" && permissions.canCreateNewVersion && (
                            <button
                              onClick={() => handleCreateNewVersion(template.id)}
                              className="p-1.5 rounded hover:bg-blue-50 text-blue-600 transition-colors"
                              title="Editar (Cria nova versão em rascunho)"
                            >
                              <Edit size={15} />
                            </button>
                          )}

                          {/* 3. PUBLICAR (Apenas se draft e canPublish) */}
                          {template.status === "draft" && permissions.canPublish && (
                            <button
                              onClick={() => handlePublish(template.id)}
                              className="p-1.5 rounded hover:bg-emerald-50 text-emerald-600 transition-colors"
                              title="Publicar checklist"
                            >
                              <Send size={15} />
                            </button>
                          )}

                          {/* 4. DUPLICAR */}
                          {permissions.canCreate && (
                            <button
                              onClick={() => handleDuplicate(template.id)}
                              className="p-1.5 rounded hover:bg-slate-100 text-slate-600 transition-colors"
                              title="Duplicar checklist"
                            >
                              <Copy size={15} />
                            </button>
                          )}

                          {/* 5. ARQUIVAR (Apenas se published e canArchive) */}
                          {template.status === "published" && permissions.canArchive && (
                            <button
                              onClick={() => handleArchive(template.id)}
                              className="p-1.5 rounded hover:bg-amber-50 text-amber-600 transition-colors"
                              title="Arquivar checklist"
                            >
                              <Archive size={15} />
                            </button>
                          )}

                          {/* 6. EXCLUIR DEFINITIVAMENTE (Restrito: Apenas Diretor/Admin, e se Rascunho NUNCA publicado e 0 usos) */}
                          {permissions.canDelete &&
                            template.status === "draft" &&
                            !template.publishedAt &&
                            template.usageCount === 0 && (
                              <button
                                onClick={() => handleDelete(template.id)}
                                className="p-1.5 rounded hover:bg-rose-50 text-rose-600 transition-colors"
                                title="Excluir definitivamente"
                              >
                                <Trash2 size={15} />
                              </button>
                            )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal de Log de Auditoria */}
        {selectedAuditLogModal && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div
              className="w-full max-w-2xl bg-white rounded-xl shadow-2xl border overflow-hidden flex flex-col max-h-[80vh]"
              style={{ backgroundColor: "var(--surface-card)", borderColor: "var(--border-default)" }}
            >
              <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: "var(--border-default)" }}>
                <div className="flex items-center gap-2">
                  <History size={18} style={{ color: "var(--nexus-blue-600)" }} />
                  <h3 className="font-bold text-sm text-slate-900">Histórico de Auditoria Administrativa</h3>
                </div>
                <button onClick={() => setSelectedAuditLogModal(false)} className="text-xs font-bold text-slate-400 hover:text-slate-600">
                  ✕ Fechar
                </button>
              </div>

              <div className="p-4 overflow-y-auto space-y-3 flex-1">
                {auditLogs.map((log) => (
                  <div key={log.id} className="p-3 border rounded-lg text-xs" style={{ borderColor: "var(--border-default)" }}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-slate-900">{log.templateTitle}</span>
                      <span className="font-mono text-[10px] text-slate-400">{new Date(log.timestamp).toLocaleString("pt-BR")}</span>
                    </div>
                    <p className="text-slate-600 leading-relaxed mb-2">{log.details}</p>
                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t" style={{ borderColor: "var(--border-default)" }}>
                      <span>
                        Executado por: <strong>{log.performedBy}</strong>
                      </span>
                      <span className="px-2 py-0.5 bg-slate-100 rounded text-[10px] font-semibold">{log.userRole}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
