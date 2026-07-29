import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { ShieldCheck } from "@tamagui/lucide-icons-2";
import { colors, control, radius, shadow, spacing, typography } from "../theme/tokens";

interface LoginScreenProps {
  onLoginSuccess: (user: { name: string; role: string }) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState("tecnico.silva@nexusops.com");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onLoginSuccess({
        name: "Carlos Silva",
        role: "Técnico operacional · Equipe Alfa",
      });
    }, 600);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <View style={styles.content}>
        {/* Marca & Header */}
        <View style={styles.header}>
          <View style={styles.logoBadge}>
            <Text style={styles.logoText}>N</Text>
          </View>
          <Text style={styles.title}>NexusOps Mobile</Text>
          <Text style={styles.subtitle}>Conformidade operacional para campo</Text>
        </View>

        {/* Form Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Acesso do técnico</Text>
          <Text style={styles.cardSubtitle}>
            Entre para registrar inspeções, evidências e atividades com segurança.
          </Text>

          <View style={styles.field}>
            <Text style={styles.label}>E-mail Corporativo</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="seu.email@provedor.com"
              keyboardType="email-address"
              autoCapitalize="none"
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
              accessibilityLabel="Senha"
            />
          </View>

          <TouchableOpacity
            style={styles.button}
            onPress={handleLogin}
            disabled={loading}
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

        {/* Badge Offline Info */}
        <View style={styles.footerNotice}>
          <ShieldCheck size={18} color={colors.blue[600]} />
          <Text style={styles.footerNoticeText}>As vistorias ficam salvas neste aparelho e sincronizam quando houver rede.</Text>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minHeight: Platform.OS === "web" ? ("100vh" as any) : "100%",
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
    color: colors.text.muted,
    fontSize: 13,
    marginTop: 2,
  },
  card: {
    backgroundColor: colors.surface.card,
    borderRadius: radius.xl,
    padding: spacing[5],
    borderWidth: 1,
    borderColor: colors.border.default,
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
  button: {
    backgroundColor: colors.blue[600],
    borderRadius: radius.md,
    minHeight: control.buttonHeight,
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing[2],
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
    color: colors.text.muted,
    fontSize: 11,
    textAlign: "center",
    lineHeight: 16,
  },
});
