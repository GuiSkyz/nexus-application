import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { LogOut } from "@tamagui/lucide-icons-2/icons/LogOut";

import { colors, radius, shadow, spacing } from "../theme/tokens";
import { MobileUser, MobileVehicle } from "../types";

interface ProfileScreenProps {
  user: MobileUser;
  vehicles: MobileVehicle[];
  onLogout: () => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  user,
  vehicles,
  onLogout,
}) => {
  const initials = user.name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
  const vehicle = vehicles[0];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Meu perfil</Text>
        <Text style={styles.subtitle}>Identidade e atribuições operacionais</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <View style={styles.avatarRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
            <View style={styles.copy}>
              <Text style={styles.userName}>{user.name}</Text>
              <Text style={styles.userRole}>
                {user.specialty || "Técnico operacional"}
              </Text>
              <Text style={styles.userEmail}>{user.email}</Text>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Atribuição atual</Text>
          <InfoRow label="Matrícula" value={user.employeeCode || "Não informada"} />
          <InfoRow label="Equipe" value={user.teamName || "Não atribuída"} />
          <InfoRow
            label="Veículo"
            value={vehicle ? `${vehicle.plate} · ${vehicle.model}` : "Não atribuído"}
          />
          <InfoRow
            label="Status do veículo"
            value={vehicle?.status || "Sem veículo"}
          />
        </View>

        <TouchableOpacity
          style={styles.logout}
          onPress={onLogout}
          accessibilityRole="button"
          accessibilityLabel="Sair da conta"
        >
          <LogOut size={18} color={colors.danger.foreground} />
          <Text style={styles.logoutText}>Sair da conta</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const InfoRow = ({ label, value }: { label: string; value: string }) => (
  <View style={styles.infoRow}>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={styles.infoValue}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface.page },
  header: {
    backgroundColor: colors.navy[900],
    paddingHorizontal: spacing[5],
    paddingTop: spacing[5],
    paddingBottom: spacing[4],
  },
  title: { color: colors.text.inverse, fontSize: 21, fontWeight: "800" },
  subtitle: { color: "#c9d5e7", fontSize: 12, marginTop: 3 },
  content: { padding: spacing[4], gap: spacing[4], paddingBottom: spacing[7] },
  card: {
    borderRadius: radius.lg,
    padding: spacing[4],
    backgroundColor: colors.surface.card,
    ...shadow.sm,
  },
  avatarRow: { flexDirection: "row", alignItems: "center", gap: 14 },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.blue[600],
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: colors.text.inverse, fontSize: 17, fontWeight: "800" },
  copy: { flex: 1 },
  userName: { color: colors.text.primary, fontSize: 16, fontWeight: "800" },
  userRole: { color: colors.text.secondary, fontSize: 12, marginTop: 2 },
  userEmail: { color: colors.text.secondary, fontSize: 11, marginTop: 2 },
  sectionTitle: {
    color: colors.text.primary,
    fontSize: 14,
    fontWeight: "800",
    marginBottom: spacing[3],
  },
  infoRow: {
    minHeight: 42,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border.default,
  },
  infoLabel: { color: colors.text.secondary, fontSize: 12 },
  infoValue: {
    flex: 1,
    color: colors.text.primary,
    fontSize: 12,
    fontWeight: "700",
    textAlign: "right",
  },
  logout: {
    minHeight: 50,
    borderRadius: radius.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.danger.soft,
  },
  logoutText: {
    color: colors.danger.foreground,
    fontSize: 13,
    fontWeight: "800",
  },
});
