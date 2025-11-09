#!/usr/bin/env python3
"""
Test script for streaming queries to the ADK agent service
Usage: python test_streaming.py [SERVICE_URL]
"""

import sys
import json
import requests
import os

def test_streaming_query(service_url, message="I need food assistance"):
    """Test a streaming query to the ADK agent"""
    print(f"Testing streaming query to: {service_url}")
    print(f"Message: {message}")
    print("=" * 60)
    print()
    
    try:
        response = requests.post(
            f"{service_url}/query",
            json={
                "message": message,
                "stream": True
            },
            headers={"Content-Type": "application/json"},
            stream=True
        )
        
        response.raise_for_status()
        
        print("Streaming response:")
        print("-" * 60)
        
        for line in response.iter_lines():
            if line:
                line_str = line.decode('utf-8')
                if line_str.startswith('data: '):
                    data_str = line_str[6:]
                    if data_str == '[DONE]':
                        print("\n[DONE]")
                        break
                    try:
                        data = json.loads(data_str)
                        if 'choices' in data:
                            choice = data['choices'][0]
                            if 'delta' in choice:
                                delta = choice['delta']
                                if 'content' in delta:
                                    print(delta['content'], end='', flush=True)
                                elif 'recommendations' in delta:
                                    print("\n\n[RECOMMENDATIONS]")
                                    for rec in delta['recommendations']:
                                        print(f"  - {rec.get('name')}: {rec.get('address')}")
                                    print()
                    except json.JSONDecodeError:
                        pass
        
        print("\n" + "-" * 60)
        print("Stream completed!")
        
    except requests.exceptions.RequestException as e:
        print(f"Error: {e}")
        return False
    
    return True

def test_non_streaming_query(service_url, message="I need food assistance"):
    """Test a non-streaming query to the ADK agent"""
    print(f"Testing non-streaming query to: {service_url}")
    print(f"Message: {message}")
    print("=" * 60)
    print()
    
    try:
        response = requests.post(
            f"{service_url}/query",
            json={
                "message": message,
                "stream": False
            },
            headers={"Content-Type": "application/json"}
        )
        
        response.raise_for_status()
        data = response.json()
        
        print("Response:")
        print("-" * 60)
        print(json.dumps(data, indent=2))
        print("-" * 60)
        
        return True
        
    except requests.exceptions.RequestException as e:
        print(f"Error: {e}")
        if hasattr(e.response, 'text'):
            print(f"Response: {e.response.text}")
        return False

if __name__ == "__main__":
    # Get service URL from argument or environment
    if len(sys.argv) > 1:
        service_url = sys.argv[1]
    else:
        service_url = os.environ.get('ADK_SERVICE_URL')
        if not service_url:
            # Try to get from gcloud
            import subprocess
            try:
                result = subprocess.run(
                    ['gcloud', 'run', 'services', 'describe', 'findhaven-adk-agent',
                     '--platform', 'managed', '--region', 'us-central1',
                     '--format', 'value(status.url)'],
                    capture_output=True,
                    text=True,
                    check=True
                )
                service_url = result.stdout.strip()
            except:
                print("Error: Please provide service URL as argument or set ADK_SERVICE_URL")
                print("Usage: python test_streaming.py <SERVICE_URL>")
                sys.exit(1)
    
    if not service_url:
        print("Error: Service URL is required")
        print("Usage: python test_streaming.py <SERVICE_URL>")
        sys.exit(1)
    
    # Remove trailing slash
    service_url = service_url.rstrip('/')
    
    print(f"Service URL: {service_url}")
    print()
    
    # Test health endpoint
    print("1. Testing health endpoint...")
    try:
        response = requests.get(f"{service_url}/health")
        response.raise_for_status()
        print("✓ Health check passed")
        print(json.dumps(response.json(), indent=2))
    except Exception as e:
        print(f"✗ Health check failed: {e}")
    print()
    
    # Test non-streaming query
    print("2. Testing non-streaming query...")
    test_non_streaming_query(service_url, "I need food assistance")
    print()
    
    # Test streaming query
    print("3. Testing streaming query...")
    test_streaming_query(service_url, "I need a youth shelter")
    print()

