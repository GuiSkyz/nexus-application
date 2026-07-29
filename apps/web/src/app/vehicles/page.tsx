"use client";

import React, { useState, useEffect } from "react";
import { AppHeader } from "@/components/nexus/app-header";
import { useRole } from "@/components/nexus/role-selector";
import { MockVehicleService } from "@/lib/mockVehicles";
import { MockChecklistService } from "@/lib/mockChecklists";
import { Vehicle, VehicleCategory, VehicleStatus } from "@/types/vehicle";
import { ChecklistTemplate } from "@/types/checklist";
import {
  Truck,
  Plus,
  Search,
  CheckSquare,
  UserCheck,
  Layers,
  Copy,
  Edit,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Wrench,
  ShieldCheck,
} from "lucide-react";
import { KpiCard } from "@/components/nexus/kpi-card";

export default function VehiclesPage() {
  const { activeRole, activeUser, permissions } = useRole();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [templates, setTemplates] = useState<ChecklistTemplate[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Partial<Vehicle>>({});
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Estados do Modal de Atribuição em Lote
  const [batchSelectedTemplateId, setBatchSelectedTemplateId] = useState("");
  const [batchSelectedVehicleIds, setBatchSelectedVehicleIds] = useState<string[]>([]);

  const loadData = () => {
    setVehicles(MockVehicleService.getVehicles());
    // Carregar apenas templates publicados
    const pub = MockChecklistService.getTemplates().filter((t) => t.status === "published");
    setTemplates(pub);
    if (pub.length > 0) {
      setBatchSelectedTemplateId(pub[0].id);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const showNotification = (type: "success" | "error", text: string) => {
    setFeedback({ type, text });
    setTimeout(() => setFeedback(null), 4000);
  };

  // Filtragem de Veículos
  const filteredVehicles = vehicles.filter((v) => {
    if (selectedCategory !== "all" && v.category !== selectedCategory) {
      return false;
    }
    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase();
      return (
        v.model.toLowerCase().includes(q) ||
        v.plate.toLowerCase().includes(q) ||
        (v.assignedTechnicianName && v.assignedTechnicianName.toLowerCase().includes(q))
      );
    }
    return true;
  });

  // Salvar/Editar Veículo
  const handleSaveVehicle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVehicle.model || !editingVehicle.plate) {
      showNotification("error", "Preencha o modelo e a placa do veículo.");
      return;
    }

    try {
      MockVehicleService.saveVehicle(editingVehicle);
      loadData();
      setIsAddEditModalOpen(false);
      setEditingVehicle({});
      showNotification("success", "Cadastro do veículo gravado com sucesso.");
    } catch (err: any) {
      showNotification("error", err.message || "Erro ao salvar veículo.");
    }
  };

  // Atribuição em Lote (Sem retrabalho de duplicação de checklist)
  const handleApplyBatchAssignment = () => {
    if (batchSelectedVehicleIds.length === 0) {
      showNotification("error", "Selecione pelo menos um veículo para receber o checklist.");
      return;
    }
    if (!batchSelectedTemplateId) {
      showNotification("error", "Selecione o template de checklist a ser atribuído.");
      return;
    }

    const tpl = templates.find((t) => t.id === batchSelectedTemplateId);
    if (!tpl) return;

    MockVehicleService.batchAssignChecklist(
      batchSelectedVehicleIds,
      tpl.id,
      `${tpl.title} (v${tpl.version}.0)`
    );

    loadData();
    setIsBatchModalOpen(false);
    setBatchSelectedVehicleIds([]);
    showNotification(
      "success",
      `Checklist "${tpl.title}" atribuído com sucesso para ${batchSelectedVehicleIds.length} veículos da frota!`
    );
  };

  const toggleSelectVehicleForBatch = (id: string) => {
    if (batchSelectedVehicleIds.includes(id)) {
      setBatchSelectedVehicleIds(batchSelectedVehicleIds.filter((vId) => vId !== id));
    } else {
      setBatchSelectedVehicleIds([...batchSelectedVehicleIds, id]);
    }
  };

  const selectAllVehiclesForBatch = () => {
    if (batchSelectedVehicleIds.length === vehicles.length) {
      setBatchSelectedVehicleIds([]);
    } else {
      setBatchSelectedVehicleIds(vehicles.map((v) => v.id));
    }
  };

  const handleDeleteVehicle = (id: string) => {
    MockVehicleService.deleteVehicle(id);
    loadData();
    showNotification("success", "Veículo removido da frota.");
  };

  return (
    <>
      <AppHeader pageTitle="Gestão de Frota & Veículos" breadcrumb={["NexusOps", "Veículos"]} />

      <main className="flex-1 p-6" style={{ backgroundColor: "var(--surface-page)" }}>
        {/* Banner Feedback */}
        {feedback && (
          <div
            className="flex items-center justify-between p-4 mb-6 text-xs font-semibold rounded-lg"
            style={{
              backgroundColor: feedback.type === "success" ? "var(--success-soft)" : "var(--danger-soft)",
              color: feedback.type === "success" ? "var(--success-foreground)" : "var(--danger-foreground)",
            }}
          >
            <span>{feedback.text}</span>
            <button onClick={() => setFeedback(null)} className="font-bold underline">
              Fechar
            </button>
          </div>
        )}

        {/* Resumo da Frota */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
          <KpiCard label="Total da frota" value={vehicles.length} context="Veículos cadastrados" icon={<Truck size={18} />} />
          <KpiCard label="Disponíveis" value={vehicles.filter((v) => v.status === "DISPONIVEL").length} context="Prontos para operação" status="success" icon={<CheckCircle2 size={18} />} />

          <div
            className="p-4 flex items-center justify-between"
            style={{
              backgroundColor: "var(--surface-card)",
              border: "1px solid var(--border-default)",
              borderRadius: "var(--radius-lg)",
            }}
          >
            <div>
              <p className="text-xs uppercase font-medium" style={{ color: "var(--text-muted)" }}>
                Em Vistoria / Vistoriando
              </p>
              <p className="text-2xl font-bold mt-1" style={{ color: "var(--warning)" }}>
                {vehicles.filter((v) => v.status === "EM_VISTORIA").length}
              </p>
            </div>
            <ShieldCheck size={22} style={{ color: "var(--warning)" }} />
          </div>

          <div
            className="p-4 flex items-center justify-between"
            style={{
              backgroundColor: "var(--surface-card)",
              border: "1px solid var(--border-default)",
              borderRadius: "var(--radius-lg)",
            }}
          >
            <div>
              <p className="text-xs uppercase font-medium" style={{ color: "var(--text-muted)" }}>
                Em Manutenção
              </p>
              <p className="text-2xl font-bold mt-1" style={{ color: "var(--danger)" }}>
                {vehicles.filter((v) => v.status === "MANUTENCAO").length}
              </p>
            </div>
            <Wrench size={22} style={{ color: "var(--danger)" }} />
          </div>
        </div>

        {/* Tabela de Gestão de Veículos */}
        <div
          style={{
            backgroundColor: "var(--surface-card)",
            border: "1px solid var(--border-default)",
            borderRadius: "var(--radius-lg)",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          {/* Controls Bar */}
          <div className="p-4 border-b flex flex-col md:flex-row md:items-center justify-between gap-4" style={{ borderColor: "var(--border-default)" }}>
            <div className="flex items-center gap-3">
              {/* Campo de Busca por Placa/Modelo */}
              <div className="relative">
                <Search size={14} className="absolute left-3 top-2.5" style={{ color: "var(--text-muted)" }} />
                <input
                  type="text"
                  placeholder="Buscar por placa, modelo ou técnico..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-3 py-1.5 text-xs border rounded-md w-72 outline-none"
                  style={{
                    backgroundColor: "var(--surface-page)",
                    borderColor: "var(--border-default)",
                    color: "var(--text-primary)",
                  }}
                />
              </div>

              {/* Filtro de Categoria */}
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="py-1.5 px-3 text-xs border rounded-md outline-none"
                style={{
                  backgroundColor: "var(--surface-page)",
                  borderColor: "var(--border-default)",
                  color: "var(--text-primary)",
                }}
              >
                <option value="all">Todas as Categorias</option>
                <option value="INSTALACAO">Instalação & Drop</option>
                <option value="MANUTENCAO_FIBRA">Manutenção de Fibra</option>
                <option value="INFRAESTRUTURA">Infraestrutura & Torres</option>
                <option value="SUPERVISAO">Supervisão Operacional</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              {/* Atribuição em Lote sem Retrabalho */}
              {permissions.canCreate && (
                <button
                  onClick={() => setIsBatchModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md border border-blue-200 text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors"
                >
                  <Layers size={14} />
                  <span>Atribuir Checklist em Lote</span>
                </button>
              )}

              {/* Novo Veículo */}
              {permissions.canCreate && (
                <button
                  onClick={() => {
                    setEditingVehicle({
                      category: "INSTALACAO",
                      status: "DISPONIVEL",
                      year: new Date().getFullYear(),
                    });
                    setIsAddEditModalOpen(true);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md text-white transition-colors"
                  style={{ backgroundColor: "var(--nexus-blue-600)" }}
                >
                  <Plus size={14} />
                  <span>Novo Veículo</span>
                </button>
              )}
            </div>
          </div>

          {/* Tabela de Veículos */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead
                className="uppercase tracking-wider font-semibold border-b text-[11px]"
                style={{ backgroundColor: "var(--surface-subtle)", color: "var(--text-muted)", borderColor: "var(--border-default)" }}
              >
                <tr>
                  <th className="py-3 px-4">Veículo & Placa</th>
                  <th className="py-3 px-4">Ano / KM</th>
                  <th className="py-3 px-4">Operação</th>
                  <th className="py-3 px-4">Técnico Responsável</th>
                  <th className="py-3 px-4">Checklist Vinculado</th>
                  <th className="py-3 px-4">Status Veículo</th>
                  <th className="py-3 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: "var(--border-default)" }}>
                {filteredVehicles.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      <Truck size={32} className="mx-auto mb-2 opacity-50" />
                      <p className="font-semibold text-sm text-slate-700">Nenhum veículo encontrado</p>
                      <p className="text-xs">Altere os filtros de busca acima para visualizar a frota.</p>
                    </td>
                  </tr>
                ) : (
                  filteredVehicles.map((vehicle) => (
                    <tr key={vehicle.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-md bg-slate-100 flex items-center justify-center font-bold text-slate-700">
                            🚗
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">{vehicle.model}</p>
                            <span className="font-mono text-[11px] font-bold px-1.5 py-0.5 bg-slate-200 text-slate-800 rounded">
                              {vehicle.plate}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        <p>{vehicle.year}</p>
                        <p className="text-[10px] text-slate-400 font-mono">{vehicle.currentKm.toLocaleString("pt-BR")} KM</p>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-700">
                        {vehicle.category}
                      </td>
                      <td className="py-3.5 px-4">
                        {vehicle.assignedTechnicianName ? (
                          <div className="flex items-center gap-1.5 text-slate-900 font-medium">
                            <UserCheck size={14} className="text-blue-600" />
                            <span>{vehicle.assignedTechnicianName}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Sem técnico</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        {vehicle.assignedChecklistTitle ? (
                          <div className="flex items-center gap-1.5 text-emerald-700 font-medium text-[11px]">
                            <CheckSquare size={14} />
                            <span>{vehicle.assignedChecklistTitle}</span>
                          </div>
                        ) : (
                          <span className="text-amber-600 font-medium text-[11px]">⚠️ Nenhum checklist</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        {vehicle.status === "DISPONIVEL" && (
                          <span className="px-2.5 py-0.5 rounded text-[11px] font-semibold bg-emerald-100 text-emerald-800">
                            Disponível
                          </span>
                        )}
                        {vehicle.status === "EM_VISTORIA" && (
                          <span className="px-2.5 py-0.5 rounded text-[11px] font-semibold bg-amber-100 text-amber-800">
                            Em Vistoria
                          </span>
                        )}
                        {vehicle.status === "MANUTENCAO" && (
                          <span className="px-2.5 py-0.5 rounded text-[11px] font-semibold bg-red-100 text-red-800">
                            Manutenção
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {permissions.canCreate && (
                            <button
                              onClick={() => {
                                setEditingVehicle(vehicle);
                                setIsAddEditModalOpen(true);
                              }}
                              className="p-1.5 rounded hover:bg-slate-100 text-slate-600"
                              title="Editar veículo"
                            >
                              <Edit size={15} />
                            </button>
                          )}
                          {permissions.canDelete && (
                            <button
                              onClick={() => handleDeleteVehicle(vehicle.id)}
                              className="p-1.5 rounded hover:bg-rose-50 text-rose-600"
                              title="Remover veículo"
                            >
                              <Trash2 size={15} />
                            </button>
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

        {/* Modal de Cadastro/Edição de Veículo */}
        {isAddEditModalOpen && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-lg bg-white rounded-xl shadow-2xl border p-6 space-y-4">
              <div className="flex justify-between items-center border-b pb-3">
                <h3 className="font-bold text-sm text-slate-900">
                  {editingVehicle.id ? "Editar Veículo da Frota" : "Novo Cadastro de Veículo"}
                </h3>
                <button onClick={() => setIsAddEditModalOpen(false)} className="text-xs font-bold text-slate-400">
                  ✕
                </button>
              </div>

              <form onSubmit={handleSaveVehicle} className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Modelo do Veículo *</label>
                  <input
                    type="text"
                    value={editingVehicle.model || ""}
                    onChange={(e) => setEditingVehicle({ ...editingVehicle, model: e.target.value })}
                    placeholder="Ex: Fiat Strada Endurance 1.4"
                    className="w-full p-2 border rounded outline-none"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Placa *</label>
                    <input
                      type="text"
                      value={editingVehicle.plate || ""}
                      onChange={(e) => setEditingVehicle({ ...editingVehicle, plate: e.target.value.toUpperCase() })}
                      placeholder="ABC-1234"
                      className="w-full p-2 border rounded font-mono uppercase outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Quilometragem (KM)</label>
                    <input
                      type="number"
                      value={editingVehicle.currentKm || 0}
                      onChange={(e) => setEditingVehicle({ ...editingVehicle, currentKm: Number(e.target.value) })}
                      className="w-full p-2 border rounded outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Categoria Operacional</label>
                    <select
                      value={editingVehicle.category || "INSTALACAO"}
                      onChange={(e) => setEditingVehicle({ ...editingVehicle, category: e.target.value as VehicleCategory })}
                      className="w-full p-2 border rounded outline-none"
                    >
                      <option value="INSTALACAO">Instalação & Drop</option>
                      <option value="MANUTENCAO_FIBRA">Manutenção de Fibra</option>
                      <option value="INFRAESTRUTURA">Infraestrutura & Torres</option>
                      <option value="SUPERVISAO">Supervisão Operacional</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Técnico Responsável</label>
                    <input
                      type="text"
                      value={editingVehicle.assignedTechnicianName || ""}
                      onChange={(e) => setEditingVehicle({ ...editingVehicle, assignedTechnicianName: e.target.value })}
                      placeholder="Nome do Técnico"
                      className="w-full p-2 border rounded outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Checklist Vinculado Padrão</label>
                  <select
                    value={editingVehicle.assignedChecklistTemplateId || ""}
                    onChange={(e) => {
                      const tplId = e.target.value;
                      const tpl = templates.find((t) => t.id === tplId);
                      setEditingVehicle({
                        ...editingVehicle,
                        assignedChecklistTemplateId: tplId,
                        assignedChecklistTitle: tpl ? `${tpl.title} (v${tpl.version}.0)` : undefined,
                      });
                    }}
                    className="w-full p-2 border rounded outline-none"
                  >
                    <option value="">Selecione um checklist publicado...</option>
                    {templates.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.title} (v{t.version}.0) - [{t.category}]
                      </option>
                    ))}
                  </select>
                </div>

                <div className="pt-4 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAddEditModalOpen(false)}
                    className="px-4 py-2 border rounded text-slate-600 font-semibold"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded font-semibold"
                  >
                    Salvar Veículo
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal de Atribuição e Replicação em Lote */}
        {isBatchModalOpen && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-xl bg-white rounded-xl shadow-2xl border p-6 space-y-4">
              <div className="flex justify-between items-center border-b pb-3">
                <div className="flex items-center gap-2">
                  <Layers size={18} className="text-blue-600" />
                  <h3 className="font-bold text-sm text-slate-900">Atribuição / Replicação de Checklist em Lote</h3>
                </div>
                <button onClick={() => setIsBatchModalOpen(false)} className="text-xs font-bold text-slate-400">
                  ✕
                </button>
              </div>

              <div className="text-xs space-y-4">
                <p className="text-slate-600 leading-relaxed">
                  Selecione o Template de Checklist publicado e os veículos da frota que devem utilizá-lo. 
                  <strong> O mesmo checklist será atribuído aos carros selecionados sem necessidade de recriação manual.</strong>
                </p>

                {/* Seleção do Template */}
                <div>
                  <label className="block font-bold text-slate-800 mb-1">1. Escolha o Template Publicado *</label>
                  <select
                    value={batchSelectedTemplateId}
                    onChange={(e) => setBatchSelectedTemplateId(e.target.value)}
                    className="w-full p-2.5 border rounded-md outline-none bg-slate-50 font-medium"
                  >
                    {templates.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.title} (v{t.version}.0) — Categoria: {t.category}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Seleção em Massa de Veículos */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="font-bold text-slate-800">2. Marque os Veículos da Frota ({batchSelectedVehicleIds.length} selecionados)</label>
                    <button
                      onClick={selectAllVehiclesForBatch}
                      className="text-blue-600 font-semibold underline text-[11px]"
                    >
                      {batchSelectedVehicleIds.length === vehicles.length ? "Desmarcar Todos" : "Marcar Todos da Frota"}
                    </button>
                  </div>

                  <div className="max-h-48 overflow-y-auto border rounded-md p-2 space-y-1.5 bg-slate-50">
                    {vehicles.map((v) => (
                      <label
                        key={v.id}
                        className="flex items-center justify-between p-2 rounded bg-white border hover:bg-blue-50/50 cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={batchSelectedVehicleIds.includes(v.id)}
                            onChange={() => toggleSelectVehicleForBatch(v.id)}
                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                          />
                          <div>
                            <span className="font-bold text-slate-900">{v.model}</span>
                            <span className="ml-2 font-mono text-[10px] font-bold px-1 bg-slate-100 rounded text-slate-700">
                              {v.plate}
                            </span>
                          </div>
                        </div>
                        <span className="text-[11px] text-slate-500">{v.assignedTechnicianName || "Sem técnico"}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="pt-3 border-t flex justify-end gap-2">
                  <button
                    onClick={() => setIsBatchModalOpen(false)}
                    className="px-4 py-2 border rounded text-slate-600 font-semibold"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleApplyBatchAssignment}
                    className="px-4 py-2 bg-blue-600 text-white rounded font-semibold flex items-center gap-1.5"
                  >
                    <CheckSquare size={14} /> Replicar Atribuição
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
