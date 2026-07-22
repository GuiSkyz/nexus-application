#!/bin/sh
set -e

echo "=== NexusOps MinIO Bucket Initialization ==="
echo "Waiting for MinIO server to be up ($MINIO_ENDPOINT)..."

# Attempt to connect to MinIO with retry mechanism
until /usr/bin/mc alias set myminio http://$MINIO_ENDPOINT $MINIO_ROOT_USER $MINIO_ROOT_PASSWORD; do
  echo "...waiting for MinIO to respond..."
  sleep 2
done

echo "MinIO server connected. Verifying/Creating bucket: $MINIO_DEFAULT_BUCKET"
/usr/bin/mc mb myminio/$MINIO_DEFAULT_BUCKET --ignore-existing

# Set download policies or metadata if needed (private by default for secure access via API)
echo "Bucket '$MINIO_DEFAULT_BUCKET' initialized successfully."
exit 0
