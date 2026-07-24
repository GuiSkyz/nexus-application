export type UserRole = "TECNICO" | "SUPERVISOR" | "COORDENADOR" | "DIRETOR" | "ADMIN";

export type ChecklistStatus = "draft" | "published" | "archived";

export type QuestionType =
  | "yes_no"
  | "yes_no_na"
  | "text"
  | "textarea"
  | "number"
  | "single_choice"
  | "multiple_choice"
  | "photo"
  | "signature"
  | "date"
  | "time";

export interface ChecklistQuestionOption {
  id: string;
  label: string;
}

export interface ChecklistQuestion {
  id: string;
  text: string;
  type: QuestionType;
  isRequired: boolean;
  requirePhoto: boolean;
  requireJustification: boolean;
  options?: ChecklistQuestionOption[]; // Para single_choice e multiple_choice
  order: number;
}

export interface ChecklistSection {
  id: string;
  title: string;
  description?: string;
  order: number;
  questions: ChecklistQuestion[];
}

export interface ChecklistTemplate {
  id: string; // Ex: "tpl-101-v1"
  templateId: string; // ID fixo da família do template, Ex: "tpl-101"
  title: string;
  category: string;
  description?: string;
  status: ChecklistStatus;
  version: number; // Ex: 1, 2, 3
  isLatestVersion: boolean;
  createdBy: string;
  createdAt: string; // ISO UTC
  updatedAt: string; // ISO UTC
  publishedAt?: string;
  archivedAt?: string;
  usageCount: number; // Número de inspeções que já utilizaram este template
  sections: ChecklistSection[];
}

export interface AuditLog {
  id: string;
  templateId: string;
  templateTitle: string;
  action:
    | "CREATE_DRAFT"
    | "UPDATE_DRAFT"
    | "PUBLISH"
    | "CREATE_NEW_VERSION"
    | "ARCHIVE"
    | "DUPLICATE"
    | "DELETE";
  performedBy: string;
  userRole: UserRole;
  timestamp: string;
  details: string;
}

// Matriz de Permissões RBAC
export interface RolePermissions {
  canReadPublished: boolean;
  canReadDrafts: boolean;
  canCreate: boolean;
  canEditDraft: boolean;
  canCreateNewVersion: boolean;
  canPublish: boolean;
  canArchive: boolean;
  canDelete: boolean;
  canViewHistory: boolean;
}

export const ROLE_PERMISSIONS_MAP: Record<UserRole, RolePermissions> = {
  TECNICO: {
    canReadPublished: true,
    canReadDrafts: false,
    canCreate: false,
    canEditDraft: false,
    canCreateNewVersion: false,
    canPublish: false,
    canArchive: false,
    canDelete: false,
    canViewHistory: false,
  },
  SUPERVISOR: {
    canReadPublished: true,
    canReadDrafts: true,
    canCreate: false,
    canEditDraft: false,
    canCreateNewVersion: false,
    canPublish: false,
    canArchive: false,
    canDelete: false,
    canViewHistory: true,
  },
  COORDENADOR: {
    canReadPublished: true,
    canReadDrafts: true,
    canCreate: true,
    canEditDraft: true,
    canCreateNewVersion: true,
    canPublish: true,
    canArchive: true,
    canDelete: false, // Coordenador não pode excluir definitivamente
    canViewHistory: true,
  },
  DIRETOR: {
    canReadPublished: true,
    canReadDrafts: true,
    canCreate: true,
    canEditDraft: true,
    canCreateNewVersion: true,
    canPublish: true,
    canArchive: true,
    canDelete: true, // Condicionado a nunca ter sido publicado/utilizado
    canViewHistory: true,
  },
  ADMIN: {
    canReadPublished: true,
    canReadDrafts: true,
    canCreate: true,
    canEditDraft: true,
    canCreateNewVersion: true,
    canPublish: true,
    canArchive: true,
    canDelete: true, // Condicionado a nunca ter sido publicado/utilizado
    canViewHistory: true,
  },
};
