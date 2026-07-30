import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import NetInfo from "@react-native-community/netinfo";
import { ClipboardList } from "@tamagui/lucide-icons-2/icons/ClipboardList";
import { History } from "@tamagui/lucide-icons-2/icons/History";
import { Home } from "@tamagui/lucide-icons-2/icons/Home";
import { ListChecks } from "@tamagui/lucide-icons-2/icons/ListChecks";
import { ShieldAlert } from "@tamagui/lucide-icons-2/icons/ShieldAlert";
import { User } from "@tamagui/lucide-icons-2/icons/User";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider, useSafeAreaInsets } from "react-native-safe-area-context";
import { TamaguiProvider } from "tamagui";

import tamaguiConfig from "./tamagui.config";
import { AllChecklistsScreen } from "./src/screens/AllChecklistsScreen";
import { AprDetailScreen } from "./src/screens/AprDetailScreen";
import { HistoryScreen } from "./src/screens/HistoryScreen";
import { HomeScreen } from "./src/screens/HomeScreen";
import { InspectionDetailScreen } from "./src/screens/InspectionDetailScreen";
import { LoginScreen } from "./src/screens/LoginScreen";
import { MyTasksScreen } from "./src/screens/MyTasksScreen";
import { ActionPlansScreen } from "./src/screens/ActionPlansScreen";
import { ProfileScreen } from "./src/screens/ProfileScreen";
import { SyncQueueScreen } from "./src/screens/SyncQueueScreen";
import { ApiService } from "./src/services/api";
import { OfflineStorage } from "./src/services/offline/storage";
import { SyncOrchestrator } from "./src/services/offline/syncQueue";
import { colors, control, radius } from "./src/theme/tokens";
import {
  ContextualChecklist,
  Inspection,
  MobileContext,
  MobileTabName,
  MobileUser,
} from "./src/types";

const tabs: Array<{
  name: MobileTabName;
  label: string;
  Icon: typeof Home;
}> = [
  { name: "HOME", label: "Início", Icon: Home },
  { name: "MY_TASKS", label: "Tarefas", Icon: ClipboardList },
  { name: "ACTION_PLANS", label: "Planos", Icon: ShieldAlert },
  { name: "ALL_CHECKLISTS", label: "Checklists", Icon: ListChecks },
  { name: "HISTORY", label: "Histórico", Icon: History },
  { name: "PROFILE", label: "Perfil", Icon: User },
];

export default function App() {
  return (
    <SafeAreaProvider>
      <MobileApp />
    </SafeAreaProvider>
  );
}

function MobileApp() {
  const insets = useSafeAreaInsets();
  const [booting, setBooting] = useState(true);
  const [user, setUser] = useState<MobileUser | null>(null);
  const [context, setContext] = useState<MobileContext | null>(null);
  const [activeTab, setActiveTab] = useState<MobileTabName>("HOME");
  const [selectedChecklist, setSelectedChecklist] =
    useState<ContextualChecklist | null>(null);
  const [isSyncQueueOpen, setIsSyncQueueOpen] = useState(false);
  const [highlightSyncId, setHighlightSyncId] = useState<string>();
  const [pendingSyncCount, setPendingSyncCount] = useState(0);
  const [usingOfflineCache, setUsingOfflineCache] = useState(false);

  const updatePendingSyncCount = useCallback(async () => {
    const queue = await OfflineStorage.getSyncQueue();
    setPendingSyncCount(
      queue.filter((item) => item.status !== "SYNCED").length,
    );
  }, []);

  const loadContext = useCallback(async () => {
    try {
      const freshContext = await ApiService.getMobileContext();
      setContext(freshContext);
      setUser(freshContext.user);
      setUsingOfflineCache(false);
      await OfflineStorage.cacheMobileContext(freshContext);
    } catch {
      const cachedContext = await OfflineStorage.getCachedMobileContext();
      if (cachedContext) {
        setContext(cachedContext);
        setUser(cachedContext.user);
        setUsingOfflineCache(true);
      }
    }
  }, []);

  useEffect(() => {
    const restore = async () => {
      const restoredUser = await ApiService.restoreSession();
      if (restoredUser) {
        setUser(restoredUser);
        await loadContext();
      } else if (await ApiService.hasStoredSession()) {
        const cachedContext = await OfflineStorage.getCachedMobileContext();
        if (cachedContext) {
          setUser(cachedContext.user);
          setContext(cachedContext);
          setUsingOfflineCache(true);
        }
      }
      await updatePendingSyncCount();
      setBooting(false);
    };
    void restore();
  }, [loadContext, updatePendingSyncCount]);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((networkState) => {
      if (
        user &&
        networkState.isConnected &&
        networkState.isInternetReachable !== false
      ) {
        void SyncOrchestrator.triggerSyncWorker().then(async () => {
          await updatePendingSyncCount();
          await loadContext();
        });
      }
    });
    return unsubscribe;
  }, [loadContext, updatePendingSyncCount, user]);

  const handleLoginSuccess = async (authenticatedUser: MobileUser) => {
    setUser(authenticatedUser);
    setActiveTab("HOME");
    await loadContext();
  };

  const handleLogout = async () => {
    await ApiService.logout();
    await OfflineStorage.clearUserData();
    setUser(null);
    setContext(null);
    setSelectedChecklist(null);
  };

  const handleSaveSuccess = async (savedItemId: string) => {
    setHighlightSyncId(savedItemId);
    setSelectedChecklist(null);
    setIsSyncQueueOpen(true);
    await updatePendingSyncCount();
  };

  const inspection: Inspection | null =
    selectedChecklist && context
      ? {
          id: selectedChecklist.id,
          templateId: selectedChecklist.id,
          templateVersion: selectedChecklist.templateVersion,
          title: selectedChecklist.title,
          type:
            selectedChecklist.contextType === "VEHICLE"
              ? "VEHICLE_OUT"
              : "HEIGHT_WORK",
          vehicleId: context.vehicles[0]?.id,
          vehiclePlate: context.vehicles[0]?.plate,
          vehicleModel: context.vehicles[0]?.model,
          technicianName: context.user.name,
          scheduledDate: new Date().toISOString(),
          status: "PENDING",
          questions: selectedChecklist.questions,
          answers: selectedChecklist.answers || {},
          evidences: selectedChecklist.evidences || [],
        }
      : null;

  if (booting) {
    return (
      <View style={styles.boot}>
        <StatusBar style="dark" />
        <ActivityIndicator size="large" color={colors.blue[600]} />
        <Text style={styles.bootText}>Preparando seu ambiente de trabalho…</Text>
      </View>
    );
  }

  return (
    <TamaguiProvider config={tamaguiConfig} defaultTheme="light">
      <SafeAreaView style={styles.container}>
        <StatusBar style="light" backgroundColor={colors.navy[900]} />
        {!user ? (
          <LoginScreen
            onLoginSuccess={(authenticatedUser) => {
              void handleLoginSuccess(authenticatedUser);
            }}
          />
        ) : isSyncQueueOpen ? (
          <SyncQueueScreen
            onBack={() => {
              setIsSyncQueueOpen(false);
              setHighlightSyncId(undefined);
            }}
            highlightItemId={highlightSyncId}
          />
        ) : selectedChecklist?.contextType === "APR" ? (
          <AprDetailScreen
            checklist={selectedChecklist}
            user={user}
            vehicle={context?.vehicles[0]}
            onBack={() => setSelectedChecklist(null)}
            onSaveSuccess={(id) => void handleSaveSuccess(id)}
          />
        ) : inspection ? (
          <InspectionDetailScreen
            inspection={inspection}
            onBack={() => setSelectedChecklist(null)}
            onSaveSuccess={(id) => void handleSaveSuccess(id)}
          />
        ) : (
          <>
            {usingOfflineCache && (
              <View style={styles.offlineBanner}>
                <Text style={styles.offlineText}>
                  Sem rede — exibindo os últimos dados sincronizados
                </Text>
              </View>
            )}
            <View style={styles.screen}>
              {activeTab === "HOME" && (
                <HomeScreen
                  context={context}
                  pendingSyncCount={pendingSyncCount}
                  onRefresh={loadContext}
                  onNavigateTab={setActiveTab}
                  onOpenChecklist={(id) =>
                    setSelectedChecklist(
                      context?.checklists.find((item) => item.id === id) || null,
                    )
                  }
                />
              )}
              {activeTab === "MY_TASKS" && (
                <MyTasksScreen
                  checklists={context?.checklists || []}
                  vehicles={context?.vehicles || []}
                  onOpenChecklist={setSelectedChecklist}
                />
              )}
              {activeTab === "ACTION_PLANS" && <ActionPlansScreen />}
              {activeTab === "ALL_CHECKLISTS" && (
                <AllChecklistsScreen
                  checklists={context?.checklists || []}
                  onOpenChecklist={setSelectedChecklist}
                />
              )}
              {activeTab === "HISTORY" && (
                <HistoryScreen history={context?.history || []} />
              )}
              {activeTab === "PROFILE" && (
                <ProfileScreen
                  user={user}
                  vehicles={context?.vehicles || []}
                  onLogout={() => void handleLogout()}
                />
              )}
            </View>

            <View
              style={[
                styles.tabBar,
                {
                  minHeight: 66 + insets.bottom,
                  paddingBottom: insets.bottom,
                },
              ]}
            >
              {tabs.map(({ name, label, Icon }) => {
                const active = activeTab === name;
                return (
                  <TouchableOpacity
                    key={name}
                    style={styles.tab}
                    onPress={() => setActiveTab(name)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    accessibilityLabel={label}
                  >
                    <Icon
                      size={21}
                      color={active ? colors.blue[600] : colors.text.secondary}
                    />
                    <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>
                      {label}
                    </Text>
                    {name === "HISTORY" && pendingSyncCount > 0 && (
                      <View style={styles.syncBadge}>
                        <Text style={styles.syncBadgeText}>{pendingSyncCount}</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </>
        )}
      </SafeAreaView>
    </TamaguiProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface.page,
  },
  boot: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    backgroundColor: colors.surface.page,
  },
  bootText: {
    color: colors.text.secondary,
    fontSize: 14,
  },
  screen: {
    flex: 1,
  },
  offlineBanner: {
    minHeight: 32,
    justifyContent: "center",
    backgroundColor: colors.warning.soft,
    paddingHorizontal: 16,
  },
  offlineText: {
    color: colors.warning.foreground,
    fontSize: 11,
    fontWeight: "700",
    textAlign: "center",
  },
  tabBar: {
    flexDirection: "row",
    backgroundColor: colors.surface.card,
    borderTopWidth: 1,
    borderTopColor: colors.border.default,
  },
  tab: {
    flex: 1,
    minHeight: control.minTouchTarget,
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
    position: "relative",
  },
  tabLabel: {
    color: colors.text.secondary,
    fontSize: 10,
    fontWeight: "600",
  },
  tabLabelActive: {
    color: colors.blue[600],
    fontWeight: "800",
  },
  syncBadge: {
    position: "absolute",
    right: 13,
    top: 7,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.danger.DEFAULT,
  },
  syncBadgeText: {
    color: colors.text.inverse,
    fontSize: 9,
    fontWeight: "800",
  },
});
