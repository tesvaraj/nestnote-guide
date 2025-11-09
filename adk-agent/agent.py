"""
FindHaven ADK Agent
A Google ADK agent for helping people find housing and support resources in Sacramento, CA.
"""
import json
import os
import warnings
from typing import List, Dict, Any, Optional
from google.adk import Agent

# Suppress pydantic warnings
warnings.filterwarnings("ignore", category=UserWarning, module=".*pydantic.*")

# Model configuration - use string directly for Gemini API
MODEL_NAME = 'gemini-2.5-flash'
AGENT_NAME = 'findhaven_assistant'

# Load resources data (lazy loading to reduce memory at startup)
RESOURCES_FILE = os.path.join(os.path.dirname(__file__), "resources-data.json")
RESOURCES_DATA = None
_resources_loaded = False

def load_resources() -> List[Dict]:
    """Load resources from JSON file (lazy loading)"""
    global RESOURCES_DATA, _resources_loaded
    if _resources_loaded:
        return RESOURCES_DATA or []
    
    try:
        with open(RESOURCES_FILE, 'r') as f:
            RESOURCES_DATA = json.load(f)
            print(f"✅ Loaded {len(RESOURCES_DATA)} service categories from JSON")
            _resources_loaded = True
            return RESOURCES_DATA
    except FileNotFoundError:
        print(f"⚠️ Warning: {RESOURCES_FILE} not found. Resource search will return empty results.")
        RESOURCES_DATA = []
        _resources_loaded = True
        return RESOURCES_DATA
    except Exception as e:
        print(f"❌ Error loading resources: {e}")
        RESOURCES_DATA = []
        _resources_loaded = True
        return RESOURCES_DATA

def get_resources_data() -> List[Dict]:
    """Get resources data, loading if necessary"""
    if not _resources_loaded:
        load_resources()
    return RESOURCES_DATA or []

# Load resources at module import (but allow lazy loading)
# Don't fail if resources can't be loaded - allow service to start
try:
    load_resources()
except Exception as e:
    print(f"Warning: Could not load resources at import: {e}")
    import traceback
    traceback.print_exc()
    RESOURCES_DATA = []
    _resources_loaded = True

# Custom Tool: Search Local Resources
def search_local_resources(
    service_category: str,
    user_filters: Optional[Dict[str, bool]] = None
) -> Dict[str, Any]:
    """
    Search resources-data.json for matching organizations.
    
    Args:
        service_category: Category to search (e.g., "Homeless Youth Shelters", "Soup Kitchens")
        user_filters: Dict of demographic filters (services_youth, services_lgbtq, etc.)
    
    Returns:
        Dictionary with recommendations list containing matching organizations
    """
    user_filters = user_filters or {}
    
    # Get resources data (lazy loading)
    resources = get_resources_data()
    
    # Find the matching category
    category = next((cat for cat in resources if cat['service_name'] == service_category), None)
    
    if not category:
        return {
            "status": "error",
            "message": f"Category '{service_category}' not found",
            "recommendations": []
        }
    
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
        if user_filters.get('services_veterans') and org.get('services_veterans'):
            score += 2
            matched_services.append("veterans")
        if user_filters.get('wheelchair_accessible') and org.get('wheelchair_accessible'):
            score += 1
            matched_services.append("wheelchair accessible")
        if user_filters.get('services_pets_allowed') and org.get('services_pets_allowed'):
            score += 1
            matched_services.append("pets allowed")
        
        # Bonus for contact info
        if org.get('phone'):
            score += 0.5
        if org.get('address'):
            score += 0.5
        if org.get('website'):
            score += 0.5
        
        scored_orgs.append({
            'org': org,
            'score': score,
            'matched_services': matched_services
        })
    
    # Sort by score and return top 5
    scored_orgs.sort(key=lambda x: x['score'], reverse=True)
    top_matches = scored_orgs[:5]
    
    # Format recommendations
    recommendations = []
    for item in top_matches:
        org = item['org']
        recommendations.append({
            'id': org['uuid'],
            'name': org['organization'],
            'type': category['service_name'],
            'address': org.get('address', 'Address not listed - please call for location'),
            'phone': org.get('phone', 'Call 2-1-1 for contact info'),
            'hours': org.get('hours_of_operation', 'Contact for hours'),
            'matchReason': f"Serves {', '.join(item['matched_services'])}" if item['matched_services'] else f"{category['service_name']} in Sacramento area"
        })
    
    return {
        "status": "success",
        "category": service_category,
        "count": len(recommendations),
        "recommendations": recommendations
    }

def get_resource_details(resource_uuid: str) -> Dict[str, Any]:
    """
    Get detailed information about a specific resource organization.
    
    Args:
        resource_uuid: UUID of the organization
    
    Returns:
        Dictionary with detailed organization info
    """
    # Get resources data (lazy loading)
    resources = get_resources_data()
    
    for category in resources:
        for org in category['organizations']:
            if org['uuid'] == resource_uuid:
                services = []
                if org.get('services_male'):
                    services.append("✓ Men")
                if org.get('services_female'):
                    services.append("✓ Women")
                if org.get('services_gender_neutral'):
                    services.append("✓ All genders")
                if org.get('services_families'):
                    services.append("✓ Families with children")
                if org.get('services_youth'):
                    services.append("✓ Youth (ages 12-17)")
                if org.get('services_seniors'):
                    services.append("✓ Seniors")
                if org.get('services_veterans'):
                    services.append("✓ Veterans")
                if org.get('services_lgbtq'):
                    services.append("✓ LGBTQ+ friendly")
                if org.get('services_pets_allowed') is True:
                    services.append("✓ Pets allowed")
                elif org.get('services_pets_allowed') is False:
                    services.append("✗ No pets")
                
                return {
                    "status": "success",
                    "organization": org['organization'],
                    "category": category['service_name'],
                    "address": org.get('address', 'Address not listed - please call'),
                    "phone": org.get('phone', 'Call 2-1-1'),
                    "email": org.get('email', 'Not listed'),
                    "website": org.get('website', 'Not listed'),
                    "hours": org.get('hours_of_operation', 'Contact for hours'),
                    "description": org.get('description', ''),
                    "services": services,
                    "wheelchair_accessible": org.get('wheelchair_accessible', False),
                    "total_beds": org.get('total_beds'),
                    "available_beds": org.get('available_beds'),
                    "detail_page": org.get('detail_page', '')
                }
    
    return {
        "status": "error",
        "message": f"Resource with UUID '{resource_uuid}' not found"
    }

# Calculate total organizations for instruction (lazy calculation)
def get_total_orgs():
    """Get total organizations count"""
    resources = get_resources_data()
    return sum(len(cat['organizations']) for cat in resources) if resources else 0

def get_num_categories():
    """Get number of categories"""
    resources = get_resources_data()
    return len(resources) if resources else 0

# System instruction for the agent (lazy generation)
def get_system_instruction() -> str:
    """Get system instruction with current resources data"""
    resources = get_resources_data()
    total_orgs = get_total_orgs()
    num_categories = get_num_categories()
    
    categories_text = chr(10).join(
        f"- {cat['service_name']} ({len(cat['organizations'])} organizations)" 
        for cat in resources
    ) if resources else "No resources loaded"
    
    return f"""You are a warm, empathetic housing assistant for FindHaven, a platform that helps people experiencing homelessness find resources and support in Sacramento, CA.

CRITICAL: You MUST ALWAYS respond with conversational text. Never just call tools without talking to the user.

Available Resource Categories:
{categories_text}

Your conversational approach:
- ALWAYS start with a warm, empathetic response acknowledging what they asked for
- Have a natural conversation while helping them
- When appropriate, you can BOTH talk to them AND show recommendations at the same time
- Show genuine care and empathy in EVERY message
- Keep responses conversational and supportive, not just transactional

When to show recommendations:
- After having a brief conversation about their needs
- You can show recommendations while also asking follow-up questions
- Always explain WHY you're showing these specific resources based on their request

Your role:
- Provide clear, compassionate guidance about housing, food, and support services
- Help users understand their options based on their profile and situation
- Use the search_local_resources tool when they ask about:
  * Youth shelters (for homeless youth ages 12-17)
  * Food/meals (soup kitchens, meal programs, food assistance)
  * Keywords like 'find', 'need', 'show', 'help', 'looking for'
- Match users with the RIGHT category based on their needs:
  * Youth/runaway/teen shelter → Homeless Youth Shelters
  * Food/meals/hungry/kitchen → Soup Kitchens
- When showing recommendations, explain WHY each resource might be a good fit
- Always combine tool calls with conversational responses - never just call a tool silently
- If users ask for more details about specific resources, use the get_resource_details tool
- Be supportive and encouraging while maintaining professionalism

Context:
- Users may be in vulnerable situations - always be respectful, patient, and supportive
- Focus on actionable information and next steps
- Keep responses warm and conversational, not clinical
- You have access to {total_orgs} organizations across {num_categories} service categories in Sacramento
- Resources have demographic filters (youth, families, LGBTQ+, veterans, wheelchair accessible, pets)

Remember: You're not just providing information - you're supporting someone through a difficult time. Be warm, be conversational, and show you care through your words WHILE providing helpful recommendations."""

# Create the root agent (with lazy instruction)
# Wrap in try-except to prevent import failures
try:
    SYSTEM_INSTRUCTION = get_system_instruction()  # Initialize with current data
    
    root_agent = Agent(
        model=MODEL_NAME,  # Model name as string from config
        name=AGENT_NAME,
        instruction=SYSTEM_INSTRUCTION,
        tools=[search_local_resources, get_resource_details],
    )
    print("✓ Root agent created successfully")
    print(f"✓ Agent model: {root_agent.canonical_model if hasattr(root_agent, 'canonical_model') else 'N/A'}")
except Exception as e:
    print(f"✗ Failed to create root agent: {e}")
    import traceback
    traceback.print_exc()
    # Create a minimal agent to allow service to start
    root_agent = None

