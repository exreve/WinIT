#!/bin/bash
# ArgoCD Installation Script
# This script installs ArgoCD using the official installation manifests

set -e

echo "Installing ArgoCD..."

# Create namespace first
kubectl apply -f argocd-namespace.yaml

# Install ArgoCD using official manifests
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

echo "Waiting for ArgoCD to be ready..."
kubectl wait --for=condition=available --timeout=300s deployment/argocd-server -n argocd || true
kubectl wait --for=condition=available --timeout=300s deployment/argocd-repo-server -n argocd || true
kubectl wait --for=condition=available --timeout=300s deployment/argocd-applicationset-controller -n argocd || true

echo "ArgoCD installation completed!"
echo ""
echo "Applying ArgoCD Application manifest..."
kubectl apply -f winit-app.yaml

echo ""
echo "To get the admin password, run:"
echo "kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath=\"{.data.password}\" | base64 -d && echo"
echo ""
echo "To port-forward the ArgoCD server, run:"
echo "kubectl port-forward svc/argocd-server -n argocd 8080:443"
echo ""
echo "ArgoCD will now watch the Git repository and automatically sync changes from the k8s/ directory."

