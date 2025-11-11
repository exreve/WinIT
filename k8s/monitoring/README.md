# Prometheus Monitoring Setup

This directory contains the Prometheus installation and configuration for monitoring the WinIT application.

## Installation

### Method 1: Using the Installation Script (Recommended)

To install Prometheus on your Kubernetes cluster, run:

```bash
cd k8s/monitoring
./prometheus-install.sh
```

This script will:
1. Create the `monitoring` namespace
2. Install Prometheus Operator (provides CRDs and manages Prometheus) using server-side apply to avoid annotation size limits
3. Create RBAC resources for Prometheus
4. Deploy a Prometheus instance
5. Wait for all components to be ready

**Note:** The script uses `kubectl apply --server-side` to avoid the "annotation too long" error that can occur with large CRDs. This requires Kubernetes 1.18+.

### Method 2: Using Helm (Alternative)

If the script fails, you can install using Helm:

```bash
# Add the Prometheus Community Helm repository
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update

# Install Prometheus Operator
helm install prometheus-operator prometheus-community/kube-prometheus-stack \
  -n monitoring \
  --create-namespace

# Then apply the Prometheus instance and RBAC
kubectl apply -f prometheus-rbac.yaml
kubectl apply -f prometheus.yaml
```

## Components

### Prometheus Operator
- Manages Prometheus instances
- Provides CRDs: `Prometheus`, `ServiceMonitor`, `PrometheusRule`
- Automatically discovers and configures scraping based on ServiceMonitors

### Prometheus Instance
- Scrapes metrics from services defined by ServiceMonitors
- Stores metrics for 30 days
- Allocates 10Gi of storage
- Configured to discover ServiceMonitors with label `app: backend` in the `winit` namespace
- Prometheus Operator automatically creates a service named `prometheus-operated`

### ServiceMonitor
- Located in `servicemonitor-backend.yaml`
- Tells Prometheus to scrape the backend service at `/metrics` endpoint
- Scrapes every 30 seconds

## Accessing Prometheus

### Via Port-Forward
```bash
kubectl port-forward svc/prometheus-operated -n monitoring 9090:9090
```

Then open `http://localhost:9090` in your browser.

### Via Cloudflare Tunnel
If you have Cloudflare tunnel configured, you can expose Prometheus through it.

## Verifying Setup

### Check Prometheus Pods
```bash
kubectl get pods -n monitoring
```

### Check ServiceMonitors
```bash
kubectl get servicemonitors -n winit
```

### Check Prometheus Targets
1. Access Prometheus UI
2. Go to Status → Targets
3. You should see `backend-metrics` target with status "UP"

### Query Metrics
In Prometheus UI, try these queries:
- `http_requests_total` - Total HTTP requests
- `service_info` - Service information
- `up{job="backend-metrics"}` - Check if backend is being scraped

## Metrics Available

The backend exposes the following metrics at `/metrics`:
- `http_requests_total` - Counter of HTTP requests by method and endpoint
- `service_info` - Gauge with service version and name

## Troubleshooting

### Prometheus not scraping backend
1. Check if ServiceMonitor exists: `kubectl get servicemonitor -n winit`
2. Check Prometheus logs: `kubectl logs -n monitoring -l app=prometheus`
3. Verify backend service has correct labels: `kubectl get svc -n winit backend-service -o yaml`
4. Check Prometheus configuration: In Prometheus UI, go to Status → Configuration

### Prometheus pod not starting
1. Check pod status: `kubectl describe pod -n monitoring -l app=prometheus`
2. Check PVC: `kubectl get pvc -n monitoring`
3. Check resource limits: `kubectl top pod -n monitoring`

## Updating Prometheus

To update Prometheus configuration, edit `prometheus.yaml` and apply:
```bash
kubectl apply -f prometheus.yaml
```

The Prometheus Operator will automatically update the Prometheus instance.

