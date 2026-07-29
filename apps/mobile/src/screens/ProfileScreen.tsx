import React from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { LogOut } from "@tamagui/lucide-icons-2";
import { colors, radius, spacing, shadow } from "../theme/tokens";
import { mockVehicleShift } from "../services/mockMobileData";

interface ProfileScreenProps {
  onLogout: () => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ onLogout }) => {
  return (
    <View style={styles.container}>
      <View style={styles.topHeader}>
        <Text style={styles.topTitle}>Perfil do Técnico</Text>
        <Text style={styles.topSubtitle}>Informações do turno e equipe operacional</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* User Card */}
        <View style={styles.card}>
          <View style={styles.avatarRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>JS</Text>
            </View>
            <View>
              <Text style={styles.userName}>{mockVehicleShift.technicianName}</Text>
              <Text style={styles.userRole}>Técnico Operacional - Instalação FTTH</Text>
            </View>
          </View>
        </View>

        {/* Atribuição do Turno Card */}
        <View style={styles.card}>
          <Text style={styles.cardSectionTitle}>Atribuição do Turno Atual</Text>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Veículo Atribuído:</Text>
            <Text style={styles.infoValue}>{mockVehicleShift.fleetNumber} ({mockVehicleShift.model})</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Placa do Veículo:</Text>
            <Text style={styles.infoValueFont}>{mockVehicleShift.plate}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Equipe:</Text>
            <Text style={styles.infoValue}>{mockVehicleShift.teamName}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Responsável pelo Envio:</Text>
            <Text style={styles.infoValueHighlight}>
              {mockVehicleShift.isResponsible ? "Sim (Você é o responsável do veículo)" : "Não"}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Outros Membros:</Text>
            <Text style={styles.infoValue}>{mockVehicleShift.participants.join(", ")}</Text>
          </View>
        </View>

        {/* Botão Sair */}
        <TouchableOpacity style={styles.logoutBtn} onPress={onLogout} activeOpacity={0.8} accessibilityRole="button" accessibilityLabel="Sair da conta">
          <LogOut size={18} color={colors.danger.foreground} />
          <Text style={styles.logoutBtnText}>Sair da conta</Text>
        </TouchableOpacity>
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
    gap: spacing[4],
  },
  card: {
    backgroundColor: colors.surface.card,
    borderRadius: radius.lg,
    padding: spacing[4],
    borderWidth: 1,
    borderColor: colors.border.default,
    ...shadow.sm,
  },
  avatarRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.blue[600],
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: colors.text.inverse,
    fontSize: 18,
    fontWeight: "800",
  },
  userName: {
    color: colors.text.primary,
    fontSize: 16,
    fontWeight: "800",
  },
  userRole: {
    color: colors.text.secondary,
    fontSize: 12,
    marginTop: 2,
  },
  cardSectionTitle: {
    color: colors.text.primary,
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
    paddingBottom: 8,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  infoLabel: {
    color: colors.text.muted,
    fontSize: 12,
  },
  infoValue: {
    color: colors.text.primary,
    fontSize: 12,
    fontWeight: "600",
  },
  infoValueFont: {
    color: colors.text.primary,
    fontSize: 12,
    fontWeight: "700",
    fontFamily: "monospace",
  },
  infoValueHighlight: {
    color: colors.success.foreground,
    fontSize: 12,
    fontWeight: "700",
  },
  logoutBtn: {
    backgroundColor: colors.danger.soft,
    borderWidth: 1,
    borderColor: colors.danger.DEFAULT,
    paddingVertical: 12,
    borderRadius: radius.lg,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    minHeight: 48,
  },
  logoutBtnText: {
    color: colors.danger.foreground,
    fontSize: 14,
    fontWeight: "700",
  },
});
