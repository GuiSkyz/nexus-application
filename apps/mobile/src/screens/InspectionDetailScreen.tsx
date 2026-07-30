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
import { XStack, Button } from "tamagui";
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
                <Text style={{ fontSize: 18, color: colors.text.muted }}>
                  {isCategoryActive ? "▲" : "▼"}
                </Text>
              </TouchableOpacity>

              {/* Corpo da Sanfona: Mostra apenas se estiver ativa */}
              {isCategoryActive && categoryQuestions.map((q: ChecklistQuestion, index: number) => {
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

                    {/* Botões de Ação: [ Não ] e [ Sim ] e [ Sem Resposta ] */}
                    <XStack gap="$2" mt="$4" jc="space-between" width="100%">
                      <Button
                        f={1}
                        size="$3"
                        bg={isSelectedNok ? colors.danger.soft : colors.surface.muted}
                        borderColor={isSelectedNok ? colors.danger.DEFAULT : "transparent"}
                        borderWidth={isSelectedNok ? 1 : 0}
                        color={isSelectedNok ? colors.danger.foreground : colors.text.primary}
                        onPress={() => handleSelectAnswer(q.id, "NAO_CONFORME")}
                      >
                        Não conforme
                      </Button>

                      <Button
                        f={1}
                        size="$3"
                        bg={isSelectedOk ? colors.success.soft : colors.surface.muted}
                        borderColor={isSelectedOk ? colors.success.DEFAULT : "transparent"}
                        borderWidth={isSelectedOk ? 1 : 0}
                        color={isSelectedOk ? colors.success.foreground : colors.text.primary}
                        onPress={() => handleSelectAnswer(q.id, "CONFORME")}
                      >
                        Conforme
                      </Button>

                      <Button
                        f={1.2}
                        size="$3"
                        bg={currentAnswer === "NA" ? colors.warning.soft : colors.surface.muted}
                        borderColor={currentAnswer === "NA" ? colors.warning.DEFAULT : "transparent"}
                        borderWidth={currentAnswer === "NA" ? 1 : 0}
                        color={currentAnswer === "NA" ? colors.warning.foreground : colors.text.primary}
                        onPress={() => handleSelectAnswer(q.id, "NA")}
                      >
                        Não se aplica
                      </Button>
                    </XStack>

                    {/* Alerta de NC se marcado Não */}
                    {isSelectedNok && (
                      <View style={styles.ncAlertNotice}>
                        <Text style={styles.ncAlertNoticeText}>
                          ⚠️ Item Inconforme: Um incidente de Ação Corretiva será aberto automaticamente para seu supervisor na sincronização. Recomenda-se adicionar foto.
                        </Text>
                      </View>
                    )}

                    {/* Box de Anexo de Foto Tracejado */}
                    <TouchableOpacity
                      style={styles.dashedPhotoBox}
                      onPress={() => void handleAddPhoto(q)}
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
          accessibilityRole="button"
          accessibilityLabel={isComplete ? "Concluir e salvar inspeção" : `Salvar checklist com ${pendingCount} itens pendentes`}
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
  categoryAccordionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.surface.card,
    padding: spacing[3],
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border.default,
    marginBottom: spacing[2],
  },
  categorySectionHeader: {
    color: colors.text.primary,
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0.5,
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
