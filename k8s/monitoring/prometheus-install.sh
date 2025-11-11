#!/bin/bash
# Complete Prometheus Installation Script
# This script installs Prometheus Operator and Prometheus instance

set -e

echo "Installing Prometheus..."

# Step 1: Create namespace
echo "Creating monitoring namespace..."
kubectl apply -f monitoring-namespace.yaml

# Step 2: Install Prometheus Operator
echo "Installing Prometheus Operator..."
echo "Using server-side apply to avoid annotation size limit issues..."

# Try server-side apply first (recommended for Kubernetes 1.18+)
if kubectl apply --server-side -f https://raw.githubusercontent.com/prometheus-operator/prometheus-operator/main/bundle.yaml 2>/dev/null; then
    echo "Successfully installed using server-side apply"
else
    echo "Server-side apply not available or failed, trying stable release v0.68.0..."
    # Fallback to a specific stable release version
    if kubectl apply --server-side -f https://raw.githubusercontent.com/prometheus-operator/prometheus-operator/v0.68.0/bundle.yaml 2>/dev/null; then
        echo "Successfully installed v0.68.0 using server-side apply"
    else
        echo "Trying regular apply with v0.68.0..."
        kubectl apply -f https://raw.githubusercontent.com/prometheus-operator/prometheus-operator/v0.68.0/bundle.yaml || {
            echo "ERROR: Failed to install Prometheus Operator"
            echo "You may need to install it manually or use Helm:"
            echo "  helm repo add prometheus-community https://prometheus-community.github.io/helm-charts"
            echo "  helm repo update"
            echo "  helm install prometheus-operator prometheus-community/kube-prometheus-stack -n monitoring --create-namespace"
            exit 1
        }
    fi
fi

echo "Waiting for Prometheus Operator to be ready..."
kubectl wait --for=condition=available --timeout=300s deployment/prometheus-operator -n default || true

echo "Waiting for CRDs to be established (this may take a few minutes)..."
# Wait for all Prometheus Operator CRDs to be established
for crd in prometheuses servicemonitors prometheusrules podmonitors alertmanagers alertmanagerconfigs probes scrapeconfigs thanosrulers; do
    echo "Waiting for CRD: monitoring.coreos.com/${crd}..."
    kubectl wait --for=condition=established --timeout=180s "crd/${crd}.monitoring.coreos.com" 2>/dev/null || {
        echo "Warning: CRD ${crd}.monitoring.coreos.com may not be ready yet, continuing..."
    }
done

echo "Giving CRDs additional time to fully register..."
sleep 15

# Step 3: Create RBAC
echo "Creating RBAC for Prometheus..."
kubectl apply -f prometheus-rbac.yaml

# Step 4: Create Prometheus instance
echo "Creating Prometheus instance..."
# Try with validation first, if it times out, retry without validation
if ! kubectl apply -f prometheus.yaml 2>&1 | tee /tmp/prometheus-apply.log; then
    echo "Apply with validation failed, retrying without validation..."
    sleep 5
    kubectl apply --validate=false -f prometheus.yaml || {
        echo "ERROR: Failed to create Prometheus instance"
        echo "Check if CRDs are ready: kubectl get crd | grep monitoring.coreos.com"
        exit 1
    }
fi

# Note: Prometheus Operator automatically creates a service named "prometheus-operated"
# We'll use that service to access Prometheus

# Step 5: Wait for Prometheus to be ready
echo "Waiting for Prometheus to be ready..."
sleep 10
kubectl wait --for=condition=available --timeout=300s statefulset/prometheus-prometheus -n monitoring || true

echo ""
echo "Prometheus installation completed!"
echo ""
echo "To access Prometheus UI, run:"
echo "kubectl port-forward svc/prometheus-operated -n monitoring 9090:9090"
echo ""
echo "Then open http://localhost:9090 in your browser"
echo ""
echo "To check if Prometheus is scraping your backend, check the 'Targets' page in Prometheus UI"
echo "or run: kubectl get servicemonitors -n winit"

