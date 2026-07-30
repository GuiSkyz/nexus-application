import React, { useMemo, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { SignaturePad } from "../components/SignaturePad";
import { OfflineStorage } from "../services/offline/storage";
import { SyncOrchestrator } from "../services/offline/syncQueue";
import { colors, radius, spacing } from "../theme/tokens";
import {
  ContextualChecklist,
  DigitalSignature,
  MobileUser,
  MobileVehicle,
} from "../types";

interface AprDetailScreenProps {
  checklist: ContextualChecklist;
  user: MobileUser;
  vehicle?: MobileVehicle;
  onBack: () => void;
  onSaveSuccess: (savedItemId: string) => void;
}

interface AprRiskDraft {
  id: string;
  hazard: string;
  probability: number;
  severity: number;
  controls: string[];
  residualProbability: number;
  residualSeverity: number;
}

const clampRiskValue = (value: number) => Math.min(5, Math.max(1, value));

const riskLevel = (score: number) => {
  if (score <= 4) return "BAIXO";
  if (score <= 9) return "MÉDIO";
  if (score <= 16) return "ALTO";
  return "CRÍTICO";
};

const riskColor = (score: number) => {
  if (score <= 4) return colors.success;
  if (score <= 9) return colors.warning;
  return colors.danger;
};

export const AprDetailScreen: React.FC<AprDetailScreenProps> = ({
  checklist,
  user,
  vehicle,
  onBack,
  onSaveSuccess,
}) => {
  const [risks, setRisks] = useState<AprRiskDraft[]>(
    checklist.questions.map((question, index) => ({
      id: question.id,
      hazard: question.questionText,
      probability: index === 0 ? 4 : 3,
      severity: index === 0 ? 5 : 4,
      controls: [
        "Área isolada e inspecionada antes do início",
        "EPI obrigatório conferido pela equipe",
      ],
      residualProbability: 2,
      residualSeverity: index === 0 ? 5 : 4,
    }))
  );
  const [signature, setSignature] = useState<DigitalSignature | null>(null);
  const [saving, setSaving] = useState(false);
  const [serviceOrderNumber, setServiceOrderNumber] = useState("");
  const [location, setLocation] = useState("");
  const [weatherConditions, setWeatherConditions] = useState("");
  const [emergencyContact, setEmergencyContact] = useState("");

  const maximumRisk = useMemo(
    () => Math.max(...risks.map((risk) => risk.probability * risk.severity)),
    [risks]
  );
  const maximumResidualRisk = useMemo(
    () =>
      Math.max(
        ...risks.map(
          (risk) => risk.residualProbability * risk.residualSeverity
        )
      ),
    [risks]
  );

  const updateRisk = (
    riskId: string,
    field: "probability" | "severity",
    delta: number
  ) => {
    setRisks((current) =>
      current.map((risk) => {
        if (risk.id !== riskId) return risk;
        const nextValue = clampRiskValue(risk[field] + delta);
        const next = { ...risk, [field]: nextValue };
        if (field === "probability") {
          next.residualProbability = Math.min(
            next.residualProbability,
            nextValue
          );
        } else {
          next.residualSeverity = Math.min(next.residualSeverity, nextValue);
        }
        return next;
      })
    );
  };

  const submitApr = async () => {
    if (
      !serviceOrderNumber.trim() ||
      !location.trim() ||
      !weatherConditions.trim() ||
      !emergencyContact.trim()
    ) {
      Alert.alert(
        "Dados obrigatórios",
        "Informe OS, local, condições climáticas e contato de emergência.",
      );
      return;
    }
    if (!signature) {
      Alert.alert(
        "Assinatura obrigatória",
        "Assine a APR antes de solicitar a autorização do supervisor."
      );
      return;
    }

    setSaving(true);
    try {
      const clientGeneratedId = OfflineStorage.generateClientUUID();
      const payload = {
        clientGeneratedId,
        serviceOrderNumber: serviceOrderNumber.trim(),
        activityId: checklist.id,
        activityType: checklist.category.toUpperCase().includes("NR10")
          ? "NR10"
          : checklist.category.toUpperCase().includes("NR35")
            ? "NR35"
            : "OUTRA",
        location: location.trim(),
        technicianId: user.id,
        technicianName: user.name,
        teamName: user.teamName || "Sem equipe",
        plannedStart: new Date().toISOString(),
        requiredPpe: [
          "Cinto paraquedista",
          "Talabarte duplo",
          "Capacete com jugular",
          "Calçado de segurança",
        ],
        weatherConditions: weatherConditions.trim(),
        emergencyContact: emergencyContact.trim(),
        risks,
        technicianSignature: signature,
        status: "PENDING_AUTHORIZATION",
        canStartActivity: false,
      };
      const queued = await OfflineStorage.enqueueSyncItem("APR", payload);
      void SyncOrchestrator.triggerSyncWorker();
      onSaveSuccess(queued.id);
    } catch {
      Alert.alert(
        "Falha ao salvar",
        "A APR não pôde ser gravada na fila offline."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Voltar</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>APR · Liberação de Trabalho</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.lockBanner}>
          <Text style={styles.lockTitle}>Atividade bloqueada</Text>
          <Text style={styles.lockText}>
            O serviço só poderá começar após a assinatura e autorização digital
            do supervisor.
          </Text>
        </View>

        <View style={styles.summary}>
          <Text style={styles.summaryTitle}>{checklist.title}</Text>
          <Text style={styles.summaryMeta}>
            {user.teamName || "Sem equipe"} · {user.name}
            {vehicle ? ` · ${vehicle.plate}` : ""}
          </Text>
          <TextInput
            style={styles.input}
            value={serviceOrderNumber}
            onChangeText={setServiceOrderNumber}
            placeholder="Número da ordem de serviço"
            placeholderTextColor={colors.text.secondary}
          />
          <TextInput
            style={styles.input}
            value={location}
            onChangeText={setLocation}
            placeholder="Local da atividade"
            placeholderTextColor={colors.text.secondary}
          />
          <TextInput
            style={styles.input}
            value={weatherConditions}
            onChangeText={setWeatherConditions}
            placeholder="Condições climáticas"
            placeholderTextColor={colors.text.secondary}
          />
          <TextInput
            style={styles.input}
            value={emergencyContact}
            onChangeText={setEmergencyContact}
            placeholder="Contato de emergência"
            placeholderTextColor={colors.text.secondary}
          />
        </View>

        <View style={styles.riskSummaryRow}>
          <View style={styles.riskSummaryItem}>
            <Text style={styles.riskSummaryLabel}>Risco inicial máximo</Text>
            <Text style={[styles.riskSummaryValue, { color: riskColor(maximumRisk).foreground }]}>
              {maximumRisk} · {riskLevel(maximumRisk)}
            </Text>
          </View>
          <View style={styles.riskSummaryItem}>
            <Text style={styles.riskSummaryLabel}>Após controles</Text>
            <Text
              style={[
                styles.riskSummaryValue,
                { color: riskColor(maximumResidualRisk).foreground },
              ]}
            >
              {maximumResidualRisk} · {riskLevel(maximumResidualRisk)}
            </Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Matriz de riscos</Text>
        <Text style={styles.sectionDescription}>
          Probabilidade × Severidade. Ajuste conforme a condição encontrada no local.
        </Text>

        {risks.map((risk, index) => {
          const score = risk.probability * risk.severity;
          const residualScore =
            risk.residualProbability * risk.residualSeverity;
          return (
            <View key={risk.id} style={styles.riskCard}>
              <Text style={styles.riskIndex}>Risco {index + 1}</Text>
              <Text style={styles.hazard}>{risk.hazard}</Text>

              <View style={styles.matrixRow}>
                <RiskControl
                  label="Probabilidade"
                  value={risk.probability}
                  onDecrease={() => updateRisk(risk.id, "probability", -1)}
                  onIncrease={() => updateRisk(risk.id, "probability", 1)}
                />
                <RiskControl
                  label="Severidade"
                  value={risk.severity}
                  onDecrease={() => updateRisk(risk.id, "severity", -1)}
                  onIncrease={() => updateRisk(risk.id, "severity", 1)}
                />
              </View>

              <View
                style={[
                  styles.scoreBadge,
                  { backgroundColor: riskColor(score).soft },
                ]}
              >
                <Text
                  style={[
                    styles.scoreBadgeText,
                    { color: riskColor(score).foreground },
                  ]}
                >
                  Risco {score} · {riskLevel(score)}
                </Text>
              </View>

              <Text style={styles.controlsTitle}>Controles obrigatórios</Text>
              {risk.controls.map((control) => (
                <Text key={control} style={styles.controlText}>
                  ✓ {control}
                </Text>
              ))}
              <Text style={styles.residualText}>
                Risco residual: {residualScore} · {riskLevel(residualScore)}
              </Text>
            </View>
          );
        })}

        <View style={styles.ppeBox}>
          <Text style={styles.sectionTitle}>EPIs obrigatórios</Text>
          <Text style={styles.ppeText}>
            Cinto paraquedista · Talabarte duplo · Capacete com jugular ·
            Calçado de segurança
          </Text>
        </View>

        <View style={styles.signatureSection}>
          <Text style={styles.sectionTitle}>Assinatura do técnico</Text>
          <Text style={styles.sectionDescription}>
            Confirmo que os riscos e controles foram verificados no local.
          </Text>
          <SignaturePad
            signerName={user.name}
            onChange={setSignature}
          />
        </View>

        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={saving ? "Salvando APR" : "Solicitar autorização do supervisor"}
          disabled={saving}
          onPress={submitApr}
          style={[styles.submitButton, saving && styles.submitButtonDisabled]}
        >
          <Text style={styles.submitButtonText}>
            {saving ? "Salvando..." : "Solicitar autorização do supervisor"}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

interface RiskControlProps {
  label: string;
  value: number;
  onDecrease: () => void;
  onIncrease: () => void;
}

const RiskControl: React.FC<RiskControlProps> = ({
  label,
  value,
  onDecrease,
  onIncrease,
}) => (
  <View style={styles.riskControl}>
    <Text style={styles.riskControlLabel}>{label}</Text>
    <View style={styles.stepper}>
      <TouchableOpacity onPress={onDecrease} style={styles.stepperButton} accessibilityRole="button" accessibilityLabel={`Diminuir ${label}`}>
        <Text style={styles.stepperButtonText}>−</Text>
      </TouchableOpacity>
      <Text style={styles.stepperValue}>{value}</Text>
      <TouchableOpacity onPress={onIncrease} style={styles.stepperButton} accessibilityRole="button" accessibilityLabel={`Aumentar ${label}`}>
        <Text style={styles.stepperButtonText}>+</Text>
      </TouchableOpacity>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface.page },
  header: {
    backgroundColor: colors.navy[900],
    paddingTop: 50,
    paddingBottom: spacing[4],
    paddingHorizontal: spacing[4],
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backButton: { minWidth: 70, minHeight: 40, justifyContent: "center" },
  backButtonText: { color: colors.text.inverse, fontSize: 13, fontWeight: "700" },
  headerTitle: { color: colors.text.inverse, fontSize: 15, fontWeight: "700" },
  headerSpacer: { width: 70 },
  content: { padding: spacing[4], paddingBottom: 64 },
  lockBanner: {
    backgroundColor: colors.danger.soft,
    borderWidth: 1,
    borderColor: colors.danger.DEFAULT,
    borderRadius: radius.lg,
    padding: spacing[4],
    marginBottom: spacing[3],
  },
  lockTitle: { color: colors.danger.foreground, fontSize: 15, fontWeight: "800" },
  lockText: { color: colors.danger.foreground, fontSize: 12, lineHeight: 18, marginTop: 4 },
  summary: {
    backgroundColor: colors.surface.card,
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: radius.lg,
    padding: spacing[4],
  },
  summaryTitle: { color: colors.text.primary, fontSize: 15, fontWeight: "800" },
  summaryText: { color: colors.text.secondary, fontSize: 12, lineHeight: 17, marginTop: 5 },
  summaryMeta: { color: colors.blue[600], fontSize: 11, fontWeight: "700", marginTop: 6 },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: radius.md,
    backgroundColor: colors.surface.subtle,
    color: colors.text.primary,
    fontSize: 13,
    paddingHorizontal: 12,
    marginTop: 10,
  },
  riskSummaryRow: { flexDirection: "row", gap: spacing[2], marginVertical: spacing[4] },
  riskSummaryItem: {
    flex: 1,
    backgroundColor: colors.surface.card,
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: radius.md,
    padding: spacing[3],
  },
  riskSummaryLabel: { color: colors.text.secondary, fontSize: 10 },
  riskSummaryValue: { fontSize: 13, fontWeight: "800", marginTop: 4 },
  sectionTitle: { color: colors.text.primary, fontSize: 15, fontWeight: "800" },
  sectionDescription: { color: colors.text.secondary, fontSize: 11, lineHeight: 16, marginTop: 3, marginBottom: spacing[3] },
  riskCard: {
    backgroundColor: colors.surface.card,
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: radius.lg,
    padding: spacing[4],
    marginBottom: spacing[3],
  },
  riskIndex: { color: colors.blue[600], fontSize: 10, fontWeight: "800", textTransform: "uppercase" },
  hazard: { color: colors.text.primary, fontSize: 13, lineHeight: 19, fontWeight: "700", marginTop: 4 },
  matrixRow: { flexDirection: "row", gap: spacing[2], marginTop: spacing[3] },
  riskControl: { flex: 1 },
  riskControlLabel: { color: colors.text.secondary, fontSize: 10, marginBottom: 5 },
  stepper: { flexDirection: "row", alignItems: "center", gap: 8 },
  stepperButton: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: radius.md,
    backgroundColor: colors.surface.subtle,
  },
  stepperButtonText: { color: colors.blue[600], fontSize: 18, fontWeight: "700" },
  stepperValue: { color: colors.text.primary, fontSize: 16, fontWeight: "800", minWidth: 18, textAlign: "center" },
  scoreBadge: { alignSelf: "flex-start", borderRadius: radius.sm, paddingHorizontal: 8, paddingVertical: 5, marginTop: spacing[3] },
  scoreBadgeText: { fontSize: 11, fontWeight: "800" },
  controlsTitle: { color: colors.text.primary, fontSize: 11, fontWeight: "800", marginTop: spacing[3], marginBottom: 4 },
  controlText: { color: colors.text.secondary, fontSize: 11, lineHeight: 17 },
  residualText: { color: colors.blue[700], fontSize: 11, fontWeight: "800", marginTop: spacing[2] },
  ppeBox: {
    backgroundColor: colors.cyan[50],
    borderWidth: 1,
    borderColor: colors.cyan[500],
    borderRadius: radius.lg,
    padding: spacing[4],
    marginTop: spacing[2],
  },
  ppeText: { color: colors.info.foreground, fontSize: 11, lineHeight: 18, marginTop: 6 },
  signatureSection: { marginTop: spacing[5] },
  submitButton: {
    minHeight: 52,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.lg,
    backgroundColor: colors.blue[600],
    marginTop: spacing[5],
  },
  submitButtonDisabled: { opacity: 0.6 },
  submitButtonText: { color: colors.text.inverse, fontSize: 13, fontWeight: "800" },
});
