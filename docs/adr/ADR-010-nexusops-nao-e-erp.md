# ADR-010: Delimitação Arquitetural — NexusOps Não É um ERP

## Status
Aceito

## Contexto
Durante o ciclo de vida de uma Operational Compliance Platform voltada a provedores de internet, frequentemente há tentação ou pressão para absorver funcionalidades administrativas adicionais (como cadastro direto de contas a pagar, emissão de boletos, aberturas de OS comerciais ou controle contábil) com o argumento de centralizar tudo na nova interface.

## Decisão
Reafirma-se como mandamento inegociável que **o NexusOps não é e não deverá se tornar um ERP**. Seu domínio restringe-se rigidamente a:
- Inspeções operacionais e técnicas de campo;
- Checklists de saída e auditoria preventiva de veículos da frota;
- Análise Preliminar de Risco (APR) e conformidade de segurança do trabalho;
- Coleta de evidências fotográficas, assinaturas e laudos;
- Identificação, registro e tratamento de não conformidades e histórico operacional.

Qualquer novo requisito administrativo ou financeiro que não pertença a esse escopo de conformidade operacional deverá ser direcionado ao ERP oficial do provedor (MK Solutions).

## Consequências
- **Positivas:** Foco do produto na excelência operacional, agilidade do aplicativo mobile de campo e clareza de propósito; codebase manutenível sem acoplamentos com regras contábeis complexas e mutáveis.
- **Negativas:** Requer que os gestores continuem operando dois sistemas em paralelo (MK Solutions para o administrativo/financeiro e NexusOps para o acompanhamento e auditoria de campo).
