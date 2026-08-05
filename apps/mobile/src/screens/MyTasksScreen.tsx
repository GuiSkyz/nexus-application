import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Car } from "@tamagui/lucide-icons-2/icons/Car";
import { ChevronRight } from "@tamagui/lucide-icons-2/icons/ChevronRight";
import { ClipboardList } from "@tamagui/lucide-icons-2/icons/ClipboardList";
import { ShieldAlert } from "@tamagui/lucide-icons-2/icons/ShieldAlert";

import { colors, radius, shadow, spacing } from "../theme/tokens";
import { ContextualChecklist, MobileVehicle } from "../types";

const categoryLabel = (category: string) =>
  category === "INSTALACAO_MANUTENCAO" ? "Instalação & Manutenção" : "Infraestrutura";

interface MyTasksScreenProps {
  checklists: ContextualChecklist[];
  vehicles: MobileVehicle[];
  onOpenChecklist: (checklist: ContextualChecklist) => void;
}

const iconFor = (contextType: ContextualChecklist["contextType"]) => {
  if (contextType === "VEHICLE") return Car;
  if (contextType === "APR") return ShieldAlert;
  return ClipboardList;
};

export const MyTasksScreen: React.FC<MyTasksScreenProps> = ({
  checklists,
  vehicles,
  onOpenChecklist,
}) => {
  const tasks = checklists.filter(
    (item) => item.isRequired || item.contextType === "APR",
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Minhas tarefas</Text>
        <Text style={styles.subtitle}>
          {tasks.length} atividade(s) disponível(is) para execução
        </Text>
        {vehicles[0] && (
          <View style={styles.vehicleBadge}>
            <Car size={15} color={colors.cyan[500]} />
            <Text style={styles.vehicleText}>
              {vehicles[0].plate} · {vehicles[0].model}
            </Text>
          </View>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {tasks.length === 0 ? (
          <View style={styles.empty}>
            <ClipboardList size={28} color={colors.text.secondary} />
            <Text style={styles.emptyTitle}>Nenhuma tarefa atribuída</Text>
            <Text style={styles.emptyText}>
              Novos checklists publicados e APRs aparecerão aqui.
            </Text>
          </View>
        ) : (
          tasks.map((item) => {
            const Icon = iconFor(item.contextType);
            const completedToday = item.state === "COMPLETED";
            return (
              <TouchableOpacity
                key={item.id}
                style={[styles.task, completedToday && styles.taskCompleted]}
                onPress={() => !completedToday && onOpenChecklist(item)}
                disabled={completedToday}
                accessibilityRole="button"
                accessibilityState={{ disabled: completedToday }}
                accessibilityLabel={completedToday ? `${item.title}, concluído hoje` : `Abrir ${item.title}`}
              >
                <View style={styles.iconBox}>
                  <Icon size={20} color={colors.blue[600]} />
                </View>
                <View style={styles.copy}>
                  <View style={styles.typeRow}>
                    <Text style={styles.type}>{categoryLabel(item.category)}</Text>
                    {item.isRequired && (
                      <View style={styles.requiredBadge}>
                        <Text style={styles.requiredText}>OBRIGATÓRIO</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.taskTitle}>{item.title}</Text>
                  <Text style={styles.meta}>
                    {completedToday ? "Concluído no período atual" : `${item.questions.length} itens · ${item.frequency === "WEEKLY" ? "Semanal" : item.frequency === "ON_DEMAND" ? "Sob demanda" : "Diário"} · ${item.estimatedMinutes} min`}
                  </Text>
                </View>
                {completedToday ? <View style={styles.completedBadge}><Text style={styles.completedText}>CONCLUÍDO</Text></View> : <ChevronRight size={20} color={colors.text.secondary} />}
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface.page },
  header: {
    backgroundColor: colors.navy[900],
    paddingHorizontal: spacing[5],
    paddingTop: spacing[5],
    paddingBottom: spacing[4],
  },
  title: { color: colors.text.inverse, fontSize: 21, fontWeight: "800" },
  subtitle: {
    color: "#c9d5e7",
    fontSize: 12,
    marginTop: 3,
  },
  vehicleBadge: {
    minHeight: 40,
    marginTop: spacing[4],
    borderRadius: radius.md,
    backgroundColor: "#0d3264",
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  vehicleText: { color: colors.text.inverse, fontSize: 12, fontWeight: "700" },
  content: { padding: spacing[4], paddingBottom: spacing[7] },
  task: {
    minHeight: 92,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.surface.card,
    borderRadius: radius.lg,
    padding: spacing[4],
    marginBottom: spacing[3],
    ...shadow.sm,
  },
  taskCompleted: { backgroundColor: colors.surface.subtle, opacity: 0.78 },
  iconBox: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.blue[50],
  },
  copy: { flex: 1 },
  typeRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  type: { color: colors.blue[600], fontSize: 10, fontWeight: "800" },
  requiredBadge: {
    borderRadius: radius.sm,
    backgroundColor: colors.danger.soft,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  requiredText: {
    color: colors.danger.foreground,
    fontSize: 8,
    fontWeight: "800",
  },
  taskTitle: {
    color: colors.text.primary,
    fontSize: 14,
    fontWeight: "800",
    marginTop: 4,
  },
  meta: { color: colors.text.secondary, fontSize: 11, marginTop: 3 },
  completedBadge: { backgroundColor: colors.success.soft, borderRadius: radius.sm, paddingHorizontal: 6, paddingVertical: 4 },
  completedText: { color: colors.success.foreground, fontSize: 8, fontWeight: "800" },
  empty: {
    alignItems: "center",
    padding: spacing[6],
    marginTop: spacing[5],
  },
  emptyTitle: {
    color: colors.text.primary,
    fontSize: 15,
    fontWeight: "800",
    marginTop: spacing[3],
  },
  emptyText: {
    color: colors.text.secondary,
    fontSize: 12,
    textAlign: "center",
    marginTop: 4,
  },
});
