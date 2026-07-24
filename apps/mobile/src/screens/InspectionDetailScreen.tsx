import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  ActivityIndicator,
} from "react-native";
import { colors, radius, spacing, shadow } from "../theme/tokens";
import { getResponsivePaddingTop, getResponsivePaddingBottom } from "../theme/responsive";
import { Inspection, ChecklistAnswerValue, EvidencePhoto, ChecklistQuestion } from "../types";
import { OfflineStorage } from "../services/offline/storage";

interface InspectionDetailScreenProps {
  inspection: Inspection;
  onBack: () => void;
  onSaveSuccess: (savedItemId: string) => void;
}

export const InspectionDetailScreen: React.FC<InspectionDetailScreenProps> = ({
  inspection,
  onBack,
  onSaveSuccess,
}) => {
  const [answers, setAnswers] = useState<Record<string, ChecklistAnswerValue>>(inspection.answers || {});
  const [evidences, setEvidences] = useState<EvidencePhoto[]>(inspection.evidences || []);
  const [notes, setNotes] = useState<string>(inspection.notes || "");
  const [saving, setSaving] = useState<boolean>(false);

  const totalQuestions = inspection.questions.length;
  const answeredCount = Object.keys(answers).length;
  const pendingCount = totalQuestions - answeredCount;
  const isComplete = answeredCount >= totalQuestions;

  // Verificar se há respostas "NÃO CONFORME"
  const hasNonConformity = Object.values(answers).includes("NAO_CONFORME");

  const handleSelectAnswer = (questionId: string, value: ChecklistAnswerValue) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  };

  const handleSimulateAddPhoto = (questionCategory: string) => {
    const newEvidence: EvidencePhoto = {
      id: `ev-${Date.now()}`,
      photoUri: "https://via.placeholder.com/300/0757c8/ffffff?text=Evidencia+Fotografica",
      capturedAt: new Date().toLocaleString("pt-BR"),
      latitude: -23.55052,
      longitude: -46.633308,
      description: `Evidência capturada em campo (${questionCategory})`,
    };

    setEvidences((prev) => [...prev, newEvidence]);
    Alert.alert("Foto Anexada!", "Carimbo automático de data/hora e coordenadas GPS registrados.");
  };

  const handleSaveInspection = async () => {
    setSaving(true);

    try {
      const payload: Inspection = {
        ...inspection,
        answers,
        evidences,
        notes,
        status: isComplete ? "COMPLETED" : "IN_PROGRESS",
      };

      const savedItem = await OfflineStorage.enqueueSyncItem("INSPECTION", payload);
      
      setSaving(false);
      onSaveSuccess(savedItem.id);
    } catch (error) {
      setSaving(false);
      Alert.alert("Erro ao Salvar", "Ocorreu uma falha ao gravar a vistoria no dispositivo.");
    }
  };

  // Grupos por Categoria
  const categories = Array.from(new Set(inspection.questions.map((q) => q.category)));

  return (
    <View style={styles.container}>
      {/* Top Header responsivo com insets do Android/iOS */}
      <View style={styles.topHeader}>
        <View style={styles.headerNavRow}>
          <TouchableOpacity onPress={onBack} style={styles.backBtn} activeOpacity={0.7}>
            <Text style={styles.backBtnText}>← Voltar</Text>
          </TouchableOpacity>
          <Text style={styles.headerAppTitle}>NexusOps Pro</Text>
          <View style={styles.statusDot}>
            <Text style={{ fontSize: 10 }}>⚡</Text>
          </View>
        </View>

        <View style={styles.headerTitleRow}>
          <View style={{ flex: 1, marginRight: 10 }}>
            <Text style={styles.screenTitle}>{inspection.title}</Text>
            <Text style={styles.screenSubtitle}>Preencha o checklist antes de iniciar as atividades no local.</Text>
          </View>
          <View style={isComplete ? styles.statusBadgeCompleted : styles.statusBadgePending}>
            <Text style={isComplete ? styles.statusTextCompleted : styles.statusTextPending}>
              {isComplete ? "Concluído" : "Em Progresso"}
            </Text>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Banner Vermelho: Alerta de Itens Críticos Ausentes/Não Conformes */}
        {hasNonConformity && (
          <View style={styles.criticalAlertBanner}>
            <Text style={styles.criticalAlertIcon}>⚠️</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.criticalAlertTitle}>Itens Não Conformes Detectados</Text>
              <Text style={styles.criticalAlertSubtitle}>
                Uma não conformidade gerará um chamado de correção automático para a Supervisão.
              </Text>
            </View>
          </View>
        )}

        {/* Card Resumo do Veículo / Equipamento */}
        {inspection.vehiclePlate && (
          <View style={styles.vehicleSummaryCard}>
            <View style={styles.vehicleCardRow}>
              <View style={styles.vehicleIconBox}>
                <Text style={{ fontSize: 20 }}>🚗</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.vehicleCardTitle}>{inspection.vehicleModel || "Caminhonete 12"}</Text>
                <Text style={styles.vehicleCardMeta}>
                  Placa: <Text style={{ fontFamily: "monospace", fontWeight: "700" }}>{inspection.vehiclePlate}</Text> • Útima Vistoria: 2 dias atrás
                </Text>
              </View>
              <View style={styles.vehicleStatusPill}>
                <Text style={styles.vehicleStatusPillText}>Pendente</Text>
              </View>
            </View>
          </View>
        )}

        {/* Progresso do Preenchimento */}
        <View style={styles.progressCard}>
          <View style={styles.progressHeaderRow}>
            <Text style={styles.progressTitle}>Progresso da Vistoria</Text>
            <Text style={styles.progressCounter}>{answeredCount} de {totalQuestions} itens</Text>
          </View>
          <View style={styles.progressBarTrack}>
            <View
              style={[
                styles.progressBarFill,
                { width: `${(answeredCount / totalQuestions) * 100}%` },
              ]}
            />
          </View>
        </View>

        {/* Grupos de Categorias do Checklist */}
        {categories.map((categoryName) => {
          const categoryQuestions = inspection.questions.filter((q) => q.category === categoryName);

          return (
            <View key={categoryName} style={styles.categorySection}>
              {/* Título da Categoria em Caixa Alta */}
              <Text style={styles.categorySectionHeader}>{categoryName.toUpperCase()}</Text>

              {categoryQuestions.map((q: ChecklistQuestion, index: number) => {
                const currentAnswer = answers[q.id];
                const isSelectedOk = currentAnswer === "CONFORME";
                const isSelectedNok = currentAnswer === "NAO_CONFORME";

                return (
                  <View key={q.id} style={styles.questionCard}>
                    {/* Linha de Cabeçalho da Pergunta */}
                    <View style={styles.questionHeaderRow}>
                      <View style={styles.questionTitleGroup}>
                        <Text style={styles.questionIcon}>
                          {categoryName.toLowerCase().includes("epi") ? "🛟" : categoryName.toLowerCase().includes("pneu") ? "🛞" : "🔧"}
                        </Text>
                        <Text style={styles.questionTextTitle}>{q.questionText}</Text>
                      </View>

                      {q.isRequired && (
                        <View style={styles.tagObrigatorio}>
                          <Text style={styles.tagObrigatorioText}>OBRIGATÓRIO</Text>
                        </View>
                      )}
                    </View>

                    {/* Botões de Ação estilo FieldOps: [ ✕ Nok ] e [ ✓ Ok ] */}
                    <View style={styles.actionButtonsRow}>
                      <TouchableOpacity
                        style={[styles.nokBtn, isSelectedNok && styles.nokBtnActive]}
                        onPress={() => handleSelectAnswer(q.id, "NAO_CONFORME")}
                        activeOpacity={0.8}
                      >
                        <Text style={[styles.nokBtnText, isSelectedNok && styles.nokBtnTextActive]}>
                          ✕ Nok
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.okBtn, isSelectedOk && styles.okBtnActive]}
                        onPress={() => handleSelectAnswer(q.id, "CONFORME")}
                        activeOpacity={0.8}
                      >
                        <Text style={[styles.okBtnText, isSelectedOk && styles.okBtnTextActive]}>
                          ✓ Ok
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.naBtn, currentAnswer === "NA" && styles.naBtnActive]}
                        onPress={() => handleSelectAnswer(q.id, "NA")}
                        activeOpacity={0.8}
                      >
                        <Text style={[styles.naBtnText, currentAnswer === "NA" && styles.naBtnTextActive]}>
                          N/A
                        </Text>
                      </TouchableOpacity>
                    </View>

                    {/* Alerta de NC se marcado Nok */}
                    {isSelectedNok && (
                      <View style={styles.ncAlertNotice}>
                        <Text style={styles.ncAlertNoticeText}>
                          ⚠️ Resposta Nok: Será aberto um chamado de Não Conformidade para a Supervisão.
                        </Text>
                      </View>
                    )}

                    {/* Box de Anexo de Foto Tracejado */}
                    <TouchableOpacity
                      style={styles.dashedPhotoBox}
                      onPress={() => handleSimulateAddPhoto(q.category)}
                      activeOpacity={0.7}
                    >
                      <Text style={{ fontSize: 20 }}>📷</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.dashedPhotoTitle}>Adicionar foto de evidência</Text>
                        <Text style={styles.dashedPhotoSub}>Carimbo de data/hora e GPS serão gravados</Text>
                      </View>
                      <View style={styles.takePhotoBtn}>
                        <Text style={styles.takePhotoBtnText}>Tirar Foto</Text>
                      </View>
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          );
        })}

        {/* Lista de Evidências Fotográficas Anexadas */}
        {evidences.length > 0 && (
          <View style={styles.evidenceSection}>
            <Text style={styles.categorySectionHeader}>EVIDÊNCIAS ANEXADAS ({evidences.length})</Text>
            {evidences.map((ev) => (
              <View key={ev.id} style={styles.evidenceCard}>
                <Image source={{ uri: ev.photoUri }} style={styles.evidenceImage} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.evidenceTitle}>{ev.description}</Text>
                  <Text style={styles.evidenceMeta}>📅 {ev.capturedAt}</Text>
                  <Text style={styles.evidenceGps}>📍 GPS: -23.5505, -46.6333 (Verificado)</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Observações / Desvios Encontrados */}
        <View style={styles.notesSection}>
          <Text style={styles.categorySectionHeader}>OBSERVAÇÕES / DESVIOS ENCONTRADOS</Text>
          <TextInput
            style={styles.notesInput}
            multiline
            numberOfLines={3}
            placeholder="Adicione notas adicionais sobre itens inspecionados ou desvios em campo..."
            placeholderTextColor={colors.text.muted}
            value={notes}
            onChangeText={setNotes}
          />
        </View>

        {/* Botão Fixo Inferior de Conclusão */}
        <TouchableOpacity
          style={[styles.mainSaveBtn, !isComplete && styles.mainSaveBtnDisabled]}
          onPress={handleSaveInspection}
          disabled={saving}
          activeOpacity={0.85}
        >
          {saving ? (
            <ActivityIndicator color={colors.text.inverse} size="small" />
          ) : (
            <Text style={styles.mainSaveBtnText}>
              {isComplete
                ? "✓ Concluir Inspeção"
                : `Concluir Checklist (Faltam ${pendingCount} itens)`}
            </Text>
          )}
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
    paddingTop: getResponsivePaddingTop(12),
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[4],
  },
  headerNavRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing[3],
  },
  backBtn: {
    paddingVertical: 4,
    paddingRight: 12,
  },
  backBtnText: {
    color: colors.cyan[500],
    fontSize: 13,
    fontWeight: "700",
  },
  headerAppTitle: {
    color: colors.text.inverse,
    fontSize: 14,
    fontWeight: "800",
  },
  statusDot: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.md,
  },
  headerTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  screenTitle: {
    color: colors.text.inverse,
    fontSize: 17,
    fontWeight: "800",
    lineHeight: 22,
  },
  screenSubtitle: {
    color: "rgba(214, 224, 239, 0.7)",
    fontSize: 11,
    marginTop: 2,
  },
  statusBadgeCompleted: {
    backgroundColor: colors.success.soft,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.sm,
    flexShrink: 0,
  },
  statusTextCompleted: {
    color: colors.success.foreground,
    fontSize: 10,
    fontWeight: "800",
  },
  statusBadgePending: {
    backgroundColor: colors.warning.soft,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.sm,
    flexShrink: 0,
  },
  statusTextPending: {
    color: colors.warning.foreground,
    fontSize: 10,
    fontWeight: "800",
  },
  scrollContent: {
    padding: spacing[4],
    paddingBottom: getResponsivePaddingBottom(40),
  },
  criticalAlertBanner: {
    backgroundColor: colors.danger.soft,
    borderWidth: 1,
    borderColor: colors.danger.DEFAULT,
    borderRadius: radius.lg,
    padding: spacing[3],
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: spacing[4],
  },
  criticalAlertIcon: {
    fontSize: 22,
  },
  criticalAlertTitle: {
    color: colors.danger.foreground,
    fontSize: 13,
    fontWeight: "800",
  },
  criticalAlertSubtitle: {
    color: colors.danger.foreground,
    fontSize: 11,
    marginTop: 2,
  },
  vehicleSummaryCard: {
    backgroundColor: colors.surface.card,
    borderRadius: radius.lg,
    padding: spacing[3],
    borderWidth: 1,
    borderColor: colors.border.default,
    marginBottom: spacing[4],
    ...shadow.sm,
  },
  vehicleCardRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  vehicleIconBox: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.surface.muted,
    alignItems: "center",
    justifyContent: "center",
  },
  vehicleCardTitle: {
    color: colors.text.primary,
    fontSize: 14,
    fontWeight: "800",
  },
  vehicleCardMeta: {
    color: colors.text.secondary,
    fontSize: 11,
    marginTop: 1,
  },
  vehicleStatusPill: {
    backgroundColor: colors.warning.soft,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.sm,
    flexShrink: 0,
  },
  vehicleStatusPillText: {
    color: colors.warning.foreground,
    fontSize: 10,
    fontWeight: "700",
  },
  progressCard: {
    backgroundColor: colors.surface.card,
    borderRadius: radius.lg,
    padding: spacing[3],
    borderWidth: 1,
    borderColor: colors.border.default,
    marginBottom: spacing[4],
    ...shadow.sm,
  },
  progressHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  progressTitle: {
    color: colors.text.primary,
    fontSize: 12,
    fontWeight: "700",
  },
  progressCounter: {
    color: colors.blue[600],
    fontSize: 12,
    fontWeight: "800",
  },
  progressBarTrack: {
    height: 6,
    backgroundColor: colors.surface.muted,
    borderRadius: 3,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: colors.blue[600],
    borderRadius: 3,
  },
  categorySection: {
    marginBottom: spacing[4],
  },
  categorySectionHeader: {
    color: colors.text.muted,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.8,
    marginBottom: spacing[2],
    marginTop: spacing[2],
  },
  questionCard: {
    backgroundColor: colors.surface.card,
    borderRadius: radius.lg,
    padding: spacing[4],
    borderWidth: 1,
    borderColor: colors.border.default,
    marginBottom: spacing[3],
    ...shadow.sm,
  },
  questionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  questionTitleGroup: {
    flexDirection: "row",
    gap: 8,
    flex: 1,
    paddingRight: 8,
  },
  questionIcon: {
    fontSize: 16,
  },
  questionTextTitle: {
    color: colors.text.primary,
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 18,
    flex: 1,
  },
  tagObrigatorio: {
    backgroundColor: colors.danger.soft,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.sm,
    flexShrink: 0,
  },
  tagObrigatorioText: {
    color: colors.danger.foreground,
    fontSize: 9,
    fontWeight: "800",
  },
  actionButtonsRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  nokBtn: {
    flex: 1,
    backgroundColor: colors.danger.soft,
    borderWidth: 1,
    borderColor: colors.danger.DEFAULT,
    paddingVertical: 10,
    borderRadius: radius.md,
    alignItems: "center",
  },
  nokBtnActive: {
    backgroundColor: colors.danger.DEFAULT,
  },
  nokBtnText: {
    color: colors.danger.foreground,
    fontSize: 12,
    fontWeight: "700",
  },
  nokBtnTextActive: {
    color: "#ffffff",
    fontWeight: "800",
  },
  okBtn: {
    flex: 1,
    backgroundColor: colors.surface.muted,
    borderWidth: 1,
    borderColor: colors.border.default,
    paddingVertical: 10,
    borderRadius: radius.md,
    alignItems: "center",
  },
  okBtnActive: {
    backgroundColor: colors.blue[600],
    borderColor: colors.blue[600],
  },
  okBtnText: {
    color: colors.text.primary,
    fontSize: 12,
    fontWeight: "700",
  },
  okBtnTextActive: {
    color: "#ffffff",
    fontWeight: "800",
  },
  naBtn: {
    width: 54,
    backgroundColor: colors.surface.muted,
    borderWidth: 1,
    borderColor: colors.border.default,
    paddingVertical: 10,
    borderRadius: radius.md,
    alignItems: "center",
  },
  naBtnActive: {
    backgroundColor: colors.text.secondary,
  },
  naBtnText: {
    color: colors.text.secondary,
    fontSize: 12,
    fontWeight: "600",
  },
  naBtnTextActive: {
    color: "#ffffff",
  },
  ncAlertNotice: {
    backgroundColor: colors.warning.soft,
    padding: 8,
    borderRadius: radius.md,
    marginBottom: 10,
  },
  ncAlertNoticeText: {
    color: colors.warning.foreground,
    fontSize: 10,
    fontWeight: "700",
  },
  dashedPhotoBox: {
    backgroundColor: colors.surface.subtle,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: colors.border.strong,
    borderRadius: radius.md,
    padding: spacing[3],
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  dashedPhotoTitle: {
    color: colors.text.primary,
    fontSize: 11,
    fontWeight: "700",
  },
  dashedPhotoSub: {
    color: colors.text.muted,
    fontSize: 9,
  },
  takePhotoBtn: {
    backgroundColor: colors.blue[600],
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.sm,
  },
  takePhotoBtnText: {
    color: colors.text.inverse,
    fontSize: 10,
    fontWeight: "700",
  },
  evidenceSection: {
    marginBottom: spacing[4],
  },
  evidenceCard: {
    backgroundColor: colors.surface.card,
    borderRadius: radius.lg,
    padding: spacing[3],
    borderWidth: 1,
    borderColor: colors.border.default,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: spacing[2],
  },
  evidenceImage: {
    width: 50,
    height: 50,
    borderRadius: radius.md,
  },
  evidenceTitle: {
    color: colors.text.primary,
    fontSize: 12,
    fontWeight: "700",
  },
  evidenceMeta: {
    color: colors.text.secondary,
    fontSize: 10,
    marginTop: 1,
  },
  evidenceGps: {
    color: colors.blue[600],
    fontSize: 10,
    fontWeight: "600",
  },
  notesSection: {
    marginBottom: spacing[5],
  },
  notesInput: {
    backgroundColor: colors.surface.card,
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: radius.lg,
    padding: 12,
    fontSize: 12,
    color: colors.text.primary,
    textAlignVertical: "top",
  },
  mainSaveBtn: {
    backgroundColor: colors.blue[600],
    borderRadius: radius.xl,
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: getResponsivePaddingBottom(12),
    ...shadow.md,
  },
  mainSaveBtnDisabled: {
    backgroundColor: colors.text.muted,
  },
  mainSaveBtnText: {
    color: colors.text.inverse,
    fontSize: 15,
    fontWeight: "800",
  },
});
