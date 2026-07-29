export interface Technician {
  id: string;
  fullName: string;
  email: string;
  employeeCode?: string;
  phone?: string;
  teamName?: string;
  specialty?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type TechnicianPayload = Omit<
  Technician,
  "id" | "createdAt" | "updatedAt"
> & { temporaryPassword?: string };
