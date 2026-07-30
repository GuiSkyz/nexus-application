import React, { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { CheckCircle2 } from "@tamagui/lucide-icons-2/icons/CheckCircle2";
import { Clock3 } from "@tamagui/lucide-icons-2/icons/Clock3";

import { OfflineStorage } from "../services/offline/storage";
import { colors, radius, shadow, spacing } from "../theme/tokens";
import { InspectionHistoryItem, SyncQueueItem } from "../types";

interface HistoryScreenProps {
  history: InspectionHistoryItem[];
}

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));

export const HistoryScreen: React.FC<HistoryScreenProps> = ({ history }) => {
  const [localItems, setLocalItems] = useState<SyncQueueItem[]>([]);

  useEffect(() => {
    void OfflineStorage.getSyncQueue().then(setLocalItems);
  }, [history]);

  const pending = localItems.filter((item) => item.status !== "SYNCED");

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Histórico</Text>
        <Text style={styles.subtitle}>
          Registros confirmados no servidor e pendências deste aparelho
        </Text>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        {pending.map((item) => (
          <View key={item.id} style={styles.card}>
            <View style={styles.row}>
              <Clock3 size={18} color={colors.warning.foreground} />
              <Text style={styles.pendingLabel}>
                {item.status === "ERROR" ? "ENVIO PENDENTE" : item.status}
              </Text>
            </View>
            <Text style={styles.cardTitle}>
              {(item.payload as { title?: string }).title || item.entityType}
            </Text>
            <Text style={styles.meta}>{formatDate(item.createdAt)}</Text>
            {item.errorMessage && (
              <Text style={styles.errorText}>{item.errorMessage}</Text>
            )}
            <Text style={styles.uuid}>{item.id}</Text>
          </View>
        ))}

        {history.map((item) => (
          <View key={item.id} style={styles.card}>
            <View style={styles.row}>
              <CheckCircle2 size={18} color={colors.success.foreground} />
              <Text style={styles.syncedLabel}>SINCRONIZADO</Text>
            </View>
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.meta}>
              {formatDate(item.completedAt)}
              {item.vehiclePlate ? ` · ${item.vehiclePlate}` : ""}
            </Text>
            <Text style={styles.uuid}>{item.clientGeneratedId}</Text>
          </View>
        ))}

        {pending.length === 0 && history.length === 0 && (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>Nenhum registro ainda</Text>
            <Text style={styles.emptyText}>
              As inspeções concluídas aparecerão aqui após o primeiro envio.
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface.page },
  header: {
    backgroundColor: colors.navy[900],
    paddingHorizontal: spacing[5],
    paddingTop: spacing[5],
    paddingBottom: spacing[4],
  },
  title: { color: colors.text.inverse, fontSize: 21, fontWeight: "800" },
  subtitle: {
    color: "#c9d5e7",
    fontSize: 12,
    lineHeight: 17,
    marginTop: 3,
  },
  content: { padding: spacing[4], paddingBottom: spacing[7] },
  card: {
    borderRadius: radius.lg,
    backgroundColor: colors.surface.card,
    padding: spacing[4],
    marginBottom: spacing[3],
    ...shadow.sm,
  },
  row: { flexDirection: "row", alignItems: "center", gap: 7 },
  pendingLabel: {
    color: colors.warning.foreground,
    fontSize: 10,
    fontWeight: "800",
  },
  syncedLabel: {
    color: colors.success.foreground,
    fontSize: 10,
    fontWeight: "800",
  },
  cardTitle: {
    color: colors.text.primary,
    fontSize: 14,
    fontWeight: "800",
    marginTop: spacing[3],
  },
  meta: { color: colors.text.secondary, fontSize: 11, marginTop: 4 },
  errorText: {
    color: colors.danger.foreground,
    fontSize: 11,
    lineHeight: 16,
    marginTop: 7,
  },
  uuid: {
    color: colors.text.secondary,
    fontSize: 9,
    fontFamily: "monospace",
    marginTop: 8,
  },
  empty: { alignItems: "center", padding: spacing[7] },
  emptyTitle: { color: colors.text.primary, fontSize: 15, fontWeight: "800" },
  emptyText: {
    color: colors.text.secondary,
    fontSize: 12,
    textAlign: "center",
    marginTop: 4,
  },
});
