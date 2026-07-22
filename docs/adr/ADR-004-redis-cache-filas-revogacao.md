# ADR-004: Redis para Cache, Filas Assíncronas e Revogação de Tokens

## Status
Aceito

## Contexto
Uma plataforma operacional com requisições em tempo real provenientes de técnicos em campo e gestores administrativos requer tempos de resposta na casa de milissegundos para verificações repetitivas de segurança, além de processamento desacoplado em segundo plano para tarefas intensivas da CPU (como geração e renderização de PDFs consolidados, envio de notificações push/e-mail e reprocessamento de filas de sincronização com falha).

## Decisão
O **Redis 7+** foi selecionado como componente obrigatório da fundação desde o primeiro dia, com as seguintes responsabilidades exclusivas:
1. **Cache de Permissões e Perfis RBAC:** Evitar consultas repetitivas ao PostgreSQL a cada requisição autenticada da API.
2. **Blocklist/Revogação Instantânea de Tokens JWT:** Permitir logout imediato, invalidação por troca de senha e encerramento de sessão de dispositivos perdidos.
3. **Rate Limiting & Proteção contra Abuso:** Controle de taxa em endpoints sensíveis e APIs públicas/mobile.
4. **Filas de Processamento Assíncrono:** Orquestração de background jobs (geração de laudos PDF e envio de notificações via Celery/ARQ/RQ em etapas futuras).

**Nota Fundamental:** O Redis **nunca** será utilizado como fonte oficial para persistência crítica de negócios. Dados voláteis perdidos na reinicialização do Redis devem ser reconstruíveis a partir do PostgreSQL.

## Consequências
- **Positivas:** Desempenho em memória ultrarrápido; isolamento de tarefas pesadas que não bloqueiam o loop de eventos síncrono/assíncrono do FastAPI.
- **Negativas:** Exige consumo contínuo de memória RAM e definição rigorosa de políticas de expiração (`TTL`) e prefixação de chaves (`nexusops:`).
