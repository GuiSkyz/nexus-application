"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Edit, Plus, Search, Trash2, UserCog } from "lucide-react";

import { AppHeader } from "@/components/nexus/app-header";
import { useAuth } from "@/components/nexus/auth-provider";
import { ApiClient } from "@/lib/apiClient";
import { UserRole } from "@/types/checklist";
import { ManagedUser, ManagedUserPayload } from "@/types/user";

const roleLabels: Record<UserRole, string> = {
  TECNICO: "Técnico",
  SUPERVISOR: "Supervisor",
  COORDENADOR: "Coordenador",
  DIRETOR: "Diretor",
  ADMIN: "Administrador",
  MASTER: "Master",
};

const allRoles: UserRole[] = [
  "TECNICO",
  "SUPERVISOR",
  "COORDENADOR",
  "DIRETOR",
  "ADMIN",
  "MASTER",
];

const emptyUser: Partial<ManagedUserPayload> = {
  fullName: "",
  email: "",
  role: "TECNICO",
  temporaryPassword: "",
  isActive: true,
};

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [editing, setEditing] = useState<
    (Partial<ManagedUserPayload> & { id?: string }) | null
  >(null);
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      setUsers(await ApiClient.fetchUsers());
      setError("");
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Não foi possível carregar os usuários.",
      );
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const availableRoles = useMemo(
    () =>
      currentUser?.role === "MASTER"
        ? allRoles
        : allRoles.filter((role) => !["MASTER", "ADMIN"].includes(role)),
    [currentUser?.role],
  );

  const visible = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return users.filter(
      (user) =>
        !normalized ||
        `${user.fullName} ${user.email} ${roleLabels[user.role]}`
          .toLowerCase()
          .includes(normalized),
    );
  }, [query, users]);

  const save = async (event: FormEvent) => {
    event.preventDefault();
    if (!editing) return;
    setSaving(true);
    setError("");
    try {
      await ApiClient.saveUser(editing);
      setEditing(null);
      await load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Falha ao salvar usuário.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (user: ManagedUser) => {
    if (!window.confirm(`Excluir o acesso de ${user.fullName}?`)) return;
    try {
      await ApiClient.deleteUser(user.id);
      await load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Falha ao excluir usuário.");
    }
  };

  return (
    <>
      <AppHeader pageTitle="Usuários e acessos" breadcrumb={["Gestão", "Usuários"]} />
      <main className="space-y-5 p-6">
        <section className="flex flex-col gap-4 border-b pb-5 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-xl font-bold text-text-primary">Controle de acesso</h1>
            <p className="mt-1 max-w-2xl text-sm text-text-secondary">
              Cadastre usuários, defina responsabilidades e suspenda acessos sem
              apagar o histórico operacional.
            </p>
          </div>
          <button
            onClick={() => setEditing({ ...emptyUser })}
            className="inline-flex h-10 items-center gap-2 rounded-md bg-nexus-blue-600 px-4 text-xs font-bold text-white"
          >
            <Plus className="h-4 w-4" />
            Novo usuário
          </button>
        </section>

        {error && (
          <div role="alert" className="rounded-lg bg-danger-soft px-4 py-3 text-sm font-semibold text-danger-foreground">
            {error}
          </div>
        )}

        <div className="flex flex-wrap gap-3">
          <Summary label="Usuários" value={users.length} />
          <Summary label="Ativos" value={users.filter((user) => user.isActive).length} />
          <Summary label="Cargos" value={new Set(users.map((user) => user.role)).size} />
        </div>

        <label className="relative block">
          <Search className="absolute left-3 top-3 h-4 w-4 text-text-muted" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar por nome, e-mail ou cargo"
            className="h-10 w-full rounded-md border bg-white pl-9 pr-3 text-sm"
          />
        </label>

        <section className="overflow-hidden rounded-xl border bg-white">
          {visible.length ? (
            <div className="divide-y">
              {visible.map((user) => (
                <article
                  key={user.id}
                  className="grid gap-3 px-5 py-4 md:grid-cols-[1fr_160px_100px_auto] md:items-center"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-nexus-blue-50 text-nexus-blue-700">
                      <UserCog className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                      <h2 className="truncate text-sm font-bold text-text-primary">{user.fullName}</h2>
                      <p className="truncate text-xs text-text-secondary">{user.email}</p>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-text-primary">{roleLabels[user.role]}</span>
                  <span className={`justify-self-start rounded px-2 py-1 text-[10px] font-bold ${user.isActive ? "bg-success-soft text-success-foreground" : "bg-surface-muted text-text-secondary"}`}>
                    {user.isActive ? "Ativo" : "Suspenso"}
                  </span>
                  <div className="flex justify-end gap-1">
                    <button
                      onClick={() =>
                        setEditing({
                          id: user.id,
                          fullName: user.fullName,
                          email: user.email,
                          role: user.role,
                          isActive: user.isActive,
                        })
                      }
                      className="rounded p-2 text-text-secondary hover:bg-surface-muted"
                      aria-label={`Editar ${user.fullName}`}
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => void remove(user)}
                      className="rounded p-2 text-text-secondary hover:bg-danger-soft hover:text-danger-foreground"
                      aria-label={`Excluir ${user.fullName}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <p className="py-16 text-center text-sm text-text-secondary">
              Nenhum usuário encontrado.
            </p>
          )}
        </section>
      </main>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <form onSubmit={save} className="w-full max-w-xl space-y-5 rounded-xl bg-white p-6 shadow-overlay">
            <div>
              <h2 className="text-base font-bold text-text-primary">
                {editing.id ? "Editar usuário" : "Cadastrar usuário"}
              </h2>
              <p className="mt-1 text-xs text-text-secondary">
                O cargo determina o nível de acesso real à plataforma.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Nome completo">
                <input required value={editing.fullName || ""} onChange={(event) => setEditing({ ...editing, fullName: event.target.value })} />
              </Field>
              <Field label="E-mail">
                <input required type="email" value={editing.email || ""} onChange={(event) => setEditing({ ...editing, email: event.target.value })} />
              </Field>
              <Field label="Cargo">
                <select value={editing.role || "TECNICO"} onChange={(event) => setEditing({ ...editing, role: event.target.value as UserRole })}>
                  {availableRoles.map((role) => <option key={role} value={role}>{roleLabels[role]}</option>)}
                </select>
              </Field>
              <Field label={editing.id ? "Nova senha (opcional)" : "Senha temporária"}>
                <input required={!editing.id} minLength={10} type="password" value={editing.temporaryPassword || ""} onChange={(event) => setEditing({ ...editing, temporaryPassword: event.target.value || undefined })} />
              </Field>
            </div>
            <label className="flex items-center gap-2 text-xs font-semibold text-text-primary">
              <input type="checkbox" checked={editing.isActive ?? true} onChange={(event) => setEditing({ ...editing, isActive: event.target.checked })} />
              Acesso ativo
            </label>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setEditing(null)} className="h-10 rounded-md border px-4 text-xs font-bold">Cancelar</button>
              <button disabled={saving} className="h-10 rounded-md bg-nexus-blue-600 px-4 text-xs font-bold text-white disabled:opacity-60">
                {saving ? "Salvando…" : "Salvar usuário"}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactElement }) {
  return (
    <label className="text-xs font-semibold text-text-secondary">
      {label}
      <span className="[&>*]:mt-1 [&>*]:h-10 [&>*]:w-full [&>*]:rounded-md [&>*]:border [&>*]:bg-white [&>*]:px-3">
        {children}
      </span>
    </label>
  );
}

function Summary({ label, value }: { label: string; value: number }) {
  return (
    <div className="min-w-36 rounded-xl border bg-white px-4 py-3">
      <p className="text-xs font-semibold text-text-secondary">{label}</p>
      <p className="mt-1 text-xl font-bold text-text-primary">{value}</p>
    </div>
  );
}
