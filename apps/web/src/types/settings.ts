export interface OperationalSettings {
  id: string;
  organizationName: string;
  timezone: string;
  aprApprovalRequired: boolean;
  criticalIncidentNotifications: boolean;
  checklistReminderHour: number;
  evidenceRetentionDays: number;
  supportEmail?: string;
  reportFooter?: string;
  updatedAt: string;
}
