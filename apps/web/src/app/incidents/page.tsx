"use client";

import { useState, useEffect } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Filter,
  Search,
  Plus,
  ShieldAlert,
  FileCheck,
  Calendar,
  User,
  Wrench,
  X,
  CheckSquare,
} from "lucide-react";
import { ApiClient } from "@/lib/apiClient";
import { Incident, IncidentSeverity, IncidentStatus } from "@/types/incident";
import { useRole } from "@/components/nexus/role-selector";
import { KpiCard } from "@/components/nexus/kpi-card";

export default function IncidentsPage() {
  const { activeUser, permissions } = useRole();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [severityFilter, setSeverityFilter] = useState<string>("ALL");

  // State dos Modais
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [isResolveModalOpen, setIsResolveModalOpen] = useState(false);

  // Form de Plano de Ação
  const [planDescription, setPlanDescription] = useState("");
  const [planAssignedTo, setPlanAssignedTo] = useState("");
  const [planDueDate, setPlanDueDate] = useState("");

  // Form de Resolução
  const [resolutionNotes, setResolutionNotes] = useState("");

  const loadData = async () => {
    const data = await ApiClient.fetchIncidents();
    setIncidents(data);
  };

  useEffect(() => {
    loadData();
  }, []);

  const kpis = {
    total: incidents.length,
    open: incidents.filter((i) => i.status === "ABERTA").length,
    inActionPlan: incidents.filter((i) => i.status === "PLANO_DE_ACAO").length,
    resolved: incidents.filter((i) => i.status === "RESOLVIDA").length,
  };

  const filteredIncidents = incidents.filter((incident) => {
    const matchesSearch =
      incident.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      incident.inspectionTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      incident.technicianName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (incident.vehiclePlate && incident.vehiclePlate.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = statusFilter === "ALL" || incident.status === statusFilter;
    const matchesSeverity = severityFilter === "ALL" || incident.severity === severityFilter;

    return matchesSearch && matchesStatus && matchesSeverity;
  });

  const handleOpenPlanModal = (incident: Incident) => {
    setSelectedIncident(incident);
    setPlanDescription("");
    setPlanAssignedTo("Oficina Credenciada / Manutenção Frota");
    setPlanDueDate(new Date(Date.now() + 86400000 * 2).toISOString().split("T")[0]);
    setIsPlanModalOpen(true);
  };

  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIncident || !planDescription || !planAssignedTo) return;

    await ApiClient.createActionPlan(selectedIncident.id, {
      description: planDescription,
      assignedTo: planAssignedTo,
      dueDate: planDueDate,
      createdBy: activeUser
    });

    await loadData();
    setIsPlanModalOpen(false);
  };

  const handleOpenResolveModal = (incident: Incident) => {
    setSelectedIncident(incident);
    setResolutionNotes("");
    setIsResolveModalOpen(true);
  };

  const handleSaveResolution = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIncident || !resolutionNotes) return;

    await ApiClient.resolveIncident(selectedIncident.id, {
      resolutionNotes
    });
    
    await loadData();
    setIsResolveModalOpen(false);
  };

  const getSeverityBadge = (severity: IncidentSeverity) => {
    switch (severity) {
      case "CRITICA":
        return <span className="px-2 py-0.5 rounded text-xs font-bold bg-red-100 text-red-800 border border-red-200">CRÍTICA</span>;
      case "ALTA":
        return <span className="px-2 py-0.5 rounded text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">ALTA</span>;
      case "MEDIA":
        return <span className="px-2 py-0.5 rounded text-xs font-bold bg-yellow-100 text-yellow-800 border border-yellow-200">MÉDIA</span>;
      case "BAIXA":
        return <span className="px-2 py-0.5 rounded text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">BAIXA</span>;
    }
  };

  const getStatusBadge = (status: IncidentStatus) => {
    switch (status) {
      case "ABERTA":
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-200">ABERTA</span>;
      case "PLANO_DE_ACAO":
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">PLANO DE AÇÃO</span>;
      case "RESOLVIDA":
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">RESOLVIDA</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-5">
        <div>
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-7 h-7 text-nexus-blue-600" />
            <h1 className="text-2xl font-bold tracking-tight text-text-primary">
              Gestão de Não Conformidades & Planos de Ação
            </h1>
          </div>
          <p className="text-sm text-text-secondary mt-1">
            Tratamento de falhas registradas em vistorias com atribuição de responsabilidade, prazos e controle de baixa.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KpiCard
          label="NCs Ativas em Aberto"
          value={kpis.totalOpen}
          context="Aguardando tratamento ou resolução"
          icon={<AlertTriangle className="w-5 h-5 text-amber-600" />}
        />
        <KpiCard
          label="Ocorrências Críticas"
          value={kpis.criticalCount}
          context="Risco de vida ou imobilização da frota"
          icon={<ShieldAlert className="w-5 h-5 text-red-600" />}
        />
        <KpiCard
          label="Em Plano de Ação"
          value={kpis.inActionPlan}
          context="Com responsável e prazo definido"
          icon={<Clock className="w-5 h-5 text-nexus-blue-600" />}
        />
        <KpiCard
          label="Resolvidas no Mês"
          value={kpis.resolvedThisMonth}
          context="Comprovadas com laudo/foto"
          icon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />}
        />
      </div>

      {/* Control Bar: Search & Filters */}
      <div className="bg-surface-card p-4 rounded-xl border border-border shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            type="text"
            placeholder="Buscar por código NC, placa, técnico ou pergunta do checklist..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-surface-page rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-nexus-blue-600 text-text-primary"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2 bg-surface-page px-3 py-1.5 rounded-lg border border-border">
            <Filter className="w-4 h-4 text-text-muted" />
            <span className="text-xs font-semibold text-text-secondary">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent text-xs font-bold text-text-primary focus:outline-none"
            >
              <option value="ALL">Todos os Status</option>
              <option value="ABERTA">Abertas</option>
              <option value="PLANO_DE_ACAO">Em Plano de Ação</option>
              <option value="RESOLVIDA">Resolvidas</option>
            </select>
          </div>

          <div className="flex items-center gap-2 bg-surface-page px-3 py-1.5 rounded-lg border border-border">
            <span className="text-xs font-semibold text-text-secondary">Severidade:</span>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="bg-transparent text-xs font-bold text-text-primary focus:outline-none"
            >
              <option value="ALL">Todas Severidades</option>
              <option value="CRITICA">Crítica</option>
              <option value="ALTA">Alta</option>
              <option value="MEDIA">Média</option>
              <option value="BAIXA">Baixa</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-surface-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface-subtle text-xs uppercase font-bold text-text-secondary border-b border-border">
              <tr>
                <th className="p-4">Código / Origem</th>
                <th className="p-4">Severidade</th>
                <th className="p-4">Não Conformidade Identificada</th>
                <th className="p-4">Técnico / Veículo</th>
                <th className="p-4">Status</th>
                <th className="p-4">Plano de Ação</th>
                <th className="p-4 text-right">Ações Operacionais</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredIncidents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-text-muted">
                    Nenhuma não conformidade encontrada com os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filteredIncidents.map((incident) => (
                  <tr key={incident.id} className="hover:bg-surface-page/50 transition-colors">
                    <td className="p-4 font-medium text-text-primary">
                      <div className="font-mono font-bold text-nexus-blue-600">{incident.id}</div>
                      <div className="text-xs text-text-muted mt-0.5 truncate max-w-[200px]">
                        {incident.inspectionTitle}
                      </div>
                    </td>
                    <td className="p-4">{getSeverityBadge(incident.severity)}</td>
                    <td className="p-4 max-w-[300px]">
                      <div className="font-semibold text-text-primary">{incident.category}</div>
                      <div className="text-xs text-text-secondary mt-1">{incident.questionText}</div>
                      {incident.description && (
                        <div className="text-xs text-amber-800 bg-amber-50 p-2 rounded mt-2 border border-amber-200">
                          {incident.description}
                        </div>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1.5 font-medium text-text-primary">
                        <User className="w-3.5 h-3.5 text-text-muted" />
                        {incident.technicianName}
                      </div>
                      {incident.vehiclePlate && (
                        <div className="text-xs font-mono font-bold text-text-secondary mt-1 bg-surface-subtle px-1.5 py-0.5 rounded border border-border inline-block">
                          {incident.vehiclePlate} ({incident.vehicleModel})
                        </div>
                      )}
                    </td>
                    <td className="p-4">{getStatusBadge(incident.status)}</td>
                    <td className="p-4">
                      {incident.actionPlan ? (
                        <div className="text-xs space-y-1">
                          <div className="font-semibold text-text-primary flex items-center gap-1">
                            <Wrench className="w-3 h-3 text-nexus-blue-600" />
                            {incident.actionPlan.assignedTo}
                          </div>
                          <div className="text-text-muted flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            Prazo: {new Date(incident.actionPlan.dueDate).toLocaleDateString("pt-BR")}
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-text-muted italic">Nenhum plano cadastrado</span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {incident.status === "ABERTA" && (
                          <button
                            onClick={() => handleOpenPlanModal(incident)}
                            className="px-3 py-1.5 bg-nexus-blue-600 hover:bg-nexus-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition-colors shadow-sm"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            Criar Plano de Ação
                          </button>
                        )}

                        {incident.status === "PLANO_DE_ACAO" && (
                          <button
                            onClick={() => handleOpenResolveModal(incident)}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition-colors shadow-sm"
                          >
                            <CheckSquare className="w-3.5 h-3.5" />
                            Dar Baixa / Resolver
                          </button>
                        )}

                        {incident.status === "RESOLVIDA" && (
                          <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            Concluída
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal 1: Criar Plano de Ação */}
      {isPlanModalOpen && selectedIncident && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface-card rounded-xl border border-border shadow-overlay max-w-lg w-full p-6 animate-in fade-in zoom-in duration-150">
            <div className="flex justify-between items-center border-b border-border pb-4 mb-4">
              <div>
                <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
                  <Wrench className="w-5 h-5 text-nexus-blue-600" />
                  Cadastrar Plano de Ação Corretiva
                </h2>
                <p className="text-xs text-text-secondary">NC: {selectedIncident.id}</p>
              </div>
              <button onClick={() => setIsPlanModalOpen(false)} className="text-text-muted hover:text-text-primary">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePlan} className="space-y-4">
              <div className="bg-amber-50 p-3 rounded-lg border border-amber-200 text-xs">
                <span className="font-bold text-amber-900">Problema Detectado: </span>
                <span className="text-amber-800">{selectedIncident.questionText}</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-text-secondary mb-1">
                  Descrição da Ação Corretiva Exigida *
                </label>
                <textarea
                  required
                  rows={3}
                  value={planDescription}
                  onChange={(e) => setPlanDescription(e.target.value)}
                  placeholder="Descreva o procedimento corretivo (ex: Substituição imediata dos 2 pneus dianteiros na oficina credenciada)..."
                  className="w-full p-2.5 text-xs bg-surface-page border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-nexus-blue-600 text-text-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-text-secondary mb-1">
                  Responsável / Setor Encarregado *
                </label>
                <input
                  type="text"
                  required
                  value={planAssignedTo}
                  onChange={(e) => setPlanAssignedTo(e.target.value)}
                  placeholder="Ex: Manutenção da Frota / AutoCenter"
                  className="w-full p-2.5 text-xs bg-surface-page border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-nexus-blue-600 text-text-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-text-secondary mb-1">Prazo Limite para Conclusão *</label>
                <input
                  type="date"
                  required
                  value={planDueDate}
                  onChange={(e) => setPlanDueDate(e.target.value)}
                  className="w-full p-2.5 text-xs bg-surface-page border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-nexus-blue-600 text-text-primary"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsPlanModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-text-secondary hover:bg-surface-subtle rounded-lg border border-border"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-nexus-blue-600 hover:bg-nexus-blue-700 rounded-lg shadow-sm"
                >
                  Salvar Plano de Ação
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Resolver NC */}
      {isResolveModalOpen && selectedIncident && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface-card rounded-xl border border-border shadow-overlay max-w-lg w-full p-6 animate-in fade-in zoom-in duration-150">
            <div className="flex justify-between items-center border-b border-border pb-4 mb-4">
              <div>
                <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  Dar Baixa na Não Conformidade
                </h2>
                <p className="text-xs text-text-secondary">NC: {selectedIncident.id}</p>
              </div>
              <button onClick={() => setIsResolveModalOpen(false)} className="text-text-muted hover:text-text-primary">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveResolution} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-text-secondary mb-1">
                  Observações Comprovatórias da Resolução *
                </label>
                <textarea
                  required
                  rows={3}
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder="Descreva como a falha foi sanada (ex: Peça substituída, laudo emitido pela oficina e aprovado)..."
                  className="w-full p-2.5 text-xs bg-surface-page border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 text-text-primary"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsResolveModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-text-secondary hover:bg-surface-subtle rounded-lg border border-border"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm"
                >
                  Confirmar Baixa da NC
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
