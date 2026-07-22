# ADR-005: FastAPI como Backend e Único Ponto de Acesso aos Dados

## Status
Aceito

## Contexto
O ecossistema NexusOps terá múltiplos clientes consumidores (aplicação Web Next.js para gestores e aplicativo Mobile React Native para técnicos de campo), além de possíveis integrações futuras por webhooks e leituras sincronizadas com o ERP MK Solutions. A segurança das regras de conformidade e a integridade transacional exigem que os dados não sejam manipulados diretamente por clientes externos.

## Decisão
O **Python 3.11+ com FastAPI** foi selecionado como o framework de backend oficial, operando sob o padrão **Clean Architecture e SOLID**, e será a **única camada autorizada a conectar-se diretamente ao PostgreSQL, Redis e MinIO**. Todas as operações e lógicas transacionais serão expostas puramente através de contratos de APIs RESTful estruturadas (`/api/v1`).

## Consequências
- **Positivas:** Geração automática e viva de documentação (`OpenAPI / Swagger`); tipagem estrita via `Pydantic v2`; altíssima performance concorrente nativa (`asyncio` / ASGI via Uvicorn); ecossistema Python líder para manipulação de arquivos, geração de PDFs e processamento de dados em segundo plano.
- **Negativas:** Exige disciplina da equipe para não violar as fronteiras arquiteturais internas do backend (não pular camadas de `Core`, `Domain`, `Application` e `Infrastructure`).
