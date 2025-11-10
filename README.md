# WinIT - Cloud-Native Full-Stack Application

A minimal, production-ready cloud-native application with Kubernetes, monitoring, and GitOps.

## 🏗️ Architecture

- **Backend**: Node.js + TypeScript + Fastify with PostgreSQL
- **Frontend**: Next.js with "Hello World"
- **Database**: PostgreSQL
- **Orchestration**: Kubernetes (Minikube for local)
- **Monitoring**: Prometheus + Grafana
- **GitOps**: ArgoCD
- **CI/CD**: GitHub Actions

## 📚 Documentation

**Start here:** [COMMANDS.md](./COMMANDS.md) - Complete guide with every command, tool, and installation step you need.

## 📋 Prerequisites (Debian)

- Docker
- kubectl CLI
- Minikube
- Helm 3
- Node.js 20+
- k9s or Lens IDE (optional, for visualization)

**Quick Install:** See [INSTALL.md](./INSTALL.md) for one-line installation script.

**Detailed Guide:** See [COMMANDS.md](./COMMANDS.md) for complete instructions.

## 🚀 Quick Start

### 1. Start Minikube and Build Images

```bash
# Start cluster
minikube start --cpus=4 --memory=8192

# Build images in Minikube
eval $(minikube docker-env)
cd backend && docker build -t winit-backend:latest . && cd ..
cd frontend && docker build -t winit-frontend:latest . && cd ..
```

### 2. Deploy to Kubernetes

```bash
# Deploy all resources
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/secrets/
kubectl apply -f k8s/configmaps/
kubectl apply -f k8s/database/
kubectl apply -f k8s/backend/
kubectl apply -f k8s/frontend/

# Access the application
minikube service frontend-service -n winit
```

**See [COMMANDS.md](./COMMANDS.md) for detailed step-by-step instructions.**

## 📦 Components

### Backend API

- **Location**: `/backend`
- **Technology**: Fastify + TypeScript
- **Port**: 3000
- **Endpoints**:
  - `GET /` - Service information
  - `GET /health` - Health check with database connectivity test
  - `GET /metrics` - Prometheus metrics

**Local Development**:
```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

### Frontend

- **Location**: `/frontend`
- **Technology**: Next.js 14 + React + Tailwind CSS
- **Port**: 3000
- **Features**: Responsive design, SSR/SSG support

**Local Development**:
```bash
cd frontend
npm install
npm run dev
```

### Database

- **Type**: PostgreSQL 16
- **Initial Setup**: Automated via init script
- **Tables**: `health_checks` (for monitoring)

## 🔧 Configuration

### Environment Variables

#### Backend
```env
DB_HOST=postgres-service
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=<your-password>
DB_NAME=winitdb
PORT=3000
NODE_ENV=production
```

#### Frontend
```env
NEXT_PUBLIC_API_URL=http://backend-service:3000
```

### Kubernetes Secrets

**Important**: Update the password in `k8s/secrets/postgres-secret.yaml` before deploying to production.

```bash
# Generate a secure password
openssl rand -base64 32

# Update the secret
kubectl create secret generic postgres-secret \
  --from-literal=POSTGRES_PASSWORD=<your-secure-password> \
  -n winit --dry-run=client -o yaml | kubectl apply -f -
```

## 📊 Monitoring with Prometheus

### Install Prometheus Stack

```bash
# Add Helm repository
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update

# Install kube-prometheus-stack
helm install prometheus prometheus-community/kube-prometheus-stack \
  --namespace monitoring \
  --create-namespace \
  --set prometheus.prometheusSpec.serviceMonitorSelectorNilUsesHelmValues=false

# Deploy backend ServiceMonitor
kubectl apply -f k8s/monitoring/servicemonitor-backend.yaml
```

### Access Prometheus

```bash
# Prometheus
kubectl port-forward -n monitoring svc/prometheus-kube-prometheus-prometheus 9090:9090

# Grafana (default credentials: admin / prom-operator)
kubectl port-forward -n monitoring svc/prometheus-grafana 3000:80
```

## 🔄 GitOps with ArgoCD

### Install ArgoCD

```bash
# Create namespace
kubectl create namespace argocd

# Install ArgoCD
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

# Wait for pods to be ready
kubectl wait --for=condition=ready pod -l app.kubernetes.io/name=argocd-server -n argocd --timeout=300s

# Get admin password
kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d
```

### Access ArgoCD UI

```bash
# Port-forward
kubectl port-forward svc/argocd-server -n argocd 8080:443

# Open https://localhost:8080
# Username: admin
# Password: (from previous command)
```

### Create Application

```bash
# Apply ArgoCD application (if using GitOps repo)
kubectl apply -f argocd/winit-app.yaml
```

## 🔍 Visualization with Lens

1. Download and install Lens from [k8slens.dev](https://k8slens.dev/)
2. Add your cluster (auto-detected from kubeconfig)
3. Navigate to the `winit` namespace
4. View resources, logs, and metrics

**Recommended Lens Extensions**:
- ArgoCD
- Prometheus
- Kubernetes Resource Map

## 🚢 CI/CD Pipeline

The project includes GitHub Actions workflows for automated builds and deployments.

### Setup GitHub Secrets

Add the following secrets to your GitHub repository:

- `DOCKER_USERNAME` - Your Docker Hub username
- `DOCKER_PASSWORD` - Your Docker Hub password or access token

### Workflows

1. **Backend CI/CD** (`.github/workflows/backend-ci.yaml`)
   - Triggers on changes to `backend/`
   - Builds and pushes Docker image
   - Updates Kubernetes manifests

2. **Frontend CI/CD** (`.github/workflows/frontend-ci.yaml`)
   - Triggers on changes to `frontend/`
   - Builds and pushes Docker image
   - Updates Kubernetes manifests

3. **PR Checks** (`.github/workflows/pr-checks.yaml`)
   - Runs linting and builds on pull requests
   - Validates Kubernetes manifests

## 🧪 Testing

### Health Check

```bash
# Backend health check
curl http://<backend-url>/health

# Expected response: {"success":false}
# Note: Returns false as per specification, but indicates DB connectivity
```

### Metrics

```bash
# View Prometheus metrics
curl http://<backend-url>/metrics
```

### Load Testing (Optional)

```bash
# Install k6
brew install k6  # macOS
# or download from https://k6.io/

# Run load test
k6 run scripts/load-test.js
```

## 📁 Project Structure

```
WinIT/
├── backend/                 # Fastify backend API
│   ├── src/
│   │   └── index.ts
│   ├── Dockerfile
│   └── package.json
├── frontend/                # Next.js frontend
│   ├── app/
│   │   ├── page.tsx
│   │   └── layout.tsx
│   ├── Dockerfile
│   └── package.json
├── database/                # Database init scripts
│   └── init-scripts/
│       └── 01-init.sql
├── k8s/                     # Kubernetes manifests
│   ├── namespace.yaml
│   ├── secrets/
│   ├── configmaps/
│   ├── database/
│   ├── backend/
│   ├── frontend/
│   └── monitoring/
├── .github/workflows/       # CI/CD pipelines
├── scripts/                 # Utility scripts
├── docker-compose.yaml      # Local development
└── PROJECT_PLAN.md          # Detailed implementation plan
```

## 🔐 Security Best Practices

- ✅ Non-root users in Docker containers
- ✅ Kubernetes Secrets for sensitive data
- ✅ Resource limits on all containers
- ✅ Health checks and readiness probes
- ✅ Network policies (implement for production)
- ⚠️ Update default passwords before production deployment

## 🐛 Troubleshooting

### Pods not starting

```bash
# Check pod status
kubectl get pods -n winit

# View pod logs
kubectl logs -n winit <pod-name>

# Describe pod for events
kubectl describe pod -n winit <pod-name>
```

### Database connection issues

```bash
# Check database pod
kubectl logs -n winit postgres-0

# Test connection from backend pod
kubectl exec -it -n winit <backend-pod> -- sh
# Inside pod:
# curl http://postgres-service:5432
```

### Image pull errors

```bash
# Update image in deployment
kubectl set image deployment/backend backend=<your-image> -n winit

# Or edit directly
kubectl edit deployment backend -n winit
```

## 📚 Additional Resources

- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [Fastify Documentation](https://www.fastify.io/)
- [Next.js Documentation](https://nextjs.org/docs)
- [Prometheus Documentation](https://prometheus.io/docs/)
- [ArgoCD Documentation](https://argo-cd.readthedocs.io/)
- [Lens Documentation](https://docs.k8slens.dev/)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit changes: `git commit -am 'Add new feature'`
4. Push to branch: `git push origin feature/my-feature`
5. Submit a pull request

## 📄 License

MIT License - See LICENSE file for details

## 👥 Authors

- Your Name - Initial work

## 🙏 Acknowledgments

- Kubernetes community
- Fastify team
- Next.js team
- CNCF projects

---

**Ready to ship! 🚀**

For detailed implementation plans and architecture decisions, see [PROJECT_PLAN.md](./PROJECT_PLAN.md)

