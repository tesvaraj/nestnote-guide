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
    
    # Filter organizations - EXTREMELY STRICT
    matched_orgs = category['organizations']
    
    print(f"Initial org count for {service_category}: {len(matched_orgs)}")
    
    # CRITICAL STEP 1: STRICT address validation - exclude ANYTHING without a complete address
    def has_valid_complete_address(org):
        """Check if organization has a valid, complete physical address with all required components"""
        address = org.get('address', '').strip()
        
        # Must have an address
        if not address:
            print(f"❌ Excluded {org.get('organization')}: No address")
            return False
        
        # Must not contain invalid indicators
        invalid_indicators = [
            'not listed', 'n/a', 'various', 'call for', 'contact for', 
            'tbd', 'see website', 'n.a.', 'na', 'varies', 'multiple locations',
            'pending', 'unknown', 'call first', 'by appointment'
        ]
        address_lower = address.lower()
        for indicator in invalid_indicators:
            if indicator in address_lower:
                print(f"❌ Excluded {org.get('organization')}: Invalid address indicator '{indicator}'")
                return False
        
        # Must have a street number (at least one digit)
        import re
        if not re.search(r'\d', address):
            print(f"❌ Excluded {org.get('organization')}: No street number")
            return False
        
        # Must have city and state or ZIP
        if not any(x in address_lower for x in ['ca', 'california', 'sacramento', '958', '956', '957']):
            print(f"❌ Excluded {org.get('organization')}: Missing CA location")
            return False
        
        print(f"✓ Accepted {org.get('organization')}: Valid address")
        return True
    
    # Apply address filtering
    matched_orgs = [org for org in matched_orgs if has_valid_complete_address(org)]
    print(f"After address filter: {len(matched_orgs)} orgs")
    
    # CRITICAL STEP 2: Filter out ALL animal-related services - NEVER relevant for human housing
    def is_animal_service(org):
        """Check if this is an animal/pet service"""
        org_name = (org.get('organization', '') or '').lower()
        org_desc = (org.get('description', '') or '').lower()
        
        animal_keywords = [
            'animal', 'pet', 'tails', 'sanctuary', 'rescue', 
            'cats and dogs', 'dog', 'cat', 'veterinary', 'spca'
        ]
        
        for keyword in animal_keywords:
            if keyword in org_name or keyword in org_desc:
                print(f"❌ Excluded {org.get('organization')}: Animal service ('{keyword}')")
                return True
        return False
    
    matched_orgs = [org for org in matched_orgs if not is_animal_service(org)]
    print(f"After animal filter: {len(matched_orgs)} orgs")
    
    # CRITICAL STEP 3: Require phone OR hours to ensure it's a real, operating service
    def has_contact_info(org):
        """Check if org has basic contact information"""
        has_phone = bool(org.get('phone', '').strip())
        has_hours = bool(org.get('hours_of_operation', '').strip())
        
        if not (has_phone or has_hours):
            print(f"❌ Excluded {org.get('organization')}: No phone or hours")
            return False
        return True
    
    matched_orgs = [org for org in matched_orgs if has_contact_info(org)]
    print(f"After contact info filter: {len(matched_orgs)} orgs")
    
    # Apply demographic filters
    if user_filters:
        matched_orgs = [
            org for org in matched_orgs
            if all(org.get(key, False) == value for key, value in user_filters.items() if value is True)
        ]
        print(f"After demographic filters: {len(matched_orgs)} orgs")
    
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
    
    # Format recommendations - ONLY include what we know is valid
    recommendations = []
    for item in top_matches:
        org = item['org']
        
        # Double-check this org has required data (should always pass due to filtering above)
        if not org.get('address') or not org.get('organization'):
            print(f"⚠️ Skipping {org.get('organization')} in final output - missing required data")
            continue
        
        # Build recommendation with ONLY validated data
        recommendations.append({
            'id': org['uuid'],
            'name': org['organization'],
            'type': category['service_name'],
            'address': org['address'],  # We know this exists and is valid
            'phone': org.get('phone', ''),  # Empty string if not available
            'hours': org.get('hours_of_operation', ''),  # Empty string if not available
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
            'matchReason': f"Serves {', '.join(item['matched_services'])}" if item['matched_services'] else "Available resource",
            'match_score': item['score']
        })
    
    print(f"Final recommendations count: {len(recommendations)}")
    
    if len(recommendations) == 0:
        print("⚠️ WARNING: No valid resources found after filtering!")
    
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
    
    return f"""You are a warm, empathetic housing assistant for FindHaven.

USER LOCATION: {location_text}

🚨 CRITICAL INSTRUCTIONS 🚨

HOW TO RESPOND:
1. Write 1 brief sentence (e.g., "Here are some options near you.")
2. IMMEDIATELY call search_local_resources tool with the RIGHT category and filters
3. STOP - Do NOT describe what you found

CATEGORY MAPPING (Match user request to category):
- Youth shelter / runaway teen → "Runaway/Youth Shelters" + services_youth: true
- Food / meals / hungry / eat → "Soup Kitchens" or "Food Pantries"
- General shelter / housing → "Homeless Shelters"
- Family housing → "Homeless Shelters" + services_families: true
- Transitional housing → "Transitional Housing"
- Drop-in center → "Homeless Drop In Centers"
- Domestic violence → "Domestic Violence Shelters"
- Healthcare → "Healthcare/Medical Clinics"
- Mental health → "Mental Health Treatment"

FILTERS TO APPLY (Based on user profile):
- Age <18 or mentions "youth/teen" → services_youth: true
- Has children → services_families: true  
- Mentions LGBTQ+ → services_lgbtq: true
- Veteran → services_veterans: true
- Wheelchair/mobility → wheelchair_accessible: true
- Has pets → services_pets_allowed: true

The search_local_resources tool will automatically create resource CARDS that show:
- Organization names
- Addresses
- Phone numbers  
- Hours
- All details

YOUR TEXT should be:
✅ "Here are some resources nearby."
✅ "I found these options for you."
✅ "These might help."

YOUR TEXT should NEVER be:
❌ "Here are options: * Organization X provides Y..."
❌ "I found X which does Y, and Z which offers..."
❌ Any bullet points or lists
❌ Any descriptions of specific organizations

WORKFLOW:
User asks → You write 1 sentence → Call tool with proper category & filters → Tool creates cards → DONE

Available categories:
{categories_text}

Context:
- {total_orgs} organizations across {num_categories} service categories
- User location: {location_text}

🚨 REMEMBER: Call search_local_resources with CORRECT category based on user's request, write 1 sentence, STOP 🚨"""

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

