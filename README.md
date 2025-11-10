# WinIT – Local Development & Kubernetes Deployment (With Minikube and Lens)

## Run Locally

### Prerequisites

- Docker
- Node.js 20+
- (optional) PostgreSQL instance (local or via Docker Compose)

### 1. Start PostgreSQL (Optional, for local backend testing)

**With Docker Compose (recommended):**
```bash
docker-compose up -d
```

**Or manually:**
```bash
docker run -d \
  --name winit-postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=winitdb \
  -p 5432:5432 \
  postgres:16-alpine
```

### 2. Start the Backend

```bash
cd backend
npm install
cp .env.example .env
npm run dev
# Runs on http://localhost:3000
```

### 3. Start the Frontend

```bash
cd frontend
npm install
npm run dev
# Runs on http://localhost:3000 (see .env or package.json for API URL)
```

---

## Run On Kubernetes With Minikube

### Prerequisites

- [Minikube](https://minikube.sigs.k8s.io/)
- [kubectl](https://kubernetes.io/docs/tasks/tools/)
- Docker (for building/pushing images)
- (Optional) [Lens](https://k8slens.dev/) (for visualization/management)

### 1. Start Minikube

```bash
minikube start --cpus=4 --memory=8192
```

### 2. Build Docker Images Inside Minikube

Make sure you use Minikube's Docker environment for image building, so that your cluster sees your local images:

```bash
eval $(minikube docker-env)
cd backend && docker build -t winit-backend:latest . && cd ..
cd frontend && docker build -t winit-frontend:latest . && cd ..
```

### 3. Deploy Kubernetes Resources

```bash
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/secrets/
kubectl apply -f k8s/configmaps/
kubectl apply -f k8s/database/
kubectl apply -f k8s/backend/
kubectl apply -f k8s/frontend/
```

### 4. Access the App

```bash
minikube service frontend-service -n winit
# This will open the frontend in your browser.
```

---

## Visualize and Manage the Cluster in Lens

1. [Download Lens](https://k8slens.dev/) and install it.
2. Add your Minikube cluster to Lens (it is detected automatically if you have kubectl context set).
3. Open Lens, select your Minikube cluster, and you can:
   - View deployments, pods, and logs in the winit namespace.
   - See events, resource usage, exec into pods, port-forwarding, and more.
   - Use the provided Lens UI to monitor, inspect, and debug your Kubernetes resources visually.

---

For more detailed and advanced workflow instructions, see [COMMANDS.md](./COMMANDS.md).
