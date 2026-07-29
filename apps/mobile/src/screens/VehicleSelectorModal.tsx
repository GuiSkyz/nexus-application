import React, { useState } from "react";
import { View, Text, StyleSheet, Modal, TouchableOpacity, TextInput, FlatList } from "react-native";
import { colors, radius, spacing, shadow } from "../theme/tokens";
import { Search, Car, CheckCircle2, ChevronRight } from "@tamagui/lucide-icons-2";

export interface VehicleOption {
  id: string;
  model: string;
  plate: string;
  fleetId: string;
  lastCheckStatus: "COMPLETED" | "PENDING";
  lastCheckDate?: string;
}

interface VehicleSelectorModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectVehicle: (vehicle: VehicleOption) => void;
}

const mockVehicleOptions: VehicleOption[] = [
  {
    id: "veh-4092",
    model: "Toyota Hilux 4x4",
    plate: "ABC-1234",
    fleetId: "#4092",
    lastCheckStatus: "COMPLETED",
    lastCheckDate: "HOJE, 06:30",
  },
  {
    id: "veh-4095",
    model: "Ford Ranger XLS",
    plate: "XYZ-9876",
    fleetId: "#4095",
    lastCheckStatus: "PENDING",
  },
  {
    id: "veh-5102",
    model: "Mercedes Sprinter",
    plate: "DEF-5678",
    fleetId: "#5102",
    lastCheckStatus: "COMPLETED",
    lastCheckDate: "ONTEM, 18:00",
  },
];

export const VehicleSelectorModal: React.FC<VehicleSelectorModalProps> = ({
  visible,
  onClose,
  onSelectVehicle,
}) => {
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string>("veh-4092");

  const filtered = mockVehicleOptions.filter(
    (v) =>
      v.plate.toLowerCase().includes(search.toLowerCase()) ||
      v.model.toLowerCase().includes(search.toLowerCase()) ||
      v.fleetId.toLowerCase().includes(search.toLowerCase())
  );

  const selectedVehicle = mockVehicleOptions.find((v) => v.id === selectedId);

  const handleConfirm = () => {
    if (selectedVehicle) {
      onSelectVehicle(selectedVehicle);
      onClose();
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <View style={styles.container}>
        {/* Top Header */}
        <View style={styles.topHeader}>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Text style={styles.closeBtnText}>← Voltar</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Seleção de Veículo</Text>
          <View style={{ width: 50 }} />
        </View>

        <View style={styles.content}>
          {/* Campo de Busca */}
          <View style={styles.searchBox}>
            <Search size={18} color={colors.text.secondary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar por placa ou ID..."
              placeholderTextColor={colors.text.muted}
              value={search}
              onChangeText={setSearch}
              accessibilityLabel="Buscar veículo por placa, modelo ou identificação"
            />
          </View>

          <Text style={styles.sectionHeader}>Veículos Disponíveis</Text>

          <FlatList
            data={filtered}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => {
              const isSelected = item.id === selectedId;

              return (
                <TouchableOpacity
                  style={[styles.card, isSelected && styles.cardSelected]}
                  onPress={() => setSelectedId(item.id)}
                  activeOpacity={0.85}
                >
                  <View style={styles.cardHeader}>
                    <View style={styles.vehicleInfoGroup}>
                      <View style={[styles.vehicleIconBox, isSelected && styles.vehicleIconBoxSelected]}>
                        <Car size={18} color={isSelected ? colors.text.inverse : colors.blue[600]} />
                      </View>
                      <View>
                        <Text style={styles.plateText}>{item.plate}</Text>
                        <Text style={styles.modelText}>
                          {item.model} (ID: {item.fleetId})
                        </Text>
                      </View>
                    </View>

                    {isSelected && (
                      <View style={styles.checkBadge}>
                        <CheckCircle2 size={18} color={colors.text.inverse} />
                      </View>
                    )}
                  </View>

                  <View style={styles.divider} />

                  <View style={styles.cardFooter}>
                    {item.lastCheckStatus === "COMPLETED" ? (
                      <Text style={styles.statusCompletedText}>
                        ✓ CHECK DE SEGURANÇA: {item.lastCheckDate}
                      </Text>
                    ) : (
                      <Text style={styles.statusPendingText}>
                        ⚠️ CHECK DE SEGURANÇA: PENDENTE
                      </Text>
                    )}
                  </View>
                </TouchableOpacity>
              );
            }}
          />

          {/* Botão Fixo de Confirmação */}
          <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirm} activeOpacity={0.85}>
            <Text style={styles.confirmBtnText}>Confirmar veículo</Text><ChevronRight size={18} color={colors.text.inverse} />
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface.page,
  },
  topHeader: {
    backgroundColor: colors.navy[900],
    paddingTop: 48,
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[4],
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  closeBtn: {
    paddingVertical: 4,
  },
  closeBtnText: {
    color: colors.cyan[500],
    fontSize: 13,
    fontWeight: "700",
  },
  headerTitle: {
    color: colors.text.inverse,
    fontSize: 16,
    fontWeight: "800",
  },
  content: {
    flex: 1,
    padding: spacing[4],
  },
  searchBox: {
    backgroundColor: colors.surface.card,
    borderRadius: radius.lg,
    paddingHorizontal: spacing[3],
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: colors.border.default,
    marginBottom: spacing[4],
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: colors.text.primary,
  },
  sectionHeader: {
    color: colors.text.primary,
    fontSize: 14,
    fontWeight: "800",
    marginBottom: spacing[3],
  },
  listContent: {
    paddingBottom: spacing[4],
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
  cardSelected: {
    borderColor: colors.blue[600],
    borderWidth: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  vehicleInfoGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  vehicleIconBox: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    backgroundColor: colors.surface.muted,
    alignItems: "center",
    justifyContent: "center",
  },
  vehicleIconBoxSelected: {
    backgroundColor: colors.blue[50],
  },
  plateText: {
    color: colors.text.primary,
    fontSize: 16,
    fontWeight: "800",
    fontFamily: "monospace",
  },
  modelText: {
    color: colors.text.secondary,
    fontSize: 12,
    marginTop: 2,
  },
  checkBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.blue[600],
    alignItems: "center",
    justifyContent: "center",
  },
  checkBadgeText: {
    color: colors.text.inverse,
    fontSize: 12,
    fontWeight: "800",
  },
  divider: {
    height: 1,
    backgroundColor: colors.border.default,
    marginVertical: 10,
  },
  cardFooter: {},
  statusCompletedText: {
    color: colors.blue[600],
    fontSize: 10,
    fontWeight: "800",
  },
  statusPendingText: {
    color: colors.danger.foreground,
    fontSize: 10,
    fontWeight: "800",
  },
  confirmBtn: {
    backgroundColor: colors.blue[600],
    borderRadius: radius.xl,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    minHeight: 52,
    marginTop: "auto",
    ...shadow.md,
  },
  confirmBtnText: {
    color: colors.text.inverse,
    fontSize: 14,
    fontWeight: "800",
  },
});
