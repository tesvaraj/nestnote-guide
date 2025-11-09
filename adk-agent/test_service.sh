#!/bin/bash

# Test script for ADK agent service
# Usage: ./test_service.sh [SERVICE_URL]
# If SERVICE_URL is not provided, it will try to get it from gcloud

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Get service URL
if [ -z "$1" ]; then
    echo -e "${YELLOW}Getting service URL from gcloud...${NC}"
    SERVICE_URL=$(gcloud run services describe findhaven-adk-agent \
        --platform managed \
        --region us-central1 \
        --format 'value(status.url)' 2>/dev/null)
    
    if [ -z "$SERVICE_URL" ]; then
        echo -e "${RED}Error: Could not get service URL. Please provide it as an argument:${NC}"
        echo "  ./test_service.sh https://your-service-url"
        exit 1
    fi
else
    SERVICE_URL="$1"
fi

echo -e "${GREEN}Testing ADK Agent Service at: ${SERVICE_URL}${NC}"
echo "=========================================="
echo ""

# Test 1: Health Check
echo -e "${YELLOW}1. Testing Health Endpoint:${NC}"
echo "GET ${SERVICE_URL}/health"
echo ""
HEALTH_RESPONSE=$(curl -s "${SERVICE_URL}/health")
echo "$HEALTH_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$HEALTH_RESPONSE"
echo ""
echo ""

# Test 2: Root Endpoint
echo -e "${YELLOW}2. Testing Root Endpoint:${NC}"
echo "GET ${SERVICE_URL}/"
echo ""
ROOT_RESPONSE=$(curl -s "${SERVICE_URL}/")
echo "$ROOT_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$ROOT_RESPONSE"
echo ""
echo ""

# Test 3: Simple Query (Non-streaming)
echo -e "${YELLOW}3. Testing Query Endpoint (Non-streaming):${NC}"
echo "POST ${SERVICE_URL}/query"
echo "Body: {\"message\": \"Hello, I need help finding food\", \"stream\": false}"
echo ""
QUERY_RESPONSE=$(curl -s -X POST "${SERVICE_URL}/query" \
    -H "Content-Type: application/json" \
    -d '{
        "message": "Hello, I need help finding food",
        "stream": false
    }')
echo "$QUERY_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$QUERY_RESPONSE"
echo ""
echo ""

# Test 4: Query with Messages Array (Non-streaming)
echo -e "${YELLOW}4. Testing Query with Messages Array (Non-streaming):${NC}"
echo "POST ${SERVICE_URL}/query"
echo "Body: {\"messages\": [{\"role\": \"user\", \"content\": \"I need a youth shelter\"}], \"stream\": false}"
echo ""
MESSAGES_RESPONSE=$(curl -s -X POST "${SERVICE_URL}/query" \
    -H "Content-Type: application/json" \
    -d '{
        "messages": [
            {"role": "user", "content": "I need a youth shelter"}
        ],
        "stream": false
    }')
echo "$MESSAGES_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$MESSAGES_RESPONSE"
echo ""
echo ""

# Test 5: Streaming Query
echo -e "${YELLOW}5. Testing Streaming Query:${NC}"
echo "POST ${SERVICE_URL}/query"
echo "Body: {\"message\": \"I need food assistance\", \"stream\": true}"
echo ""
echo "Streaming response (first 20 lines):"
curl -s -X POST "${SERVICE_URL}/query" \
    -H "Content-Type: application/json" \
    -d '{
        "message": "I need food assistance",
        "stream": true
    }' | head -20
echo ""
echo ""

echo -e "${GREEN}✅ Tests completed!${NC}"
echo ""
echo -e "${YELLOW}To test streaming queries interactively, use:${NC}"
echo "curl -N -X POST '${SERVICE_URL}/query' \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -d '{\"message\": \"I need help\", \"stream\": true}'"

