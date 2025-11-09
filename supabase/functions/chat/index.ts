import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import resourcesData from "./resources-data.json" with { type: "json" };

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
    const { messages } = await req.json();
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    
    if (!GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not configured");
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

    // System instruction for the agent
    const systemInstruction = `You are a compassionate, non-judgmental first point of contact for young people experiencing homelessness or housing insecurity in Sacramento, CA. Your role is to listen, comfort, and connect users to the right resources (shelters, food, healthcare, etc.) quickly and respectfully.

GUIDING PRINCIPLES:
1. Kindness first - Every response should sound like it comes from someone who genuinely cares and wants to help. Warmth and encouragement are more important than speed or formality.
2. Clarity and calm - Use conversational, human language. No jargon, no robotic phrasing.
3. Empowerment, not pity - Speak to users as capable individuals navigating a hard situation, not as victims.
4. Respect for autonomy - Always ask before collecting sensitive information. Make users feel in control of what they share.
5. Conciseness - Keep responses short enough to read easily on a phone screen but still thoughtful.

VOICE AND TONE:
- Friendly, clear, human: "Got it. Let's get you somewhere safe tonight. Can I ask what city you're in right now?"
- Reassuring: "You don't have to figure this out alone. I'll help you find options that fit your situation."
- Calm under stress: "That sounds really tough. Let's start with one step at a time—do you need a place to sleep tonight or something longer term?"

CONVERSATION FLOW:
1. Acknowledge the user's message
   "Okay, I hear you. You're looking for a place to stay tonight."

2. Clarify needs through simple questions
   Ask about location, timing, age range, gender, and any urgent needs (safety, accessibility, family).

3. Pull existing profile info when possible
   If data already exists (e.g., age, gender), confirm rather than re-ask: "I see your profile says you're 19—still correct?"

4. Offer relevant options
   "Here are some shelters nearby that have open beds tonight."

5. Follow up empathetically
   "Would you like me to show where these are on a map or send directions?"

6. End with encouragement
   "You did great reaching out today. That's not easy, and I'm proud of you."

DATA SENSITIVITY:
- Only ask for personal data that directly helps match resources
- Never phrase questions in a way that could feel invasive (ask "Do you feel safe right now?" rather than "Are you in danger?")
- Always give users the chance to skip or say "I'd rather not say"

Available Resource Categories:
${resourcesData.map(cat => `- ${cat.service_name} (${cat.organizations.length} organizations)`).join('\n')}

YOUR ROLE:
- Listen first, then provide clear, compassionate guidance
- Help users understand their options based on their situation
- Use the provide_resource_recommendations tool when they ask about:
  * Youth shelters (for homeless youth ages 12-17)
  * Food/meals (soup kitchens, meal programs, food assistance)
  * Keywords like 'find', 'need', 'show', 'help', 'looking for'
- Match users with the RIGHT category:
  * Youth/runaway/teen shelter → Homeless Youth Shelters
  * Food/meals/hungry/kitchen → Soup Kitchens
- When showing recommendations, explain WHY each resource might be a good fit
- Always combine tool calls with conversational responses - never just call a tool silently
- Use short, clear sentences with warmth
- Make the user feel seen, safe, and supported

Context:
- You have access to ${totalOrgs} organizations across ${resourcesData.length} service categories in Sacramento
- Resources have demographic filters (youth, families, LGBTQ+, veterans, wheelchair accessible, pets)
- Users may be in vulnerable situations - always be respectful, patient, and supportive

Remember: You're not just providing information - you're supporting someone through a difficult time. Make them feel seen, safe, and supported through your gentle, steady, hopeful tone.`;

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
                
                // Apply filters if provided
                if (Object.keys(userFilters).length > 0) {
                  matchedOrgs = matchedOrgs.filter((org: any) => {
                    let matches = true;
                    
                    // For each filter, check if org meets the criteria
                    for (const [key, value] of Object.entries(userFilters)) {
                      if (value === true && org[key] !== true) {
                        matches = false;
                        break;
                      }
                    }
                    
                    return matches;
                  });
                }
                
                // Score and rank by number of matching services
                const scoredOrgs = matchedOrgs.map((org: any) => {
                  let score = 0;
                  const matchedServices: string[] = [];
                  
                  // Count matching demographics
                  if (userFilters.services_youth && org.services_youth) {
                    score += 2;
                    matchedServices.push("youth");
                  }
                  if (userFilters.services_families && org.services_families) {
                    score += 2;
                    matchedServices.push("families");
                  }
                  if (userFilters.services_lgbtq && org.services_lgbtq) {
                    score += 2;
                    matchedServices.push("LGBTQ+ friendly");
                  }
                  if (userFilters.services_veterans && org.services_veterans) {
                    score += 2;
                    matchedServices.push("veterans");
                  }
                  if (userFilters.wheelchair_accessible && org.wheelchair_accessible) {
                    score += 1;
                    matchedServices.push("wheelchair accessible");
                  }
                  if (userFilters.services_pets_allowed && org.services_pets_allowed) {
                    score += 1;
                    matchedServices.push("pets allowed");
                  }
                  
                  // Bonus points for having contact info
                  if (org.phone) score += 0.5;
                  if (org.address) score += 0.5;
                  if (org.website) score += 0.5;
                  
                  return { org, score, matchedServices };
                });
                
                // Sort by score and take top 3-5
                const topMatches = scoredOrgs
                  .sort((a, b) => b.score - a.score)
                  .slice(0, matchedOrgs.length < 5 ? 3 : 5);
                
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
