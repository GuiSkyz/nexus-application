"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { AlertTriangle, ArrowLeft, Camera, Download } from "lucide-react";

import { AppHeader } from "@/components/nexus/app-header";
import { Dialog } from "@/components/nexus/dialog";
import { apiUrl, ApiClient } from "@/lib/apiClient";
import { AuditInspectionDetail } from "@/types/audit";

export default function AuditDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [audit, setAudit] = useState<AuditInspectionDetail | null>(null);
  const [questionId, setQuestionId] = useState("");
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState("MEDIA");
  const [plan, setPlan] = useState({ description: "", assignedTo: "", dueDate: "" });
  const [dialogMessage, setDialogMessage] = useState("");
  const [dialogTitle, setDialogTitle] = useState("");

  const openDialog = (title: string, message: string) => {
    setDialogTitle(title);
    setDialogMessage(message);
  };

  const createNonconformity = async () => {
    try {
      const result = await ApiClient.createAuditNonconformity(id, {
        questionId,
        description,
        severity,
        actionPlanDescription: plan.description,
        actionPlanAssignedTo: plan.assignedTo,
        actionPlanDueDate: plan.dueDate,
      });
      setQuestionId("");
      setDescription("");
      setPlan({ description: "", assignedTo: "", dueDate: "" });
      openDialog("Não conformidade aberta", `A NC ${result.code} foi criada com o plano de ação e enviada ao técnico.`);
    } catch (error) {
      openDialog("Não foi possível abrir a NC", error instanceof Error ? error.message : "Tente novamente.");
    }
  };

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
              <label className="mt-3 block text-xs font-bold text-warning-foreground" htmlFor="audit-question">Questão do checklist</label>
              <select id="audit-question" value={questionId} onChange={(e) => setQuestionId(e.target.value)} className="mt-1 h-10 w-full rounded border px-2">
                <option value="">Selecione a questão com divergência</option>
                {audit.answers.map((answer) => <option key={answer.questionId} value={answer.questionId}>{answer.questionText}</option>)}
              </select>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Descreva a divergência" className="mt-3 min-h-24 w-full rounded border p-2" />
              <select value={severity} onChange={(e) => setSeverity(e.target.value)} className="mt-2 h-10 w-full rounded border px-2">
                <option value="MEDIA">Média</option>
                <option value="ALTA">Alta</option>
                <option value="CRITICA">Crítica</option>
              </select>
              <p className="mt-4 text-xs font-bold text-warning-foreground">Plano de ação</p>
              <textarea value={plan.description} onChange={(e) => setPlan({ ...plan, description: e.target.value })} placeholder="Ação corretiva solicitada" className="mt-2 min-h-20 w-full rounded border p-2" />
              <input value={plan.assignedTo} onChange={(e) => setPlan({ ...plan, assignedTo: e.target.value })} placeholder="Responsável pela ação" className="mt-2 h-10 w-full rounded border px-2" />
              <input type="datetime-local" value={plan.dueDate} onChange={(e) => setPlan({ ...plan, dueDate: e.target.value })} className="mt-2 h-10 w-full rounded border px-2" />
              <button disabled={!questionId || !description.trim() || !plan.description.trim() || !plan.assignedTo.trim() || !plan.dueDate} onClick={() => void createNonconformity()} className="mt-3 h-10 w-full rounded bg-warning-foreground text-xs font-bold text-white disabled:opacity-50">
                Abrir NC
              </button>
            </section>
          </aside>
        </section>
      </main>
      <Dialog open={Boolean(dialogMessage)} title={dialogTitle} onClose={() => setDialogMessage("")}>
        <p className="text-sm text-text-secondary">{dialogMessage}</p>
        <div className="mt-5 flex justify-end"><button type="button" onClick={() => setDialogMessage("")} className="rounded-md bg-nexus-blue-600 px-4 py-2 text-xs font-bold text-white">Entendi</button></div>
      </Dialog>
    </>
  );
}
