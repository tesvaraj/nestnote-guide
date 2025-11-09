#!/bin/bash
# Startup script to ensure service starts properly

set -e  # Exit on error

echo "=========================================="
echo "Starting FindHaven ADK Agent..."
echo "=========================================="
echo "Python version: $(python --version)"
echo "Working directory: $(pwd)"
echo "PORT: ${PORT:-8080}"
echo ""

echo "Files in directory:"
ls -la
echo ""

echo "Checking Python path..."
python -c "import sys; print('Python path:', sys.path)"
echo ""

echo "Checking imports..."
python -c "
import sys
import os
sys.path.insert(0, os.path.dirname(__file__) if '__file__' in dir() else '.')
print('Python path:', sys.path)
try:
    print('Importing service...')
    from service import app
    print('✓ Service imported successfully')
    print('✓ Flask app created:', app)
except Exception as e:
    print('✗ Service import failed:', e)
    import traceback
    traceback.print_exc()
    sys.exit(1)
"

echo ""
echo "=========================================="
echo "Starting Gunicorn..."
echo "=========================================="
exec gunicorn \
    -w 2 \
    -b 0.0.0.0:${PORT:-8080} \
    --timeout 300 \
    --worker-class sync \
    --worker-connections 1000 \
    --max-requests 1000 \
    --max-requests-jitter 50 \
    --log-level info \
    --access-logfile - \
    --error-logfile - \
    --capture-output \
    service:app

