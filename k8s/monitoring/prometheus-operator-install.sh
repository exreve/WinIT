#!/bin/bash
# Prometheus Operator Installation Script
# This script installs Prometheus Operator using the official manifests

set -e

echo "Installing Prometheus Operator..."

# Create namespace first
kubectl apply -f monitoring-namespace.yaml

# Install Prometheus Operator using official manifests
# Using the latest stable release
kubectl apply -f https://raw.githubusercontent.com/prometheus-operator/prometheus-operator/main/bundle.yaml

echo "Waiting for Prometheus Operator to be ready..."
kubectl wait --for=condition=available --timeout=300s deployment/prometheus-operator -n default || true

echo "Waiting for CRDs to be established..."
kubectl wait --for=condition=established --timeout=60s crd/prometheuses.monitoring.coreos.com || true
kubectl wait --for=condition=established --timeout=60s crd/servicemonitors.monitoring.coreos.com || true
kubectl wait --for=condition=established --timeout=60s crd/prometheusrules.monitoring.coreos.com || true

echo "Prometheus Operator installation completed!"

