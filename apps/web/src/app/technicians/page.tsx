"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Edit, HardHat, Plus, Search, Trash2 } from "lucide-react";

import { AppHeader } from "@/components/nexus/app-header";
import { ApiClient } from "@/lib/apiClient";
import { Technician, TechnicianPayload } from "@/types/technician";

const empty: Partial<TechnicianPayload> = {
  fullName: "",
  email: "",
  phone: "",
  teamName: "",
  specialty: "",
  operationalCategory: "INSTALACAO_MANUTENCAO",
  isActive: true,
};

export default function TechniciansPage() {
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [editing, setEditing] = useState<(Partial<TechnicianPayload> & { id?: string }) | null>(null);
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      setTechnicians(await ApiClient.fetchTechnicians());
      setError("");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Falha ao carregar técnicos.");
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const visible = useMemo(() => {
    const search = query.toLowerCase();
    return technicians.filter((item) => !search || `${item.fullName} ${item.email} ${item.teamName}`.toLowerCase().includes(search));
  }, [query, technicians]);

  const save = async (event: FormEvent) => {
    event.preventDefault();
    if (!editing) return;
    try {
      await ApiClient.saveTechnician(editing);
      setEditing(null);
      await load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Não foi possível salvar.");
    }
  };

  return (
    <>
      <AppHeader pageTitle="Técnicos" breadcrumb={["Operacional", "Técnicos"]} />
      <main className="space-y-5 p-6">
        <section className="flex flex-col gap-4 border-b pb-5 md:flex-row md:items-end md:justify-between">
          <div><h1 className="text-xl font-bold text-text-primary">Equipe técnica</h1><p className="mt-1 text-sm text-text-secondary">Cadastros utilizados em atribuições, inspeções, APRs e relatórios.</p></div>
          <button onClick={() => setEditing({ ...empty })} className="inline-flex h-10 items-center gap-2 rounded-md bg-nexus-blue-600 px-4 text-xs font-bold text-white"><Plus className="h-4 w-4" /> Novo técnico</button>
        </section>
        {error && <div role="alert" className="rounded-lg bg-danger-soft px-4 py-3 text-sm font-semibold text-danger-foreground">{error}</div>}
        <section className="grid gap-3 sm:grid-cols-3">
          <Summary label="Técnicos cadastrados" value={technicians.length} />
          <Summary label="Ativos na operação" value={technicians.filter((item) => item.isActive).length} />
          <Summary label="Equipes representadas" value={new Set(technicians.map((item) => item.teamName).filter(Boolean)).size} />
        </section>
        <label className="relative block">
          <Search className="absolute left-3 top-3 h-4 w-4 text-text-muted" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar técnico, e-mail ou equipe" className="h-10 w-full rounded-md border bg-white pl-9 pr-3 text-sm" />
        </label>
        <section className="overflow-hidden rounded-xl border bg-white">
          {visible.length ? <div className="divide-y">{visible.map((item) => (
            <article key={item.id} className="grid gap-3 px-5 py-4 lg:grid-cols-[1fr_180px_100px_auto] lg:items-center">
              <div className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-lg bg-nexus-blue-50 text-nexus-blue-700"><HardHat className="h-5 w-5" /></span><div><h2 className="text-sm font-bold text-text-primary">{item.fullName}</h2><p className="text-xs text-text-secondary">{item.email}</p></div></div>
              <div className="text-xs"><p className="font-bold text-text-primary">{item.phone || "Sem telefone"}</p></div>
              <div className="text-xs"><p className="font-bold text-text-primary">{item.teamName || "Sem equipe"}</p><p className="text-text-secondary">{item.operationalCategory === "INFRAESTRUTURA" ? "Infraestrutura" : "Instalação & Manutenção"}</p></div>
              <span className={`justify-self-start rounded px-2 py-1 text-[10px] font-bold ${item.isActive ? "bg-success-soft text-success-foreground" : "bg-surface-muted text-text-secondary"}`}>{item.isActive ? "Ativo" : "Inativo"}</span>
              <div className="flex justify-end gap-1"><button onClick={() => setEditing({ ...item })} className="rounded p-2 text-text-secondary hover:bg-surface-muted"><Edit className="h-4 w-4" /></button><button onClick={() => window.confirm("Excluir este técnico?") && void ApiClient.deleteTechnician(item.id).then(load)} className="rounded p-2 text-text-secondary hover:bg-danger-soft hover:text-danger-foreground"><Trash2 className="h-4 w-4" /></button></div>
            </article>
          ))}</div> : <p className="py-16 text-center text-sm text-text-secondary">Nenhum técnico encontrado.</p>}
        </section>
      </main>

      {editing && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"><form onSubmit={save} className="w-full max-w-2xl space-y-4 rounded-xl bg-white p-6 shadow-overlay">
        <h2 className="text-base font-bold">{editing.id ? "Editar técnico" : "Cadastrar técnico"}</h2>
        <div className="grid gap-3 md:grid-cols-2">
          <Field label="Nome completo"><input required value={editing.fullName || ""} onChange={(e) => setEditing({ ...editing, fullName: e.target.value })} /></Field>
          <Field label="E-mail corporativo"><input required type="email" value={editing.email || ""} onChange={(e) => setEditing({ ...editing, email: e.target.value })} /></Field>
          <Field label="Telefone"><input value={editing.phone || ""} onChange={(e) => setEditing({ ...editing, phone: e.target.value })} /></Field>
          <Field label="Equipe"><input value={editing.teamName || ""} onChange={(e) => setEditing({ ...editing, teamName: e.target.value })} /></Field>
          <Field label="Especialidade"><input value={editing.specialty || ""} onChange={(e) => setEditing({ ...editing, specialty: e.target.value })} /></Field>
          <Field label="Categoria operacional"><select value={editing.operationalCategory || "INSTALACAO_MANUTENCAO"} onChange={(e) => setEditing({ ...editing, operationalCategory: e.target.value as Technician["operationalCategory"] })}><option value="INSTALACAO_MANUTENCAO">Instalação & Manutenção</option><option value="INFRAESTRUTURA">Infraestrutura</option></select></Field>
          <Field label={editing.id ? "Nova senha (opcional)" : "Senha temporária"}><input required={!editing.id} type="password" minLength={10} value={editing.temporaryPassword || ""} onChange={(e) => setEditing({ ...editing, temporaryPassword: e.target.value || undefined })} /></Field>
          <label className="flex items-center gap-2 self-end pb-3 text-xs font-semibold text-text-primary"><input type="checkbox" checked={editing.isActive ?? true} onChange={(e) => setEditing({ ...editing, isActive: e.target.checked })} /> Técnico ativo</label>
        </div>
        <p className="rounded-md bg-info-soft px-3 py-2 text-xs text-info-foreground">A senha temporária deve ter ao menos 10 caracteres. Oriente o técnico a alterá-la em Segurança da conta após o primeiro acesso.</p>
        <div className="flex justify-end gap-2"><button type="button" onClick={() => setEditing(null)} className="rounded-md border px-4 py-2 text-xs font-bold">Cancelar</button><button className="rounded-md bg-nexus-blue-600 px-4 py-2 text-xs font-bold text-white">Salvar técnico</button></div>
      </form></div>}
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactElement }) {
  return <label className="text-xs font-semibold text-text-secondary">{label}<span className="[&>*]:mt-1 [&>*]:h-10 [&>*]:w-full [&>*]:rounded-md [&>*]:border [&>*]:px-3">{children}</span></label>;
}
function Summary({ label, value }: { label: string; value: number }) {
  return <div className="rounded-xl border bg-white p-4"><p className="text-xs font-semibold text-text-secondary">{label}</p><p className="mt-2 text-2xl font-bold text-text-primary">{value}</p></div>;
}
