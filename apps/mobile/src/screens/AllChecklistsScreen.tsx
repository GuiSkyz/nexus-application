import React, { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { ChevronRight } from "@tamagui/lucide-icons-2/icons/ChevronRight";
import { ListChecks } from "@tamagui/lucide-icons-2/icons/ListChecks";

import { colors, radius, shadow, spacing } from "../theme/tokens";
import { ContextualChecklist } from "../types";

interface AllChecklistsScreenProps {
  checklists: ContextualChecklist[];
  onOpenChecklist: (checklist: ContextualChecklist) => void;
}

type Filter = "ALL" | "VEHICLE" | "INDIVIDUAL" | "ACTIVITY";

export const AllChecklistsScreen: React.FC<AllChecklistsScreenProps> = ({
  checklists,
  onOpenChecklist,
}) => {
  const [filter, setFilter] = useState<Filter>("ALL");
  const filtered = checklists.filter((item) => {
    if (filter === "ALL") return true;
    if (filter === "ACTIVITY") {
      return item.contextType === "ACTIVITY" || item.contextType === "APR";
    }
    return item.contextType === filter;
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Central de checklists</Text>
        <Text style={styles.subtitle}>Somente versões publicadas pela gestão</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filters}
        >
          {(
            [
              ["ALL", `Todos (${checklists.length})`],
              ["VEHICLE", "Veículo"],
              ["INDIVIDUAL", "Individual"],
              ["ACTIVITY", "Atividade e APR"],
            ] as Array<[Filter, string]>
          ).map(([value, label]) => (
            <TouchableOpacity
              key={value}
              style={[styles.chip, filter === value && styles.chipActive]}
              onPress={() => setFilter(value)}
              accessibilityRole="button"
              accessibilityState={{ selected: filter === value }}
            >
              <Text
                style={[
                  styles.chipText,
                  filter === value && styles.chipTextActive,
                ]}
              >
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {filtered.length === 0 ? (
          <View style={styles.empty}>
            <ListChecks size={30} color={colors.text.secondary} />
            <Text style={styles.emptyTitle}>Nenhum checklist disponível</Text>
            <Text style={styles.emptyText}>
              A gestão ainda não publicou um checklist para este contexto.
            </Text>
          </View>
        ) : (
          filtered.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[styles.card, item.state === "COMPLETED" && styles.cardCompleted]}
              onPress={() => item.state !== "COMPLETED" && onOpenChecklist(item)}
              disabled={item.state === "COMPLETED"}
              accessibilityRole="button"
              accessibilityState={{ disabled: item.state === "COMPLETED" }}
              accessibilityLabel={item.state === "COMPLETED" ? `${item.title}, concluído hoje` : `Abrir ${item.title}`}
            >
              <View style={styles.copy}>
                <Text style={styles.category}>{item.category}</Text>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text style={styles.meta}>
                  {item.state === "COMPLETED" ? "Concluído hoje · disponível amanhã" : `Versão ${item.templateVersion} · ${item.questions.length} itens`}
                </Text>
              </View>
              {item.state === "COMPLETED" ? <View style={styles.completedBadge}><Text style={styles.completedText}>CONCLUÍDO</Text></View> : <ChevronRight size={20} color={colors.blue[600]} />}
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface.page },
  header: {
    backgroundColor: colors.navy[900],
    paddingHorizontal: spacing[4],
    paddingTop: spacing[5],
    paddingBottom: spacing[4],
  },
  title: { color: colors.text.inverse, fontSize: 21, fontWeight: "800" },
  subtitle: { color: "#c9d5e7", fontSize: 12, marginTop: 3 },
  filters: { gap: 8, paddingTop: spacing[4], paddingRight: spacing[4] },
  chip: {
    minHeight: 44,
    justifyContent: "center",
    borderRadius: radius.md,
    paddingHorizontal: 14,
    backgroundColor: "#0d3264",
  },
  chipActive: { backgroundColor: colors.cyan[500] },
  chipText: { color: "#d4dfef", fontSize: 11, fontWeight: "700" },
  chipTextActive: { color: colors.navy[950], fontWeight: "800" },
  content: { padding: spacing[4], paddingBottom: spacing[7] },
  card: {
    minHeight: 86,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: radius.lg,
    backgroundColor: colors.surface.card,
    padding: spacing[4],
    marginBottom: spacing[3],
    ...shadow.sm,
  },
  cardCompleted: { backgroundColor: colors.surface.subtle, opacity: 0.78 },
  copy: { flex: 1 },
  category: { color: colors.blue[600], fontSize: 10, fontWeight: "800" },
  cardTitle: {
    color: colors.text.primary,
    fontSize: 15,
    fontWeight: "800",
    marginTop: 4,
  },
  meta: { color: colors.text.secondary, fontSize: 11, marginTop: 3 },
  completedBadge: { backgroundColor: colors.success.soft, borderRadius: radius.sm, paddingHorizontal: 7, paddingVertical: 4 },
  completedText: { color: colors.success.foreground, fontSize: 9, fontWeight: "800" },
  empty: { alignItems: "center", padding: spacing[7] },
  emptyTitle: {
    color: colors.text.primary,
    fontSize: 15,
    fontWeight: "800",
    marginTop: spacing[3],
  },
  emptyText: {
    color: colors.text.secondary,
    fontSize: 12,
    textAlign: "center",
    marginTop: 4,
  },
});
