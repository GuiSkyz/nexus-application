import { ChecklistTemplate, AuditLog, UserRole } from "@/types/checklist";

let mockChecklistStore: ChecklistTemplate[] = [
  {
    id: "tpl-101-v1",
    templateId: "tpl-101",
    title: "Vistoria de Saída — Veículos da Frota",
    category: "Frota & Veículos",
    description: "Checklist obrigatório de conferência de itens de segurança e mecânica para saída de veículos operacionais.",
    status: "published",
    version: 1,
    isLatestVersion: true,
    createdBy: "Roberto Alcantara (Coordenador)",
    createdAt: "2026-07-01T08:00:00Z",
    updatedAt: "2026-07-01T09:30:00Z",
    publishedAt: "2026-07-01T09:30:00Z",
    usageCount: 42,
    sections: [
      {
        id: "sec-1",
        title: "Equipamentos Obrigatórios & Documentação",
        description: "Itens exigidos pelo CTB e regulamentação interna.",
        order: 1,
        questions: [
          {
            id: "q1",
            text: "Triângulo de sinalização, macaco hidráulico e chave de roda estão no veículo e funcionais?",
            type: "yes_no",
            isRequired: true,
            requirePhoto: true,
            requireJustification: false,
            order: 1,
          },
          {
            id: "q2",
            text: "CRLVE físico ou digital do veículo está atualizado e presente?",
            type: "yes_no_na",
            isRequired: true,
            requirePhoto: false,
            requireJustification: true,
            order: 2,
          },
        ],
      },
      {
        id: "sec-2",
        title: "Pneus & Iluminação",
        description: "Verificação mecânica rápida antes da saída.",
        order: 2,
        questions: [
          {
            id: "q3",
            text: "Informe a quilometragem atual do odômetro do veículo:",
            type: "number",
            isRequired: true,
            requirePhoto: true,
            requireJustification: false,
            order: 1,
          },
          {
            id: "q4",
            text: "Estado de conservação dos 4 pneus e do estepe:",
            type: "single_choice",
            isRequired: true,
            requirePhoto: false,
            requireJustification: false,
            options: [
              { id: "opt-1", label: "Ótimo / Semissubstituído" },
              { id: "opt-2", label: "Bom / Desgaste Normal" },
              { id: "opt-3", label: "Alerta / Requer Troca Próxima" },
              { id: "opt-4", label: "Crítico / Pneu Careca" },
            ],
            order: 2,
          },
          {
            id: "q5",
            text: "Assinatura do Técnico Responsável pela Vistoria:",
            type: "signature",
            isRequired: true,
            requirePhoto: false,
            requireJustification: false,
            order: 3,
          },
        ],
      },
    ],
  },
  {
    id: "tpl-102-v1",
    templateId: "tpl-102",
    title: "Segurança para Trabalho em Altura & NR-35",
    category: "Segurança & NR",
    description: "Inspeção de pré-operação para subida em postes e estruturas elevadas.",
    status: "published",
    version: 1,
    isLatestVersion: true,
    createdBy: "Mariana Souza (Diretora EHS)",
    createdAt: "2026-07-10T10:00:00Z",
    updatedAt: "2026-07-10T11:00:00Z",
    publishedAt: "2026-07-10T11:00:00Z",
    usageCount: 18,
    sections: [
      {
        id: "sec-102-1",
        title: "EPIs & Ancoragem",
        order: 1,
        questions: [
          {
            id: "q102-1",
            text: "Cinto de segurança tipo paraquedista e talabarte duplo inspecionados sem desgastes?",
            type: "yes_no",
            isRequired: true,
            requirePhoto: true,
            requireJustification: true,
            order: 1,
          },
          {
            id: "q102-2",
            text: "Foto comprovatória do capacete de proteção com jugular travada:",
            type: "photo",
            isRequired: true,
            requirePhoto: true,
            requireJustification: false,
            order: 2,
          },
        ],
      },
    ],
  },
  {
    id: "tpl-103-v1",
    templateId: "tpl-103",
    title: "Vistoria de Ferramental Óptico & Maquinas de Fusão",
    category: "Telecom & Redes",
    description: "Rascunho inicial do novo modelo de checklist para equipes de fusão de fibra óptica.",
    status: "draft",
    version: 1,
    isLatestVersion: true,
    createdBy: "Roberto Alcantara (Coordenador)",
    createdAt: "2026-07-20T14:00:00Z",
    updatedAt: "2026-07-22T16:00:00Z",
    usageCount: 0,
    sections: [
      {
        id: "sec-103-1",
        title: "Conferência de Kit Óptico",
        order: 1,
        questions: [
          {
            id: "q103-1",
            text: "Clivador de precisão e decapador de fibra calibrados?",
            type: "yes_no_na",
            isRequired: true,
            requirePhoto: false,
            requireJustification: false,
            order: 1,
          },
          {
            id: "q103-2",
            text: "Descreva qualquer anomalia encontrada nos conectores ou Power Meter:",
            type: "textarea",
            isRequired: false,
            requirePhoto: false,
            requireJustification: false,
            order: 2,
          },
        ],
      },
    ],
  },
  {
    id: "tpl-100-v1",
    templateId: "tpl-100",
    title: "Checklist Antigo de Vistoria de Cabos (Descontinuado)",
    category: "Telecom & Redes",
    description: "Modelo antigo substituído pela versão atualizada de frota.",
    status: "archived",
    version: 1,
    isLatestVersion: true,
    createdBy: "Admin Geral",
    createdAt: "2026-05-01T08:00:00Z",
    updatedAt: "2026-06-15T10:00:00Z",
    publishedAt: "2026-05-01T09:00:00Z",
    archivedAt: "2026-06-15T10:00:00Z",
    usageCount: 15,
    sections: [],
  },
];

let mockAuditLogs: AuditLog[] = [
  {
    id: "log-1",
    templateId: "tpl-101",
    templateTitle: "Vistoria de Saída — Veículos da Frota",
    action: "PUBLISH",
    performedBy: "Roberto Alcantara",
    userRole: "COORDENADOR",
    timestamp: "2026-07-01T09:30:00Z",
    details: "Template publicado na versão 1.0 e disponibilizado para execução no mobile.",
  },
  {
    id: "log-2",
    templateId: "tpl-102",
    templateTitle: "Segurança para Trabalho em Altura & NR-35",
    action: "PUBLISH",
    performedBy: "Mariana Souza",
    userRole: "DIRETOR",
    timestamp: "2026-07-10T11:00:00Z",
    details: "Template de NR-35 homologado e publicado v1.0.",
  },
  {
    id: "log-3",
    templateId: "tpl-103",
    templateTitle: "Vistoria de Ferramental Óptico & Maquinas de Fusão",
    action: "CREATE_DRAFT",
    performedBy: "Roberto Alcantara",
    userRole: "COORDENADOR",
    timestamp: "2026-07-20T14:00:00Z",
    details: "Novo rascunho v1.0 criado para homologação.",
  },
];

export class MockChecklistService {
  static getTemplates(): ChecklistTemplate[] {
    return [...mockChecklistStore];
  }

  static getTemplateById(id: string): ChecklistTemplate | undefined {
    return mockChecklistStore.find((t) => t.id === id);
  }

  static getAuditLogs(): AuditLog[] {
    return [...mockAuditLogs].reverse();
  }

  /**
   * Salva ou edita um rascunho.
   */
  static saveDraft(template: ChecklistTemplate, performedBy: string, role: UserRole): ChecklistTemplate {
    const existingIndex = mockChecklistStore.findIndex((t) => t.id === template.id);

    const now = new Date().toISOString();
    const updatedTemplate: ChecklistTemplate = {
      ...template,
      updatedAt: now,
      status: "draft",
    };

    if (existingIndex >= 0) {
      mockChecklistStore[existingIndex] = updatedTemplate;
    } else {
      mockChecklistStore.push(updatedTemplate);
    }

    // Registrar log
    mockAuditLogs.push({
      id: `log-${Date.now()}`,
      templateId: updatedTemplate.templateId,
      templateTitle: updatedTemplate.title,
      action: existingIndex >= 0 ? "UPDATE_DRAFT" : "CREATE_DRAFT",
      performedBy,
      userRole: role,
      timestamp: now,
      details: `Rascunho ${updatedTemplate.title} (v${updatedTemplate.version}.0) gravado com sucesso.`,
    });

    return updatedTemplate;
  }

  /**
   * Ao editar um checklist PUBLICADO: cria uma NOVA VERSÃO em rascunho (draft).
   * A versão publicada anterior permanece imutável e com isLatestVersion: false.
   */
  static createDraftFromPublished(publishedId: string, performedBy: string, role: UserRole): ChecklistTemplate {
    const published = this.getTemplateById(publishedId);
    if (!published || published.status !== "published") {
      throw new Error("Apenas checklists no estado publicado podem gerar nova versão.");
    }

    const newVersionNumber = published.version + 1;
    const newId = `${published.templateId}-v${newVersionNumber}`;
    const now = new Date().toISOString();

    // Desmarcar versão antiga como isLatestVersion
    published.isLatestVersion = false;

    const newDraft: ChecklistTemplate = {
      ...JSON.parse(JSON.stringify(published)),
      id: newId,
      version: newVersionNumber,
      status: "draft",
      isLatestVersion: true,
      createdAt: now,
      updatedAt: now,
      publishedAt: undefined,
      usageCount: 0, // Nova versão inicia com 0 usos
    };

    mockChecklistStore.push(newDraft);

    mockAuditLogs.push({
      id: `log-${Date.now()}`,
      templateId: published.templateId,
      templateTitle: published.title,
      action: "CREATE_NEW_VERSION",
      performedBy,
      userRole: role,
      timestamp: now,
      details: `Criada nova versão em rascunho (v${newVersionNumber}.0) a partir da v${published.version}.0 publicada.`,
    });

    return newDraft;
  }

  /**
   * Publica um checklist no estado RASCUNHO.
   */
  static publishTemplate(id: string, performedBy: string, role: UserRole): ChecklistTemplate {
    const template = this.getTemplateById(id);
    if (!template) throw new Error("Checklist não encontrado.");
    if (template.status !== "draft") throw new Error("Apenas rascunhos podem ser publicados.");

    const now = new Date().toISOString();
    template.status = "published";
    template.publishedAt = now;
    template.updatedAt = now;

    mockAuditLogs.push({
      id: `log-${Date.now()}`,
      templateId: template.templateId,
      templateTitle: template.title,
      action: "PUBLISH",
      performedBy,
      userRole: role,
      timestamp: now,
      details: `Checklist ${template.title} v${template.version}.0 publicado e liberado para o mobile.`,
    });

    return template;
  }

  /**
   * Arquiva um checklist publicado.
   */
  static archiveTemplate(id: string, performedBy: string, role: UserRole): ChecklistTemplate {
    const template = this.getTemplateById(id);
    if (!template) throw new Error("Checklist não encontrado.");

    const now = new Date().toISOString();
    template.status = "archived";
    template.archivedAt = now;
    template.updatedAt = now;

    mockAuditLogs.push({
      id: `log-${Date.now()}`,
      templateId: template.templateId,
      templateTitle: template.title,
      action: "ARCHIVE",
      performedBy,
      userRole: role,
      timestamp: now,
      details: `Checklist ${template.title} arquivado. Bloqueado para novas inspeções no mobile.`,
    });

    return template;
  }

  /**
   * Duplica qualquer checklist criando uma nova família de rascunho v1.0.
   */
  static duplicateTemplate(id: string, performedBy: string, role: UserRole): ChecklistTemplate {
    const source = this.getTemplateById(id);
    if (!source) throw new Error("Checklist não encontrado.");

    const newFamilyId = `tpl-${Math.floor(100 + Math.random() * 900)}`;
    const newId = `${newFamilyId}-v1`;
    const now = new Date().toISOString();

    const clone: ChecklistTemplate = {
      ...JSON.parse(JSON.stringify(source)),
      id: newId,
      templateId: newFamilyId,
      title: `${source.title} (Cópia)`,
      status: "draft",
      version: 1,
      isLatestVersion: true,
      createdBy: performedBy,
      createdAt: now,
      updatedAt: now,
      publishedAt: undefined,
      archivedAt: undefined,
      usageCount: 0,
    };

    mockChecklistStore.push(clone);

    mockAuditLogs.push({
      id: `log-${Date.now()}`,
      templateId: newFamilyId,
      templateTitle: clone.title,
      action: "DUPLICATE",
      performedBy,
      userRole: role,
      timestamp: now,
      details: `Duplicado a partir de ${source.title} (v${source.version}.0).`,
    });

    return clone;
  }

  /**
   * Exclusão definitiva RESTRITA:
   * Apenas Diretor/Admin podem excluir, E somente se status === 'draft', nunca foi publicado (publishedAt undefined)
   * e usageCount === 0.
   */
  static deleteTemplate(id: string, performedBy: string, role: UserRole): void {
    if (role !== "DIRETOR" && role !== "ADMIN") {
      throw new Error("Apenas Diretores ou Administradores possuem permissão para exclusão definitiva.");
    }

    const template = this.getTemplateById(id);
    if (!template) throw new Error("Checklist não encontrado.");

    if (template.status === "published" || template.publishedAt || template.usageCount > 0) {
      throw new Error("Impossível excluir: checklists que já foram publicados ou possuem histórico de uso não podem ser deletados.");
    }

    mockChecklistStore = mockChecklistStore.filter((t) => t.id !== id);

    mockAuditLogs.push({
      id: `log-${Date.now()}`,
      templateId: template.templateId,
      templateTitle: template.title,
      action: "DELETE",
      performedBy,
      userRole: role,
      timestamp: new Date().toISOString(),
      details: `Rascunho não-publicado ${template.title} excluído definitivamente do sistema.`,
    });
  }
}
