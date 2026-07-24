import {
  VehicleShiftAssignment,
  ActivityContext,
  ContextualChecklist,
} from "../types";

export const mockVehicleShift: VehicleShiftAssignment = {
  technicianId: "tech-01",
  technicianName: "João Souza",
  vehicleId: "veh-12",
  model: "Fiat Strada Endurance 1.4",
  plate: "ABC1D23",
  fleetNumber: "Caminhonete 12",
  teamId: "team-alfa",
  teamName: "Equipe Alfa - Instalação",
  date: "Hoje, 23 de Julho",
  shift: "Turno Manhã (07:30 - 16:30)",
  isResponsible: true, // João é o responsável por concluir o checklist do veículo no turno
  participants: ["João Souza (Responsável)", "Marcos Oliveira (Técnico Auxiliar)"],
  lastInspectionDate: "Ontem às 17:40",
  pendingIssuesCount: 0,
};

export const mockTodayActivity: ActivityContext = {
  activityId: "os-8849",
  serviceOrderNumber: "OS-8849",
  title: "Instalação FTTH — Trabalho em Altura & Lançamento",
  activityType: "TRABALHO_ALTURA",
  riskLevel: "ALTO",
  scheduledTime: "09:00 - 12:00",
  address: "Av. Paulista, 1500 - Bela Vista, SP",
};

export const mockContextualChecklists: ContextualChecklist[] = [
  // 1. Contexto VEÍCULO
  {
    id: "chk-veh-01",
    templateId: "tpl-101",
    templateVersion: 1,
    title: "Checklist Diário de Saída da Caminhonete 12",
    category: "Veículo da Frota",
    contextType: "VEHICLE",
    vehicleId: "veh-12",
    isRequired: true,
    state: "PENDING",
    estimatedMinutes: 5,
    answers: {},
    evidences: [],
    questions: [
      {
        id: "vq1",
        category: "Equipamentos Obrigatórios",
        questionText: "Triângulo, macaco hidráulico e chave de roda estão presentes e operacionais?",
        isRequired: true,
      },
      {
        id: "vq2",
        category: "Segurança Mecânica",
        questionText: "Calibragem e estado dos 4 pneus e estepe da Caminhonete 12 estão adequados?",
        isRequired: true,
      },
      {
        id: "vq3",
        category: "Sinalização Luminosa",
        questionText: "Faróis, lanternas, setas e luzes de freio estão funcionando?",
        isRequired: true,
      },
    ],
  },
  {
    id: "chk-veh-02",
    templateId: "tpl-105",
    templateVersion: 1,
    title: "Conferência de Ferramentas e Escada do Veículo",
    category: "Equipamentos do Veículo",
    contextType: "VEHICLE",
    vehicleId: "veh-12",
    isRequired: false,
    state: "PENDING",
    estimatedMinutes: 4,
    answers: {},
    evidences: [],
    questions: [
      {
        id: "vq4",
        category: "Escada Telescópica",
        questionText: "Escada de fibra isolada acoplada ao rack sem trincas nos degraus?",
        isRequired: true,
      },
    ],
  },

  // 2. Contexto INDIVIDUAL (Técnico)
  {
    id: "chk-ind-01",
    templateId: "tpl-201",
    templateVersion: 1,
    title: "Checklist Individual de EPI & Uniforme",
    category: "Segurança Individual",
    contextType: "INDIVIDUAL",
    technicianId: "tech-01",
    isRequired: true,
    state: "PENDING",
    estimatedMinutes: 3,
    answers: {},
    evidences: [],
    questions: [
      {
        id: "iq1",
        category: "EPIs Individuais",
        questionText: "Capacete de proteção com jugular, óculos de proteção e luvas de vaqueta em bom estado?",
        isRequired: true,
      },
      {
        id: "iq2",
        category: "Calçado & Uniforme",
        questionText: "Bota de segurança com biqueira e uniforme refletivo limpo e em uso?",
        isRequired: true,
      },
    ],
  },
  {
    id: "chk-ind-02",
    templateId: "tpl-202",
    templateVersion: 1,
    title: "Validade de Treinamentos & CNH do Técnico",
    category: "Documentação do Técnico",
    contextType: "INDIVIDUAL",
    technicianId: "tech-01",
    isRequired: true,
    state: "COMPLETED",
    estimatedMinutes: 2,
    answers: { iq3: "CONFORME" },
    evidences: [],
    questions: [
      {
        id: "iq3",
        category: "Certificações",
        questionText: "Certificado NR-35 (Trabalho em Altura) e CNH válidos e portados?",
        isRequired: true,
      },
    ],
  },

  // 3. Contexto ATIVIDADE & APR
  {
    id: "chk-act-01",
    templateId: "tpl-301",
    templateVersion: 1,
    title: "APR — Análise Preliminar de Risco (Trabalho em Altura)",
    category: "Análise de Risco",
    contextType: "APR",
    activityId: "os-8849",
    isRequired: true,
    state: "PENDING",
    estimatedMinutes: 6,
    answers: {},
    evidences: [],
    questions: [
      {
        id: "aq1",
        category: "Condições Atmosféricas",
        questionText: "Área isenta de chuva, ventos fortes ou descargas elétricas?",
        isRequired: true,
      },
      {
        id: "aq2",
        category: "Ancoragem & Linha de Vida",
        questionText: "Ponto de ancoragem no poste/estrutura verificado com cinto tipo paraquedista?",
        isRequired: true,
      },
      {
        id: "aq3",
        category: "Isolamento da Área",
        questionText: "Cones de sinalização posicionados e fita zebrada isolando a calçada?",
        isRequired: true,
      },
    ],
  },
  {
    id: "chk-act-02",
    templateId: "tpl-302",
    templateVersion: 1,
    title: "Checklist de Lançamento de Cabo Óptico FTTH",
    category: "Procedimento Técnico",
    contextType: "ACTIVITY",
    activityId: "os-8849",
    isRequired: false,
    state: "PENDING",
    estimatedMinutes: 5,
    answers: {},
    evidences: [],
    questions: [
      {
        id: "aq4",
        category: "Rede Externa",
        questionText: "Passagem de cabo drop óptico mantendo altura mínima regulamentar da via?",
        isRequired: true,
      },
    ],
  },
];
