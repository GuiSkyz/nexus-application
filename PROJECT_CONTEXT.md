# PROJECT_CONTEXT.md - NexusOps (Operational Compliance Platform)

## 1. Visão do Produto
O **NexusOps** é uma **Operational Compliance Platform** voltada especificamente para provedores de internet (ISPs). O objetivo fundamental da plataforma é garantir a padronização, rastreabilidade, auditoria e segurança operacional nas atividades de campo e logística de frotas e equipes técnicas.

### Funcionalidades Específicas do NexusOps:
- **Inspeções Operacionais:** Verificação e acompanhamento de padrões técnicos em campo.
- **Inspeções de Saída de Veículos:** Checklists diários e auditoria de frotas.
- **APR — Análise Preliminar de Risco:** Prevenção e verificação obrigatória de segurança do trabalho antes das atividades de risco.
- **Checklists Configuráveis:** Modelos dinâmicos adaptáveis a diferentes tipos de ordens ou vistorias.
- **Evidências Fotográficas & Assinaturas:** Captura digital de provas visuais e assinaturas com metadados e carimbo de tempo.
- **Auditoria & Não Conformidades:** Registro, rastreio e plano de ação para falhas ou desvios operacionais.
- **Dashboards & Relatórios:** Indicadores operacionais, histórico e geração de PDFs rastreáveis.
- **Operação Offline-First:** Coleta de evidências, preenchimento de APR e checklists em áreas remotas sem conectividade, com sincronização automática e transacional posterior.

---

## 2. Relação e Limites com o MK Solutions (ADR-001 & ADR-010)
O NexusOps **não é um ERP** e não tenta substituir as funções administrativas, comerciais ou financeiras do provedor.
- O **MK Solutions** permanece sendo o **ERP Oficial** e a única fonte da verdade para:
  - Dados administrativos e financeiros;
  - Cadastros de clientes e contratos;
  - Abertura, fechamento e faturamento de Ordens de Serviço (OS).
- O **NexusOps** atua como plataforma complementar acoplada à operação técnica:
  - Integra-se ao MK Solutions para consumir dados de equipes, técnicos, veículos e ordens de serviço;
  - Devolve evidências, laudos de APR e status de conformidade operacional.

---

## 3. Princípios Arquiteturais Obrigatórios
- **Clean Architecture & SOLID:** Separação estrita em camadas (`Core`, `Domain`, `Application`, `Infrastructure`, `Interfaces`), protegendo as regras de domínio das implementações de infraestrutura.
- **API First:** O backend FastAPI expõe contratos claros e versionados (`/api/v1`). Nenhuma aplicação cliente (Web ou Mobile) acessa diretamente o banco de dados ou storage.
- **Offline First (Mobile):** O aplicativo React Native (Expo) opera plenamente offline via armazenamento local, com gerador de UUID no cliente para conciliação sem colisão.
- **Secure by Design:** Validação estrita de entradas via Pydantic, autenticação JWT/RBAC preparada no core, mascaramento de logs estruturados em JSON e tolerância zero com credenciais hardcoded.
- **Modularidade & Baixo Acoplamento:** Estrutura organizada por módulos de negócio com alta coesão interior e comunicação por interfaces.

---

## 4. Stack Oficial & Responsabilidade de Cada Serviço

| Serviço / Camada | Tecnologia Principal | Responsabilidade Principal |
| :--- | :--- | :--- |
| **Backend API** | Python / FastAPI / SQLAlchemy / Alembic / Pydantic | Camada única autorizada a acessar dados e storage. Orquestra regras de negócio, validações, autenticação e geração de PDFs. |
| **Banco Relacional** | PostgreSQL 16 | Fonte Oficial da Verdade para dados permanentes e estruturados (usuários, equipes, checklists, inspeções, respostas, auditoria). |
| **Cache & Filas** | Redis 7 | Cache de permissões, rate limiting, revogação de tokens JWT (blocklist), filas assíncronas e controle de reprocessamento. **Nunca** utilizado como armazenamento permanente crítico. |
| **Object Storage** | MinIO | Armazenamento seguro de arquivos binários pesados: fotos, evidências fotográficas, assinaturas digitais e relatórios em PDF gerados pela API. |
| **Aplicação Web** | Next.js 14+ / TypeScript / Tailwind CSS / shadcn/ui | Interface administrativa responsiva para gestores, coordenação e controle de conformidade/dashboards. |
| **Aplicação Mobile** | React Native / Expo / TypeScript | Ferramenta de campo para técnicos, com foco absoluto em resiliência, usabilidade e operação **Offline First**. |
| **Infraestrutura** | Docker / Docker Compose / Nginx | Orquestração local isolada, health checks em todos os contêineres e proxy reverso. |

---

## 5. Regras e Limites de Dados
1. **Geração de PDFs:** Apenas e exclusivamente gerados pelo serviço FastAPI em background ou de forma síncrona, e salvos no MinIO. O Frontend nunca gera laudos oficiais em PDF.
2. **Referência de Arquivos:** O PostgreSQL armazena **apenas as chaves de referência (paths/keys)** e metadados dos arquivos. O arquivo físico reside no MinIO.
3. **Chaves Primárias:** Todos os identificadores do sistema seguem o padrão `UUIDv4`.
