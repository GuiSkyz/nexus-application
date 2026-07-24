# Deploy de produção

O ambiente de produção usa `docker-compose.production.yml`. Ele expõe somente o
Nginx no host; PostgreSQL, Redis, MinIO, API e Web permanecem na rede interna do
Compose.

## 1. Preparar variáveis

Copie `.env.production.example` para `.env.production` e substitua todos os
valores iniciados por `replace-with-`.

```bash
cp .env.production.example .env.production
```

Use um `SECRET_KEY` aleatório com pelo menos 64 caracteres e senhas exclusivas
para PostgreSQL, Redis e MinIO. O arquivo `.env.production` é ignorado pelo Git.

Por padrão, o Nginx escuta somente em `127.0.0.1:8080`, adequado para uso atrás
de um proxy reverso ou balanceador com TLS. Ajuste `HTTP_BIND_ADDRESS` somente
se a infraestrutura exigir exposição direta.

## 2. Validar a configuração

```bash
docker compose --env-file .env.production -f docker-compose.production.yml config --quiet
```

O comando deve terminar sem erros de variáveis ausentes.

## 3. Construir e subir

```bash
docker compose --env-file .env.production -f docker-compose.production.yml up -d --build
```

A API executa as migrations Alembic antes de iniciar. O bucket do MinIO também
é criado automaticamente.

## 4. Verificar

```bash
docker compose --env-file .env.production -f docker-compose.production.yml ps
docker compose --env-file .env.production -f docker-compose.production.yml logs --tail=100 api nginx
curl http://127.0.0.1:8080/api/v1/health
curl http://127.0.0.1:8080/api/v1/health/ready
```

Todos os serviços permanentes devem aparecer como `healthy`. O serviço
`minio-init` deve terminar com código `0`.

## 5. Atualizar

Antes de uma atualização, faça backup dos volumes do PostgreSQL e do MinIO.
Depois execute:

```bash
docker compose --env-file .env.production -f docker-compose.production.yml up -d --build
```

Para encerrar sem apagar os dados:

```bash
docker compose --env-file .env.production -f docker-compose.production.yml down
```

Não use `down -v` em produção, pois esse comando remove os volumes persistentes.

## Requisitos externos

- Termine TLS no proxy reverso ou balanceador que encaminha para
  `127.0.0.1:8080`.
- Configure backups periódicos dos volumes `postgres_data` e `minio_data`.
- Restrinja firewall e acesso SSH ao servidor.
- Monitore espaço em disco, saúde dos containers e expiração do certificado.
