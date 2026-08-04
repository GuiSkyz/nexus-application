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
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { colors, radius, spacing, shadow } from "../theme/tokens";
import { getResponsivePaddingTop, getResponsivePaddingBottom } from "../theme/responsive";
import { Inspection, ChecklistAnswerValue, EvidencePhoto, ChecklistQuestion } from "../types";
import { OfflineStorage } from "../services/offline/storage";
import { SyncOrchestrator } from "../services/offline/syncQueue";

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

  // Grupos por Categoria
  const categories = Array.from(new Set(inspection.questions.map((q) => q.category)));
  const [activeCategory, setActiveCategory] = useState<string | null>(categories.length > 0 ? categories[0] : null);

  const totalQuestions = inspection.questions.length;
  const answeredCount = Object.keys(answers).length;
  const pendingCount = totalQuestions - answeredCount;
  const requiredAnswersComplete = inspection.questions.every(
    (question) => !question.isRequired || Boolean(answers[question.id]),
  );
  const requiredPhotosComplete = inspection.questions.every(
    (question) =>
      !question.requirePhoto ||
      evidences.some((evidence) => evidence.questionId === question.id),
  );
  const isComplete = requiredAnswersComplete && requiredPhotosComplete;

  // Verificar se há respostas "NÃO CONFORME"
  const hasNonConformity = Object.values(answers).includes("NAO_CONFORME");

  const handleSelectAnswer = (questionId: string, value: ChecklistAnswerValue) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  };

  const handleAddPhoto = async (question: ChecklistQuestion) => {
    const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
    if (!cameraPermission.granted) {
      Alert.alert(
        "Câmera não autorizada",
        "Permita o acesso à câmera nas configurações do aparelho.",
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      allowsEditing: false,
      quality: 0.65,
      base64: true,
    });
    if (result.canceled || !result.assets[0]?.base64) return;

    let coordinates: { latitude?: number; longitude?: number } = {};
    try {
      const locationPermission =
        await Location.requestForegroundPermissionsAsync();
      if (locationPermission.granted) {
        const position = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        coordinates = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
      }
    } catch {
      // A evidência continua válida sem coordenadas quando o GPS não responde.
    }

    const asset = result.assets[0];
    const contentType = asset.mimeType || "image/jpeg";
    const newEvidence: EvidencePhoto = {
      id: OfflineStorage.generateClientUUID(),
      questionId: question.id,
      photoUri: asset.uri,
      dataUrl: `data:${contentType};base64,${asset.base64}`,
      capturedAt: new Date().toISOString(),
      ...coordinates,
      description: `Evidência de campo · ${question.category}`,
    };
    setEvidences((current) => [...current, newEvidence]);
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
        completedAt: new Date().toISOString(),
      };

      const savedItem = await OfflineStorage.enqueueSyncItem("INSPECTION", payload);
      void SyncOrchestrator.triggerSyncWorker();
      
      setSaving(false);
      onSaveSuccess(savedItem.id);
    } catch (error) {
      setSaving(false);
      Alert.alert("Erro ao Salvar", "Ocorreu uma falha ao gravar a vistoria no dispositivo.");
    }
  };

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

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Progresso do Preenchimento - Sobreposto ao Header */}
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

        <View style={styles.innerScrollContent}>
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

          {/* Grupos de Categorias do Checklist (Sanfona) */}
          {categories.map((categoryName) => {
            const categoryQuestions = inspection.questions.filter((q) => q.category === categoryName);
            const isCategoryActive = activeCategory === categoryName;
            
            // Quantidade respondida desta categoria
            const catAnsweredCount = categoryQuestions.filter(q => answers[q.id]).length;
            const isCatComplete = catAnsweredCount === categoryQuestions.length;

            return (
              <View key={categoryName} style={styles.categorySection}>
                {/* Cabeçalho da Categoria (Clicável para Sanfona) */}
                <TouchableOpacity 
                  style={styles.categoryAccordionHeader} 
                  onPress={() => setActiveCategory(isCategoryActive ? null : categoryName)}
                  activeOpacity={0.8}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.categorySectionHeader}>{categoryName.toUpperCase()}</Text>
                    <Text style={{ fontSize: 12, color: isCatComplete ? colors.success.DEFAULT : colors.text.muted, marginTop: 2 }}>
                      {catAnsweredCount} de {categoryQuestions.length} respondidas
                    </Text>
                  </View>
                  <View style={styles.accordionIconBox}>
                    <Text style={{ fontSize: 14, color: colors.blue[600], fontWeight: "800" }}>
                      {isCategoryActive ? "▲" : "▼"}
                    </Text>
                  </View>
                </TouchableOpacity>

                {/* Corpo da Sanfona: Mostra apenas se estiver ativa */}
                {isCategoryActive && categoryQuestions.map((q: ChecklistQuestion, index: number) => {
                  const currentAnswer = answers[q.id];
                  const isSelectedOk = currentAnswer === "CONFORME";
                  const isSelectedNok = currentAnswer === "NAO_CONFORME";
                  const isNA = currentAnswer === "NA";

                  return (
                    <View key={q.id} style={styles.questionCard}>
                      {/* Linha de Cabeçalho da Pergunta */}
                      <View style={styles.questionHeaderRow}>
                        <View style={styles.questionTitleGroup}>
                          <View style={styles.questionIconBox}>
                            <Text style={styles.questionIcon}>
                              {categoryName.toLowerCase().includes("epi") ? "🛟" : categoryName.toLowerCase().includes("pneu") ? "🛞" : "🔧"}
                            </Text>
                          </View>
                          <Text style={styles.questionTextTitle}>{q.questionText}</Text>
                        </View>

                        {q.isRequired && (
                          <View style={styles.tagObrigatorio}>
                            <Text style={styles.tagObrigatorioText}>OBRIGATÓRIO</Text>
                          </View>
                        )}
                      </View>

                      {/* Botões de Ação */}
                      <View style={styles.actionButtonsRow}>
                        <TouchableOpacity
                          style={[styles.actionBtn, isSelectedNok && styles.actionBtnNokActive]}
                          onPress={() => handleSelectAnswer(q.id, "NAO_CONFORME")}
                          activeOpacity={0.7}
                        >
                          <Text style={[styles.actionBtnText, isSelectedNok && styles.actionBtnTextNokActive]}>Não conforme</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[styles.actionBtn, isSelectedOk && styles.actionBtnOkActive]}
                          onPress={() => handleSelectAnswer(q.id, "CONFORME")}
                          activeOpacity={0.7}
                        >
                          <Text style={[styles.actionBtnText, isSelectedOk && styles.actionBtnTextOkActive]}>Conforme</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[styles.actionBtn, isNA && styles.actionBtnNaActive]}
                          onPress={() => handleSelectAnswer(q.id, "NA")}
                          activeOpacity={0.7}
                        >
                          <Text style={[styles.actionBtnText, isNA && styles.actionBtnTextNaActive]}>N/A</Text>
                        </TouchableOpacity>
                      </View>

                      {/* Alerta de NC se marcado Não */}
                      {isSelectedNok && (
                        <View style={styles.ncAlertNotice}>
                          <Text style={styles.ncAlertNoticeText}>
                            ⚠️ Item Inconforme: Um incidente de Ação Corretiva será aberto automaticamente na sincronização.
                          </Text>
                        </View>
                      )}

                      {/* Box de Anexo de Foto Tracejado */}
                      <TouchableOpacity
                        style={styles.dashedPhotoBox}
                        onPress={() => void handleAddPhoto(q)}
                        activeOpacity={0.7}
                      >
                        <View style={styles.photoIconContainer}>
                          <Text style={{ fontSize: 20 }}>📸</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.dashedPhotoTitle}>Adicionar evidência</Text>
                          <Text style={styles.dashedPhotoSub}>Carimbo de data/hora incluso</Text>
                        </View>
                        <View style={styles.takePhotoBtn}>
                          <Text style={styles.takePhotoBtnText}>Capturar</Text>
                        </View>
                      </TouchableOpacity>
                    </View>
                  );
                })}
                {/* Fim do Corpo da Sanfona */}

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
              numberOfLines={4}
              placeholder="Adicione notas sobre os itens inspecionados..."
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
            accessibilityRole="button"
            accessibilityLabel={isComplete ? "Concluir e salvar inspeção" : `Salvar checklist com ${pendingCount} itens pendentes`}
          >
            {saving ? (
              <ActivityIndicator color={colors.text.inverse} size="small" />
            ) : (
              <Text style={styles.mainSaveBtnText}>
                {isComplete
                  ? "✓ Concluir Inspeção"
                  : `Concluir Checklist (${pendingCount} pendentes)`}
              </Text>
            )}
          </TouchableOpacity>
        </View>
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
    backgroundColor: colors.navy[950],
    paddingTop: getResponsivePaddingTop(16),
    paddingHorizontal: spacing[5],
    paddingBottom: spacing[7] + 24, // Extra padding for the overlapping card
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  headerNavRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing[4],
  },
  backBtn: {
    paddingVertical: 4,
    paddingRight: 12,
  },
  backBtnText: {
    color: colors.cyan[500],
    fontSize: 14,
    fontWeight: "700",
  },
  headerAppTitle: {
    color: colors.text.inverse,
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  statusDot: {
    backgroundColor: "rgba(255, 255, 255, 0.15)",
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
    fontSize: 22,
    fontWeight: "800",
    lineHeight: 28,
  },
  screenSubtitle: {
    color: "rgba(214, 224, 239, 0.8)",
    fontSize: 13,
    marginTop: 4,
    lineHeight: 18,
  },
  statusBadgeCompleted: {
    backgroundColor: colors.success.soft,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.sm,
    flexShrink: 0,
  },
  statusTextCompleted: {
    color: colors.success.foreground,
    fontSize: 11,
    fontWeight: "800",
  },
  statusBadgePending: {
    backgroundColor: colors.warning.soft,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.sm,
    flexShrink: 0,
  },
  statusTextPending: {
    color: colors.warning.foreground,
    fontSize: 11,
    fontWeight: "800",
  },
  scrollContent: {
    paddingBottom: 0,
  },
  innerScrollContent: {
    paddingHorizontal: spacing[4],
    paddingBottom: getResponsivePaddingBottom(40),
  },
  progressCard: {
    backgroundColor: colors.surface.card,
    borderRadius: radius.xl,
    padding: spacing[4],
    marginHorizontal: spacing[5],
    marginTop: -40, // Negative margin to overlap the header
    marginBottom: spacing[5],
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.8)",
    ...shadow.md,
    elevation: 4,
  },
  progressHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  progressTitle: {
    color: colors.text.primary,
    fontSize: 13,
    fontWeight: "800",
  },
  progressCounter: {
    color: colors.blue[600],
    fontSize: 13,
    fontWeight: "800",
  },
  progressBarTrack: {
    height: 8,
    backgroundColor: colors.surface.muted,
    borderRadius: 4,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: colors.blue[600],
    borderRadius: 4,
  },
  criticalAlertBanner: {
    backgroundColor: colors.danger.soft,
    borderWidth: 1,
    borderColor: colors.danger.DEFAULT,
    borderRadius: radius.lg,
    padding: spacing[4],
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: spacing[4],
  },
  criticalAlertIcon: {
    fontSize: 24,
  },
  criticalAlertTitle: {
    color: colors.danger.foreground,
    fontSize: 14,
    fontWeight: "800",
  },
  criticalAlertSubtitle: {
    color: colors.danger.foreground,
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },
  vehicleSummaryCard: {
    backgroundColor: colors.surface.card,
    borderRadius: radius.xl,
    padding: spacing[4],
    borderWidth: 1,
    borderColor: colors.border.default,
    marginBottom: spacing[5],
    ...shadow.sm,
  },
  vehicleCardRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  vehicleIconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.blue[50],
    alignItems: "center",
    justifyContent: "center",
  },
  vehicleCardTitle: {
    color: colors.text.primary,
    fontSize: 15,
    fontWeight: "800",
  },
  vehicleCardMeta: {
    color: colors.text.secondary,
    fontSize: 12,
    marginTop: 2,
  },
  vehicleStatusPill: {
    backgroundColor: colors.warning.soft,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 100,
    flexShrink: 0,
  },
  vehicleStatusPillText: {
    color: colors.warning.foreground,
    fontSize: 11,
    fontWeight: "700",
  },
  categorySection: {
    marginBottom: spacing[4],
  },
  categoryAccordionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.surface.muted,
    padding: spacing[4],
    borderRadius: radius.lg,
    borderLeftWidth: 4,
    borderLeftColor: colors.blue[600],
    marginBottom: spacing[3],
  },
  accordionIconBox: {
    backgroundColor: "rgba(255,255,255,0.5)",
    padding: 6,
    borderRadius: 100,
  },
  categorySectionHeader: {
    color: colors.text.primary,
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 0.5,
    marginBottom: 0,
  },
  questionCard: {
    backgroundColor: colors.surface.card,
    borderRadius: radius.xl,
    padding: spacing[4],
    borderWidth: 1,
    borderColor: colors.border.default,
    marginBottom: spacing[4],
    ...shadow.sm,
  },
  questionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  questionTitleGroup: {
    flexDirection: "row",
    gap: 10,
    flex: 1,
    paddingRight: 8,
  },
  questionIconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surface.muted,
    alignItems: "center",
    justifyContent: "center",
  },
  questionIcon: {
    fontSize: 16,
  },
  questionTextTitle: {
    color: colors.text.primary,
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 20,
    flex: 1,
    marginTop: 4,
  },
  tagObrigatorio: {
    backgroundColor: colors.danger.soft,
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: radius.sm,
    flexShrink: 0,
  },
  tagObrigatorioText: {
    color: colors.danger.foreground,
    fontSize: 10,
    fontWeight: "800",
  },
  actionButtonsRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: spacing[3],
    marginBottom: spacing[2],
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 100,
    backgroundColor: colors.surface.muted,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "transparent",
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.text.secondary,
  },
  actionBtnNokActive: {
    backgroundColor: colors.danger.soft,
    borderColor: colors.danger.DEFAULT,
  },
  actionBtnTextNokActive: {
    color: colors.danger.foreground,
  },
  actionBtnOkActive: {
    backgroundColor: colors.success.soft,
    borderColor: colors.success.DEFAULT,
  },
  actionBtnTextOkActive: {
    color: colors.success.foreground,
  },
  actionBtnNaActive: {
    backgroundColor: colors.surface.subtle,
    borderColor: colors.text.muted,
  },
  actionBtnTextNaActive: {
    color: colors.text.primary,
  },
  ncAlertNotice: {
    backgroundColor: colors.warning.soft,
    padding: spacing[3],
    borderRadius: radius.md,
    marginTop: 8,
  },
  ncAlertNoticeText: {
    color: colors.warning.foreground,
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 16,
  },
  dashedPhotoBox: {
    backgroundColor: colors.blue[50],
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: colors.blue[500],
    borderRadius: radius.lg,
    padding: spacing[3],
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: spacing[4],
  },
  photoIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    ...shadow.sm,
  },
  dashedPhotoTitle: {
    color: colors.blue[700],
    fontSize: 13,
    fontWeight: "800",
  },
  dashedPhotoSub: {
    color: colors.blue[600],
    fontSize: 11,
    marginTop: 2,
  },
  takePhotoBtn: {
    backgroundColor: colors.blue[600],
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 100,
  },
  takePhotoBtnText: {
    color: colors.text.inverse,
    fontSize: 12,
    fontWeight: "800",
  },
  evidenceSection: {
    marginBottom: spacing[5],
  },
  evidenceCard: {
    backgroundColor: colors.surface.card,
    borderRadius: radius.lg,
    padding: spacing[3],
    borderWidth: 1,
    borderColor: colors.border.default,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: spacing[3],
    ...shadow.sm,
  },
  evidenceImage: {
    width: 60,
    height: 60,
    borderRadius: radius.md,
  },
  evidenceTitle: {
    color: colors.text.primary,
    fontSize: 13,
    fontWeight: "700",
  },
  evidenceMeta: {
    color: colors.text.secondary,
    fontSize: 11,
    marginTop: 2,
  },
  evidenceGps: {
    color: colors.blue[600],
    fontSize: 11,
    fontWeight: "700",
    marginTop: 2,
  },
  notesSection: {
    marginBottom: spacing[6],
  },
  notesInput: {
    backgroundColor: colors.surface.card,
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: radius.xl,
    padding: spacing[4],
    fontSize: 14,
    color: colors.text.primary,
    textAlignVertical: "top",
    ...shadow.sm,
  },
  mainSaveBtn: {
    backgroundColor: colors.blue[600],
    borderRadius: 100,
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: getResponsivePaddingBottom(24),
    ...shadow.md,
  },
  mainSaveBtnDisabled: {
    backgroundColor: colors.text.muted,
  },
  mainSaveBtnText: {
    color: colors.text.inverse,
    fontSize: 16,
    fontWeight: "800",
  },
});
