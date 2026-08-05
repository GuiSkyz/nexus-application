"use client";

import { useEffect, useState } from "react";
import { Camera, CheckSquare, ClipboardList, Search } from "lucide-react";
import { AppHeader } from "@/components/nexus/app-header";
import { ApiClient } from "@/lib/apiClient";
import { AuditInspectionDetail, AuditInspectionSummary } from "@/types/audit";

export default function AuditsPage() {
  const [items, setItems] = useState<AuditInspectionSummary[]>([]);
  const [selected, setSelected] = useState<AuditInspectionDetail | null>(null);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => { ApiClient.fetchAuditInspections().then(setItems).finally(() => setLoading(false)); }, []);
  const visible = items.filter((item) => `${item.title} ${item.technicianName} ${item.vehiclePlate || ""}`.toLowerCase().includes(query.toLowerCase()));
  const open = (id: string) => { window.location.href = `/audits/${id}`; };

  return <><AppHeader pageTitle="Auditoria de checklists" breadcrumb={["Operacional", "Auditoria"]} />
    <main className="space-y-5 p-6">
      <section><h1 className="text-xl font-bold text-text-primary">Checklists preenchidos</h1><p className="mt-1 text-sm text-text-secondary">Consulte respostas, evidências fotográficas e registros enviados pelos técnicos.</p></section>
      <label className="relative block"><Search className="absolute left-3 top-3 h-4 w-4 text-text-muted" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por checklist, técnico ou placa" className="h-10 w-full rounded-md border bg-white pl-9 pr-3 text-sm" /></label>
      <section className="overflow-hidden rounded-xl border bg-white">{loading ? <div className="space-y-2 p-5">{Array.from({ length: 4 }).map((_, i) => <div className="skeleton h-16" key={i} />)}</div> : visible.map((item) => <button key={item.id} onClick={() => void open(item.id)} className="grid w-full gap-3 border-b px-5 py-4 text-left hover:bg-surface-subtle md:grid-cols-[1fr_180px_130px_120px] md:items-center"><div><p className="font-bold text-text-primary">{item.title}</p><p className="mt-1 text-xs text-text-secondary">{item.technicianName}{item.vehiclePlate ? ` · ${item.vehiclePlate}` : ""}</p></div><span className="text-xs text-text-secondary">{new Date(item.completedAt).toLocaleString("pt-BR")}</span><span className="text-xs text-text-secondary">{item.answerCount} respostas</span><span className="inline-flex items-center gap-1 text-xs font-bold text-nexus-blue-700"><Camera className="h-4 w-4" /> {item.evidenceCount} foto(s)</span></button>)}</section>
      {selected && <section className="grid gap-5 rounded-xl border bg-white p-5 lg:grid-cols-[1fr_320px]"><div><div className="flex items-center gap-2"><ClipboardList className="h-5 w-5 text-nexus-blue-700" /><div><h2 className="font-bold text-text-primary">{selected.title}</h2><p className="text-xs text-text-secondary">{selected.technicianName} · {new Date(selected.completedAt).toLocaleString("pt-BR")}</p></div></div><div className="mt-5 divide-y rounded-md border">{selected.answers.map((answer) => <div key={answer.questionId} className="flex items-center justify-between gap-4 px-4 py-3 text-sm"><span className="text-text-primary">{answer.questionText}</span><span className={`shrink-0 font-bold ${answer.answerValue === "NAO_CONFORME" ? "text-danger-foreground" : "text-success-foreground"}`}>{answer.answerValue}</span></div>)}</div>{selected.notes && <p className="mt-4 text-sm text-text-secondary">Observações: {selected.notes}</p>}</div><aside><h3 className="flex items-center gap-2 text-sm font-bold text-text-primary"><Camera className="h-4 w-4" /> Evidências</h3><div className="mt-3 grid grid-cols-2 gap-2">{selected.evidences.map((evidence) => <a key={evidence.id} href={evidence.photoUrl} target="_blank" rel="noreferrer" className="overflow-hidden rounded-md border"><img src={evidence.photoUrl} alt={evidence.description || "Evidência fotográfica"} className="h-28 w-full object-cover" /><span className="block p-2 text-[10px] text-text-secondary">{evidence.description || "Foto registrada"}</span></a>)}</div>{!selected.evidences.length && <p className="mt-3 text-xs text-text-secondary">Nenhuma foto anexada.</p>}</aside></section>}
    </main></>;
}
