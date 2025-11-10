#!/bin/bash
# Script to generate Kubernetes secrets from environment variables
# Usage: 
#   POSTGRES_PASSWORD=mypassword ./scripts/generate-secrets.sh
#   Or: ./scripts/generate-secrets.sh  (will generate random password)

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
SECRETS_DIR="$PROJECT_ROOT/k8s/secrets"
TEMPLATE_FILE="$SECRETS_DIR/postgres-secret.yaml.template"
OUTPUT_FILE="$SECRETS_DIR/postgres-secret.yaml"

# Check if required environment variables are set
if [ -z "$POSTGRES_PASSWORD" ]; then
    echo "⚠️  POSTGRES_PASSWORD not set. Generating a random password..."
    POSTGRES_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)
    echo "Generated password: $POSTGRES_PASSWORD"
    echo "💡 Save this password securely! You can set POSTGRES_PASSWORD env var to use a custom password."
fi

# Set defaults if not provided
export POSTGRES_USER=${POSTGRES_USER:-postgres}
export POSTGRES_DB=${POSTGRES_DB:-winitdb}
export DB_USER=${DB_USER:-$POSTGRES_USER}
export DB_PASSWORD=$POSTGRES_PASSWORD
export DB_NAME=${DB_NAME:-$POSTGRES_DB}

# Create secrets directory if it doesn't exist
mkdir -p "$SECRETS_DIR"

# Check if template exists
if [ ! -f "$TEMPLATE_FILE" ]; then
    echo "❌ Template file not found: $TEMPLATE_FILE"
    exit 1
fi

# Check if envsubst is available
if ! command -v envsubst &> /dev/null; then
    echo "❌ envsubst not found. Install gettext package:"
    echo "   Ubuntu/Debian: sudo apt-get install gettext-base"
    echo "   macOS: brew install gettext"
    exit 1
fi

# Generate secret file from template
echo "📝 Generating secrets file..."
envsubst < "$TEMPLATE_FILE" > "$OUTPUT_FILE"

echo "✅ Secrets file generated: $OUTPUT_FILE"
echo ""
echo "🔐 Generated secrets:"
echo "   POSTGRES_USER: $POSTGRES_USER"
echo "   POSTGRES_PASSWORD: $POSTGRES_PASSWORD"
echo "   POSTGRES_DB: $POSTGRES_DB"
echo ""
echo "⚠️  IMPORTANT:"
echo "   1. The generated file contains real passwords"
echo "   2. Make sure k8s/secrets/*.yaml is in .gitignore ✅"
echo "   3. Never commit this file to version control!"
echo ""
echo "🚀 To apply secrets to Kubernetes:"
echo "   kubectl apply -f $OUTPUT_FILE"


