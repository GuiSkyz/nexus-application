import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from "react-native";
import { colors, radius, spacing, shadow } from "../theme/tokens";
import { mockVehicleShift, mockTodayActivity, mockContextualChecklists } from "../services/mockMobileData";
import { OfflineStorage } from "../services/offline/storage";

interface HomeScreenProps {
  onNavigateTab: (tabName: any) => void;
  onOpenChecklist: (checklistId: string) => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ onNavigateTab, onOpenChecklist }) => {
  const [pendingSyncCount, setPendingSyncCount] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const loadSyncStatus = async () => {
    const queue = await OfflineStorage.getSyncQueue();
    const pending = queue.filter((i) => i.status === "PENDING").length;
    setPendingSyncCount(pending);
  };

  useEffect(() => {
    loadSyncStatus();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadSyncStatus();
    setRefreshing(false);
  };

  const vehicleChecklists = mockContextualChecklists.filter((c) => c.contextType === "VEHICLE");
  const individualChecklists = mockContextualChecklists.filter((c) => c.contextType === "INDIVIDUAL");
  const activityChecklists = mockContextualChecklists.filter((c) => c.contextType === "ACTIVITY" || c.contextType === "APR");

  const pendingIndividualCount = individualChecklists.filter((c) => c.state === "PENDING").length;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.blue[600]}
          colors={[colors.blue[600]]}
        />
      }
    >
      {/* Top Welcome Header */}
      <View style={styles.topHeader}>
        <View style={styles.welcomeRow}>
          <View>
            <Text style={styles.greetingText}>Bom dia,</Text>
            <Text style={styles.userNameText}>{mockVehicleShift.technicianName}</Text>
          </View>

          <View style={styles.shiftBadge}>
            <Text style={styles.shiftBadgeText}>Equipe Alfa</Text>
          </View>
        </View>

        <Text style={styles.dateMeta}>{mockVehicleShift.date} • {mockVehicleShift.shift}</Text>
      </View>

      {/* Card 1: Veículo Atual */}
      <View style={styles.card}>
        <View style={styles.cardHeaderRow}>
          <Text style={styles.cardCategoryTitle}>🚗 VEÍCULOS E FROTA</Text>
          {mockVehicleShift.isResponsible ? (
            <View style={styles.respBadge}>
              <Text style={styles.respBadgeText}>RESPONSÁVEL PELO TURNO</Text>
            </View>
          ) : (
            <View style={styles.memberBadge}>
              <Text style={styles.memberBadgeText}>MEMBRO DA EQUIPE</Text>
            </View>
          )}
        </View>

        <Text style={styles.vehicleTitle}>{mockVehicleShift.fleetNumber}</Text>
        <View style={styles.vehicleSubRow}>
          <Text style={styles.vehicleModelText}>{mockVehicleShift.model}</Text>
          <View style={styles.plateBadge}>
            <Text style={styles.plateText}>{mockVehicleShift.plate}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.cardFooterRow}>
          <Text style={styles.lastCheckText}>Última vistoria: {mockVehicleShift.lastInspectionDate}</Text>
          <TouchableOpacity
            style={styles.actionBtnPrimary}
            onPress={() => onNavigateTab("MY_TASKS")}
            activeOpacity={0.85}
          >
            <Text style={styles.actionBtnPrimaryText}>Iniciar Checklist do Veículo ➔</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Card 2: Meu Checklist Individual */}
      <View style={styles.card}>
        <View style={styles.cardHeaderRow}>
          <Text style={styles.cardCategoryTitle}>👤 MEU CHECKLIST INDIVIDUAL</Text>
          {pendingIndividualCount > 0 ? (
            <View style={styles.pendingBadge}>
              <Text style={styles.pendingBadgeText}>{pendingIndividualCount} PENDENTE(S)</Text>
            </View>
          ) : (
            <View style={styles.completedBadge}>
              <Text style={styles.completedBadgeText}>CONCLUÍDO</Text>
            </View>
          )}
        </View>

        <Text style={styles.cardMainTitle}>EPIs, Uniforme & Treinamentos</Text>
        <Text style={styles.cardSubText}>
          Verificação obrigatória do técnico para liberação de início de atividades.
        </Text>

        <TouchableOpacity
          style={styles.actionBtnOutline}
          onPress={() => onNavigateTab("MY_TASKS")}
          activeOpacity={0.8}
        >
          <Text style={styles.actionBtnOutlineText}>Continuar Checklist Individual ➔</Text>
        </TouchableOpacity>
      </View>

      {/* Card 3: Atividades de Hoje */}
      <View style={styles.card}>
        <View style={styles.cardHeaderRow}>
          <Text style={styles.cardCategoryTitle}>⚡ ATIVIDADES E APR DE HOJE</Text>
          <View style={styles.riskBadge}>
            <Text style={styles.riskBadgeText}>RISCO: {mockTodayActivity.riskLevel}</Text>
          </View>
        </View>

        <Text style={styles.cardMainTitle}>{mockTodayActivity.serviceOrderNumber} — {mockTodayActivity.title}</Text>
        <Text style={styles.cardSubText}>📍 {mockTodayActivity.address}</Text>

        <TouchableOpacity
          style={styles.actionBtnOutline}
          onPress={() => onNavigateTab("MY_TASKS")}
          activeOpacity={0.8}
        >
          <Text style={styles.actionBtnOutlineText}>Ver Checklists da Atividade ➔</Text>
        </TouchableOpacity>
      </View>

      {/* Card 4: Sincronização Offline */}
      <View style={styles.syncCard}>
        <View style={styles.syncRow}>
          <Text style={{ fontSize: 24 }}>📦</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.syncTitle}>Sincronização Offline Local</Text>
            <Text style={styles.syncText}>
              {pendingSyncCount > 0
                ? `${pendingSyncCount} vistoria(s) gravada(s) localmente aguardando rede.`
                : "Todos os registros estão sincronizados com a nuvem."}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.syncActionBtn}
            onPress={() => onNavigateTab("ALL_CHECKLISTS")}
          >
            <Text style={styles.syncActionText}>Ver Fila</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface.page,
  },
  contentContainer: {
    padding: spacing[5],
    paddingTop: 56,
    paddingBottom: spacing[8],
  },
  topHeader: {
    marginBottom: spacing[5],
  },
  welcomeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  greetingText: {
    color: colors.text.muted,
    fontSize: 13,
  },
  userNameText: {
    color: colors.text.primary,
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  shiftBadge: {
    backgroundColor: colors.blue[50],
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.md,
  },
  shiftBadgeText: {
    color: colors.blue[600],
    fontSize: 11,
    fontWeight: "700",
  },
  dateMeta: {
    color: colors.text.muted,
    fontSize: 12,
    marginTop: 4,
  },
  card: {
    backgroundColor: colors.surface.card,
    borderRadius: radius.xl,
    padding: spacing[4],
    borderWidth: 1,
    borderColor: colors.border.default,
    marginBottom: spacing[4],
    ...shadow.sm,
  },
  cardHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  cardCategoryTitle: {
    color: colors.blue[600],
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  respBadge: {
    backgroundColor: colors.success.soft,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  respBadgeText: {
    color: colors.success.foreground,
    fontSize: 9,
    fontWeight: "800",
  },
  memberBadge: {
    backgroundColor: colors.surface.muted,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  memberBadgeText: {
    color: colors.text.secondary,
    fontSize: 9,
    fontWeight: "700",
  },
  vehicleTitle: {
    color: colors.text.primary,
    fontSize: 18,
    fontWeight: "800",
  },
  vehicleSubRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 2,
  },
  vehicleModelText: {
    color: colors.text.secondary,
    fontSize: 13,
  },
  plateBadge: {
    backgroundColor: colors.surface.subtle,
    borderWidth: 1,
    borderColor: colors.border.default,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: radius.sm,
  },
  plateText: {
    color: colors.text.primary,
    fontSize: 11,
    fontWeight: "700",
    fontFamily: "monospace",
  },
  divider: {
    height: 1,
    backgroundColor: colors.border.default,
    marginVertical: 12,
  },
  cardFooterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  lastCheckText: {
    color: colors.text.muted,
    fontSize: 11,
  },
  actionBtnPrimary: {
    backgroundColor: colors.blue[600],
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.md,
  },
  actionBtnPrimaryText: {
    color: colors.text.inverse,
    fontSize: 12,
    fontWeight: "700",
  },
  pendingBadge: {
    backgroundColor: colors.warning.soft,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  pendingBadgeText: {
    color: colors.warning.foreground,
    fontSize: 9,
    fontWeight: "800",
  },
  completedBadge: {
    backgroundColor: colors.success.soft,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  completedBadgeText: {
    color: colors.success.foreground,
    fontSize: 9,
    fontWeight: "800",
  },
  cardMainTitle: {
    color: colors.text.primary,
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 4,
  },
  cardSubText: {
    color: colors.text.secondary,
    fontSize: 12,
    marginBottom: 12,
  },
  actionBtnOutline: {
    borderWidth: 1,
    borderColor: colors.blue[600],
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: radius.md,
    alignItems: "center",
  },
  actionBtnOutlineText: {
    color: colors.blue[600],
    fontSize: 12,
    fontWeight: "700",
  },
  riskBadge: {
    backgroundColor: colors.danger.soft,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  riskBadgeText: {
    color: colors.danger.foreground,
    fontSize: 9,
    fontWeight: "800",
  },
  syncCard: {
    backgroundColor: colors.surface.card,
    borderRadius: radius.xl,
    padding: spacing[4],
    borderWidth: 1,
    borderColor: colors.border.default,
    ...shadow.sm,
  },
  syncRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  syncTitle: {
    color: colors.text.primary,
    fontSize: 14,
    fontWeight: "700",
  },
  syncText: {
    color: colors.text.muted,
    fontSize: 11,
    marginTop: 2,
  },
  syncActionBtn: {
    backgroundColor: colors.surface.muted,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.md,
  },
  syncActionText: {
    color: colors.text.primary,
    fontSize: 11,
    fontWeight: "600",
  },
});
