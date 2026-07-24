# Deploy de staging

## 1. Preparar variáveis

Copie `.env.staging.example` para `.env.staging` e substitua todos os valores iniciados por `replace-with-`. O arquivo real não deve ser versionado.

Gere o `SECRET_KEY` com pelo menos 64 caracteres aleatórios e use credenciais diferentes das usadas em desenvolvimento.

## 2. Validar a configuração

```bash
docker compose --env-file .env.staging -f docker-compose.staging.yml config
```

O comando deve concluir sem avisos de variáveis ausentes.

## 3. Subir staging

```bash
docker compose --env-file .env.staging -f docker-compose.staging.yml up -d --build
```

O serviço `api` aplica as migrations Alembic antes de iniciar o FastAPI. O Nginx expõe a aplicação em `http://localhost:8080`.

## 4. Verificar saúde

```bash
docker compose --env-file .env.staging -f docker-compose.staging.yml ps
curl http://localhost:8080/api/v1/health
curl http://localhost:8080/api/v1/health/ready
```

## 5. Operação

- PostgreSQL, Redis e MinIO não expõem portas diretamente no host.
- PDFs, fotos e assinaturas permanecem no MinIO; o PostgreSQL armazena somente chaves e metadados.
- Backups dos volumes `postgres_data` e `minio_data` devem ser configurados antes do uso com dados reais.
- TLS deve ser terminado no balanceador ou proxy da infraestrutura antes de promover para produção.
