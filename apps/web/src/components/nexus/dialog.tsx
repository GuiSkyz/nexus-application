"use client";

import { ReactNode, useEffect } from "react";
import { X } from "lucide-react";

type DialogProps = {
  open: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
  width?: "md" | "lg";
};

export function Dialog({ open, title, children, onClose, width = "md" }: DialogProps) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose, open]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="presentation" onMouseDown={onClose}>
      <section role="dialog" aria-modal="true" aria-label={title} onMouseDown={(event) => event.stopPropagation()} className={`w-full ${width === "lg" ? "max-w-2xl" : "max-w-lg"} rounded-xl bg-white p-6 shadow-overlay`}>
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 className="text-base font-bold text-text-primary">{title}</h2>
          <button type="button" onClick={onClose} className="rounded p-1 text-text-secondary hover:bg-surface-muted" aria-label="Fechar diálogo"><X className="h-4 w-4" /></button>
        </div>
        {children}
      </section>
    </div>
  );
}
