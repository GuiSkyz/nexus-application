import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { colors, radius, spacing, shadow } from "../theme/tokens";
import { getResponsivePaddingTop, getResponsivePaddingBottom } from "../theme/responsive";
import { mockContextualChecklists } from "../services/mockMobileData";
import { ContextualChecklist } from "../types";

interface AllChecklistsScreenProps {
  onOpenChecklist: (checklist: ContextualChecklist) => void;
}

export const AllChecklistsScreen: React.FC<AllChecklistsScreenProps> = ({ onOpenChecklist }) => {
  const [selectedFilter, setSelectedFilter] = useState<"ALL" | "VEHICLE" | "INDIVIDUAL" | "ACTIVITY">("ALL");

  const filtered = mockContextualChecklists.filter((item) => {
    if (selectedFilter === "ALL") return true;
    if (selectedFilter === "VEHICLE") return item.contextType === "VEHICLE";
    if (selectedFilter === "INDIVIDUAL") return item.contextType === "INDIVIDUAL";
    if (selectedFilter === "ACTIVITY") return item.contextType === "ACTIVITY" || item.contextType === "APR";
    return true;
  });

  return (
    <View style={styles.container}>
      {/* Top Header responsivo */}
      <View style={styles.topHeader}>
        <Text style={styles.topTitle}>Central de Checklists</Text>
        <Text style={styles.dateMetaText}>Visão unificada por contexto operativo</Text>

        {/* Scroll Horizontal de Filtros Sem Cortar Textos */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterChipScroll}
        >
          <TouchableOpacity
            style={[styles.chipItem, selectedFilter === "ALL" && styles.chipItemActive]}
            onPress={() => setSelectedFilter("ALL")}
          >
            <Text style={[styles.chipText, selectedFilter === "ALL" && styles.chipTextActive]}>
              Todos ({mockContextualChecklists.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.chipItem, selectedFilter === "VEHICLE" && styles.chipItemActive]}
            onPress={() => setSelectedFilter("VEHICLE")}
          >
            <Text style={[styles.chipText, selectedFilter === "VEHICLE" && styles.chipTextActive]}>
              🚗 Veículo
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.chipItem, selectedFilter === "INDIVIDUAL" && styles.chipItemActive]}
            onPress={() => setSelectedFilter("INDIVIDUAL")}
          >
            <Text style={[styles.chipText, selectedFilter === "INDIVIDUAL" && styles.chipTextActive]}>
              👤 Individuais
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.chipItem, selectedFilter === "ACTIVITY" && styles.chipItemActive]}
            onPress={() => setSelectedFilter("ACTIVITY")}
          >
            <Text style={[styles.chipText, selectedFilter === "ACTIVITY" && styles.chipTextActive]}>
              ⚡ Atividades & APR
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {filtered.map((item) => (
          <View key={item.id} style={styles.checklistCard}>
            <View style={styles.cardHeaderRow}>
              <View style={styles.originTag}>
                <Text style={styles.originTagText}>CATEGORIA: {item.category.toUpperCase()}</Text>
              </View>
              <View style={styles.statusPill}>
                <Text style={styles.statusPillText}>PENDENTE</Text>
              </View>
            </View>

            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.cardMeta}>{item.category} • Versão 1.0 (Publicado)</Text>

            <View style={styles.divider} />

            <View style={styles.cardFooterRow}>
              <Text style={styles.questionCountText}>{item.questions.length} perguntas de verificação</Text>
              <TouchableOpacity
                style={styles.openBtn}
                onPress={() => onOpenChecklist(item)}
                activeOpacity={0.8}
              >
                <Text style={styles.openBtnText}>Abrir ➔</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>
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
    paddingTop: getResponsivePaddingTop(12),
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[4],
  },
  topTitle: {
    color: colors.text.inverse,
    fontSize: 20,
    fontWeight: "800",
  },
  dateMetaText: {
    color: "rgba(214, 224, 239, 0.7)",
    fontSize: 11,
    marginTop: 2,
    marginBottom: spacing[3],
  },
  filterChipScroll: {
    flexDirection: "row",
    gap: 8,
    paddingRight: 16,
  },
  chipItem: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: radius.md,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
  },
  chipItemActive: {
    backgroundColor: colors.cyan[500],
  },
  chipText: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 11,
    fontWeight: "600",
  },
  chipTextActive: {
    color: colors.navy[950],
    fontWeight: "800",
  },
  scrollContent: {
    padding: spacing[4],
    paddingBottom: getResponsivePaddingBottom(40),
  },
  checklistCard: {
    backgroundColor: colors.surface.card,
    borderRadius: radius.lg,
    padding: spacing[4],
    borderWidth: 1,
    borderColor: colors.border.default,
    marginBottom: spacing[3],
    ...shadow.sm,
  },
  cardHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  originTag: {
    backgroundColor: colors.blue[50],
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  originTagText: {
    color: colors.blue[600],
    fontSize: 9,
    fontWeight: "800",
  },
  statusPill: {
    backgroundColor: colors.warning.soft,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  statusPillText: {
    color: colors.warning.foreground,
    fontSize: 9,
    fontWeight: "800",
  },
  cardTitle: {
    color: colors.text.primary,
    fontSize: 15,
    fontWeight: "800",
    lineHeight: 20,
  },
  cardMeta: {
    color: colors.text.secondary,
    fontSize: 11,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border.default,
    marginVertical: 10,
  },
  cardFooterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  questionCountText: {
    color: colors.text.muted,
    fontSize: 11,
  },
  openBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  openBtnText: {
    color: colors.blue[600],
    fontSize: 12,
    fontWeight: "800",
  },
});
