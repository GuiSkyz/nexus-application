"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { AppHeader } from "@/components/nexus/app-header";
import { useRole } from "@/components/nexus/role-selector";
import { ApiClient } from "@/lib/apiClient";
import {
  ChecklistTemplate,
  ChecklistSection,
  ChecklistQuestion,
  QuestionType,
} from "@/types/checklist";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Save,
  Send,
  Eye,
  CheckSquare,
  Camera,
  FileText,
  Clock,
  Calendar,
  Hash,
  PenTool,
  HelpCircle,
  AlertTriangle,
} from "lucide-react";

const categoryLabel: Record<string, string> = {
  INSTALACAO_MANUTENCAO: "Instalação & Manutenção",
  INFRAESTRUTURA: "Infraestrutura",
};

function BuilderContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("id");

  const { activeUser, permissions } = useRole();

  const [template, setTemplate] = useState<ChecklistTemplate>({
    id: "",
    templateId: "",
    title: "",
    category: "INSTALACAO_MANUTENCAO",
    description: "",
    status: "draft",
    version: 1,
    isLatestVersion: true,
    createdBy: activeUser,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    usageCount: 0,
    assignedTechnicianCount: 0,
    assignedTechnicianIds: [],
    sections: [
      {
        id: `sec-${Date.now()}`,
        title: "Seção 1: Inspeção Geral",
        description: "Verificação dos itens principais.",
        order: 1,
        questions: [
          {
            id: `q-${Date.now()}`,
            text: "Os equipamentos de proteção individual estão em conformidade?",
            type: "yes_no",
            isRequired: true,
            requirePhoto: false,
            requireJustification: false,
            order: 1,
          },
        ],
      },
    ],
  });

  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [notification, setNotification] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (!editId) return;
    ApiClient.fetchChecklist(editId)
      .then((existing) => setTemplate(existing))
      .catch((error) =>
        showNotification(
          "error",
          error instanceof Error ? error.message : "Checklist não encontrado.",
        ),
      );
  }, [editId]);

  const showNotification = (type: "success" | "error", text: string) => {
    setNotification({ type, text });
    setTimeout(() => setNotification(null), 4000);
  };

  // Funções de manipulação do construtor
  const addSection = () => {
    const newSec: ChecklistSection = {
      id: `sec-${Date.now()}`,
      title: `Nova Seção ${template.sections.length + 1}`,
      description: "",
      order: template.sections.length + 1,
      questions: [],
    };
    setTemplate((prev) => ({ ...prev, sections: [...prev.sections, newSec] }));
  };

  const removeSection = (sectionId: string) => {
    setTemplate((prev) => ({
      ...prev,
      sections: prev.sections.filter((s) => s.id !== sectionId),
    }));
  };

  const addQuestion = (sectionId: string) => {
    const newQ: ChecklistQuestion = {
      id: `q-${Date.now()}`,
      text: "Nova Pergunta de Verificação",
      type: "yes_no",
      isRequired: true,
      requirePhoto: false,
      requireJustification: false,
      order: 1,
    };

    setTemplate((prev) => ({
      ...prev,
      sections: prev.sections.map((sec) => {
        if (sec.id === sectionId) {
          return { ...sec, questions: [...sec.questions, newQ] };
        }
        return sec;
      }),
    }));
  };

  const updateQuestion = (sectionId: string, questionId: string, fields: Partial<ChecklistQuestion>) => {
    setTemplate((prev) => ({
      ...prev,
      sections: prev.sections.map((sec) => {
        if (sec.id === sectionId) {
          return {
            ...sec,
            questions: sec.questions.map((q) => (q.id === questionId ? { ...q, ...fields } : q)),
          };
        }
        return sec;
      }),
    }));
  };

  const updateQuestionType = (sectionId: string, question: ChecklistQuestion, type: QuestionType) => {
    const needsOptions = type === "single_choice" || type === "multiple_choice";
    const defaults = [
      { id: "option-1", label: "Opção 1" },
      { id: "option-2", label: "Opção 2" },
    ];
    updateQuestion(sectionId, question.id, {
      type,
      options: needsOptions ? (question.options?.length ? question.options : defaults) : undefined,
      // Uma pergunta cuja própria resposta é foto não precisa de uma segunda foto obrigatória.
      requirePhoto: type === "photo" ? false : question.requirePhoto,
    });
  };

  const removeQuestion = (sectionId: string, questionId: string) => {
    setTemplate((prev) => ({
      ...prev,
      sections: prev.sections.map((sec) => {
        if (sec.id === sectionId) {
          return { ...sec, questions: sec.questions.filter((q) => q.id !== questionId) };
        }
        return sec;
      }),
    }));
  };

  // Ações de Gravação e Publicação
  const handleSaveDraft = async () => {
    if (!template.title.trim()) {
      showNotification("error", "Informe o título do checklist antes de salvar.");
      return;
    }

    try {
      await ApiClient.saveChecklist({ ...template, createdBy: activeUser });
      showNotification("success", "Rascunho salvo com sucesso.");
      setTimeout(() => router.push("/checklists"), 1000);
    } catch (e) {
      showNotification("error", e instanceof Error ? e.message : "Erro ao salvar rascunho.");
    }
  };

  const handlePublish = async () => {
    if (!template.title.trim()) {
      showNotification("error", "Informe o título do checklist antes de publicar.");
      return;
    }

    try {
      const saved = await ApiClient.saveChecklist({ ...template, createdBy: activeUser });
      await ApiClient.publishChecklist(saved.id);
      showNotification("success", "Checklist publicado com sucesso!");
      setTimeout(() => router.push("/checklists"), 1000);
    } catch (e) {
      showNotification("error", e instanceof Error ? e.message : "Erro ao publicar.");
    }
  };

  const questionTypes: { type: QuestionType; label: string }[] = [
    { type: "yes_no", label: "Sim / Não" },
    { type: "yes_no_na", label: "Sim / Não / N/A" },
    { type: "text", label: "Texto Curto" },
    { type: "textarea", label: "Texto Longo" },
    { type: "number", label: "Número / Medição" },
    { type: "single_choice", label: "Escolha Única (Select)" },
    { type: "multiple_choice", label: "Múltipla Escolha" },
    { type: "photo", label: "Evidência Fotográfica" },
    { type: "signature", label: "Assinatura Digital" },
    { type: "date", label: "Data" },
    { type: "time", label: "Hora" },
  ];

  return (
    <>
      <AppHeader
        pageTitle={editId ? `Editar Rascunho (v${template.version}.0)` : "Novo Template de Checklist"}
        breadcrumb={["NexusOps", "Checklists", editId ? "Editar" : "Novo"]}
      />

      <main className="flex-1 p-6" style={{ backgroundColor: "var(--surface-page)" }}>
        {/* Banner de Notificação */}
        {notification && (
          <div
            className="p-4 mb-6 text-xs font-semibold rounded-lg flex items-center gap-2"
            style={{
              backgroundColor: notification.type === "success" ? "var(--success-soft)" : "var(--danger-soft)",
              color: notification.type === "success" ? "var(--success-foreground)" : "var(--danger-foreground)",
            }}
          >
            <span>{notification.text}</span>
          </div>
        )}

        {/* Top Action Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <Link
              href="/checklists"
              className="p-2 rounded-md border bg-white text-slate-600 hover:bg-slate-50 transition-colors"
              style={{ borderColor: "var(--border-default)" }}
            >
              <ArrowLeft size={16} />
            </Link>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {template.title || "Sem Título Definido"}
              </h2>
              <p className="text-xs text-slate-500">
                Versão: <strong>v{template.version}.0</strong> ({template.status.toUpperCase()})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Toggle de Pré-Visualização */}
            <button
              onClick={() => setIsPreviewMode(!isPreviewMode)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md border transition-colors ${
                isPreviewMode ? "bg-blue-50 border-blue-600 text-blue-600" : "bg-white border-slate-300 text-slate-700"
              }`}
            >
              <Eye size={14} />
              <span>{isPreviewMode ? "Voltar ao Editor" : "Pré-visualizar"}</span>
            </button>

            {/* Salvar Rascunho */}
            {permissions.canEditDraft && (
              <button
                onClick={handleSaveDraft}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md border bg-white text-slate-700 hover:bg-slate-50"
                style={{ borderColor: "var(--border-default)" }}
              >
                <Save size={14} />
                <span>Salvar Rascunho</span>
              </button>
            )}

            {/* Publicar */}
            {permissions.canPublish && (
              <button
                onClick={handlePublish}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md text-white shadow-sm"
                style={{ backgroundColor: "var(--success)" }}
              >
                <Send size={14} />
                <span>Publicar Checklist</span>
              </button>
            )}
          </div>
        </div>

        {/* Modo Pré-Visualização (Simulador) */}
        {isPreviewMode ? (
          <div className="max-w-2xl mx-auto bg-white p-6 rounded-xl border shadow-lg space-y-6" style={{ borderColor: "var(--border-default)" }}>
            <div className="border-b pb-4">
              <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">{categoryLabel[template.category]}</span>
              <h3 className="text-xl font-bold text-slate-900 mt-1">{template.title || "Título do Checklist"}</h3>
              <p className="text-xs text-slate-500 mt-1">{template.description || "Sem descrição."}</p>
            </div>

            {template.sections.map((sec) => (
              <div key={sec.id} className="space-y-4">
                <h4 className="font-bold text-sm text-slate-800 border-b pb-1">{sec.title}</h4>
                {sec.questions.map((q) => (
                  <div key={q.id} className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-2 text-xs">
                    <p className="font-semibold text-slate-900">
                      {q.text} {q.isRequired && <span className="text-red-500">*</span>}
                    </p>

                    {/* Exibição simulada do controle */}
                    {q.type === "yes_no" && (
                      <div className="flex gap-2">
                        <button className="px-3 py-1.5 bg-white border rounded font-semibold text-slate-700">✓ Sim</button>
                        <button className="px-3 py-1.5 bg-white border rounded font-semibold text-slate-700">✕ Não</button>
                      </div>
                    )}
                    {q.type === "yes_no_na" && (
                      <div className="flex gap-2">
                        <button className="px-3 py-1.5 bg-white border rounded font-semibold text-slate-700">✓ Sim</button>
                        <button className="px-3 py-1.5 bg-white border rounded font-semibold text-slate-700">✕ Não</button>
                        <button className="px-3 py-1.5 bg-white border rounded font-semibold text-slate-700">N/A</button>
                      </div>
                    )}
                    {q.type === "text" && <input disabled placeholder="Resposta em texto curto..." className="w-full p-2 bg-white border rounded text-xs" />}
                    {q.type === "textarea" && <textarea disabled placeholder="Resposta em texto longo..." className="w-full p-2 bg-white border rounded text-xs" rows={2} />}
                    {q.type === "number" && <input disabled type="number" placeholder="Digite um valor numérico..." className="w-48 p-2 bg-white border rounded text-xs" />}
                    {q.type === "photo" && (
                      <div className="p-3 bg-white border border-dashed rounded text-center text-blue-600 font-semibold cursor-pointer">
                        📷 Simular Anexo de Foto
                      </div>
                    )}
                    {q.type === "signature" && (
                      <div className="p-3 bg-white border border-dashed rounded text-center text-slate-400 font-mono">
                        [ Campo de Assinatura Touch / Digital ]
                      </div>
                    )}
                    {["date", "time"].includes(q.type) && <input disabled type={q.type} className="w-48 p-2 bg-white border rounded text-xs" />}
                    {["single_choice", "multiple_choice"].includes(q.type) && (
                      <div className="space-y-2">
                        {(q.options || []).map((option) => <label key={option.id} className="flex items-center gap-2"><input disabled type={q.type === "multiple_choice" ? "checkbox" : "radio"} />{option.label}</label>)}
                      </div>
                    )}

                    <div className="flex gap-3 text-[10px] text-slate-400 pt-1">
                      {q.requirePhoto && <span>• Exige Foto</span>}
                      {q.requireJustification && <span>• Exige Justificativa</span>}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        ) : (
          /* Modo Editor */
          <div className="space-y-6">
            {/* Dados Principais do Template */}
            <div className="bg-white p-6 rounded-xl border shadow-sm space-y-4" style={{ borderColor: "var(--border-default)" }}>
              <h3 className="font-bold text-sm text-slate-900 border-b pb-2">Informações Gerais</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Título do Checklist *</label>
                  <input
                    type="text"
                    value={template.title}
                    onChange={(e) => setTemplate({ ...template, title: e.target.value })}
                    placeholder="Ex: Vistoria de Saída — Veículos da Frota"
                    className="w-full p-2.5 border rounded-md text-xs outline-none focus:border-blue-600"
                    style={{ borderColor: "var(--border-default)" }}
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Categoria Operacional</label>
                  <select
                    value={template.category}
                    onChange={(e) => setTemplate({ ...template, category: e.target.value })}
                    className="w-full p-2.5 border rounded-md text-xs outline-none focus:border-blue-600"
                    style={{ borderColor: "var(--border-default)" }}
                  >
                    <option value="INSTALACAO_MANUTENCAO">Instalação & Manutenção</option>
                    <option value="INFRAESTRUTURA">Infraestrutura</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1 text-xs">Descrição / Instruções do Checklist</label>
                <textarea
                  value={template.description || ""}
                  onChange={(e) => setTemplate({ ...template, description: e.target.value })}
                  placeholder="Orientações aos técnicos antes do início da inspeção..."
                  rows={2}
                  className="w-full p-2.5 border rounded-md text-xs outline-none focus:border-blue-600"
                  style={{ borderColor: "var(--border-default)" }}
                />
              </div>
            </div>

            {/* Seções e Perguntas */}
            {template.sections.map((sec, secIndex) => (
              <div key={sec.id} className="bg-white p-6 rounded-xl border shadow-sm space-y-4" style={{ borderColor: "var(--border-default)" }}>
                <div className="flex items-center justify-between border-b pb-3">
                  <input
                    type="text"
                    value={sec.title}
                    onChange={(e) => {
                      const title = e.target.value;
                      setTemplate((prev) => ({
                        ...prev,
                        sections: prev.sections.map((s) => (s.id === sec.id ? { ...s, title } : s)),
                      }));
                    }}
                    className="font-bold text-sm text-slate-900 border-b border-transparent hover:border-slate-300 focus:border-blue-600 outline-none w-2/3"
                  />
                  <button
                    onClick={() => removeSection(sec.id)}
                    className="text-xs text-red-600 hover:text-red-800 font-semibold flex items-center gap-1"
                  >
                    <Trash2 size={14} /> Excluir Seção
                  </button>
                </div>

                {/* Perguntas da Seção */}
                <div className="space-y-4">
                  {sec.questions.map((q, qIndex) => (
                    <div key={q.id} className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <span className="font-mono font-bold text-xs text-blue-600 mt-1">{qIndex + 1}.</span>
                        <input
                          type="text"
                          value={q.text}
                          onChange={(e) => updateQuestion(sec.id, q.id, { text: e.target.value })}
                          placeholder="Digite a pergunta de verificação..."
                          className="flex-1 p-2 text-xs font-semibold border rounded bg-white outline-none focus:border-blue-600"
                        />
                        <button
                          onClick={() => removeQuestion(sec.id, q.id)}
                          className="text-red-500 hover:text-red-700 p-1"
                          title="Remover Pergunta"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs pt-2">
                        {/* Tipo da Pergunta */}
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 mb-1">Tipo de Resposta</label>
                          <select
                            value={q.type}
                            onChange={(e) => updateQuestionType(sec.id, q, e.target.value as QuestionType)}
                            className="w-full p-2 border rounded bg-white text-xs outline-none"
                          >
                            {questionTypes.map((qt) => (
                              <option key={qt.type} value={qt.type}>
                                {qt.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Toggle Obrigatoriedade */}
                        <div className="flex items-center gap-2 pt-4">
                          <input
                            type="checkbox"
                            id={`req-${q.id}`}
                            checked={q.isRequired}
                            onChange={(e) => updateQuestion(sec.id, q.id, { isRequired: e.target.checked })}
                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                          />
                          <label htmlFor={`req-${q.id}`} className="text-xs font-medium text-slate-700 cursor-pointer">
                            Resposta Obrigatória
                          </label>
                        </div>

                        {/* Toggle Exigir Foto */}
                        {q.type !== "photo" && <div className="flex items-center gap-2 pt-4">
                          <input
                            type="checkbox"
                            id={`photo-${q.id}`}
                            checked={q.requirePhoto}
                            onChange={(e) => updateQuestion(sec.id, q.id, { requirePhoto: e.target.checked })}
                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                          />
                          <label htmlFor={`photo-${q.id}`} className="text-xs font-medium text-slate-700 cursor-pointer">
                            Exigir Foto Comprovatória
                          </label>
                        </div>}

                        {/* Toggle Exigir Justificativa */}
                        <div className="flex items-center gap-2 pt-4">
                          <input
                            type="checkbox"
                            id={`just-${q.id}`}
                            checked={q.requireJustification}
                            onChange={(e) => updateQuestion(sec.id, q.id, { requireJustification: e.target.checked })}
                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                          />
                          <label htmlFor={`just-${q.id}`} className="text-xs font-medium text-slate-700 cursor-pointer">
                            Exigir Justificativa
                          </label>
                        </div>
                      </div>

                      {(q.type === "single_choice" || q.type === "multiple_choice") && (
                        <div className="rounded-md border border-blue-100 bg-blue-50/50 p-3 space-y-2">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="text-xs font-semibold text-slate-800">Opções de resposta</p>
                              <p className="text-[11px] text-slate-500">Estas opções aparecerão para o técnico.</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => updateQuestion(sec.id, q.id, { options: [...(q.options || []), { id: `option-${Date.now()}`, label: `Opção ${(q.options?.length || 0) + 1}` }] })}
                              className="text-xs font-semibold text-blue-700 hover:text-blue-900"
                            >
                              + Adicionar opção
                            </button>
                          </div>
                          {(q.options || []).map((option, optionIndex) => (
                            <div key={option.id} className="flex items-center gap-2">
                              <input
                                type="text"
                                value={option.label}
                                onChange={(e) => updateQuestion(sec.id, q.id, { options: (q.options || []).map((item, index) => index === optionIndex ? { ...item, label: e.target.value } : item) })}
                                className="flex-1 p-2 text-xs border rounded bg-white outline-none focus:border-blue-600"
                                aria-label={`Opção ${optionIndex + 1}`}
                              />
                              <button
                                type="button"
                                onClick={() => updateQuestion(sec.id, q.id, { options: (q.options || []).filter((_, index) => index !== optionIndex) })}
                                className="p-1 text-red-600 hover:text-red-800"
                                aria-label={`Excluir opção ${optionIndex + 1}`}
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}

                  <button
                    onClick={() => addQuestion(sec.id)}
                    className="w-full py-2 border border-dashed border-slate-300 rounded-md text-xs font-semibold text-blue-600 hover:bg-blue-50 flex items-center justify-center gap-1"
                  >
                    <Plus size={14} /> Adicionar Pergunta nesta Seção
                  </button>
                </div>
              </div>
            ))}

            <button
              onClick={addSection}
              className="w-full py-3 border-2 border-dashed border-blue-200 bg-blue-50/50 rounded-xl text-xs font-bold text-blue-600 hover:bg-blue-100 flex items-center justify-center gap-2"
            >
              <Plus size={16} /> Adicionar Nova Seção ao Checklist
            </button>
          </div>
        )}
      </main>
    </>
  );
}

export default function ChecklistBuilderPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-xs">Carregando construtor...</div>}>
      <BuilderContent />
    </Suspense>
  );
}
