# NexusOps — Operational Compliance Platform

**NexusOps** é uma plataforma de conformidade operacional projetada para provedores de internet (ISPs). Ela atua de forma complementar ao ERP oficial **MK Solutions**, provendo inspeções operacionais, verificação de saída de veículos, Análises Preliminares de Risco (APR), checklists configuráveis, evidências fotográficas e assinaturas digitais com resiliência e suporte completo à operação **Offline-First**.

---

## Requisitos de Sistema

Para executar a plataforma em ambiente local, certifique-se de ter instalado:
- **Docker** (v24.0+) & **Docker Compose** (v2.20+)
- **Python** (3.11 ou 3.12) *(apenas para execução local isolada de desenvolvimento do backend)*
- **Node.js** (v20 LTS+) & **npm/pnpm** *(apenas para execução local isolada da Web ou Mobile)*

---

## Configuração Inicial

1. Clone o repositório e acesse o diretório raiz:
   ```bash
   git clone <URL_DO_REPOSITORIO> nexusops
   cd nexusops
   ```

2. Crie o arquivo de configuração `.env` a partir do modelo estruturado:
   ```bash
   cp .env.example .env
   ```
   *(Nota: O arquivo `.env.example` já está pré-configurado com valores seguros para desenvolvimento local com Docker Compose).*

---

## Execução com Docker Compose (Recomendado)

A infraestrutura completa foi projetada em contêineres autossuficientes com verificação de integridade (`health checks`).

1. **Subir toda a infraestrutura:**
   ```bash
   docker compose up -d --build
   ```

2. **Verificar o status e a saúde dos serviços:**
   ```bash
   docker compose ps
   ```
   Todos os contêineres (`postgres`, `redis`, `minio`, `api`, `web`) devem constar como `healthy` ou `running`.

3. **Endpoints de Verificação da API (Health Checks):**
   - Liveness Probe: `http://localhost:8000/api/v1/health`
   - Readiness Probe (Verifica conexão com Postgres, Redis e MinIO): `http://localhost:8000/api/v1/health/ready`

4. **Painéis de Acesso Local:**
   - **API Swagger Documentation:** `http://localhost:8000/docs`
   - **Aplicação Web (Next.js):** `http://localhost:3000`
   - **MinIO Console (Storage):** `http://localhost:9001` *(Usuário/Senha: `nexusops_minio_admin` / `nexusops_minio_secure_pass`)*

5. **Derrubar os serviços:**
   ```bash
   docker compose down
   ```
   *(Para limpar os volumes persistentes, utilize `docker compose down -v`)*.

---

## Execução Isolada de Desenvolvimento (Sem Docker Completo)

Caso deseje rodar a API, Web ou Mobile diretamente na sua máquina local (usando apenas o Postgres, Redis e MinIO via Docker):

### 1. Subir apenas os serviços de infraestrutura:
```bash
docker compose up -d postgres redis minio minio-init
```

### 2. Rodar a API FastAPI localmente (`apps/api`):
```bash
cd apps/api
python -m venv venv
# Windows (PowerShell):
.\venv\Scripts\Activate.ps1
# Linux/macOS:
# source venv/bin/activate

pip install -e .[dev]
alembic upgrade head
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### 3. Rodar o Frontend Web (`apps/web`):
```bash
cd apps/web
npm install
npm run dev
```

### 4. Rodar o Mobile (`apps/mobile`):
```bash
cd apps/mobile
npm install
npx expo start
```

---

## Execução de Testes Automatizados

A suite de testes da API foi desenvolvida em `pytest` garantindo isolamento e verificação de contratos:

### Rodar os testes via Docker Compose:
```bash
docker compose exec api pytest -v
```

### Rodar os testes localmente no ambiente virtual (`apps/api`):
```bash
cd apps/api
pytest -v --cov=app
```

---

## Troubleshooting Inicial

- **Erro de Conexão no `/health/ready` (`minio: unhealthy` ou `postgres: unhealthy`):**
  Aguarde 10 a 15 segundos após a subida dos contêineres. O script de inicialização do MinIO (`minio-init`) precisa de tempo para provisionar o bucket `nexusops-storage`. Verifique os logs com `docker compose logs -f minio-init api`.
- **Portas em Uso (`5432`, `6379`, `8000`, `3000` ou `9000/9001`):**
  Certifique-se de que não há instâncias locais do PostgreSQL ou Redis rodando na máquina host que conflitem com as portas dos contêineres do Docker.
- **Falha de Permissões ou Variáveis Ausentes:**
  Verifique se o arquivo `.env` foi gerado corretamente a partir de `.env.example` no diretório raiz do monorepo.
