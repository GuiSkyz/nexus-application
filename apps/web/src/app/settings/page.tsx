"use client";

import { FormEvent, useEffect, useState } from "react";
import { Bell, Building2, Database, Save, ShieldCheck } from "lucide-react";

import { AppHeader } from "@/components/nexus/app-header";
import { ApiClient } from "@/lib/apiClient";
import { OperationalSettings } from "@/types/settings";

export default function SettingsPage() {
  const [settings, setSettings] = useState<OperationalSettings | null>(null);
  const [feedback, setFeedback] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    ApiClient.fetchSettings().then(setSettings).catch((error) => setFeedback(error.message));
  }, []);

  const save = async (event: FormEvent) => {
    event.preventDefault();
    if (!settings) return;
    setSaving(true);
    try {
      const { id: _id, updatedAt: _updatedAt, ...payload } = settings;
      setSettings(await ApiClient.saveSettings(payload));
      setFeedback("Configurações salvas e aplicadas.");
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Não foi possível salvar.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <AppHeader pageTitle="Configurações" breadcrumb={["Gestão", "Configurações"]} />
      <main className="space-y-5 p-6">
        <section className="border-b pb-5"><h1 className="text-xl font-bold text-text-primary">Políticas operacionais</h1><p className="mt-1 text-sm text-text-secondary">Parâmetros compartilhados pela aplicação web, API e fluxo dos técnicos.</p></section>
        {feedback && <div role="status" className="rounded-lg bg-info-soft px-4 py-3 text-sm font-semibold text-info-foreground">{feedback}</div>}
        {!settings ? <div className="skeleton h-96" /> : <form onSubmit={save} className="space-y-5">
          <SettingsSection icon={<Building2 />} title="Organização" description="Identificação e dados exibidos em relatórios.">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Nome da organização"><input required value={settings.organizationName} onChange={(e) => setSettings({ ...settings, organizationName: e.target.value })} /></Field>
              <Field label="Fuso horário"><select value={settings.timezone} onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}><option value="America/Sao_Paulo">Brasília (São Paulo)</option><option value="America/Manaus">Manaus</option><option value="America/Recife">Recife</option></select></Field>
              <Field label="E-mail de suporte"><input type="email" value={settings.supportEmail || ""} onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })} /></Field>
              <Field label="Rodapé dos relatórios"><input value={settings.reportFooter || ""} onChange={(e) => setSettings({ ...settings, reportFooter: e.target.value })} /></Field>
            </div>
          </SettingsSection>
          <SettingsSection icon={<ShieldCheck />} title="Segurança operacional" description="Regras que bloqueiam ou liberam atividades.">
            <Toggle checked={settings.aprApprovalRequired} onChange={(checked) => setSettings({ ...settings, aprApprovalRequired: checked })} title="Exigir autorização de APR" description="A atividade permanece bloqueada até a decisão do supervisor." />
            <Toggle checked={settings.criticalIncidentNotifications} onChange={(checked) => setSettings({ ...settings, criticalIncidentNotifications: checked })} title="Alertar NCs críticas" description="Sinaliza imediatamente desvios classificados como críticos." />
          </SettingsSection>
          <SettingsSection icon={<Bell />} title="Rotina e retenção" description="Lembretes de campo e preservação de evidências.">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Hora do lembrete diário"><input type="number" min={0} max={23} value={settings.checklistReminderHour} onChange={(e) => setSettings({ ...settings, checklistReminderHour: Number(e.target.value) })} /></Field>
              <Field label="Retenção de evidências (dias)"><input type="number" min={30} max={3650} value={settings.evidenceRetentionDays} onChange={(e) => setSettings({ ...settings, evidenceRetentionDays: Number(e.target.value) })} /></Field>
            </div>
          </SettingsSection>
          <div className="flex items-center justify-between rounded-xl bg-nexus-navy-900 px-5 py-4 text-white"><div className="flex items-center gap-3"><Database className="h-5 w-5 text-nexus-cyan-500" /><div><p className="text-sm font-bold">Persistência PostgreSQL</p><p className="text-xs text-slate-300">Última atualização: {new Date(settings.updatedAt).toLocaleString("pt-BR")}</p></div></div><button disabled={saving} className="inline-flex h-10 items-center gap-2 rounded-md bg-white px-4 text-xs font-bold text-nexus-navy-900 disabled:opacity-60"><Save className="h-4 w-4" />{saving ? "Salvando..." : "Salvar configurações"}</button></div>
        </form>}
      </main>
    </>
  );
}

function SettingsSection({ icon, title, description, children }: { icon: React.ReactNode; title: string; description: string; children: React.ReactNode }) {
  return <section className="rounded-xl border bg-white"><div className="flex items-center gap-3 border-b px-5 py-4"><span className="text-nexus-blue-600">{icon}</span><div><h2 className="text-sm font-bold text-text-primary">{title}</h2><p className="text-xs text-text-secondary">{description}</p></div></div><div className="space-y-4 p-5">{children}</div></section>;
}
function Field({ label, children }: { label: string; children: React.ReactElement }) {
  return <label className="text-xs font-semibold text-text-secondary">{label}<span className="[&>*]:mt-1 [&>*]:h-10 [&>*]:w-full [&>*]:rounded-md [&>*]:border [&>*]:bg-white [&>*]:px-3">{children}</span></label>;
}
function Toggle({ checked, onChange, title, description }: { checked: boolean; onChange: (checked: boolean) => void; title: string; description: string }) {
  return <label className="flex cursor-pointer items-center justify-between gap-4 rounded-lg bg-surface-subtle px-4 py-3"><span><span className="block text-sm font-bold text-text-primary">{title}</span><span className="mt-1 block text-xs text-text-secondary">{description}</span></span><input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-5 w-5 accent-nexus-blue-600" /></label>;
}
