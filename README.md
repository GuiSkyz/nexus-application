# NexusOps — Operational Compliance Platform

O **NexusOps** é uma plataforma de conformidade operacional para provedores de
internet. A aplicação reúne inspeções, checklists, Análises Preliminares de
Risco (APR), evidências fotográficas, assinaturas digitais e operação
offline-first.

## Requisitos

Para executar a plataforma completa:

- Docker 24 ou superior;
- Docker Compose 2.20 ou superior.

Python 3.11 e Node.js 20 são necessários somente para desenvolvimento direto,
fora dos containers.

## Configuração

O projeto usa apenas:

```text
docker-compose.yml
.env
```

Crie o `.env` local:

```bash
cp .env.example .env
```

O Docker Compose carrega esse arquivo automaticamente. Não use nomes como
`.env.production` ou `.env.staging`; cada máquina mantém seu próprio `.env`.

Para produção, configure no mínimo:

```dotenv
ENVIRONMENT=production
DEBUG=false
SECRET_KEY=<segredo-aleatorio-com-pelo-menos-64-caracteres>
CORS_ORIGINS=https://seu-dominio.example.com
POSTGRES_PASSWORD=<senha-forte>
REDIS_PASSWORD=<senha-forte>
MINIO_ROOT_PASSWORD=<senha-forte>
```

O `.env` contém segredos e nunca deve ser versionado.

## Docker

Validar a configuração:

```bash
docker compose config --quiet
```

Construir e subir:

```bash
docker compose up -d --build
```

Verificar os serviços:

```bash
docker compose ps
docker compose logs --tail=100 api nginx
```

Encerrar sem apagar os dados:

```bash
docker compose down
```

Não execute `docker compose down -v` em staging ou produção. A opção `-v`
remove os volumes persistentes.

## Acesso

Por padrão, o Nginx publica a aplicação somente em `127.0.0.1:8080`:

- Aplicação Web: `http://127.0.0.1:8080`;
- Swagger: `http://127.0.0.1:8080/docs`;
- Health: `http://127.0.0.1:8080/api/v1/health`;
- Readiness: `http://127.0.0.1:8080/api/v1/health/ready`.

PostgreSQL, Redis, MinIO, API e Web permanecem na rede interna do Compose. Em
produção, um proxy reverso ou balanceador deve fornecer TLS e encaminhar para
`127.0.0.1:8080`.

## Ambientes

A estrutura dos containers é sempre a mesma. Somente os valores do `.env`
mudam:

- desenvolvimento: `ENVIRONMENT=development` e `DEBUG=true`;
- staging: `ENVIRONMENT=staging` e `DEBUG=false`;
- produção: `ENVIRONMENT=production` e `DEBUG=false`.

Consulte [docs/deployment/docker.md](docs/deployment/docker.md) para o fluxo
operacional completo.

## Desenvolvimento direto

API:

```bash
cd apps/api
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -e .[dev]
pytest -v --cov=app
```

Web:

```bash
cd apps/web
npm install
npm run dev
```

Mobile:

```bash
cd apps/mobile
npm install
npx expo start
```
