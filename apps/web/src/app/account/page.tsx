"use client";

import { FormEvent, useState } from "react";
import { KeyRound } from "lucide-react";

import { AppHeader } from "@/components/nexus/app-header";
import { useAuth } from "@/components/nexus/auth-provider";
import { ApiClient } from "@/lib/apiClient";

export default function AccountPage() {
  const { user } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setMessage("");
    if (newPassword !== confirmation) {
      setError("A confirmação não corresponde à nova senha.");
      return;
    }
    setSaving(true);
    try {
      await ApiClient.changePassword(currentPassword, newPassword);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmation("");
      setMessage("Senha alterada com segurança.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Falha ao alterar senha.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <AppHeader pageTitle="Segurança da conta" breadcrumb={["Conta", "Segurança"]} />
      <main className="mx-auto w-full max-w-3xl space-y-6 p-6">
        <section className="border-b pb-5">
          <h1 className="text-xl font-bold text-text-primary">Sua conta</h1>
          <p className="mt-1 text-sm text-text-secondary">
            {user?.name} · {user?.email}
          </p>
        </section>

        <section className="rounded-xl border bg-white p-6">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-nexus-blue-50 text-nexus-blue-700">
              <KeyRound className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-base font-bold text-text-primary">Alterar senha</h2>
              <p className="mt-1 text-sm text-text-secondary">
                Use pelo menos 10 caracteres e não reutilize a senha atual.
              </p>
            </div>
          </div>

          <form onSubmit={submit} className="mt-6 max-w-md space-y-4">
            {error && <p role="alert" className="rounded-md bg-danger-soft px-3 py-2 text-sm font-semibold text-danger-foreground">{error}</p>}
            {message && <p role="status" className="rounded-md bg-success-soft px-3 py-2 text-sm font-semibold text-success-foreground">{message}</p>}
            <PasswordField label="Senha atual" value={currentPassword} onChange={setCurrentPassword} autoComplete="current-password" />
            <PasswordField label="Nova senha" value={newPassword} onChange={setNewPassword} autoComplete="new-password" />
            <PasswordField label="Confirmar nova senha" value={confirmation} onChange={setConfirmation} autoComplete="new-password" />
            <button disabled={saving} className="h-10 rounded-md bg-nexus-blue-600 px-4 text-sm font-bold text-white disabled:opacity-60">
              {saving ? "Salvando…" : "Atualizar senha"}
            </button>
          </form>
        </section>
      </main>
    </>
  );
}

function PasswordField({
  label,
  value,
  onChange,
  autoComplete,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete: string;
}) {
  return (
    <label className="block text-sm font-semibold text-text-primary">
      {label}
      <input
        required
        minLength={10}
        type="password"
        autoComplete={autoComplete}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 h-10 w-full rounded-md border px-3 text-sm"
      />
    </label>
  );
}
