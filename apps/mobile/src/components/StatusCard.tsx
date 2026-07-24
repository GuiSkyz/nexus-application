import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors, radius, shadow } from "../theme/tokens";

type ServiceStatus = "healthy" | "unhealthy" | "unknown" | "loading" | "ready" | "unready" | "error";

interface StatusCardProps {
  label: string;
  status: ServiceStatus;
  description?: string;
}

function resolveStatusConfig(status: ServiceStatus) {
  switch (status) {
    case "healthy":
    case "ready":
      return {
        label: "Operacional",
        dotColor: colors.success.DEFAULT,
        badgeBg: colors.success.soft,
        badgeText: colors.success.foreground,
      };
    case "unhealthy":
    case "unready":
    case "error":
      return {
        label: "Indisponível",
        dotColor: colors.danger.DEFAULT,
        badgeBg: colors.danger.soft,
        badgeText: colors.danger.foreground,
      };
    case "loading":
      return {
        label: "Verificando",
        dotColor: colors.warning.DEFAULT,
        badgeBg: colors.warning.soft,
        badgeText: colors.warning.foreground,
      };
    default:
      return {
        label: "Desconhecido",
        dotColor: colors.text.muted,
        badgeBg: colors.surface.muted,
        badgeText: colors.text.secondary,
      };
  }
}

export const StatusCard: React.FC<StatusCardProps> = ({ label, status, description }) => {
  const config = resolveStatusConfig(status);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.leftSide}>
          <View style={[styles.dot, { backgroundColor: config.dotColor }]} />
          <View>
            <Text style={styles.label}>{label}</Text>
            {description ? <Text style={styles.description}>{description}</Text> : null}
          </View>
        </View>
        <View style={[styles.badge, { backgroundColor: config.badgeBg }]}>
          <Text style={[styles.badgeText, { color: config.badgeText }]}>
            {config.label}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface.card,
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: radius.lg,
    padding: 16,
    marginBottom: 8,
    ...shadow.sm,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  leftSide: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  label: {
    color: colors.text.primary,
    fontSize: 14,
    fontWeight: "600",
  },
  description: {
    color: colors.text.muted,
    fontSize: 11,
    marginTop: 2,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.sm,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "500",
  },
});
