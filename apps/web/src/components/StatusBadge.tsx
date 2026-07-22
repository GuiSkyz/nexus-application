import React from "react";

interface StatusBadgeProps {
  label: string;
  status: "healthy" | "unhealthy" | "unknown" | "loading" | "ready" | "unready" | "error";
  description?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ label, status, description }) => {
  const getColors = () => {
    switch (status) {
      case "healthy":
      case "ready":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      case "unhealthy":
      case "unready":
      case "error":
        return "bg-rose-500/10 text-rose-400 border-rose-500/20";
      case "loading":
        return "bg-amber-500/10 text-amber-400 border-amber-500/20 animate-pulse";
      default:
        return "bg-slate-500/10 text-slate-400 border-slate-500/20";
    }
  };

  const getDotColors = () => {
    switch (status) {
      case "healthy":
      case "ready":
        return "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]";
      case "unhealthy":
      case "unready":
      case "error":
        return "bg-rose-400 shadow-[0_0_8px_rgba(251,113,133,0.8)]";
      case "loading":
        return "bg-amber-400 animate-ping";
      default:
        return "bg-slate-400";
    }
  };

  return (
    <div className={`flex items-center justify-between p-4 rounded-xl border transition-all duration-300 ${getColors()}`}>
      <div className="flex items-center space-x-3">
        <span className={`w-3 h-3 rounded-full ${getDotColors()}`} />
        <div>
          <h4 className="font-semibold text-sm tracking-wide">{label}</h4>
          {description && <p className="text-xs opacity-80 mt-0.5">{description}</p>}
        </div>
      </div>
      <span className="text-xs font-mono uppercase px-2.5 py-1 rounded-md bg-black/20 tracking-wider">
        {status}
      </span>
    </div>
  );
};
