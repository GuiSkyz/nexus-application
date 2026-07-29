import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { Car, UserRound } from "@tamagui/lucide-icons-2";
import { colors, radius, spacing, shadow } from "../theme/tokens";
import { mockVehicleShift } from "../services/mockMobileData";

export const HistoryScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <View style={styles.topHeader}>
        <Text style={styles.topTitle}>Histórico de Vistorias</Text>
        <Text style={styles.topSubtitle}>Registros salvos e concluídos neste dispositivo</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.historyCard}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.typeRow}><Car size={15} color={colors.blue[600]} /><Text style={styles.cardType}>VISTORIA DE SAÍDA · FROTA</Text></View>
            <View style={styles.syncedBadge}>
              <Text style={styles.syncedBadgeText}>SINCRONIZADO</Text>
            </View>
          </View>
          <Text style={styles.cardTitle}>Vistoria Diária — {mockVehicleShift.fleetNumber}</Text>
          <Text style={styles.cardMeta}>Concluído em: Ontem às 17:40 • Técnico: João Souza</Text>
          <Text style={styles.cardUuid}>UUID: 8f4a12b9-3c7d-4e9f-9a1b-0248a356e719</Text>
        </View>

        <View style={styles.historyCard}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.typeRow}><UserRound size={15} color={colors.blue[600]} /><Text style={styles.cardType}>INDIVIDUAL · CERTIFICAÇÃO</Text></View>
            <View style={styles.syncedBadge}>
              <Text style={styles.syncedBadgeText}>SINCRONIZADO</Text>
            </View>
          </View>
          <Text style={styles.cardTitle}>Validade de Treinamentos & CNH</Text>
          <Text style={styles.cardMeta}>Concluído em: 21/07/2026 às 08:15 • Técnico: João Souza</Text>
          <Text style={styles.cardUuid}>UUID: c4b89e21-5a0d-4b82-9f33-7e821094ab02</Text>
        </View>
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
    paddingTop: 50,
    paddingHorizontal: spacing[5],
    paddingBottom: spacing[4],
  },
  topTitle: {
    color: colors.text.inverse,
    fontSize: 18,
    fontWeight: "800",
  },
  topSubtitle: {
    color: "rgba(214, 224, 239, 0.7)",
    fontSize: 12,
    marginTop: 2,
  },
  scrollContent: {
    padding: spacing[5],
    gap: spacing[3],
  },
  historyCard: {
    backgroundColor: colors.surface.card,
    borderRadius: radius.lg,
    padding: spacing[4],
    borderWidth: 1,
    borderColor: colors.border.default,
    ...shadow.sm,
  },
  cardHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  typeRow: { flexDirection: "row", alignItems: "center", gap: 6, flex: 1 },
  cardType: {
    color: colors.blue[600],
    fontSize: 12,
    fontWeight: "700",
  },
  syncedBadge: {
    backgroundColor: colors.success.soft,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  syncedBadgeText: {
    color: colors.success.foreground,
    fontSize: 11,
    fontWeight: "800",
  },
  cardTitle: {
    color: colors.text.primary,
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 4,
  },
  cardMeta: {
    color: colors.text.secondary,
    fontSize: 11,
    marginBottom: 4,
  },
  cardUuid: {
    color: colors.text.muted,
    fontSize: 10,
    fontFamily: "monospace",
  },
});
