import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Platform } from "react-native";
import { colors, radius, spacing, shadow } from "../theme/tokens";
import { CheckCircle2 } from "@tamagui/lucide-icons-2/icons/CheckCircle2";
import { RefreshCw } from "@tamagui/lucide-icons-2/icons/RefreshCw";
import { ShieldCheck } from "@tamagui/lucide-icons-2/icons/ShieldCheck";
import { SyncQueueItem } from "../types";
import { OfflineStorage } from "../services/offline/storage";
import { SyncOrchestrator } from "../services/offline/syncQueue";

interface SyncQueueScreenProps {
  onBack: () => void;
  highlightItemId?: string;
}

export const SyncQueueScreen: React.FC<SyncQueueScreenProps> = ({ onBack, highlightItemId }) => {
  const [queue, setQueue] = useState<SyncQueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const loadQueue = async () => {
    setLoading(true);
    const items = await OfflineStorage.getSyncQueue();
    setQueue(items.reverse()); // Mais recentes no topo
    setLoading(false);
  };

  useEffect(() => {
    loadQueue();
  }, []);

  const handleManualSync = async () => {
    setSyncing(true);
    await SyncOrchestrator.triggerSyncWorker();
    await loadQueue();
    setSyncing(false);
  };

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.topHeader}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Voltar</Text>
        </TouchableOpacity>
        <Text style={styles.topHeaderTitle}>Fila de Sincronização Local</Text>
        <View style={{ width: 60 }} />
      </View>

      <View style={styles.content}>
        {/* Banner Explicativo */}
        <View style={styles.infoBanner}>
          <View style={styles.bannerTitleRow}><ShieldCheck size={20} color={colors.blue[600]} /><Text style={styles.bannerTitle}>Salvo neste aparelho</Text></View>
          <Text style={styles.bannerSubtitle}>
            Cada registro recebeu um identificador único e será enviado assim que houver rede.
          </Text>

          <TouchableOpacity
            style={styles.syncButton}
            onPress={handleManualSync}
            disabled={syncing}
            activeOpacity={0.8}
          >
            {syncing ? (
              <ActivityIndicator color={colors.text.inverse} size="small" />
            ) : (
              <>
                <RefreshCw size={18} color={colors.text.inverse} />
                <Text style={styles.syncButtonText}>Sincronizar agora</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator color={colors.blue[600]} size="large" style={{ marginTop: 40 }} />
        ) : queue.length === 0 ? (
          <View style={styles.emptyContainer}>
            <CheckCircle2 size={40} color={colors.success.DEFAULT} />
            <Text style={styles.emptyTitle}>Nenhum Item Pendente</Text>
            <Text style={styles.emptySubtitle}>
              Todas as suas vistorias e evidências já estão sincronizadas com o servidor.
            </Text>
          </View>
        ) : (
          <FlatList
            data={queue}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => {
              const isHighlighted = item.id === highlightItemId;
              const payload = item.payload || {};
              const isError = item.status === "ERROR";
              const isPending = item.status === "PENDING" || item.status === "SYNCING";
              const statusLabel = isError
                ? "Falha no envio"
                : item.status === "SYNCED"
                  ? "Sincronizado"
                  : item.status === "SYNCING"
                    ? "Enviando"
                    : "Aguardando rede";

              return (
                <View
                  style={[
                    styles.card,
                    isHighlighted && styles.cardHighlighted,
                  ]}
                >
                  <View style={styles.cardHeader}>
                    <View style={styles.typeBadge}>
                      <Text style={styles.typeBadgeText}>{item.entityType}</Text>
                    </View>
                    <View
                      style={[
                        styles.statusPill,
                        isError
                          ? styles.statusPillError
                          : isPending
                          ? styles.statusPillPending
                          : styles.statusPillSynced,
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusPillText,
                          isError
                            ? styles.statusPillTextError
                            : isPending
                            ? styles.statusPillTextPending
                            : styles.statusPillTextSynced,
                        ]}
                      >
                        {statusLabel}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.itemTitle}>
                    {payload.title || "Vistoria Registrada"}
                  </Text>

                  {payload.vehiclePlate && (
                    <Text style={styles.itemDetail}>
                      Veículo: {payload.vehicleModel} ({payload.vehiclePlate})
                    </Text>
                  )}

                  <Text style={styles.uuidText}>UUID Cliente: {item.id}</Text>
                  {item.errorMessage && (
                    <Text style={styles.errorMessage}>{item.errorMessage}</Text>
                  )}

                  <View style={styles.cardFooter}>
                    <Text style={styles.timeText}>
                      Gravado em: {new Date(item.createdAt).toLocaleString("pt-BR")}
                    </Text>
                    <Text style={styles.retryText}>Tentativas: {item.retryCount}</Text>
                  </View>
                </View>
              );
            }}
          />
        )}
      </View>
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
    paddingTop: 50,
    paddingBottom: spacing[4],
    paddingHorizontal: spacing[5],
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backButton: {
    paddingVertical: 4,
    paddingRight: 10,
  },
  backButtonText: {
    color: colors.text.inverse,
    fontSize: 14,
    fontWeight: "600",
  },
  topHeaderTitle: {
    color: colors.text.inverse,
    fontSize: 16,
    fontWeight: "700",
  },
  content: {
    flex: 1,
    padding: spacing[5],
  },
  infoBanner: {
    backgroundColor: colors.surface.card,
    borderRadius: radius.lg,
    padding: spacing[4],
    borderWidth: 1,
    borderColor: colors.border.default,
    marginBottom: spacing[4],
    ...shadow.sm,
  },
  bannerTitle: {
    color: colors.text.primary,
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 4,
  },
  bannerTitleRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 },
  bannerSubtitle: {
    color: colors.text.secondary,
    fontSize: 12,
    lineHeight: 18,
    marginBottom: spacing[3],
  },
  syncButton: {
    backgroundColor: colors.blue[600],
    borderRadius: radius.md,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    minHeight: 48,
  },
  syncButtonText: {
    color: colors.text.inverse,
    fontSize: 13,
    fontWeight: "600",
  },
  listContent: {
    paddingBottom: 40,
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
  cardHighlighted: {
    borderColor: colors.warning.DEFAULT,
    borderWidth: 2,
    backgroundColor: colors.warning.soft,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  typeBadge: {
    backgroundColor: colors.blue[50],
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  typeBadgeText: {
    color: colors.blue[600],
    fontSize: 10,
    fontWeight: "700",
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  statusPillPending: {
    backgroundColor: colors.warning.soft,
  },
  statusPillSynced: {
    backgroundColor: colors.success.soft,
  },
  statusPillError: {
    backgroundColor: colors.danger.soft,
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: "700",
  },
  statusPillTextPending: {
    color: colors.warning.foreground,
  },
  statusPillTextSynced: {
    color: colors.success.foreground,
  },
  statusPillTextError: {
    color: colors.danger.foreground,
  },
  itemTitle: {
    color: colors.text.primary,
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 4,
  },
  itemDetail: {
    color: colors.text.secondary,
    fontSize: 12,
    marginBottom: 4,
  },
  uuidText: {
    color: colors.text.muted,
    fontSize: 10,
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
    marginBottom: 8,
  },
  errorMessage: {
    color: colors.danger.foreground,
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 8,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: colors.border.default,
    paddingTop: 8,
    marginTop: 4,
  },
  timeText: {
    color: colors.text.muted,
    fontSize: 11,
  },
  retryText: {
    color: colors.text.muted,
    fontSize: 11,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: 12,
  },
  emptyTitle: {
    color: colors.text.primary,
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
  },
  emptySubtitle: {
    color: colors.text.muted,
    fontSize: 12,
    textAlign: "center",
    paddingHorizontal: 40,
  },
});
