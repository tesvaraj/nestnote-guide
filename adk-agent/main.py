# Google ADK Agent for FindHaven
# Deploy this to Google Cloud Vertex AI Agent Engine Runtime
# 
# Setup Instructions:
# 1. Enable Vertex AI API in Google Cloud Console
# 2. Install dependencies: pip install google-genai flask
# 3. Set up authentication: gcloud auth application-default login
# 4. Deploy to Cloud Run or App Engine
# 5. Update ADK_SERVICE_URL secret in Lovable with the deployed URL

import json
import os
from typing import List, Dict, Any
from flask import Flask, request, Response, stream_with_context
from google import genai
from google.genai import types

app = Flask(__name__)

# Load resources data
RESOURCES_FILE = "resources-data.json"
RESOURCES_DATA = []

def load_resources() -> List[Dict]:
    """Load resources from JSON file"""
    global RESOURCES_DATA
    try:
        with open(RESOURCES_FILE, 'r') as f:
            RESOURCES_DATA = json.load(f)
            print(f"✅ Loaded {len(RESOURCES_DATA)} service categories from JSON")
    except FileNotFoundError:
        print(f"⚠️ Warning: {RESOURCES_FILE} not found. Resource search will return empty results.")
        RESOURCES_DATA = []
    except Exception as e:
        print(f"❌ Error loading resources: {e}")
        RESOURCES_DATA = []

# Try to load resources at startup
load_resources()

# Custom Tool: Search Local Resources
def search_local_resources(service_category: str, user_filters: Dict[str, bool] = None) -> List[Dict]:
    """
    Search resources-data.json for matching organizations
    
    Args:
        service_category: Category to search (e.g., "Homeless Youth Shelters", "Soup Kitchens")
        user_filters: Dict of demographic filters (services_youth, services_lgbtq, etc.)
    
    Returns:
        List of matching organizations with scores
    """
    user_filters = user_filters or {}
    
    # Find the matching category
    category = next((cat for cat in RESOURCES_DATA if cat['service_name'] == service_category), None)
    
    if not category:
        return []
    
    # Filter organizations
    matched_orgs = category['organizations']
    
    # Apply demographic filters
    if user_filters:
        matched_orgs = [
            org for org in matched_orgs
            if all(org.get(key, False) == value for key, value in user_filters.items() if value is True)
        ]
    
    # Score organizations
    scored_orgs = []
    for org in matched_orgs:
        score = 0
        matched_services = []
        
        # Score based on filters
        if user_filters.get('services_youth') and org.get('services_youth'):
            score += 2
            matched_services.append("youth")
        if user_filters.get('services_families') and org.get('services_families'):
            score += 2
            matched_services.append("families")
        if user_filters.get('services_lgbtq') and org.get('services_lgbtq'):
            score += 2
            matched_services.append("LGBTQ+ friendly")
        if user_filters.get('wheelchair_accessible') and org.get('wheelchair_accessible'):
            score += 1
            matched_services.append("wheelchair accessible")
        
        # Bonus for contact info
        if org.get('phone'):
            score += 0.5
        if org.get('address'):
            score += 0.5
        
        scored_orgs.append({
            'org': org,
            'score': score,
            'matched_services': matched_services
        })
    
    # Sort by score and return top 5
    scored_orgs.sort(key=lambda x: x['score'], reverse=True)
    return scored_orgs[:5]

def get_resource_details(resource_uuid: str) -> Dict:
    """
    Get detailed information about a specific resource
    
    Args:
        resource_uuid: UUID of the organization
    
    Returns:
        Detailed organization info
    """
    for category in RESOURCES_DATA:
        for org in category['organizations']:
            if org['uuid'] == resource_uuid:
                return {
                    'organization': org,
                    'category': category['service_name']
                }
    return {}

# Define agent tools - use Schema() wrapper with UPPERCASE type strings
search_resources_tool = types.Tool(
    function_declarations=[
        types.FunctionDeclaration(
            name='search_local_resources',
            description='Search the local Sacramento resources database for shelters, food services, and support organizations',
            parameters=types.Schema(
                type="OBJECT",
                properties={
                    'service_category': types.Schema(
                        type="STRING",
                        description='Service category: "Homeless Youth Shelters" or "Soup Kitchens"'
                    ),
                    'user_filters': types.Schema(
                        type="OBJECT",
                        description='Demographic and accessibility filters',
                        properties={
                            'services_youth': types.Schema(type="BOOLEAN"),
                            'services_families': types.Schema(type="BOOLEAN"),
                            'services_lgbtq': types.Schema(type="BOOLEAN"),
                            'wheelchair_accessible': types.Schema(type="BOOLEAN"),
                        }
                    )
                },
                required=['service_category']
            )
        ),
        types.FunctionDeclaration(
            name='get_resource_details',
            description='Get detailed information about a specific resource organization',
            parameters=types.Schema(
                type="OBJECT",
                properties={
                    'resource_uuid': types.Schema(
                        type="STRING",
                        description='UUID of the organization'
                    )
                },
                required=['resource_uuid']
            )
        )
    ]
)

# Google Search tool for web grounding
google_search_tool = types.Tool(google_search=types.GoogleSearch())

# System instruction for the agent
SYSTEM_INSTRUCTION = """You are a warm, empathetic housing assistant for FindHaven, helping people experiencing homelessness in Sacramento, CA.

Your role:
- Have genuine, caring conversations with users
- Learn about their situation (family size, special needs, preferences)
- Search local Sacramento resources FIRST using search_local_resources
- Only use web search if local resources don't match their specific needs
- Explain WHY each resource is a good fit
- Be patient, supportive, and encouraging

Available local resources:
- Homeless Youth Shelters (for ages 12-17)
- Soup Kitchens (meal services, food assistance)

When recommending resources:
1. Ask clarifying questions to understand their needs
2. Search local database with appropriate filters
3. Present 3-5 top matches with reasons
4. If local search has no matches, use web search for specialized needs
5. Always be warm and conversational

Remember: You're supporting someone through a difficult time. Show empathy and care."""

@app.route('/query', methods=['POST'])
def query():
    """Handle chat query with streaming response"""
    try:
        data = request.json
        message = data.get('message', '')
        session_id = data.get('session_id', '')
        stream_mode = data.get('stream', True)
        
        # Initialize Genai client
        client = genai.Client(
            api_key=os.environ.get('GEMINI_API_KEY')
        )
        
        # Create chat session
        config = types.GenerateContentConfig(
            system_instruction=SYSTEM_INSTRUCTION,
            tools=[search_resources_tool, google_search_tool],
            temperature=0.7,
        )
        
        # Generate response
        if stream_mode:
            def generate_stream():
                response = client.models.generate_content_stream(
                    model='gemini-1.5-flash',
                    contents=message,
                    config=config
                )
                
                for chunk in response:
                    # Handle function calls
                    if chunk.candidates and chunk.candidates[0].content.parts:
                        for part in chunk.candidates[0].content.parts:
                            if hasattr(part, 'function_call'):
                                # Execute function
                                func_call = part.function_call
                                if func_call.name == 'search_local_resources':
                                    results = search_local_resources(**func_call.args)
                                    # Format as recommendations
                                    recommendations = []
                                    service_category = func_call.args.get('service_category', 'Resource')
                                    for item in results:
                                        org = item['org']
                                        recommendations.append({
                                            'id': org['uuid'],
                                            'name': org['organization'],
                                            'type': service_category,
                                            'address': org.get('address', 'Address not listed'),
                                            'phone': org.get('phone', 'Call 2-1-1'),
                                            'hours': org.get('hours_of_operation', 'Contact for hours'),
                                            'matchReason': f"Serves {', '.join(item['matched_services'])}" if item['matched_services'] else 'Local resource'
                                        })
                                    
                                    # Send as SSE
                                    yield f"data: {json.dumps({'recommendations': recommendations})}\n\n"
                                
                                elif func_call.name == 'get_resource_details':
                                    result = get_resource_details(**func_call.args)
                                    # Send detailed info
                                    if result:
                                        yield f"data: {json.dumps({'details': result})}\n\n"
                            
                            elif hasattr(part, 'text'):
                                # Stream text content
                                yield f"data: {json.dumps({'text': part.text})}\n\n"
                
                yield "data: [DONE]\n\n"
            
            return Response(
                stream_with_context(generate_stream()),
                mimetype='text/event-stream',
                headers={
                    'Cache-Control': 'no-cache',
                    'X-Accel-Buffering': 'no'
                }
            )
        else:
            # Non-streaming mode
            response = client.models.generate_content(
                model='gemini-1.5-flash',
                contents=message,
                config=config
            )
            return {'response': response.text}
    
    except Exception as e:
        return {'error': str(e)}, 500

@app.route('/', methods=['GET'])
def index():
    """Root endpoint"""
    return {
        'service': 'FindHaven ADK Agent',
        'status': 'running',
        'endpoints': {
            '/health': 'Health check',
            '/query': 'POST - Chat query endpoint'
        },
        'resources_loaded': len(RESOURCES_DATA) > 0
    }

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return {
        'status': 'healthy',
        'service': 'FindHaven ADK Agent',
        'resources_loaded': len(RESOURCES_DATA)
    }

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8080))
    app.run(host='0.0.0.0', port=port)
