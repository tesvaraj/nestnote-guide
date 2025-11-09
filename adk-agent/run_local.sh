#!/bin/bash

# Local development script for FindHaven ADK Agent

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}FindHaven ADK Agent - Local Development${NC}"
echo "=============================================="
echo ""

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo -e "${YELLOW}Creating virtual environment...${NC}"
    python3 -m venv venv
fi

# Activate virtual environment
echo -e "${YELLOW}Activating virtual environment...${NC}"
source venv/bin/activate

# Install dependencies
echo -e "${YELLOW}Installing dependencies...${NC}"
pip install -q -r requirements.txt

# Check for API key
if [ -z "$GOOGLE_API_KEY" ]; then
    echo -e "${YELLOW}GOOGLE_API_KEY environment variable not set.${NC}"
    read -p "Enter your Google API key: " GOOGLE_API_KEY
    export GOOGLE_API_KEY
    if [ -z "$GOOGLE_API_KEY" ]; then
        echo -e "${RED}Error: API key is required${NC}"
        exit 1
    fi
fi

# Check if resources file exists
if [ ! -f "resources-data.json" ]; then
    echo -e "${RED}Error: resources-data.json not found${NC}"
    echo "Please ensure resources-data.json exists in the adk-agent directory"
    exit 1
fi

echo ""
echo -e "${GREEN}Starting ADK Agent service...${NC}"
echo "Service will be available at: http://localhost:8080"
echo "Press Ctrl+C to stop"
echo ""

# Run the service
python main.py

