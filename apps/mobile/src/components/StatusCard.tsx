import React from "react";
import { View, Text, StyleSheet } from "react-native";

interface StatusCardProps {
  label: string;
  status: "healthy" | "unhealthy" | "unknown" | "loading" | "ready" | "unready" | "error";
  description?: string;
}

export const StatusCard: React.FC<StatusCardProps> = ({ label, status, description }) => {
  const getBadgeStyle = () => {
    switch (status) {
      case "healthy":
      case "ready":
        return { backgroundColor: "#065F46", borderColor: "#10B981" };
      case "unhealthy":
      case "unready":
      case "error":
        return { backgroundColor: "#7F1D1D", borderColor: "#EF4444" };
      case "loading":
        return { backgroundColor: "#78350F", borderColor: "#F59E0B" };
      default:
        return { backgroundColor: "#1E293B", borderColor: "#475569" };
    }
  };

  const getTextColor = () => {
    switch (status) {
      case "healthy":
      case "ready":
        return "#34D399";
      case "unhealthy":
      case "unready":
      case "error":
        return "#F87171";
      case "loading":
        return "#FBBF24";
      default:
        return "#94A3B8";
    }
  };

  return (
    <View style={[styles.card, getBadgeStyle()]}>
      <View style={styles.header}>
        <Text style={styles.label}>{label}</Text>
        <Text style={[styles.statusText, { color: getTextColor() }]}>{status.toUpperCase()}</Text>
      </View>
      {description ? <Text style={styles.description}>{description}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  label: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "bold",
  },
  description: {
    color: "#CBD5E1",
    fontSize: 12,
    opacity: 0.85,
  },
});
