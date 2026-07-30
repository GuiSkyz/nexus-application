import React, { useState } from "react";
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { ArrowRight } from "@tamagui/lucide-icons-2/icons/ArrowRight";
import { Car } from "@tamagui/lucide-icons-2/icons/Car";
import { ClipboardCheck } from "@tamagui/lucide-icons-2/icons/ClipboardCheck";
import { CloudOff } from "@tamagui/lucide-icons-2/icons/CloudOff";

import { colors, radius, shadow, spacing } from "../theme/tokens";
import { MobileContext, MobileTabName } from "../types";

interface HomeScreenProps {
  context: MobileContext | null;
  pendingSyncCount: number;
  onRefresh: () => Promise<void>;
  onNavigateTab: (tab: MobileTabName) => void;
  onOpenChecklist: (checklistId: string) => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  context,
  pendingSyncCount,
  onRefresh,
  onNavigateTab,
  onOpenChecklist,
}) => {
  const [refreshing, setRefreshing] = useState(false);
  const vehicle = context?.vehicles[0];
  const requiredChecklist =
    context?.checklists.find((item) => item.isRequired) ||
    context?.checklists[0];

  const refresh = async () => {
    setRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => void refresh()}
          colors={[colors.blue[600]]}
        />
      }
    >
      <View style={styles.welcome}>
        <Text style={styles.greeting}>Olá,</Text>
        <Text style={styles.userName}>{context?.user.name || "Técnico"}</Text>
        <Text style={styles.team}>
          {context?.user.teamName || "Equipe ainda não atribuída"}
        </Text>
      </View>

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.iconBox}>
            <Car size={20} color={colors.blue[600]} />
          </View>
          <View style={styles.headerCopy}>
            <Text style={styles.cardLabel}>VEÍCULO ATRIBUÍDO</Text>
            <Text style={styles.cardTitle}>
              {vehicle?.model || "Nenhum veículo atribuído"}
            </Text>
          </View>
        </View>
        {vehicle ? (
          <>
            <Text style={styles.meta}>
              Placa {vehicle.plate} · {vehicle.currentKm.toLocaleString("pt-BR")} km
            </Text>
            <View style={styles.statusRow}>
              <View style={styles.successBadge}>
                <Text style={styles.successText}>{vehicle.status}</Text>
              </View>
              <Text style={styles.yearText}>Ano {vehicle.year}</Text>
            </View>
          </>
        ) : (
          <Text style={styles.emptyText}>
            Solicite ao Coordenador a atribuição do veículo antes de iniciar a
            vistoria de frota.
          </Text>
        )}
      </View>

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.iconBox}>
            <ClipboardCheck size={20} color={colors.blue[600]} />
          </View>
          <View style={styles.headerCopy}>
            <Text style={styles.cardLabel}>PRÓXIMA TAREFA</Text>
            <Text style={styles.cardTitle}>
              {requiredChecklist?.title || "Nenhum checklist publicado"}
            </Text>
          </View>
        </View>
        {requiredChecklist && (
          <>
            <Text style={styles.meta}>
              {requiredChecklist.questions.length} itens · aproximadamente{" "}
              {requiredChecklist.estimatedMinutes} minutos
            </Text>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => onOpenChecklist(requiredChecklist.id)}
              accessibilityRole="button"
              accessibilityLabel={`Iniciar ${requiredChecklist.title}`}
            >
              <Text style={styles.primaryButtonText}>Iniciar checklist</Text>
              <ArrowRight size={18} color={colors.text.inverse} />
            </TouchableOpacity>
          </>
        )}
      </View>

      {pendingSyncCount > 0 && (
        <TouchableOpacity
          style={styles.syncNotice}
          onPress={() => onNavigateTab("HISTORY")}
          accessibilityRole="button"
        >
          <CloudOff size={20} color={colors.warning.foreground} />
          <View style={styles.headerCopy}>
            <Text style={styles.syncTitle}>
              {pendingSyncCount} registro(s) aguardando envio
            </Text>
            <Text style={styles.syncText}>
              Permanecem protegidos neste aparelho até a conexão retornar.
            </Text>
          </View>
          <ArrowRight size={18} color={colors.warning.foreground} />
        </TouchableOpacity>
      )}

      <TouchableOpacity
        style={styles.secondaryButton}
        onPress={() => onNavigateTab("ALL_CHECKLISTS")}
        accessibilityRole="button"
      >
        <Text style={styles.secondaryButtonText}>Ver todos os checklists</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface.page },
  content: { padding: spacing[5], paddingBottom: spacing[7] },
  welcome: { marginBottom: spacing[5] },
  greeting: { color: colors.text.secondary, fontSize: 14 },
  userName: {
    color: colors.text.primary,
    fontSize: 26,
    fontWeight: "800",
    marginTop: 1,
  },
  team: { color: colors.text.secondary, fontSize: 13, marginTop: 3 },
  card: {
    backgroundColor: colors.surface.card,
    borderRadius: radius.lg,
    padding: spacing[4],
    marginBottom: spacing[4],
    ...shadow.sm,
  },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 12 },
  iconBox: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.blue[50],
  },
  headerCopy: { flex: 1 },
  cardLabel: {
    color: colors.text.secondary,
    fontSize: 10,
    fontWeight: "700",
  },
  cardTitle: {
    color: colors.text.primary,
    fontSize: 16,
    fontWeight: "800",
    marginTop: 2,
  },
  meta: { color: colors.text.secondary, fontSize: 12, marginTop: spacing[3] },
  emptyText: {
    color: colors.text.secondary,
    fontSize: 12,
    lineHeight: 18,
    marginTop: spacing[3],
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: spacing[3],
  },
  successBadge: {
    borderRadius: radius.sm,
    backgroundColor: colors.success.soft,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  successText: {
    color: colors.success.foreground,
    fontSize: 10,
    fontWeight: "800",
  },
  yearText: { color: colors.text.secondary, fontSize: 11 },
  primaryButton: {
    minHeight: 48,
    marginTop: spacing[4],
    borderRadius: radius.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.blue[600],
  },
  primaryButtonText: {
    color: colors.text.inverse,
    fontSize: 13,
    fontWeight: "800",
  },
  syncNotice: {
    minHeight: 72,
    borderRadius: radius.lg,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: spacing[4],
    marginBottom: spacing[4],
    backgroundColor: colors.warning.soft,
  },
  syncTitle: {
    color: colors.warning.foreground,
    fontSize: 12,
    fontWeight: "800",
  },
  syncText: {
    color: colors.warning.foreground,
    fontSize: 11,
    lineHeight: 16,
    marginTop: 2,
  },
  secondaryButton: {
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryButtonText: {
    color: colors.blue[600],
    fontSize: 13,
    fontWeight: "800",
  },
});
