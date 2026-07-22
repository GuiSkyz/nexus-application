# ADR-002: PostgreSQL como Banco Principal (Fonte Oficial da Verdade)

## Status
Aceito

## Contexto
O NexusOps requer um banco de dados robusto, transacional, em conformidade com propriedades ACID e capaz de suportar esquemas complexos para auditoria, histórico operacional, inspeções estruturadas e controle de não conformidades, além de lidar perfeitamente com tipagem rigorosa, JSONB para templates dinâmicos e indexação eficiente.

## Decisão
O **PostgreSQL 16+** foi selecionado como a **Fonte Oficial da Verdade** para todos os dados permanentes e relacionais da plataforma NexusOps (usuários, perfis, equipes, veículos, inspeções operacionais, respostas aos checklists, registros de auditoria e não conformidades).

## Consequências
- **Positivas:** Maturidade comprovada no mercado; suporte nativo a `JSONB` e `UUIDv4`; integração sem falhas com `SQLAlchemy 2.0` / `asyncpg` e `Alembic` para rastreamento de migrações estruturais.
- **Negativas:** Exige rotinas consolidadas de backup de banco e dimensionamento de pool de conexões (tratado na camada de infraestrutura do FastAPI).
