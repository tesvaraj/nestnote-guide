#!/bin/bash

# Test script for local ADK agent service

echo "Testing FindHaven ADK Agent Service"
echo "===================================="
echo ""

# Check if service is running
echo "1. Testing health endpoint..."
curl -s http://localhost:8080/health | python3 -m json.tool
echo ""
echo ""

# Test query endpoint
echo "2. Testing query endpoint (non-streaming)..."
curl -s -X POST http://localhost:8080/query \
  -H "Content-Type: application/json" \
  -d '{
    "message": "I need food",
    "stream": false
  }' | python3 -m json.tool
echo ""
echo ""

# Test with messages
echo "3. Testing with messages array..."
curl -s -X POST http://localhost:8080/query \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"role": "user", "content": "I need a youth shelter"}
    ],
    "stream": false
  }' | python3 -m json.tool
echo ""
echo ""

echo "Tests completed!"

