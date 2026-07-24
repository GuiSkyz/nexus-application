import React from "react";

interface KpiCardProps {
  label: string;
  value: string | number;
  context?: string;
  status?: "success" | "warning" | "danger" | "info" | "neutral";
  icon?: React.ReactNode;
}

export function KpiCard({ label, value, context, status = "neutral", icon }: KpiCardProps) {
  const statusColor = {
    success: "var(--success)",
    warning: "var(--warning)",
    danger: "var(--danger)",
    info: "var(--info)",
    neutral: "var(--text-muted)",
  }[status];

  const statusBg = {
    success: "var(--success-soft)",
    warning: "var(--warning-soft)",
    danger: "var(--danger-soft)",
    info: "var(--info-soft)",
    neutral: "var(--surface-muted)",
  }[status];

  return (
    <div
      className="flex flex-col justify-between"
      style={{
        backgroundColor: "var(--surface-card)",
        border: "1px solid var(--border-default)",
        borderRadius: "var(--radius-lg)",
        boxShadow: "var(--shadow-sm)",
        padding: "20px",
        minHeight: "120px",
      }}
    >
      <div className="flex items-start justify-between mb-3">
        <span
          className="text-xs font-medium uppercase tracking-wide"
          style={{ color: "var(--text-secondary)" }}
        >
          {label}
        </span>
        {icon && (
          <span
            className="flex items-center justify-center w-8 h-8 flex-shrink-0"
            style={{
              backgroundColor: statusBg,
              color: statusColor,
              borderRadius: "var(--radius-md)",
            }}
          >
            {icon}
          </span>
        )}
      </div>
      <div>
        <span
          className="text-2xl font-bold tracking-tight"
          style={{ color: "var(--text-primary)" }}
        >
          {value}
        </span>
        {context && (
          <p
            className="text-xs mt-1"
            style={{ color: "var(--text-muted)" }}
          >
            {context}
          </p>
        )}
      </div>
    </div>
  );
}
