"""
HTTP service wrapper for the ADK agent.
This service provides an HTTP API that can be called from the Supabase edge function.
"""
import os
import sys
import json
import traceback

# Ensure we can import from current directory
sys.path.insert(0, os.path.dirname(__file__))

from flask import Flask, request, Response, jsonify
from flask_cors import CORS

# Import agent components with error handling
AGENT_LOADED = False
root_agent = None
search_local_resources = None
get_resource_details = None
get_resources_data = None
get_resources_count = None

try:
    from google import genai
    from google.genai import types
    print("✓ Google genai imported successfully")
except Exception as e:
    print(f"✗ Failed to import google.genai: {e}")
    traceback.print_exc()
    genai = None
    types = None

try:
    from agent import root_agent, get_resources_data, search_local_resources, get_resource_details
    AGENT_LOADED = True
    print("✓ Agent imported successfully")
    
    # Use lazy loading for resources data
    def get_resources_count():
        resources = get_resources_data()
        return len(resources) if resources else 0
except Exception as e:
    print(f"✗ Failed to load agent: {e}")
    traceback.print_exc()
    AGENT_LOADED = False
    root_agent = None
    
    # Placeholder functions
    def get_resources_data():
        return []
    
    def get_resources_count():
        return 0
    
    def search_local_resources(*args, **kwargs):
        return {"status": "error", "message": "Agent not loaded", "recommendations": []}
    
    def get_resource_details(*args, **kwargs):
        return {"status": "error", "message": "Agent not loaded"}

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Print startup information
print("=" * 50)
print("FindHaven ADK Agent Service Starting")
print("=" * 50)
print(f"Agent loaded: {AGENT_LOADED}")
print(f"Resources available: {get_resources_count() > 0}")
print(f"Python version: {sys.version}")
print("=" * 50)

# Initialize Gemini client (lazy initialization to reduce memory)
gemini_client = None
_client_lock = None

def get_gemini_client():
    """Get or create Gemini client (thread-safe)"""
    global gemini_client, _client_lock
    if genai is None:
        raise ValueError("Google genai module not available")
    if gemini_client is None:
        import threading
        if _client_lock is None:
            _client_lock = threading.Lock()
        with _client_lock:
            # Double-check after acquiring lock
            if gemini_client is None:
                api_key = os.environ.get('GOOGLE_API_KEY') or os.environ.get('GEMINI_API_KEY')
                if not api_key:
                    raise ValueError("GOOGLE_API_KEY or GEMINI_API_KEY environment variable is required")
                gemini_client = genai.Client(api_key=api_key)
    return gemini_client

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    try:
        resources_count = get_resources_count()
        return jsonify({
            'status': 'healthy',
            'service': 'FindHaven ADK Agent',
            'agent_loaded': AGENT_LOADED,
            'resources_loaded': resources_count > 0,
            'resource_categories': resources_count,
            'api_key_configured': bool(os.environ.get('GOOGLE_API_KEY') or os.environ.get('GEMINI_API_KEY'))
        })
    except Exception as e:
        return jsonify({
            'status': 'error',
            'error': str(e)
        }), 500

@app.route('/', methods=['GET'])
def index():
    """Root endpoint"""
    return jsonify({
        'service': 'FindHaven ADK Agent',
        'status': 'running',
        'agent_loaded': AGENT_LOADED,
        'endpoints': {
            '/health': 'Health check',
            '/query': 'POST - Chat query endpoint'
        },
        'resources_loaded': get_resources_count() > 0
    })

def create_adk_tools():
    """Create tool definitions from ADK agent tools"""
    if types is None:
        raise ValueError("Google genai types module not available")
    # Define tools using ADK's tool structure
    # The ADK agent has search_local_resources and get_resource_details as tools
    search_tool = types.Tool(
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
                                'services_veterans': types.Schema(type="BOOLEAN"),
                                'services_pets_allowed': types.Schema(type="BOOLEAN"),
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
    return search_tool

@app.route('/query', methods=['POST'])
def query():
    """Handle chat query using ADK agent configuration with Gemini API"""
    try:
        data = request.json
        message = data.get('message', '')
        messages = data.get('messages', [])
        session_id = data.get('session_id', '')
        stream_mode = data.get('stream', True)
        
        # Extract the last user message if messages array is provided
        if messages and not message:
            user_messages = [m for m in messages if m.get('role') == 'user']
            if user_messages:
                message = user_messages[-1].get('content', '')
        
        if not message:
            return jsonify({'error': 'Message is required'}), 400
        
        # Check if agent is loaded
        if not AGENT_LOADED or root_agent is None:
            return jsonify({'error': 'Agent not loaded. Check logs for details.'}), 500
        
        # Get agent configuration from ADK agent
        try:
            from agent import get_system_instruction
            SYSTEM_INSTRUCTION = get_system_instruction()
        except ImportError:
            try:
                from agent import SYSTEM_INSTRUCTION
            except ImportError:
                return jsonify({'error': 'Failed to import agent configuration'}), 500
        
        # Create Gemini client
        try:
            client = get_gemini_client()
        except Exception as e:
            return jsonify({'error': f'Failed to initialize Gemini client: {str(e)}'}), 500
        
        # Build conversation history
        contents = []
        if messages:
            for msg in messages:
                role = "model" if msg.get('role') == 'assistant' else "user"
                contents.append(types.Content(
                    role=role,
                    parts=[types.Part(text=msg.get('content', ''))]
                ))
        else:
            contents = [types.Content(parts=[types.Part(text=message)])]
        
        # Create config with ADK agent's instruction and tools
        try:
            config = types.GenerateContentConfig(
                system_instruction=SYSTEM_INSTRUCTION,
                tools=[create_adk_tools()],
                temperature=0.7,
            )
        except Exception as e:
            return jsonify({'error': f'Failed to create agent config: {str(e)}'}), 500
        
        # For streaming mode
        if stream_mode:
            def generate_stream():
                try:
                    # First, send the request and collect function calls
                    accumulated_contents = list(contents)
                    max_iterations = 10  # Prevent infinite loops
                    iteration = 0
                    
                    while iteration < max_iterations:
                        iteration += 1
                        try:
                            # Get model name as string - use the MODEL_NAME from agent module
                            # ADK agent's canonical_model is an object, not a string, so we use MODEL_NAME directly
                            from agent import MODEL_NAME
                            model_name = MODEL_NAME
                            
                            response_stream = client.models.generate_content_stream(
                                model=model_name,
                                contents=accumulated_contents,
                                config=config
                            )
                        except Exception as e:
                            yield f"data: {json.dumps({'error': f'Failed to generate content: {str(e)}'})}\n\n"
                            yield "data: [DONE]\n\n"
                            return
                        
                        accumulated_text = ""
                        function_calls = []
                        tool_calls_processed = set()
                        # Store only function call parts, not all parts to reduce memory
                        function_call_parts_only = []
                        
                        # Process chunks streamingly
                        for chunk in response_stream:
                            if chunk.candidates and len(chunk.candidates) > 0:
                                candidate = chunk.candidates[0]
                                if candidate.content and candidate.content.parts:
                                    for part in candidate.content.parts:
                                        # Check for function calls
                                        if hasattr(part, 'function_call') and part.function_call:
                                            func_call = part.function_call
                                            call_key = f"{func_call.name}_{hash(str(func_call.args))}"
                                            if call_key not in tool_calls_processed:
                                                tool_calls_processed.add(call_key)
                                                function_calls.append(func_call)
                                                # Store only function call parts (minimal memory)
                                                function_call_parts_only.append(part)
                                        
                                        # Stream text content immediately if available
                                        if hasattr(part, 'text') and part.text:
                                            accumulated_text += part.text
                                            # Convert to OpenAI-compatible format for frontend
                                            openai_format = {
                                                "choices": [{
                                                    "delta": {"content": part.text}
                                                }]
                                            }
                                            yield f"data: {json.dumps(openai_format)}\n\n"
                        
                        # If we have function calls, execute them and continue
                        if function_calls:
                            # Add model's response with function calls to conversation
                            function_call_parts = [types.Part(function_call=fc) for fc in function_calls]
                            accumulated_contents.append(types.Content(
                                role="model",
                                parts=function_call_parts
                            ))
                            
                            # Execute function calls and add results
                            function_response_parts = []
                            for func_call in function_calls:
                                func_name = func_call.name
                                # Convert function call args to dict
                                if hasattr(func_call, 'args'):
                                    if hasattr(func_call.args, '__dict__'):
                                        func_args = func_call.args.__dict__
                                    elif isinstance(func_call.args, dict):
                                        func_args = func_call.args
                                    else:
                                        # Try to convert to dict
                                        func_args = dict(func_call.args) if func_call.args else {}
                                else:
                                    func_args = {}
                                
                                # Execute tool
                                if func_name == 'search_local_resources':
                                    result = search_local_resources(**func_args)
                                    # Send recommendations to frontend
                                    if result.get('recommendations'):
                                        recommendations = result['recommendations']
                                        rec_format = {
                                            "choices": [{
                                                "delta": {
                                                    "recommendations": recommendations
                                                }
                                            }]
                                        }
                                        yield f"data: {json.dumps(rec_format)}\n\n"
                                    
                                    # Add function response for model
                                    function_response_parts.append(types.Part(
                                        function_response=types.FunctionResponse(
                                            name=func_name,
                                            response=result
                                        )
                                    ))
                                
                                elif func_name == 'get_resource_details':
                                    result = get_resource_details(**func_args)
                                    # Send details to frontend
                                    if result.get('status') == 'success':
                                        detail_text = f"\n\n**Details for {result['organization']}:**\n"
                                        detail_text += f"📍 {result['address']}\n"
                                        detail_text += f"📞 {result['phone']}\n"
                                        detail_text += f"⏰ {result['hours']}\n"
                                        if result.get('services'):
                                            detail_text += f"\n**Services:**\n" + "\n".join(result['services'])
                                        detail_format = {
                                            "choices": [{
                                                "delta": {"content": detail_text}
                                            }]
                                        }
                                        yield f"data: {json.dumps(detail_format)}\n\n"
                                    
                                    # Add function response for model
                                    function_response_parts.append(types.Part(
                                        function_response=types.FunctionResponse(
                                            name=func_name,
                                            response=result
                                        )
                                    ))
                            
                            # Add function responses to conversation and continue
                            accumulated_contents.append(types.Content(
                                role="user",
                                parts=function_response_parts
                            ))
                            # Continue the loop to get model's response with function results
                            continue
                        else:
                            # No function calls, we're done
                            break
                    
                    yield "data: [DONE]\n\n"
                    
                except Exception as e:
                    import traceback
                    error_msg = json.dumps({'error': str(e), 'traceback': traceback.format_exc()})
                    yield f"data: {error_msg}\n\n"
            
            return Response(
                generate_stream(),
                mimetype='text/event-stream',
                headers={
                    'Cache-Control': 'no-cache',
                    'X-Accel-Buffering': 'no'
                }
            )
        else:
            # Non-streaming mode
            try:
                # Get model name as string - use the MODEL_NAME from agent module
                from agent import MODEL_NAME
                model_name = MODEL_NAME
                
                response = client.models.generate_content(
                    model=model_name,
                    contents=contents,
                    config=config
                )
                
                result = {
                    'response': response.text if hasattr(response, 'text') else str(response)
                }
                
                return jsonify(result)
                
            except Exception as e:
                import traceback
                return jsonify({
                    'error': str(e),
                    'traceback': traceback.format_exc()
                }), 500
    
    except Exception as e:
        import traceback
        return jsonify({
            'error': str(e),
            'traceback': traceback.format_exc()
        }), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8080))
    app.run(host='0.0.0.0', port=port, debug=False)

