#!/bin/bash

# Variables
IMAGE_NAME="xesuspb/picketball-racketplanner-frontend:latest"

# Construir y hacer push multi-arquitectura
docker buildx build --platform linux/amd64 \
  -t $IMAGE_NAME \
  --push \
  ../.

echo "Imagen frontend construida y enviada como $IMAGE_NAME"