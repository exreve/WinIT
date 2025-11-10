#!/bin/bash

set -e

echo "=== Updating Kubernetes Deployments ==="
echo ""

export KUBECONFIG=~/.kube/config-vps

# Restart deployments to pull latest images
echo "🔄 Restarting backend deployment..."
kubectl rollout restart deployment/backend -n winit

echo "🔄 Restarting frontend deployment..."
kubectl rollout restart deployment/frontend -n winit

echo ""
echo "⏳ Waiting for rollouts to complete..."
kubectl rollout status deployment/backend -n winit --timeout=120s
kubectl rollout status deployment/frontend -n winit --timeout=120s

echo ""
echo "✅ Deployments updated!"
echo ""
echo "Current pod images:"
kubectl get pods -n winit -l app=backend -o jsonpath='{range .items[*]}{.metadata.name}{": "}{.spec.containers[0].image}{"\n"}{end}'
kubectl get pods -n winit -l app=frontend -o jsonpath='{range .items[*]}{.metadata.name}{": "}{.spec.containers[0].image}{"\n"}{end}'

