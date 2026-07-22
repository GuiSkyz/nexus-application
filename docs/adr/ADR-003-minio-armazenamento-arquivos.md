# ADR-003: MinIO para Armazenamento de Arquivos e Evidências

## Status
Aceito

## Contexto
O fluxo diário de checklists operacionais, saídas de frotas e análises preliminares de risco (APR) gera um volume massivo de arquivos binários não estruturados (fotos, assinaturas biométricas e relatórios consolidados em formato PDF). Armazenar diretamente blobs binários em colunas do banco de dados relacional (PostgreSQL) degradaria a performance, incharia o tamanho dos backups e inviabilizaria escalabilidade independente.

## Decisão
O **MinIO** (Object Storage compatível 100% com a API do AWS S3) foi escolhido como o repositório oficial e isolado de todos os objetos binários (evidências fotográficas, assinaturas digitais e relatórios em PDF gerados pelo backend). O PostgreSQL guardará única e exclusivamente a chave de identificação do objeto (`object_key`/`UUID`) e seus metadados (`content_type`, `file_size`, `hash`).

## Consequências
- **Positivas:** Separação limpa entre dados transacionais e binários pesados; compatibilidade imediata para transição cloud futura (AWS S3 ou Google Cloud Storage sem alteração no código da aplicação); facilidade de streaming seguro por URLs pré-assinadas via API.
- **Negativas:** Exige orquestração e monitoramento de mais um serviço no cluster Docker Compose e estratégias de retenção/expiração de arquivos temporários.
