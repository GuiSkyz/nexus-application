"use client";

import { FormEvent, useEffect, useState } from "react";
import { Eye, EyeOff, LockKeyhole, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/components/nexus/auth-provider";

export default function LoginPage() {
  const { login, status } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (status === "authenticated") router.replace("/");
  }, [router, status]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await login(email, password);
      const next =
        typeof window === "undefined"
          ? "/"
          : new URLSearchParams(window.location.search).get("next") || "/";
      router.replace(next.startsWith("/") ? next : "/");
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Não foi possível entrar. Tente novamente.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="grid min-h-screen bg-white lg:grid-cols-[minmax(360px,0.85fr)_1.15fr]">
      <section className="flex items-center justify-center px-6 py-12 sm:px-10">
        <div className="w-full max-w-sm">
          <div className="mb-10 flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-nexus-blue-600 text-lg font-black text-white">
              N
            </span>
            <div>
              <p className="text-base font-bold text-text-primary">NexusOps</p>
              <p className="text-xs text-text-secondary">
                Conformidade operacional
              </p>
            </div>
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-text-primary">
            Acesse sua operação
          </h1>
          <p className="mt-2 text-sm leading-6 text-text-secondary">
            Entre com as credenciais fornecidas pela administração.
          </p>

          <form onSubmit={submit} className="mt-8 space-y-5">
            {error && (
              <div
                role="alert"
                className="rounded-lg bg-danger-soft px-4 py-3 text-sm font-semibold text-danger-foreground"
              >
                {error}
              </div>
            )}

            <label className="block text-sm font-semibold text-text-primary">
              E-mail
              <input
                required
                autoComplete="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="nome@empresa.com.br"
                className="mt-2 h-11 w-full rounded-md border bg-white px-3 text-sm placeholder:text-slate-500 focus:border-nexus-blue-600"
              />
            </label>

            <label className="block text-sm font-semibold text-text-primary">
              Senha
              <span className="relative mt-2 block">
                <input
                  required
                  autoComplete="current-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="h-11 w-full rounded-md border bg-white px-3 pr-11 text-sm focus:border-nexus-blue-600"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((visible) => !visible)}
                  className="absolute right-1 top-1 flex h-9 w-9 items-center justify-center rounded text-text-secondary hover:bg-surface-muted"
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </span>
            </label>

            <button
              disabled={submitting}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-md bg-nexus-blue-600 px-4 text-sm font-bold text-white hover:bg-nexus-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <LockKeyhole className="h-4 w-4" />
              )}
              {submitting ? "Entrando…" : "Entrar"}
            </button>
          </form>

          <p className="mt-6 text-xs leading-5 text-text-secondary">
            Problemas de acesso devem ser encaminhados ao administrador da
            plataforma.
          </p>
        </div>
      </section>

      <section className="relative hidden overflow-hidden bg-nexus-navy-900 lg:flex lg:items-end">
        <div className="relative z-10 max-w-xl p-14 text-white">
          <ShieldCheck className="mb-6 h-9 w-9 text-nexus-cyan-500" />
          <h2 className="max-w-lg text-3xl font-bold leading-tight tracking-tight">
            Decisões operacionais sustentadas por evidências reais.
          </h2>
          <p className="mt-4 max-w-lg text-sm leading-6 text-blue-100">
            Checklists, APRs, não conformidades, equipes e frota em uma visão
            única, segura e auditável.
          </p>
        </div>
      </section>
    </main>
  );
}
