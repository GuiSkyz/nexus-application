import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { ClipboardCheck } from "@tamagui/lucide-icons-2/icons/ClipboardCheck";
import { Clock3 } from "@tamagui/lucide-icons-2/icons/Clock3";

import { ApiService } from "../services/api";
import { Incident } from "../types";
import { colors, radius, shadow, spacing } from "../theme/tokens";

const severityLabels: Record<Incident["severity"], string> = {
  CRITICA: "Crítica",
  ALTA: "Alta",
  MEDIA: "Média",
  BAIXA: "Baixa",
};

export function ActionPlansScreen() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string>();

  const load = useCallback(async () => {
    try {
      setError(undefined);
      const records = await ApiService.getMyIncidents();
      setIncidents(records);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Não foi possível carregar os planos.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color={colors.blue[600]} /></View>;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Não conformidades</Text>
        <Text style={styles.subtitle}>Acompanhe as divergências registradas e as respectivas correções.</Text>
      </View>
      {error && <Text style={styles.error}>{error}</Text>}
      <FlatList
        data={incidents}
        keyExtractor={(item) => item.id}
        contentContainerStyle={incidents.length ? styles.list : styles.emptyList}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(); }} colors={[colors.blue[600]]} />}
        ListEmptyComponent={<View style={styles.empty}><ClipboardCheck size={42} color={colors.success.DEFAULT} /><Text style={styles.emptyTitle}>Nenhuma não conformidade</Text><Text style={styles.emptyText}>As não conformidades vinculadas a você aparecerão aqui, mesmo antes de receberem um plano de ação.</Text></View>}
        renderItem={({ item }) => {
          const plan = item.actionPlan;
          const resolved = item.status === "RESOLVIDA" || Boolean(plan?.resolvedAt);
          const statusLabel = resolved ? "Concluído" : plan ? "Em andamento" : "Aberta";
          return <View style={styles.card}>
            <View style={styles.cardTop}><Text style={styles.code}>{item.id}</Text><Text style={[styles.status, resolved ? styles.statusResolved : styles.statusOpen]}>{statusLabel}</Text></View>
            <Text style={styles.question}>{item.questionText}</Text>
            {plan ? <><Text style={styles.planLabel}>Ação corretiva</Text><Text style={styles.plan}>{plan.description}</Text><View style={styles.details}><Text style={styles.detail}>Responsável: {plan.assignedTo}</Text><View style={styles.deadline}><Clock3 size={14} color={colors.text.secondary} /><Text style={styles.detail}>Prazo: {new Date(plan.dueDate).toLocaleDateString("pt-BR")}</Text></View></View></> : <Text style={styles.waiting}>Aguardando definição do plano de ação pela supervisão.</Text>}
            <Text style={styles.severity}>Severidade: {severityLabels[item.severity]}</Text>
          </View>;
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface.page },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.surface.page },
  header: { backgroundColor: colors.navy[900], paddingHorizontal: spacing[5], paddingTop: spacing[5], paddingBottom: spacing[6] },
  title: { color: colors.text.inverse, fontSize: 21, fontWeight: "800" },
  subtitle: { color: "#c9d5e9", fontSize: 13, lineHeight: 19, marginTop: 6 },
  error: { color: colors.danger.foreground, backgroundColor: colors.danger.soft, fontSize: 12, fontWeight: "600", margin: spacing[4], padding: spacing[3], borderRadius: radius.md },
  list: { padding: spacing[4], gap: spacing[3] },
  emptyList: { flexGrow: 1 },
  empty: { alignItems: "center", justifyContent: "center", flex: 1, paddingHorizontal: 44, gap: 10 },
  emptyTitle: { color: colors.text.primary, fontSize: 16, fontWeight: "800" },
  emptyText: { color: colors.text.secondary, fontSize: 13, lineHeight: 19, textAlign: "center" },
  card: { backgroundColor: colors.surface.card, borderWidth: 1, borderColor: colors.border.default, borderRadius: radius.lg, padding: spacing[4], ...shadow.sm },
  cardTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 },
  code: { color: colors.blue[600], fontSize: 12, fontWeight: "800" },
  status: { borderRadius: radius.sm, fontSize: 10, fontWeight: "800", overflow: "hidden", paddingHorizontal: 8, paddingVertical: 4 },
  statusOpen: { backgroundColor: colors.warning.soft, color: colors.warning.foreground },
  statusResolved: { backgroundColor: colors.success.soft, color: colors.success.foreground },
  question: { color: colors.text.primary, fontSize: 15, fontWeight: "800", lineHeight: 21 },
  planLabel: { color: colors.text.secondary, fontSize: 11, fontWeight: "800", marginTop: 14 },
  plan: { color: colors.text.primary, fontSize: 13, lineHeight: 19, marginTop: 4 },
  waiting: { color: colors.text.secondary, fontSize: 13, lineHeight: 19, marginTop: 14 },
  details: { borderTopWidth: 1, borderTopColor: colors.border.default, gap: 6, marginTop: 14, paddingTop: 12 },
  detail: { color: colors.text.secondary, fontSize: 12 },
  deadline: { flexDirection: "row", alignItems: "center", gap: 5 },
  severity: { color: colors.text.muted, fontSize: 11, fontWeight: "600", marginTop: 12 },
});
