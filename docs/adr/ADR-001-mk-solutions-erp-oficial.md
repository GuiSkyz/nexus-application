# ADR-001: MK Solutions Permanece como ERP Oficial

## Status
Aceito

## Contexto
O provedor de internet (ISP) já utiliza o sistema **MK Solutions** como seu sistema primário (ERP) para a gestão de clientes, contratos financeiros, estoques patrimoniais, faturamento e ordens de serviço (OS). O NexusOps está sendo construído para cobrir uma lacuna crítica de conformidade operacional em campo, segurança do trabalho (APR) e auditoria de veículos, disciplinas que não são o foco arquitetural do ERP.

## Decisão
Fica determinado que o **MK Solutions continuará sendo o sistema oficial e a única fonte da verdade** para todos os dados administrativos, financeiros, contratos de clientes e abertura/fechamento administrativo de ordens de serviço. O NexusOps consumirá esses dados (via integração/leitura em momento oportuno) para vincular checklists e APRs aos técnicos e ordens adequadas, sem duplicar o papel ou a lógica cadastral do ERP.

## Consequências
- **Positivas:** Sem retrabalho de cadastro e faturamento; preservação do histórico contábil oficial; acoplamento reduzido ao negócio financeiro.
- **Negativas:** Necessidade de manter rotinas de sincronização e conciliação de dados cadastrais (ex: lista atualizada de técnicos e veículos) com o MK Solutions.
