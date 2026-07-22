# ADR-006: Next.js com TypeScript e Tailwind como Aplicação Web

## Status
Aceito

## Contexto
O portal corporativo e administrativo do NexusOps precisará de uma interface rica, responsiva, moderna e de alto desempenho para supervisores de segurança do trabalho, coordenadores de frotas e gestores operacionais analisarem evidências, aprovarem laudos e configurarem checklists dinâmicos em tempo real.

## Decisão
A stack oficial para o frontend corporativo em `apps/web` será composta por **Next.js 14+ (App Router)** com **TypeScript estrito**, estilização nativa utilitária via **Tailwind CSS** e biblioteca de componentes acessíveis baseada em **shadcn/ui** (que utiliza primitivos Radix UI sem amarras ou caixas pretas de estilo). A aplicação consome única e exclusivamente os endpoints REST da API FastAPI.

## Consequências
- **Positivas:** Ecossistema sólido; renderização híbrida rápida e SEO amigável para painéis corporativos; componentes altamente customizáveis, acessíveis e padronizados sem inchar o pacote JavaScript via `shadcn/ui`; segurança de tipo de ponta a ponta.
- **Negativas:** Curva de aprendizado moderada sobre os paradigmas de Server Components (RSC) no Next.js 14, exigindo separação clara entre componentes de cliente (`'use client'`) focados em interatividade e requisições no navegador via clientes HTTP.
