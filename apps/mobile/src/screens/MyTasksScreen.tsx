import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { colors, radius, spacing, shadow } from "../theme/tokens";
import { mockVehicleShift, mockTodayActivity, mockContextualChecklists } from "../services/mockMobileData";
import { ContextualChecklist } from "../types";
import { VehicleSelectorModal, VehicleOption } from "./VehicleSelectorModal";

interface MyTasksScreenProps {
  onOpenChecklist: (checklist: ContextualChecklist) => void;
}

export const MyTasksScreen: React.FC<MyTasksScreenProps> = ({ onOpenChecklist }) => {
  const [activeFilterChip, setActiveFilterChip] = useState<"PENDING" | "REVISION" | "COMPLETED">("PENDING");
  const [selectedVehicleOption, setSelectedVehicleOption] = useState<VehicleOption>({
    id: "veh-4092",
    model: "Toyota Hilux 4x4",
    plate: "ABC-1234",
    fleetId: "#4092",
    lastCheckStatus: "COMPLETED",
  });
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);

  const vehicleChecklists = mockContextualChecklists.filter((c) => c.contextType === "VEHICLE");
  const individualChecklists = mockContextualChecklists.filter((c) => c.contextType === "INDIVIDUAL");
  const activityChecklists = mockContextualChecklists.filter((c) => c.contextType === "ACTIVITY" || c.contextType === "APR");

  return (
    <View style={styles.container}>
      {/* Top Header estilo FieldOps */}
      <View style={styles.topHeader}>
        <View style={styles.headerTitleRow}>
          <Text style={styles.topTitle}>Inspeções de Hoje</Text>
          <TouchableOpacity
            style={styles.selectVehicleBtn}
            onPress={() => setIsVehicleModalOpen(true)}
            activeOpacity={0.8}
          >
            <Text style={styles.selectVehicleBtnText}>🚗 {selectedVehicleOption.plate} ▾</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.dateMetaText}>Sexta-feira, 24 de Julho • 3 tarefas críticas pendentes</Text>

        {/* Chips de Filtro Horizontal (FieldOps UI) */}
        <View style={styles.chipRow}>
          <TouchableOpacity
            style={[styles.chipItem, activeFilterChip === "PENDING" && styles.chipItemActive]}
            onPress={() => setActiveFilterChip("PENDING")}
          >
            <Text style={[styles.chipText, activeFilterChip === "PENDING" && styles.chipTextActive]}>
              Pendentes (3)
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.chipItem, activeFilterChip === "REVISION" && styles.chipItemActive]}
            onPress={() => setActiveFilterChip("REVISION")}
          >
            <Text style={[styles.chipText, activeFilterChip === "REVISION" && styles.chipTextActive]}>
              Em Revisão (1)
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.chipItem, activeFilterChip === "COMPLETED" && styles.chipItemActive]}
            onPress={() => setActiveFilterChip("COMPLETED")}
          >
            <Text style={[styles.chipText, activeFilterChip === "COMPLETED" && styles.chipTextActive]}>
              Finalizadas (2)
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Card 1: Checklist do Veículo */}
        {vehicleChecklists.map((item) => (
          <View key={item.id} style={styles.taskCard}>
            <View style={styles.cardHeaderRow}>
              <View style={styles.cardIconBox}>
                <Text style={{ fontSize: 20 }}>🚗</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardMainTitle}>{item.title}</Text>
                <View style={styles.tagRow}>
                  <View style={styles.tagObrigatorio}>
                    <Text style={styles.tagObrigatorioText}>OBRIGATÓRIO</Text>
                  </View>
                  <Text style={styles.contextTagText}>Veículo {selectedVehicleOption.plate}</Text>
                </View>
              </View>
              <Text style={styles.menuDots}>⋮</Text>
            </View>

            {/* Barra de Progresso Visual */}
            <View style={styles.progressContainer}>
              <View style={styles.progressTextRow}>
                <Text style={styles.progressLabel}>Progresso</Text>
                <Text style={styles.progressValue}>5/15 itens</Text>
              </View>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: "33%" }]} />
              </View>
            </View>

            <TouchableOpacity
              style={styles.continueBtn}
              onPress={() => onOpenChecklist(item)}
              activeOpacity={0.85}
            >
              <Text style={styles.continueBtnText}>Continuar ➔</Text>
            </TouchableOpacity>
          </View>
        ))}

        {/* Card 2: EPI / EPC */}
        {individualChecklists.map((item) => (
          <View key={item.id} style={styles.taskCard}>
            <View style={styles.cardHeaderRow}>
              <View style={styles.cardIconBox}>
                <Text style={{ fontSize: 20 }}>🛡️</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardMainTitle}>{item.title}</Text>
                <View style={styles.tagRow}>
                  <View style={styles.tagObrigatorio}>
                    <Text style={styles.tagObrigatorioText}>OBRIGATÓRIO</Text>
                  </View>
                  <Text style={styles.contextTagText}>Individual João Souza</Text>
                </View>
              </View>
              <Text style={styles.menuDots}>⋮</Text>
            </View>

            <View style={styles.progressContainer}>
              <View style={styles.progressTextRow}>
                <Text style={styles.progressLabel}>Progresso</Text>
                <Text style={styles.progressValue}>0/8 itens</Text>
              </View>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: "0%" }]} />
              </View>
            </View>

            <TouchableOpacity
              style={styles.startBtn}
              onPress={() => onOpenChecklist(item)}
              activeOpacity={0.8}
            >
              <Text style={styles.startBtnText}>Iniciar ➔</Text>
            </TouchableOpacity>
          </View>
        ))}

        {/* Card 3: APR (Análise de Risco) */}
        {activityChecklists.map((item) => (
          <View key={item.id} style={styles.taskCard}>
            <View style={styles.cardHeaderRow}>
              <View style={styles.cardIconBox}>
                <Text style={{ fontSize: 20 }}>⚠️</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardMainTitle}>{item.title}</Text>
                <View style={styles.tagRow}>
                  <View style={styles.tagRecomendado}>
                    <Text style={styles.tagRecomendadoText}>RECOMENDADO</Text>
                  </View>
                  <Text style={styles.contextTagText}>{mockTodayActivity.serviceOrderNumber}</Text>
                </View>
              </View>
              <Text style={styles.menuDots}>⋮</Text>
            </View>

            <View style={styles.progressContainer}>
              <View style={styles.progressTextRow}>
                <Text style={styles.progressLabel}>Progresso</Text>
                <Text style={styles.progressValue}>10/12 itens</Text>
              </View>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: "83%" }]} />
              </View>
            </View>

            <TouchableOpacity
              style={styles.continueBtn}
              onPress={() => onOpenChecklist(item)}
              activeOpacity={0.85}
            >
              <Text style={styles.continueBtnText}>Continuar ➔</Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>

      {/* Botão Flutuante de Adição [+] */}
      <TouchableOpacity style={styles.fabBtn} activeOpacity={0.9}>
        <Text style={styles.fabBtnText}>+</Text>
      </TouchableOpacity>

      {/* Modal de Seleção de Veículo */}
      <VehicleSelectorModal
        visible={isVehicleModalOpen}
        onClose={() => setIsVehicleModalOpen(false)}
        onSelectVehicle={(veh) => setSelectedVehicleOption(veh)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface.page,
  },
  topHeader: {
    backgroundColor: colors.navy[900],
    paddingTop: 48,
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[4],
  },
  headerTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  topTitle: {
    color: colors.text.inverse,
    fontSize: 20,
    fontWeight: "800",
  },
  selectVehicleBtn: {
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.md,
  },
  selectVehicleBtnText: {
    color: colors.cyan[500],
    fontSize: 11,
    fontWeight: "700",
    fontFamily: "monospace",
  },
  dateMetaText: {
    color: "rgba(214, 224, 239, 0.7)",
    fontSize: 11,
    marginTop: 2,
    marginBottom: spacing[4],
  },
  chipRow: {
    flexDirection: "row",
    gap: 8,
  },
  chipItem: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: radius.md,
  },
  chipItemActive: {
    backgroundColor: colors.blue[600],
  },
  chipText: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 11,
    fontWeight: "600",
  },
  chipTextActive: {
    color: colors.text.inverse,
    fontWeight: "800",
  },
  scrollContent: {
    padding: spacing[4],
    paddingBottom: 80,
  },
  taskCard: {
    backgroundColor: colors.surface.card,
    borderRadius: radius.lg,
    padding: spacing[4],
    borderWidth: 1,
    borderColor: colors.border.default,
    marginBottom: spacing[4],
    ...shadow.sm,
  },
  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  cardIconBox: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.surface.muted,
    alignItems: "center",
    justifyContent: "center",
  },
  cardMainTitle: {
    color: colors.text.primary,
    fontSize: 15,
    fontWeight: "800",
  },
  tagRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
  },
  tagObrigatorio: {
    backgroundColor: colors.danger.soft,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  tagObrigatorioText: {
    color: colors.danger.foreground,
    fontSize: 9,
    fontWeight: "800",
  },
  tagRecomendado: {
    backgroundColor: colors.blue[50],
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  tagRecomendadoText: {
    color: colors.blue[600],
    fontSize: 9,
    fontWeight: "800",
  },
  contextTagText: {
    color: colors.text.muted,
    fontSize: 10,
  },
  menuDots: {
    color: colors.text.muted,
    fontSize: 18,
    fontWeight: "bold",
  },
  progressContainer: {
    marginTop: 14,
    marginBottom: 14,
  },
  progressTextRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  progressLabel: {
    color: colors.text.secondary,
    fontSize: 11,
  },
  progressValue: {
    color: colors.text.primary,
    fontSize: 11,
    fontWeight: "700",
  },
  progressTrack: {
    height: 6,
    backgroundColor: colors.surface.muted,
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: colors.blue[600],
    borderRadius: 3,
  },
  continueBtn: {
    backgroundColor: colors.blue[600],
    borderRadius: radius.md,
    paddingVertical: 10,
    alignItems: "center",
  },
  continueBtnText: {
    color: colors.text.inverse,
    fontSize: 13,
    fontWeight: "700",
  },
  startBtn: {
    backgroundColor: colors.surface.muted,
    borderRadius: radius.md,
    paddingVertical: 10,
    alignItems: "center",
  },
  startBtnText: {
    color: colors.text.primary,
    fontSize: 13,
    fontWeight: "700",
  },
  fabBtn: {
    position: "absolute",
    right: 20,
    bottom: 25,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.blue[600],
    alignItems: "center",
    justifyContent: "center",
    elevation: 5,
    ...shadow.md,
  },
  fabBtnText: {
    color: colors.text.inverse,
    fontSize: 28,
    fontWeight: "300",
    lineHeight: 32,
  },
});
