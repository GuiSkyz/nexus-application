# Execução com Docker

O NexusOps usa uma única configuração:

```text
docker-compose.yml
.env
```

O arquivo `docker-compose.yml` define a estrutura dos serviços. O `.env` define
o ambiente e as credenciais da máquina atual. O Docker Compose carrega `.env`
automaticamente, portanto não é necessário informar `--env-file` nem `-f`.

## Preparação

Crie o arquivo local uma única vez:

```bash
cp .env.example .env
```

O `.env` não é versionado. Cada máquina possui o seu:

- desenvolvimento usa `ENVIRONMENT=development` e `DEBUG=true`;
- staging usa `ENVIRONMENT=staging` e `DEBUG=false`;
- produção usa `ENVIRONMENT=production` e `DEBUG=false`.

Antes de usar staging ou produção, substitua `SECRET_KEY`, `POSTGRES_PASSWORD`,
`REDIS_PASSWORD` e `MINIO_ROOT_PASSWORD` por valores fortes e exclusivos.
Produção rejeita `SECRET_KEY` curta, `DEBUG=true` e `CORS_ORIGINS=*`.

## Comandos

Validar:

```bash
docker compose config --quiet
```

Construir e subir:

```bash
docker compose up -d --build
```

Verificar:

```bash
docker compose ps
docker compose logs --tail=100 api nginx
curl http://127.0.0.1:8080/api/v1/health
curl http://127.0.0.1:8080/api/v1/health/ready
```

Atualizar:

```bash
docker compose up -d --build
```

Encerrar sem apagar dados:

```bash
docker compose down
```

Não use `docker compose down -v` em staging ou produção, pois esse comando
remove os volumes persistentes.

## Exposição HTTP

Por padrão, o Nginx escuta em `127.0.0.1:8080`. Em produção, mantenha essa
configuração atrás de um proxy reverso ou balanceador com TLS.

PostgreSQL, Redis, MinIO, API e Web não publicam portas no host. A comunicação
entre eles ocorre somente pela rede interna do Compose.
