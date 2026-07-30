import React, { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { ShieldCheck } from "@tamagui/lucide-icons-2/icons/ShieldCheck";

import { ApiService } from "../services/api";
import {
  colors,
  control,
  radius,
  shadow,
  spacing,
  typography,
} from "../theme/tokens";
import { MobileUser } from "../types";

interface LoginScreenProps {
  onLoginSuccess: (user: MobileUser) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      setErrorMessage("Informe o e-mail corporativo e a senha.");
      return;
    }
    setLoading(true);
    setErrorMessage(null);
    try {
      const user = await ApiService.login(email, password);
      onLoginSuccess(user);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Não foi possível entrar. Verifique sua conexão.",
      );
    } finally {
      setLoading(false);
    }
  };

  const disabled = loading || !email.trim() || !password;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.logoBadge}>
            <Text style={styles.logoText}>N</Text>
          </View>
          <Text style={styles.title}>NexusOps Mobile</Text>
          <Text style={styles.subtitle}>Conformidade operacional para campo</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Acesso do técnico</Text>
          <Text style={styles.cardSubtitle}>
            Entre para registrar inspeções, evidências e atividades com segurança.
          </Text>

          <View style={styles.field}>
            <Text style={styles.label}>E-mail corporativo</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="nome@empresa.com.br"
              placeholderTextColor={colors.text.secondary}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              textContentType="username"
              accessibilityLabel="E-mail corporativo"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Senha</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholder="Sua senha"
              placeholderTextColor={colors.text.secondary}
              textContentType="password"
              accessibilityLabel="Senha"
              onSubmitEditing={() => {
                if (!disabled) void handleLogin();
              }}
            />
          </View>

          {errorMessage && (
            <View style={styles.errorNotice} accessibilityRole="alert">
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.button, disabled && styles.buttonDisabled]}
            onPress={() => void handleLogin()}
            disabled={disabled}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Entrar no NexusOps"
          >
            {loading ? (
              <ActivityIndicator color={colors.text.inverse} size="small" />
            ) : (
              <Text style={styles.buttonText}>Entrar no NexusOps</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.footerNotice}>
          <ShieldCheck size={18} color={colors.blue[600]} />
          <Text style={styles.footerNoticeText}>
            As vistorias ficam salvas neste aparelho e sincronizam quando houver
            rede.
          </Text>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minHeight: Platform.OS === "web" ? ("100vh" as never) : "100%",
    backgroundColor: colors.surface.page,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    padding: spacing[5],
  },
  header: {
    alignItems: "center",
    marginBottom: spacing[6],
  },
  logoBadge: {
    width: 48,
    height: 48,
    backgroundColor: colors.blue[600],
    borderRadius: radius.lg,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  logoText: {
    color: colors.text.inverse,
    ...typography.heading,
    fontWeight: "700",
  },
  title: {
    color: colors.text.primary,
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  subtitle: {
    color: colors.text.secondary,
    fontSize: 13,
    marginTop: 2,
  },
  card: {
    backgroundColor: colors.surface.card,
    borderRadius: radius.xl,
    padding: spacing[5],
    ...shadow.md,
  },
  cardTitle: {
    color: colors.text.primary,
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
  },
  cardSubtitle: {
    color: colors.text.secondary,
    fontSize: 12,
    lineHeight: 18,
    marginBottom: spacing[5],
  },
  field: {
    marginBottom: spacing[4],
  },
  label: {
    color: colors.text.primary,
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 6,
  },
  input: {
    backgroundColor: colors.surface.subtle,
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    minHeight: control.inputHeight,
    fontSize: typography.body.fontSize,
    color: colors.text.primary,
  },
  errorNotice: {
    backgroundColor: colors.danger.soft,
    borderRadius: radius.md,
    padding: spacing[3],
    marginBottom: spacing[3],
  },
  errorText: {
    color: colors.danger.foreground,
    fontSize: 12,
    lineHeight: 17,
  },
  button: {
    backgroundColor: colors.blue[600],
    borderRadius: radius.md,
    minHeight: control.buttonHeight,
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing[2],
  },
  buttonDisabled: {
    opacity: 0.55,
  },
  buttonText: {
    color: colors.text.inverse,
    ...typography.label,
    fontWeight: "600",
  },
  footerNotice: {
    marginTop: spacing[6],
    paddingHorizontal: spacing[4],
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  footerNoticeText: {
    flex: 1,
    color: colors.text.secondary,
    fontSize: 11,
    textAlign: "center",
    lineHeight: 16,
  },
});
