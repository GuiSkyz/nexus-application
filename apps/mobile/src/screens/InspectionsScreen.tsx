import React from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from "react-native";
import { colors, radius, spacing, shadow } from "../theme/tokens";
import { Inspection } from "../types";

interface InspectionsScreenProps {
  onSelectInspection: (inspection: Inspection) => void;
  user: { name: string; role: string };
  pendingSyncCount: number;
  onOpenSyncQueue: () => void;
}

const mockInspections: Inspection[] = [
  {
    id: "INSP-2026-001",
    title: "Vistoria de Saída — Veículos da Frota",
    type: "VEHICLE_OUT",
    vehiclePlate: "ABC-1234",
    vehicleModel: "Fiat Strada Endurance 1.4",
    technicianName: "Carlos Silva",
    scheduledDate: "Hoje, 08:00",
    status: "PENDING",
    answers: {},
    evidences: [],
    questions: [
      {
        id: "Q1",
        category: "Equipamentos Obrigatórios",
        questionText: "Triângulo de sinalização, macaco e chave de roda estão presentes e funcionais?",
        isRequired: true,
      },
      {
        id: "Q2",
        category: "Segurança de Pneus",
        questionText: "Pressão e estado de conservação dos 4 pneus e estepe estão adequados?",
        isRequired: true,
      },
      {
        id: "Q3",
        category: "Nível de Fluidos",
        questionText: "Óleo do motor e fluido de freio estão dentro do nível recomendado?",
        isRequired: true,
      },
      {
        id: "Q4",
        category: "Sinalização Luminosa",
        questionText: "Faróis, lanternas, setas e luzes de freio estão funcionando perfeitamente?",
        isRequired: true,
      },
      {
        id: "Q5",
        category: "EPIs da Equipe",
        questionText: "Capacetes com jugular, cintos tipo paraquedista e talabartes estão no veículo?",
        isRequired: true,
      },
    ],
  },
  {
    id: "INSP-2026-002",
    title: "Segurança para Trabalho em Altura & NR-35",
    type: "HEIGHT_WORK",
    vehiclePlate: "XYZ-9876",
    vehicleModel: "VW Delivery 9.170 (Escada)",
    technicianName: "Carlos Silva",
    scheduledDate: "Hoje, 10:30",
    status: "PENDING",
    answers: {},
    evidences: [],
    questions: [
      {
        id: "Q1",
        category: "Ancoragem",
        questionText: "Ponto de ancoragem verificado e com laudo dentro da validade?",
        isRequired: true,
      },
      {
        id: "Q2",
        category: "Escada Telescópica",
        questionText: "Escada isolada sem trincas nos degraus e com travas operacionais?",
        isRequired: true,
      },
    ],
  },
];

export const InspectionsScreen: React.FC<InspectionsScreenProps> = ({
  onSelectInspection,
  user,
  pendingSyncCount,
  onOpenSyncQueue,
}) => {
  return (
    <View style={styles.container}>
      {/* Header do Perfil */}
      <View style={styles.profileBar}>
        <View>
          <Text style={styles.userName}>{user.name}</Text>
          <Text style={styles.userRole}>{user.role}</Text>
        </View>

        <TouchableOpacity
          style={styles.syncQueueButton}
          onPress={onOpenSyncQueue}
          activeOpacity={0.8}
        >
          <Text style={styles.syncQueueText}>Fila Sync</Text>
          {pendingSyncCount > 0 && (
            <View style={styles.badgeCount}>
              <Text style={styles.badgeCountText}>{pendingSyncCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Título da Seção */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Inspeções Publicadas Disponíveis ({mockInspections.length})</Text>
        <Text style={styles.sectionSubtitle}>
          Apenas modelos no estado PUBLICADO pelo coordenador são baixados para execução no mobile.
        </Text>
      </View>

      {/* Lista de Vistorias */}
      <FlatList
        data={mockInspections}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => onSelectInspection(item)}
            activeOpacity={0.85}
          >
            <View style={styles.cardHeader}>
              <Text style={styles.cardType}>
                {item.type === "VEHICLE_OUT" ? "🚗 FROTA & VEÍCULOS" : "🧗 NR-35 ALTURA"}
              </Text>
              <View style={styles.statusPill}>
                <Text style={styles.statusPillText}>VERSÃO v1.0 (PUBLICADO)</Text>
              </View>
            </View>

            <Text style={styles.cardTitle}>{item.title}</Text>

            {item.vehiclePlate && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Veículo / Placa:</Text>
                <Text style={styles.detailValue}>
                  {item.vehicleModel} ({item.vehiclePlate})
                </Text>
              </View>
            )}

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Horário Previsto:</Text>
              <Text style={styles.detailValue}>{item.scheduledDate}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Itens de Verificação:</Text>
              <Text style={styles.detailValue}>{item.questions.length} perguntas</Text>
            </View>

            <View style={styles.actionPrompt}>
              <Text style={styles.actionPromptText}>Iniciar Inspeção e Congelar Versão ➔</Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface.page,
  },
  profileBar: {
    backgroundColor: colors.navy[900],
    paddingHorizontal: spacing[5],
    paddingTop: 50,
    paddingBottom: spacing[4],
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  userName: {
    color: colors.text.inverse,
    fontSize: 16,
    fontWeight: "700",
  },
  userRole: {
    color: "rgba(214, 224, 239, 0.7)",
    fontSize: 12,
    marginTop: 2,
  },
  syncQueueButton: {
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.md,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  syncQueueText: {
    color: colors.text.inverse,
    fontSize: 12,
    fontWeight: "600",
  },
  badgeCount: {
    backgroundColor: colors.warning.DEFAULT,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  badgeCountText: {
    color: "#000000",
    fontSize: 10,
    fontWeight: "800",
  },
  sectionHeader: {
    paddingHorizontal: spacing[5],
    paddingTop: spacing[5],
    paddingBottom: spacing[2],
  },
  sectionTitle: {
    color: colors.text.primary,
    fontSize: 17,
    fontWeight: "700",
  },
  sectionSubtitle: {
    color: colors.text.muted,
    fontSize: 12,
    marginTop: 2,
  },
  listContainer: {
    padding: spacing[5],
    gap: spacing[4],
  },
  card: {
    backgroundColor: colors.surface.card,
    borderRadius: radius.lg,
    padding: spacing[4],
    borderWidth: 1,
    borderColor: colors.border.default,
    marginBottom: spacing[3],
    ...shadow.sm,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  cardType: {
    color: colors.blue[600],
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  statusPill: {
    backgroundColor: colors.success.soft,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  statusPillText: {
    color: colors.success.foreground,
    fontSize: 10,
    fontWeight: "700",
  },
  cardTitle: {
    color: colors.text.primary,
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  detailLabel: {
    color: colors.text.muted,
    fontSize: 12,
  },
  detailValue: {
    color: colors.text.secondary,
    fontSize: 12,
    fontWeight: "500",
  },
  actionPrompt: {
    marginTop: spacing[3],
    paddingTop: spacing[3],
    borderTopWidth: 1,
    borderTopColor: colors.border.default,
    alignItems: "flex-end",
  },
  actionPromptText: {
    color: colors.blue[600],
    fontSize: 12,
    fontWeight: "700",
  },
});
