# ADR-009: Geração de Relatórios em PDF Exclusivamente no Backend (FastAPI)

## Status
Aceito

## Contexto
O NexusOps emitirá laudos oficiais de conformidade de saídas de veículos, relatórios consolidados de vistorias e documentos legais de Análise Preliminar de Risco (APR) carimbados e assinados. Esses relatórios são frequentemente auditados, baixados por clientes ou anexados a processos de compliance corporativo e trabalhista.

## Decisão
Fica terminantemente estabelecido que **todos os relatórios em formato PDF deverão ser gerados e processados unicamente pela camada de backend no FastAPI**, salvos como objetos binários no **MinIO** com hash de integridade e referenciados no PostgreSQL. **O frontend Web e o aplicativo Mobile estão proibidos de gerar arquivos PDF finais** do lado do cliente utilizando bibliotecas em JavaScript.

## Consequências
- **Positivas:** Rastreabilidade, imutabilidade e padronização visual rigorosa dos documentos, independentemente de qual navegador ou dispositivo móvel solicitou; garantia de que a versão impressa reflete fielmente os dados consolidados e validados pela API oficial; facilidade para aplicar assinaturas digitais ou carimbos criptográficos centralizados.
- **Negativas:** Exige poder de processamento da CPU no backend ou em workers de background (via fila no Redis) em momentos de pico de solicitação de relatórios.
