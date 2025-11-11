# ArgoCD Setup

This directory contains the ArgoCD installation and configuration for the WinIT project.

## Installation

To install ArgoCD on your Kubernetes cluster, run:

```bash
cd k8s/argocd
./argocd-install.sh
```

This script will:
1. Create the `argocd` namespace
2. Install ArgoCD using the official installation manifests
3. Wait for ArgoCD components to be ready
4. Apply the WinIT Application manifest

## ArgoCD Application Configuration

The `winit-app.yaml` file configures ArgoCD to:
- Watch the Git repository: `https://github.com/exreve/WinIT.git`
- Monitor the `main` branch
- Watch the `k8s/` directory for Kubernetes manifests
- Automatically sync changes when detected (auto-sync enabled)
- Deploy to the `winit` namespace
- Enable self-healing (automatically corrects drift)
- Enable pruning (removes resources deleted from Git)

## Accessing ArgoCD UI

After installation, you can access the ArgoCD UI by port-forwarding:

```bash
kubectl port-forward svc/argocd-server -n argocd 8080:443
```

Then open `https://localhost:8080` in your browser.

The default username is `admin`. To get the password:

```bash
kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d && echo
```

## How It Works

1. **GitHub Actions** builds and publishes Docker images to the registry
2. **GitHub Actions** updates the Kubernetes manifests with new image tags and commits them to Git
3. **ArgoCD** detects the changes in the Git repository
4. **ArgoCD** automatically applies the updated manifests to the cluster

This separation ensures:
- No conflicts between GitHub Actions and ArgoCD
- Git is the single source of truth
- Automatic deployment when manifests change
- Self-healing capabilities if cluster state drifts from Git

