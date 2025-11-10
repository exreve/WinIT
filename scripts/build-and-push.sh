#!/bin/bash

set -e  # Exit on error

echo "=== Building and Pushing Docker Images ==="
echo ""

# Backend
echo "📦 Building backend..."
cd backend
docker build -t exreve/winit-backend:latest .
docker push exreve/winit-backend:latest
cd ..

echo ""

# Frontend
echo "📦 Building frontend..."
cd frontend
docker build -t exreve/winit-frontend:latest .
docker push exreve/winit-frontend:latest
cd ..

echo ""
echo "✅ Done! Images pushed:"
echo "  - exreve/winit-backend:latest"
echo "  - exreve/winit-frontend:latest"

