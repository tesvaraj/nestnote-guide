#!/bin/bash

# Deployment script for FindHaven ADK Agent to Google Cloud Run

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}FindHaven ADK Agent Deployment${NC}"
echo "======================================"
echo ""

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo -e "${RED}Error: gcloud CLI is not installed${NC}"
    echo "Install it from: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Check if user is authenticated
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" &> /dev/null; then
    echo -e "${YELLOW}Not authenticated with gcloud. Running gcloud auth login...${NC}"
    gcloud auth login
fi

# Get project ID
PROJECT_ID=$(gcloud config get-value project 2>/dev/null)
if [ -z "$PROJECT_ID" ]; then
    echo -e "${YELLOW}No project ID set. Please set it:${NC}"
    echo "  gcloud config set project YOUR_PROJECT_ID"
    exit 1
fi

echo -e "${GREEN}Project ID: ${PROJECT_ID}${NC}"

# Get API key
if [ -z "$GOOGLE_API_KEY" ]; then
    echo -e "${YELLOW}GOOGLE_API_KEY environment variable not set.${NC}"
    read -p "Enter your Google API key: " GOOGLE_API_KEY
    if [ -z "$GOOGLE_API_KEY" ]; then
        echo -e "${RED}Error: API key is required${NC}"
        exit 1
    fi
fi

# Service configuration
SERVICE_NAME="findhaven-adk-agent"
REGION="us-central1"

echo ""
echo -e "${GREEN}Deployment Configuration:${NC}"
echo "  Service Name: $SERVICE_NAME"
echo "  Region: $REGION"
echo "  Project: $PROJECT_ID"
echo ""

# Enable required APIs
echo -e "${YELLOW}Enabling required APIs...${NC}"
gcloud services enable run.googleapis.com --project=$PROJECT_ID
gcloud services enable cloudbuild.googleapis.com --project=$PROJECT_ID
gcloud services enable containerregistry.googleapis.com --project=$PROJECT_ID 2>/dev/null || true

# Build Docker image and deploy to Cloud Run
echo ""
echo -e "${YELLOW}Building Docker image using Cloud Build...${NC}"

# Use Artifact Registry (preferred) or Container Registry
# Try Artifact Registry first
ARTIFACT_REGISTRY="${REGION}-docker.pkg.dev/${PROJECT_ID}/cloud-run-source-deploy/${SERVICE_NAME}"
IMAGE_NAME="gcr.io/${PROJECT_ID}/${SERVICE_NAME}"

echo -e "${YELLOW}Building image: ${IMAGE_NAME}${NC}"
echo -e "${YELLOW}This may take a few minutes...${NC}"

# Build and push the image using Cloud Build (this will use the Dockerfile)
gcloud builds submit --tag ${IMAGE_NAME} --project $PROJECT_ID .

if [ $? -ne 0 ]; then
    echo -e "${RED}Error: Failed to build Docker image${NC}"
    echo -e "${YELLOW}Trying alternative method...${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}✓ Docker image built successfully${NC}"
echo -e "${YELLOW}Deploying to Cloud Run...${NC}"

# Deploy using the built image
gcloud run deploy $SERVICE_NAME \
  --image ${IMAGE_NAME} \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated \
  --set-env-vars GOOGLE_API_KEY=$GOOGLE_API_KEY \
  --memory 1Gi \
  --cpu 1 \
  --timeout 300 \
  --max-instances 10 \
  --min-instances 0 \
  --cpu-boost \
  --project $PROJECT_ID

# Get service URL
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME \
  --platform managed \
  --region $REGION \
  --format 'value(status.url)' \
  --project $PROJECT_ID)

echo ""
echo -e "${GREEN}✅ Deployment successful!${NC}"
echo ""
echo -e "${GREEN}Service URL: ${SERVICE_URL}${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Test the service:"
echo "   curl $SERVICE_URL/health"
echo ""
echo "2. Set Supabase secret:"
echo "   - Go to Supabase Dashboard → Settings → Secrets"
echo "   - Add ADK_SERVICE_URL = $SERVICE_URL"
echo ""
echo "3. Test the integration in your application"
echo ""

