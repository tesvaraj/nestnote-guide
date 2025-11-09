import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import resourcesData from "./resources-data.json" with { type: "json" };

// Calculate distance between two coordinates using Haversine formula
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3959; // Earth's radius in miles
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return Math.round(distance * 10) / 10; // Round to 1 decimal place
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

console.log(`Loaded ${resourcesData.length} service categories from JSON`);


serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, userProfile, userLocation } = await req.json();
    const ADK_SERVICE_URL = Deno.env.get("ADK_SERVICE_URL");
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    
    console.log("User profile:", userProfile);
    console.log("User location:", userLocation);
    
    // If ADK service URL is configured, use it instead of direct Gemini API
    if (ADK_SERVICE_URL) {
      console.log("Using ADK agent service:", ADK_SERVICE_URL);
      
      try {
        const adkResponse = await fetch(`${ADK_SERVICE_URL}/query`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messages,
            stream: true,
          }),
        });

        if (!adkResponse.ok) {
          const errorText = await adkResponse.text();
          console.error("ADK service error:", adkResponse.status, errorText);
          throw new Error(`ADK service error: ${adkResponse.status}`);
        }

        // Return the ADK service response stream
        return new Response(adkResponse.body, {
          headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
        });
      } catch (error) {
        console.error("Error calling ADK service:", error);
        // Fall through to direct Gemini API call as fallback
        console.log("Falling back to direct Gemini API");
      }
    }
    
    // Fallback to direct Gemini API (original implementation)
    if (!GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not configured and ADK_SERVICE_URL is not available");
    }

    console.log("Chat request received with", messages.length, "messages");

    // Check if this is a resource search query or detail request
    const lastMessage = messages[messages.length - 1]?.content?.toLowerCase() || "";
    const isResourceQuery = lastMessage.includes("bed") || 
                           lastMessage.includes("shelter") || 
                           lastMessage.includes("housing") ||
                           lastMessage.includes("find") ||
                           lastMessage.includes("need") ||
                           lastMessage.includes("food") ||
                           lastMessage.includes("meal") ||
                           lastMessage.includes("eat") ||
                           lastMessage.includes("hungry") ||
                           lastMessage.includes("kitchen") ||
                           lastMessage.includes("pantry") ||
                           lastMessage.includes("school") ||
                           lastMessage.includes("transport") ||
                           lastMessage.includes("plan") ||
                           lastMessage.includes("recommend");
    
    const isDetailRequest = lastMessage.includes("amenities") ||
                           lastMessage.includes("services") ||
                           lastMessage.includes("more about") ||
                           lastMessage.includes("details") ||
                           lastMessage.includes("tell me more");

    // Build conversation history in Gemini format
    const contents = messages.map((msg: any) => ({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [{ text: msg.content }]
    }));

    // Calculate total organizations across all service categories
    const totalOrgs = resourcesData.reduce((sum, category) => sum + category.organizations.length, 0);

    // Build user context from profile
    let userContext = "";
    if (userProfile) {
      const parts = [];
      if (userProfile.name) parts.push(`Name: ${userProfile.name}`);
      if (userProfile.age) parts.push(`Age: ${userProfile.age}`);
      if (userProfile.housing_situation) parts.push(`Current housing: ${userProfile.housing_situation}`);
      if (userProfile.immediate_needs?.length > 0) parts.push(`Immediate needs: ${userProfile.immediate_needs.join(', ')}`);
      if (userProfile.has_children) parts.push(`Has children: Yes`);
      if (userProfile.household_disability) parts.push(`Household has disability: Yes`);
      if (userProfile.services_lgbtq) parts.push(`LGBTQ+ individual`);
      if (userLocation?.address) parts.push(`Current location: ${userLocation.address}`);
      
      if (parts.length > 0) {
        userContext = `\n\nUSER PROFILE:\n${parts.join('\n')}\n\nIMPORTANT: Use this profile information to provide personalized recommendations. Match resources based on their demographic needs, location proximity, and specific situation. DO NOT ask for information already in the profile unless you need clarification.`;
      }
    }
    
    // System instruction for the agent
    const systemInstruction = `You are Haven, a kind and gentle AI assistant helping people in Sacramento.${userContext}

YOUR COMMUNICATION STYLE:
- Keep your text responses VERY SHORT (1-2 sentences max)
- Be warm, kind, and supportive
- Let the resource cards speak for themselves - don't describe resources in your text
- Just acknowledge what the user needs and show them the cards

LOCATION GATHERING (CRITICAL):
${!userLocation ? `- The user HAS NOT provided their location yet - you MUST ask for it FIRST before providing recommendations
- Ask: "To find the best options near you, could you share your zip code or current location?"
- Do NOT provide recommendations until you have location information` : `- User location is known: ${userLocation.address}`}

CRITICAL FILTERING RULES:
1. NEVER recommend animal shelters, pet rescues, or any animal-related services for human housing needs
2. ONLY recommend resources with valid physical addresses
3. Match user's demographic needs (age, gender, family status)
4. For youth (under 18), ONLY recommend youth-specific shelters
5. Prioritize Sacramento locations unless user specifies elsewhere

Available Resource Categories:
${resourcesData.map(cat => `- ${cat.service_name} (${cat.organizations.length} organizations)`).join('\n')}

YOUR ROLE:
- First priority: Get location if missing
- Use the provide_resource_recommendations tool when they ask about shelters, food, or services
- Keep text brief and caring
- Let the cards show the details
- Make the user feel supported

Context: You have access to ${totalOrgs} organizations across ${resourcesData.length} service categories in Sacramento.`;

    // Define tools for resource recommendations and details
    const tools = [{
      function_declarations: [
        {
          name: "provide_resource_recommendations",
          description: "Search and recommend organizations from the resource database based on user needs. Use when user asks about shelters, food, meals, or any specific service. IMPORTANT: Always provide conversational text response along with calling this tool - never call it silently.",
          parameters: {
            type: "OBJECT",
            properties: {
              service_category: {
                type: "STRING",
                description: `The service category to search. Map user's request to the appropriate category:
- For youth/teen/runaway shelter needs: "Homeless Youth Services" or "Runaway/Youth Shelters"
- For general shelter/housing: "Homeless Shelter"
- For food/meals/eating/hungry: "Soup Kitchens" or "Food Pantries" 
- For families with children: "Homeless Youth Services"
- For transitional housing: "Transitional Housing/Shelter"
- For drop-in centers: "Homeless Drop In Centers"
- For domestic violence: "Domestic Violence Shelter"`,
                enum: resourcesData.map(cat => cat.service_name)
              },
              user_filters: {
                type: "OBJECT",
                description: "Demographic and accessibility filters based on user's situation",
                properties: {
                  services_male: { type: "BOOLEAN", description: "Serves males" },
                  services_female: { type: "BOOLEAN", description: "Serves females" },
                  services_gender_neutral: { type: "BOOLEAN", description: "Serves all genders" },
                  services_families: { type: "BOOLEAN", description: "Serves families with children" },
                  services_youth: { type: "BOOLEAN", description: "Serves youth/teens (12-17)" },
                  services_seniors: { type: "BOOLEAN", description: "Serves seniors" },
                  services_veterans: { type: "BOOLEAN", description: "Serves veterans" },
                  services_lgbtq: { type: "BOOLEAN", description: "LGBTQ+ friendly" },
                  services_pets_allowed: { type: "BOOLEAN", description: "Allows pets" },
                  wheelchair_accessible: { type: "BOOLEAN", description: "Wheelchair accessible" }
                }
              }
            },
            required: ["service_category"]
          }
        },
        {
          name: "provide_detailed_resource_info",
          description: "Provide detailed information about a specific resource organization including all services, contact info, and accessibility features. Use when user asks for more details about a specific organization. Always accompany with conversational text.",
          parameters: {
            type: "OBJECT",
            properties: {
              resource_uuid: {
                type: "STRING",
                description: "UUID of the specific organization to get details about"
              }
            },
            required: ["resource_uuid"]
          }
        }
      ]
    }];

    // Use Gemini 2.5 Flash with Google ADK approach
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:streamGenerateContent?key=${GEMINI_API_KEY}&alt=sse`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          system_instruction: {
            parts: [{ text: systemInstruction }]
          },
          contents,
          tools,
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 2048,
          },
          safetySettings: [
            {
              category: "HARM_CATEGORY_HARASSMENT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_HATE_SPEECH",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_DANGEROUS_CONTENT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            }
          ]
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      
      return new Response(
        JSON.stringify({ error: "Failed to get AI response" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Transform Gemini SSE stream to match our existing format
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    
    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body?.getReader();
        if (!reader) return;

        let accumulatedText = "";
        let toolCalls: any[] = [];

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n');

            for (const line of lines) {
              if (!line.trim() || line.startsWith(':')) continue;
              
              if (line.startsWith('data: ')) {
                const jsonStr = line.slice(6);
                
                try {
                  const data = JSON.parse(jsonStr);
                  const candidate = data.candidates?.[0];
                  const text = candidate?.content?.parts?.[0]?.text;
                  const functionCall = candidate?.content?.parts?.[0]?.functionCall;
                  
                  if (text) {
                    accumulatedText += text;
                    // Convert to OpenAI-compatible format for frontend
                    const openAIFormat = {
                      choices: [{
                        delta: { content: text }
                      }]
                    };
                    controller.enqueue(
                      encoder.encode(`data: ${JSON.stringify(openAIFormat)}\n\n`)
                    );
                  }

                  // Handle function calls (tool calls)
                  if (functionCall) {
                    toolCalls.push(functionCall);
                  }
                } catch (e) {
                  console.error('Failed to parse SSE data:', e);
                }
              }
            }
          }
          
          // After streaming text, process tool calls
          if (toolCalls.length > 0) {
            for (const toolCall of toolCalls) {
              if (toolCall.name === "provide_resource_recommendations") {
                const serviceCategory = toolCall.args?.service_category;
                const userFilters = toolCall.args?.user_filters || {};
                
                console.log("Tool call args:", { serviceCategory, userFilters });
                
                // Find the matching service category
                const category = resourcesData.find(cat => cat.service_name === serviceCategory);
                
                if (!category) {
                  console.error("Category not found:", serviceCategory);
                  continue;
                }
                
                // Filter organizations based on user criteria
                let matchedOrgs: any[] = category.organizations;
                
                // CRITICAL: Filter out ALL animal-related services - NEVER relevant for human housing
                matchedOrgs = matchedOrgs.filter((org: any) => {
                  const orgName = (org.organization || '').toLowerCase();
                  const orgDesc = (org.description || '').toLowerCase();
                  const isAnimalService = orgName.includes('animal') ||
                                         orgName.includes('pet') ||
                                         orgName.includes('tails') ||
                                         orgName.includes('sanctuary') ||
                                         orgName.includes('rescue') ||
                                         orgDesc.includes('animal') ||
                                         orgDesc.includes('pet') ||
                                         orgDesc.includes('cats and dogs');
                  
                  return !isAnimalService; // Exclude all animal services
                });
                
                // CRITICAL: STRICT address validation - exclude ANYTHING without a complete address
                console.log(`Initial orgs count: ${matchedOrgs.length}`);
                matchedOrgs = matchedOrgs.filter((org: any) => {
                  const address = org.address || '';
                  const trimmedAddress = address.trim();
                  
                  // Must have an address
                  if (!trimmedAddress) {
                    console.log(`Excluded ${org.organization}: No address`);
                    return false;
                  }
                  
                  // Must not contain these invalid indicators
                  const invalidIndicators = ['not listed', 'n/a', 'various', 'call for', 'contact for', 'tbd', 'see website'];
                  const lowerAddress = trimmedAddress.toLowerCase();
                  for (const indicator of invalidIndicators) {
                    if (lowerAddress.includes(indicator)) {
                      console.log(`Excluded ${org.organization}: Invalid address indicator "${indicator}"`);
                      return false;
                    }
                  }
                  
                  // Must have street number and street name (basic validation)
                  const hasNumber = /\d/.test(trimmedAddress);
                  if (!hasNumber) {
                    console.log(`Excluded ${org.organization}: No street number in address`);
                    return false;
                  }
                  
                  return true;
                });
                console.log(`After address validation: ${matchedOrgs.length} orgs`);
                
                // CRITICAL: Calculate distances and STRICTLY filter by proximity
                if (userLocation?.lat && userLocation?.lng) {
                  console.log("User location provided:", userLocation);
                  console.log("Calculating distances for", matchedOrgs.length, "organizations");
                  
                  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
                  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
                  
                  const orgsWithDistance = await Promise.all(
                    matchedOrgs.map(async (org: any) => {
                      try {
                        let resourceLat: number;
                        let resourceLon: number;
                        
                        // Check cache first
                        const cacheResp = await fetch(
                          `${SUPABASE_URL}/rest/v1/geocode_cache?address=eq.${encodeURIComponent(org.address)}&select=latitude,longitude`,
                          {
                            headers: {
                              'apikey': SUPABASE_SERVICE_ROLE_KEY || '',
                              'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
                            }
                          }
                        );
                        const cacheData = await cacheResp.json();
                        
                        if (Array.isArray(cacheData) && cacheData.length > 0) {
                          resourceLat = cacheData[0].latitude;
                          resourceLon = cacheData[0].longitude;
                          console.log(`✓ Cache hit for ${org.organization}`);
                        } else {
                          // Geocode via API
                          const geocodeResp = await fetch(
                            `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(org.address)}&format=json&limit=1`
                          );
                          const geocodeData = await geocodeResp.json();
                          
                          if (!Array.isArray(geocodeData) || geocodeData.length === 0) {
                            console.log(`✗ Failed to geocode ${org.organization}: ${org.address}`);
                            return { org, distance: 999, failed: true };
                          }
                          
                          resourceLat = parseFloat(geocodeData[0].lat);
                          resourceLon = parseFloat(geocodeData[0].lon);
                          
                          // Cache for future
                          await fetch(
                            `${SUPABASE_URL}/rest/v1/geocode_cache`,
                            {
                              method: 'POST',
                              headers: {
                                'apikey': SUPABASE_SERVICE_ROLE_KEY || '',
                                'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
                                'Content-Type': 'application/json',
                                'Prefer': 'return=minimal'
                              },
                              body: JSON.stringify({
                                address: org.address,
                                latitude: resourceLat,
                                longitude: resourceLon,
                                display_name: geocodeData[0].display_name
                              })
                            }
                          );
                          console.log(`✓ Geocoded and cached ${org.organization}`);
                        }
                        
                        // Calculate distance
                        const distance = calculateDistance(
                          userLocation.lat,
                          userLocation.lng,
                          resourceLat,
                          resourceLon
                        );
                        
                        console.log(`${org.organization}: ${distance} miles away`);
                        return { org, distance, failed: false };
                      } catch (e) {
                        console.error(`Error processing ${org.organization}:`, e);
                        return { org, distance: 999, failed: true };
                      }
                    })
                  );
                  
                  // STRICT filtering: ONLY resources within 15 miles (tightened from 25)
                  const MAX_DISTANCE = 15;
                  matchedOrgs = orgsWithDistance
                    .filter(({ distance, failed }) => {
                      if (failed) {
                        console.log(`Excluding ${failed} - geocoding failed`);
                        return false;
                      }
                      if (distance >= MAX_DISTANCE) {
                        console.log(`Excluding - too far (${distance} miles)`);
                        return false;
                      }
                      return true;
                    })
                    .sort((a, b) => a.distance - b.distance)
                    .map(({ org }) => org);
                  
                  console.log(`FINAL RESULT: ${matchedOrgs.length} resources within ${MAX_DISTANCE} miles`);
                  
                  // If no resources found within distance, don't return anything
                  if (matchedOrgs.length === 0) {
                    console.log("No resources found within acceptable distance");
                  }
                } else {
                  console.log("WARNING: No user location provided - cannot filter by distance");
                  // If no location, limit results heavily
                  matchedOrgs = matchedOrgs.slice(0, 3);
                }
                
                // Apply demographic filters if provided
                if (Object.keys(userFilters).length > 0) {
                  matchedOrgs = matchedOrgs.filter((org: any) => {
                    let matches = true;
                    
                    for (const [key, value] of Object.entries(userFilters)) {
                      if (value === true && org[key] !== true) {
                        matches = false;
                        break;
                      }
                    }
                    
                    return matches;
                  });
                }
                
                // Score by matching services (already sorted by distance)
                const scoredOrgs = matchedOrgs.map((org: any) => {
                  const matchedServices: string[] = [];
                  
                  if (userFilters.services_youth && org.services_youth) {
                    matchedServices.push("youth");
                  }
                  if (userFilters.services_families && org.services_families) {
                    matchedServices.push("families");
                  }
                  if (userFilters.services_lgbtq && org.services_lgbtq) {
                    matchedServices.push("LGBTQ+ friendly");
                  }
                  if (userFilters.services_veterans && org.services_veterans) {
                    matchedServices.push("veterans");
                  }
                  if (userFilters.wheelchair_accessible && org.wheelchair_accessible) {
                    matchedServices.push("wheelchair accessible");
                  }
                  if (userFilters.services_pets_allowed && org.services_pets_allowed) {
                    matchedServices.push("pets allowed");
                  }
                  
                  return { org, matchedServices };
                });
                
                // Take top 5 (already sorted by distance)
                const topMatches = scoredOrgs.slice(0, 5);
                
                const recommendations = topMatches.map(({ org, matchedServices }) => ({
                  id: org.uuid,
                  name: org.organization,
                  type: category.service_name,
                  address: org.address || "Address not listed - please call for location",
                  phone: org.phone || "Call 2-1-1 for contact info",
                  hours: (org as any).hours_of_operation || "Contact for hours",
                  matchReason: matchedServices.length > 0 
                    ? `Serves ${matchedServices.join(", ")}` 
                    : `${category.service_name} in Sacramento area`
                }));
                
                console.log(`Sending ${recommendations.length} recommendations for ${serviceCategory}`);
                
                const recFormat = {
                  choices: [{
                    delta: { 
                      recommendations: recommendations
                    }
                  }]
                };
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify(recFormat)}\n\n`)
                );
              } else if (toolCall.name === "provide_detailed_resource_info") {
                const resourceUuid = toolCall.args?.resource_uuid;
                
                // Find the organization across all categories
                let foundOrg: any = null;
                let foundCategory = null;
                
                for (const category of resourcesData) {
                  const org = category.organizations.find(o => o.uuid === resourceUuid);
                  if (org) {
                    foundOrg = org;
                    foundCategory = category.service_name;
                    break;
                  }
                }
                
                if (foundOrg) {
                  const services = [];
                  if (foundOrg.services_male) services.push("✓ Men");
                  if (foundOrg.services_female) services.push("✓ Women");
                  if (foundOrg.services_gender_neutral) services.push("✓ All genders");
                  if (foundOrg.services_families) services.push("✓ Families with children");
                  if (foundOrg.services_youth) services.push("✓ Youth (ages 12-17)");
                  if (foundOrg.services_seniors) services.push("✓ Seniors");
                  if (foundOrg.services_veterans) services.push("✓ Veterans");
                  if (foundOrg.services_lgbtq) services.push("✓ LGBTQ+ friendly");
                  if (foundOrg.services_pets_allowed === true) services.push("✓ Pets allowed");
                  if (foundOrg.services_pets_allowed === false) services.push("✗ No pets");
                  
                  const detailedInfo = `
**Full Details for ${foundOrg.organization}:**

📍 **Location:** ${foundOrg.address || "Address not listed - please call"}
📞 **Phone:** ${foundOrg.phone || "Call 2-1-1"}
📧 **Email:** ${foundOrg.email || "Not listed"}
🌐 **Website:** ${foundOrg.website || "Not listed"}
⏰ **Hours:** ${foundOrg.hours_of_operation || "Contact for hours"}

**Service Category:** ${foundCategory}
${"total_beds" in foundOrg && foundOrg.total_beds ? `**Total Beds:** ${foundOrg.total_beds}` : ""}
${"available_beds" in foundOrg && foundOrg.available_beds ? `**Available Beds:** ${foundOrg.available_beds}` : ""}

**Who They Serve:**
${services.join("\n")}

**Accessibility:**
${foundOrg.wheelchair_accessible ? "♿ Wheelchair accessible" : "Wheelchair accessibility not confirmed"}

**Description:**
${foundOrg.description}

**More Information:**
${foundOrg.detail_page}
`;
                  
                  const detailFormat = {
                    choices: [{
                      delta: { 
                        content: detailedInfo
                      }
                    }]
                  };
                  controller.enqueue(
                    encoder.encode(`data: ${JSON.stringify(detailFormat)}\n\n`)
                  );
                }
              }
            }
          }
          
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        } catch (error) {
          console.error('Stream error:', error);
          controller.error(error);
        }
      }
    });

    return new Response(stream, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chat error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
