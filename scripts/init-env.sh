#!/usr/bin/env bash
set -e

echo "=== NexusOps Environment Setup ==="
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

if [ -f "$ROOT_DIR/.env" ]; then
  echo "[OK] Arquivo .env já existe na raiz do monorepo."
else
  echo "[INFO] Copiando .env.example para .env..."
  cp "$ROOT_DIR/.env.example" "$ROOT_DIR/.env"
  echo "[SUCCESS] Arquivo .env criado com sucesso na raiz."
fi

echo "Para subir toda a infraestrutura localmente, execute:"
echo "  docker compose up -d --build"
echo "=================================="
