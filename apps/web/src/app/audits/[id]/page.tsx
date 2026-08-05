"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { AlertTriangle, ArrowLeft, Camera, Download } from "lucide-react";

import { AppHeader } from "@/components/nexus/app-header";
import { apiUrl, ApiClient } from "@/lib/apiClient";
import { AuditInspectionDetail } from "@/types/audit";

export default function AuditDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [audit, setAudit] = useState<AuditInspectionDetail | null>(null);
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState("MEDIA");
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    void ApiClient.fetchAuditInspection(id).then(setAudit);
  }, [id]);

  if (!audit) {
    return (
      <>
        <AppHeader pageTitle="Verificação" breadcrumb={["Auditoria"]} />
        <main className="p-6"><div className="skeleton h-64" /></main>
      </>
    );
  }

  return (
    <>
      <AppHeader pageTitle="Verificação de checklist" breadcrumb={["Auditoria", audit.title]} />
      <main className="space-y-5 p-6">
        <div className="flex justify-between gap-3">
          <div>
            <Link href="/audits" className="text-xs font-bold text-nexus-blue-700">
              <ArrowLeft className="inline h-4 w-4" /> Voltar
            </Link>
            <h1 className="mt-2 text-xl font-bold">{audit.title}</h1>
            <p className="text-sm text-text-secondary">
              {audit.technicianName} · {new Date(audit.completedAt).toLocaleString("pt-BR")}
            </p>
          </div>
          <button
            onClick={() => void ApiClient.exportAuditPdf(id).then((result) => window.open(apiUrl(result.downloadUrl), "_blank"))}
            className="h-10 rounded-md border border-nexus-blue-600 px-4 text-xs font-bold text-nexus-blue-700"
          >
            <Download className="inline h-4 w-4" /> Exportar PDF
          </button>
        </div>

        {feedback && <p className="rounded-md bg-success-soft p-3 text-sm font-bold text-success-foreground">{feedback}</p>}

        <section className="grid gap-5 lg:grid-cols-[1fr_340px]">
          <div className="divide-y rounded-xl border bg-white">
            {audit.answers.map((answer) => (
              <div key={answer.questionId} className="flex justify-between gap-4 p-4">
                <span>{answer.questionText}</span>
                <b className={answer.answerValue === "NAO_CONFORME" ? "text-danger-foreground" : "text-success-foreground"}>
                  {answer.answerValue.replaceAll("_", " ")}
                </b>
              </div>
            ))}
          </div>
          <aside className="space-y-5">
            <section className="rounded-xl border bg-white p-4">
              <h2 className="font-bold"><Camera className="inline h-4 w-4" /> Fotos</h2>
              <div className="mt-3 grid grid-cols-2 gap-2">
                {audit.evidences.map((e) => (
                  <a key={e.id} href={apiUrl(e.photoUrl)} target="_blank" rel="noreferrer">
                    <img
                      src={apiUrl(e.photoUrl)}
                      alt={e.description || "Evidência"}
                      className="h-28 w-full rounded object-cover"
                    />
                  </a>
                ))}
              </div>
            </section>
            <section className="rounded-xl border border-warning-soft bg-warning-soft p-4">
              <h2 className="font-bold text-warning-foreground"><AlertTriangle className="inline h-4 w-4" /> Abrir não conformidade</h2>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Descreva a divergência" className="mt-3 min-h-24 w-full rounded border p-2" />
              <select value={severity} onChange={(e) => setSeverity(e.target.value)} className="mt-2 h-10 w-full rounded border px-2">
                <option value="MEDIA">Média</option>
                <option value="ALTA">Alta</option>
                <option value="CRITICA">Crítica</option>
              </select>
              <button disabled={!description.trim()} onClick={() => void ApiClient.createAuditNonconformity(id, description, severity).then((result) => setFeedback(`NC ${result.code} aberta.`))} className="mt-3 h-10 w-full rounded bg-warning-foreground text-xs font-bold text-white disabled:opacity-50">
                Abrir NC
              </button>
            </section>
          </aside>
        </section>
      </main>
    </>
  );
}
