import { UserRole } from "./checklist";

export interface ManagedUser {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  operationalCategory: "INSTALACAO_MANUTENCAO" | "INFRAESTRUTURA";
  createdAt: string;
  updatedAt: string;
}

export type ManagedUserPayload = Pick<
  ManagedUser,
  "fullName" | "email" | "role" | "isActive" | "operationalCategory"
> & {
  temporaryPassword?: string;
};
