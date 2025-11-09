"""
Main entry point for the ADK agent service.
This can be used to run the agent locally or deploy it.
"""
import os
import sys

# Add current directory to path to ensure imports work
sys.path.insert(0, os.path.dirname(__file__))

from service import app

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8080))
    debug = os.environ.get('DEBUG', 'False').lower() == 'true'
    
    print(f"Starting FindHaven ADK Agent on port {port}")
    print(f"Debug mode: {debug}")
    
    app.run(host='0.0.0.0', port=port, debug=debug)

