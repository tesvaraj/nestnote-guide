#!/bin/bash

# Diagnostic script to check ADK agent service

SERVICE_URL=${1:-"http://localhost:8080"}

echo "Checking ADK Agent Service at: $SERVICE_URL"
echo "=========================================="
echo ""

# Check health endpoint
echo "1. Health Check:"
curl -s "$SERVICE_URL/health" | python3 -m json.tool 2>/dev/null || echo "Failed to connect"
echo ""
echo ""

# Check root endpoint
echo "2. Root Endpoint:"
curl -s "$SERVICE_URL/" | python3 -m json.tool 2>/dev/null || echo "Failed to connect"
echo ""
echo ""

# Test query endpoint
echo "3. Query Endpoint Test:"
curl -s -X POST "$SERVICE_URL/query" \
  -H "Content-Type: application/json" \
  -d '{"message": "test", "stream": false}' \
  | python3 -m json.tool 2>/dev/null || echo "Failed to connect"
echo ""

