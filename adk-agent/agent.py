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
    
    # CRITICAL: STRICT address validation - exclude ANYTHING without a complete address
    def has_valid_address(org):
        address = org.get('address', '').strip()
        if not address:
            return False
        
        # Must not contain invalid indicators
        invalid_indicators = ['not listed', 'n/a', 'various', 'call for', 'contact for', 'tbd', 'see website']
        address_lower = address.lower()
        for indicator in invalid_indicators:
            if indicator in address_lower:
                return False
        
        # Must have a street number
        import re
        if not re.search(r'\d', address):
            return False
        
        return True
    
    # Filter out resources without valid addresses
    matched_orgs = [org for org in matched_orgs if has_valid_address(org)]
    
    # CRITICAL: Filter out ALL animal-related services - NEVER relevant for human housing
    def is_animal_service(org):
        org_name = (org.get('organization', '') or '').lower()
        org_desc = (org.get('description', '') or '').lower()
        
        animal_keywords = ['animal', 'pet', 'tails', 'sanctuary', 'rescue', 'cats and dogs']
        return any(keyword in org_name or keyword in org_desc for keyword in animal_keywords)
    
    matched_orgs = [org for org in matched_orgs if not is_animal_service(org)]
    
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
    
    # Format recommendations with full context for agent to understand
    recommendations = []
    for item in top_matches:
        org = item['org']
        # Include full description and details so agent can understand and validate
        recommendations.append({
            'id': org['uuid'],
            'name': org['organization'],
            'type': category['service_name'],
            'address': org.get('address', 'Address not listed - please call for location'),
            'phone': org.get('phone', 'Call 2-1-1 for contact info'),
            'hours': org.get('hours_of_operation', 'Contact for hours'),
            'description': org.get('description', ''),
            'website': org.get('website', ''),
            'email': org.get('email', ''),
            'services_offered': {
                'male': org.get('services_male', False),
                'female': org.get('services_female', False),
                'gender_neutral': org.get('services_gender_neutral', False),
                'families': org.get('services_families', False),
                'youth': org.get('services_youth', False),
                'seniors': org.get('services_seniors', False),
                'veterans': org.get('services_veterans', False),
                'lgbtq': org.get('services_lgbtq', False),
                'pets_allowed': org.get('services_pets_allowed'),
                'wheelchair_accessible': org.get('wheelchair_accessible', False)
            },
            'total_beds': org.get('total_beds'),
            'available_beds': org.get('available_beds'),
            'matchReason': f"Serves {', '.join(item['matched_services'])}" if item['matched_services'] else f"{category['service_name']} in Sacramento area",
            'match_score': item['score']
        })
    
    return {
        "status": "success",
        "category": service_category,
        "count": len(recommendations),
        "recommendations": recommendations,
        "user_query_context": f"Searching for {service_category} with filters: {user_filters}"
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
def get_system_instruction(user_location: Optional[str] = None) -> str:
    """Get system instruction with current resources data and user location"""
    resources = get_resources_data()
    total_orgs = get_total_orgs()
    num_categories = get_num_categories()
    
    # Use user's actual location or default to Sacramento
    location_text = user_location if user_location else "Sacramento, CA"
    
    categories_text = chr(10).join(
        f"- {cat['service_name']} ({len(cat['organizations'])} organizations)" 
        for cat in resources
    ) if resources else "No resources loaded"
    
    return f"""You are a warm, empathetic housing assistant for FindHaven, a platform that helps people experiencing homelessness find resources and support.

USER LOCATION: {location_text}
IMPORTANT: The user is currently in {location_text}. Focus on resources near this location.

CRITICAL: Keep your text responses VERY SHORT (1-2 sentences max).
- Be warm and kind, but BRIEF
- Let the resource cards do the talking - don't describe them in your text
- Just acknowledge what they need and show the cards
- Example: "I found some options for you nearby." (then show cards)

Available Resource Categories:
{categories_text}

Your conversational approach:
- ALWAYS keep responses SHORT - maximum 1-2 sentences
- Acknowledge their request warmly but briefly
- Show recommendations via search_local_resources tool
- DO NOT describe the resources in your text - the cards will show all details
- DO NOT list out what each resource does - just show the cards

When to show recommendations:
- Use search_local_resources tool when they ask for shelters, food, services
- The tool will return cards with all the details
- Your text should just be a brief, kind acknowledgment

Your role:
- Use search_local_resources when they ask about services
- Match users with appropriate categories
- Keep text minimal - let cards show details
- Be supportive but concise

When showing recommendations:
- Call the search_local_resources tool
- Keep your text response to 1-2 sentences maximum
- DO NOT describe each resource - the cards show everything
- Example text: "Here are some options near you." or "I found these resources that might help."

Context:
- Users may be in vulnerable situations - always be respectful, patient, and supportive
- Keep responses SHORT and warm
- You have access to {total_orgs} organizations across {num_categories} service categories
- Resources have demographic filters (youth, families, LGBTQ+, veterans, wheelchair accessible, pets)
- User's current location: {location_text}

Remember: 
- Maximum 1-2 sentences per response
- Let the resource cards show all the details
- Be kind but BRIEF"""

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

