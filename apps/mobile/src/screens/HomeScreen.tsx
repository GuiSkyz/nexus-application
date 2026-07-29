import React, { useEffect, useState } from "react";
import { ScrollView, RefreshControl } from "react-native";
import { YStack, XStack, Text, Button, View } from "tamagui";
import { colors } from "../theme/tokens";
import { mockVehicleShift, mockTodayActivity, mockContextualChecklists } from "../services/mockMobileData";
import { OfflineStorage } from "../services/offline/storage";
import { ArrowRight, Car, UserCircle, Activity, Wifi, MapPin } from "@tamagui/lucide-icons-2";

interface HomeScreenProps {
  onNavigateTab: (tabName: any) => void;
  onOpenChecklist: (checklistId: string) => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ onNavigateTab, onOpenChecklist }) => {
  const [pendingSyncCount, setPendingSyncCount] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const loadSyncStatus = async () => {
    const queue = await OfflineStorage.getSyncQueue();
    const pending = queue.filter((i) => i.status !== "SYNCED").length;
    setPendingSyncCount(pending);
  };

  useEffect(() => {
    loadSyncStatus();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadSyncStatus();
    setRefreshing(false);
  };

  const individualChecklists = mockContextualChecklists.filter((c) => c.contextType === "INDIVIDUAL");
  const pendingIndividualCount = individualChecklists.filter((c) => c.state === "PENDING").length;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.surface.page }}
      contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.blue[600]}
          colors={[colors.blue[600]]}
        />
      }
    >
      {/* Top Welcome Header */}
      <YStack mb="$6" mt="$4">
        <XStack jc="space-between" ai="center">
          <YStack>
            <Text color={colors.text.secondary} fontSize={16} fontWeight="500">Bom dia,</Text>
            <Text color={colors.text.primary} fontSize={28} fontWeight="900" mt="$-1">{mockVehicleShift.technicianName}</Text>
          </YStack>
          <View backgroundColor={colors.blue[50]} px="$3" py="$1.5" br="$6">
            <Text color={colors.blue[700]} fontSize={12} fontWeight="bold">Equipe Alfa</Text>
          </View>
        </XStack>
        <Text color={colors.text.muted} fontSize={14} mt="$2" fontWeight="500">
          {mockVehicleShift.date} • {mockVehicleShift.shift}
        </Text>
      </YStack>

      {/* Card 1: Veículo Atual */}
      <YStack backgroundColor="#ffffff" br="$6" p="$4" mb="$4" shadowColor="#000" shadowOpacity={0.03} shadowRadius={10} shadowOffset={{ height: 4, width: 0 }} elevation={2}>
        <XStack jc="space-between" ai="center" mb="$3">
          <XStack ai="center" gap="$2">
            <Car size={18} color={colors.text.secondary} />
            <Text color={colors.text.secondary} fontSize={12} fontWeight="bold" ls={1}>FROTA</Text>
          </XStack>
          <View backgroundColor={mockVehicleShift.isResponsible ? colors.cyan[50] : colors.surface.muted} px="$2" py="$1" br="$4">
            <Text color={mockVehicleShift.isResponsible ? colors.cyan[600] : colors.text.secondary} fontSize={10} fontWeight="bold">
              {mockVehicleShift.isResponsible ? "RESPONSÁVEL" : "MEMBRO"}
            </Text>
          </View>
        </XStack>

        <Text color={colors.text.primary} fontSize={22} fontWeight="800">{mockVehicleShift.fleetNumber}</Text>
        <XStack ai="center" gap="$3" mt="$1" mb="$4">
          <Text color={colors.text.secondary} fontSize={14}>{mockVehicleShift.model}</Text>
          <View backgroundColor={colors.surface.muted} px="$2" py="$1" br="$2">
            <Text color={colors.text.primary} fontSize={12} fontWeight="bold" fontFamily="monospace">
              {mockVehicleShift.plate}
            </Text>
          </View>
        </XStack>

        <View height={1} backgroundColor={colors.border.default} mb="$4" o={0.5} />

        <XStack jc="space-between" ai="center">
          <Text color={colors.text.muted} fontSize={12}>Última: {mockVehicleShift.lastInspectionDate}</Text>
          <Button
            size="$3"
            br="$10"
            bg={colors.blue[600]}
            onPress={() => onNavigateTab("MY_TASKS")}
            iconAfter={ArrowRight}
          >
            Vistoriar
          </Button>
        </XStack>
      </YStack>

      {/* Card 2: Meu Checklist Individual */}
      <YStack backgroundColor="#ffffff" br="$6" p="$4" mb="$4" shadowColor="#000" shadowOpacity={0.03} shadowRadius={10} shadowOffset={{ height: 4, width: 0 }} elevation={2}>
        <XStack jc="space-between" ai="center" mb="$3">
          <XStack ai="center" gap="$2">
            <UserCircle size={18} color={colors.text.secondary} />
            <Text color={colors.text.secondary} fontSize={12} fontWeight="bold" ls={1}>INDIVIDUAL</Text>
          </XStack>
          <View backgroundColor={pendingIndividualCount > 0 ? colors.warning.soft : colors.success.soft} px="$2" py="$1" br="$4">
            <Text color={pendingIndividualCount > 0 ? colors.warning.foreground : colors.success.foreground} fontSize={10} fontWeight="bold">
              {pendingIndividualCount > 0 ? `${pendingIndividualCount} PENDENTE` : "CONCLUÍDO"}
            </Text>
          </View>
        </XStack>

        <Text color={colors.text.primary} fontSize={18} fontWeight="700">EPIs & Uniforme</Text>
        <Text color={colors.text.secondary} fontSize={13} mt="$2" mb="$4" lh={18}>
          Verificação obrigatória do técnico para liberação de início de atividades.
        </Text>

        <Button
          size="$3"
          br="$10"
          bg={colors.surface.muted}
          color={colors.text.primary}
          onPress={() => onNavigateTab("MY_TASKS")}
          iconAfter={ArrowRight}
        >
          Continuar
        </Button>
      </YStack>

      {/* Card 3: Atividades de Hoje */}
      <YStack backgroundColor="#ffffff" br="$6" p="$4" mb="$4" shadowColor="#000" shadowOpacity={0.03} shadowRadius={10} shadowOffset={{ height: 4, width: 0 }} elevation={2}>
        <XStack jc="space-between" ai="center" mb="$3">
          <XStack ai="center" gap="$2">
            <Activity size={18} color={colors.text.secondary} />
            <Text color={colors.text.secondary} fontSize={12} fontWeight="bold" ls={1}>ATIVIDADE (APR)</Text>
          </XStack>
          <View backgroundColor={colors.danger.soft} px="$2" py="$1" br="$4">
            <Text color={colors.danger.foreground} fontSize={10} fontWeight="bold">
              RISCO: {mockTodayActivity.riskLevel}
            </Text>
          </View>
        </XStack>

        <Text color={colors.text.primary} fontSize={16} fontWeight="700">{mockTodayActivity.serviceOrderNumber} — {mockTodayActivity.title}</Text>
        <XStack ai="center" gap="$1.5" mt="$2" mb="$4"><MapPin size={15} color={colors.text.secondary} /><Text color={colors.text.secondary} fontSize={13}>{mockTodayActivity.address}</Text></XStack>

        <Button
          size="$3"
          br="$10"
          bg={colors.surface.muted}
          color={colors.text.primary}
          onPress={() => onNavigateTab("MY_TASKS")}
          iconAfter={ArrowRight}
        >
          Ver Checklists
        </Button>
      </YStack>

      {/* Card 4: Sincronização Offline */}
      <XStack backgroundColor={pendingSyncCount > 0 ? colors.blue[50] : "#ffffff"} br="$6" p="$4" ai="center" gap="$4" shadowColor="#000" shadowOpacity={0.03} shadowRadius={10} shadowOffset={{ height: 4, width: 0 }} elevation={2}>
        <Wifi size={24} color={pendingSyncCount > 0 ? colors.blue[600] : colors.text.muted} />
        <YStack f={1}>
          <Text color={colors.text.primary} fontWeight="700">Sincronização</Text>
          <Text color={colors.text.muted} fontSize={12}>
            {pendingSyncCount > 0
              ? `${pendingSyncCount} registros aguardando rede`
              : "Tudo sincronizado"}
          </Text>
        </YStack>
        <Button size="$2" variant="outlined" br="$8" onPress={() => onNavigateTab("ALL_CHECKLISTS")}>
          Ver Fila
        </Button>
      </XStack>
    </ScrollView>
  );
};
