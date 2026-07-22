import React, { useEffect, useState, useCallback } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from "react-native";
import { ApiService } from "../services/api";
import { ReadinessResponse } from "../types";
import { StatusCard } from "../components/StatusCard";

export const HomeScreen: React.FC = () => {
  const [readiness, setReadiness] = useState<ReadinessResponse>({
    status: "loading",
    services: {
      postgres: "unknown",
      redis: "unknown",
      minio: "unknown",
    },
  });
  const [refreshing, setRefreshing] = useState(false);

  const fetchStatus = useCallback(async () => {
    setRefreshing(true);
    const result = await ApiService.getReadinessStatus();
    setReadiness(result);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={fetchStatus} tintColor="#34D399" />}
    >
      <View style={styles.header}>
        <Text style={styles.badgeText}>OPERATIONAL COMPLIANCE PLATFORM</Text>
        <Text style={styles.title}>NexusOps Mobile</Text>
        <Text style={styles.subtitle}>
          Ferramenta de campo para inspeções operacionais, verificação de saída de frotas e APR com operação Offline-First.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Status de Saúde (FastAPI Backend)</Text>
        {readiness.errorDetail ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>Aviso: {readiness.errorDetail}</Text>
          </View>
        ) : null}

        <StatusCard
          label="API Gateway (FastAPI)"
          status={readiness.status === "loading" ? "loading" : readiness.status === "ready" ? "ready" : "unready"}
          description="Serviço principal de acesso a dados"
        />
        <StatusCard
          label="PostgreSQL 16"
          status={readiness.status === "loading" ? "loading" : readiness.services.postgres}
          description="Fonte Oficial da Verdade"
        />
        <StatusCard
          label="Redis 7"
          status={readiness.status === "loading" ? "loading" : readiness.services.redis}
          description="Cache de Permissões e Filas"
        />
        <StatusCard
          label="MinIO Storage"
          status={readiness.status === "loading" ? "loading" : readiness.services.minio}
          description="Repositório de Evidências Fotográficas e PDFs"
        />
      </View>

      <View style={styles.footerInfo}>
        <Text style={styles.footerTitle}>🔒 Estratégia de Operação</Text>
        <Text style={styles.footerText}>
          Os identificadores de checklist (UUIDv4) são gerados no dispositivo móvel. As evidências ficam em cache transacional e são sincronizadas automaticamente sem bloquear o técnico em áreas sem rede.
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0F172A",
  },
  contentContainer: {
    padding: 20,
    paddingTop: 50,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 24,
  },
  badgeText: {
    color: "#34D399",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.2,
    marginBottom: 6,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 32,
    fontWeight: "900",
    marginBottom: 8,
  },
  subtitle: {
    color: "#94A3B8",
    fontSize: 14,
    lineHeight: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: "#E2E8F0",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
  },
  errorBanner: {
    backgroundColor: "rgba(239, 68, 68, 0.15)",
    borderColor: "#EF4444",
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  errorText: {
    color: "#F87171",
    fontSize: 12,
  },
  footerInfo: {
    backgroundColor: "#1E293B",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#334155",
  },
  footerTitle: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 6,
  },
  footerText: {
    color: "#94A3B8",
    fontSize: 12,
    lineHeight: 18,
  },
});
