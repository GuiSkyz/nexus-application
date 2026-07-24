import React, { useState, useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView, StyleSheet, View, Text, TouchableOpacity, Platform } from "react-native";
import { colors, radius } from "./src/theme/tokens";
import { getResponsivePaddingBottom } from "./src/theme/responsive";
import { MobileTabName, ContextualChecklist, Inspection } from "./src/types";
import { LoginScreen } from "./src/screens/LoginScreen";
import { HomeScreen } from "./src/screens/HomeScreen";
import { MyTasksScreen } from "./src/screens/MyTasksScreen";
import { AllChecklistsScreen } from "./src/screens/AllChecklistsScreen";
import { HistoryScreen } from "./src/screens/HistoryScreen";
import { ProfileScreen } from "./src/screens/ProfileScreen";
import { InspectionDetailScreen } from "./src/screens/InspectionDetailScreen";
import { SyncQueueScreen } from "./src/screens/SyncQueueScreen";
import { OfflineStorage } from "./src/services/offline/storage";

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeTab, setActiveTab] = useState<MobileTabName>("HOME");
  const [selectedChecklist, setSelectedChecklist] = useState<ContextualChecklist | null>(null);
  const [isExecutingChecklist, setIsExecutingChecklist] = useState(false);
  const [isSyncQueueOpen, setIsSyncQueueOpen] = useState(false);
  const [highlightSyncId, setHighlightSyncId] = useState<string | undefined>(undefined);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);

  const updatePendingSyncCount = async () => {
    const queue = await OfflineStorage.getSyncQueue();
    const pending = queue.filter((i) => i.status === "PENDING").length;
    setPendingSyncCount(pending);
  };

  useEffect(() => {
    updatePendingSyncCount();
  }, [activeTab, isExecutingChecklist, isSyncQueueOpen]);

  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
    setActiveTab("HOME");
  };

  const handleOpenChecklist = (checklist: ContextualChecklist) => {
    setSelectedChecklist(checklist);
    setIsExecutingChecklist(true);
  };

  const handleSaveSuccess = (savedItemId: string) => {
    setHighlightSyncId(savedItemId);
    setIsExecutingChecklist(false);
    setIsSyncQueueOpen(true);
    updatePendingSyncCount();
  };

  // Adapter para InspectionDetailScreen
  const getAdaptedInspectionData = (): Inspection | null => {
    if (!selectedChecklist) return null;
    return {
      id: selectedChecklist.id,
      title: selectedChecklist.title,
      type: selectedChecklist.contextType === "VEHICLE" ? "VEHICLE_OUT" : "HEIGHT_WORK",
      vehiclePlate: "ABC1D23",
      vehicleModel: "Fiat Strada Endurance 1.4 (Caminhonete 12)",
      technicianName: "João Souza",
      scheduledDate: "Hoje, Turno Manhã",
      status: "PENDING",
      questions: selectedChecklist.questions,
      answers: selectedChecklist.answers,
      evidences: selectedChecklist.evidences,
    };
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" backgroundColor={colors.navy[900]} translucent={true} />

      {/* Roteamento Principal */}
      <View style={styles.screenContainer}>
        {!isLoggedIn ? (
          <LoginScreen onLoginSuccess={handleLoginSuccess} />
        ) : isExecutingChecklist && selectedChecklist ? (
          <InspectionDetailScreen
            inspection={getAdaptedInspectionData()!}
            onBack={() => setIsExecutingChecklist(false)}
            onSaveSuccess={handleSaveSuccess}
          />
        ) : isSyncQueueOpen ? (
          <SyncQueueScreen
            highlightItemId={highlightSyncId}
            onBack={() => setIsSyncQueueOpen(false)}
          />
        ) : (
          <>
            {activeTab === "HOME" && (
              <HomeScreen
                onNavigateTab={(tab) => setActiveTab(tab)}
                onOpenChecklist={(id) => {
                  /* Callback */
                }}
              />
            )}

            {activeTab === "MY_TASKS" && (
              <MyTasksScreen onOpenChecklist={handleOpenChecklist} />
            )}

            {activeTab === "ALL_CHECKLISTS" && (
              <AllChecklistsScreen onOpenChecklist={handleOpenChecklist} />
            )}

            {activeTab === "HISTORY" && <HistoryScreen />}

            {activeTab === "PROFILE" && (
              <ProfileScreen onLogout={() => setIsLoggedIn(false)} />
            )}
          </>
        )}
      </View>

      {/* Tab Bar Inferior com Responsividade Impecável */}
      {isLoggedIn && !isExecutingChecklist && !isSyncQueueOpen && (
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tabItem, activeTab === "HOME" && styles.tabItemActive]}
            onPress={() => setActiveTab("HOME")}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabIcon, activeTab === "HOME" && styles.tabIconActive]}>🏠</Text>
            <Text style={[styles.tabText, activeTab === "HOME" && styles.tabTextActive]} numberOfLines={1}>Início</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabItem, activeTab === "MY_TASKS" && styles.tabItemActive]}
            onPress={() => setActiveTab("MY_TASKS")}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabIcon, activeTab === "MY_TASKS" && styles.tabIconActive]}>📋</Text>
            <Text style={[styles.tabText, activeTab === "MY_TASKS" && styles.tabTextActive]} numberOfLines={1}>Tarefas</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabItem, activeTab === "ALL_CHECKLISTS" && styles.tabItemActive]}
            onPress={() => setActiveTab("ALL_CHECKLISTS")}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabIcon, activeTab === "ALL_CHECKLISTS" && styles.tabIconActive]}>📚</Text>
            <Text style={[styles.tabText, activeTab === "ALL_CHECKLISTS" && styles.tabTextActive]} numberOfLines={1}>
              Todos {pendingSyncCount > 0 ? `(${pendingSyncCount})` : ""}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabItem, activeTab === "HISTORY" && styles.tabItemActive]}
            onPress={() => setActiveTab("HISTORY")}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabIcon, activeTab === "HISTORY" && styles.tabIconActive]}>🕒</Text>
            <Text style={[styles.tabText, activeTab === "HISTORY" && styles.tabTextActive]} numberOfLines={1}>Histórico</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabItem, activeTab === "PROFILE" && styles.tabItemActive]}
            onPress={() => setActiveTab("PROFILE")}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabIcon, activeTab === "PROFILE" && styles.tabIconActive]}>👤</Text>
            <Text style={[styles.tabText, activeTab === "PROFILE" && styles.tabTextActive]} numberOfLines={1}>Perfil</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    height: Platform.OS === "web" ? ("100vh" as any) : "100%",
    backgroundColor: colors.navy[900],
  },
  screenContainer: {
    flex: 1,
    backgroundColor: colors.surface.page,
  },
  tabBar: {
    flexDirection: "row",
    backgroundColor: colors.navy[900],
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.1)",
    paddingTop: 8,
    paddingBottom: getResponsivePaddingBottom(8),
    paddingHorizontal: 4,
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 4,
    borderRadius: radius.md,
  },
  tabItemActive: {
    backgroundColor: "rgba(0, 184, 230, 0.18)",
  },
  tabIcon: {
    fontSize: 16,
    marginBottom: 2,
    opacity: 0.7,
  },
  tabIconActive: {
    opacity: 1,
  },
  tabText: {
    color: "rgba(214, 224, 239, 0.7)",
    fontSize: 10,
    fontWeight: "600",
  },
  tabTextActive: {
    color: colors.cyan[500],
    fontWeight: "800",
  },
});
