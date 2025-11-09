import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import resourcesData from "./resources-data.json" with { type: "json" };

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

console.log(`Loaded ${resourcesData.length} resources from JSON`);

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    const ADK_SERVICE_URL = Deno.env.get("ADK_SERVICE_URL");
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    
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

    // System instruction for the agent
    const systemInstruction = `You are a warm, empathetic housing assistant for NestNote, a platform that helps people experiencing homelessness find resources and support.

CRITICAL: You MUST ALWAYS respond with conversational text. Never just call tools without talking to the user.

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

Example flow:
User: "Find bed"
You: "I'd be happy to help you find a bed tonight. Let me show you some available options. [CALL TOOL] I've shared a few shelters that currently have beds available. Are you looking for yourself, or do you have family with you? This will help me narrow down the best options for your specific situation."

Your role:
- Provide clear, compassionate guidance about housing resources, shelters, and support services
- Help users understand their options based on their profile and situation
- Use the provide_resource_recommendations tool when they ask about beds, shelters, housing, food, transport, or say find/need/plan
- When showing recommendations, explain WHY each resource might be a good fit
- Always combine tool calls with conversational responses - never just call a tool silently
- If users ask for more details about amenities, services, or specific features, use the provide_detailed_resource_info tool
- Answer questions about available beds, locations, and how to access services
- Be supportive and encouraging while maintaining professionalism

Context:
- Users may be in vulnerable situations - always be respectful, patient, and supportive
- Focus on actionable information and next steps
- Keep responses warm and conversational, not clinical
- The platform has resources including shelters, beds, and support services
- You have access to a database of ${resourcesData.length} resources with detailed information

Remember: You're not just providing information - you're supporting someone through a difficult time. Be warm, be conversational, and show you care through your words WHILE providing helpful recommendations.`;

    // Define tools for resource recommendations and details
    const tools = [{
      function_declarations: [
        {
          name: "provide_resource_recommendations",
          description: "Call this to show 3 shelter/housing recommendations when user asks about beds, shelters, housing, food, transport, school, or uses keywords like 'find', 'need', 'show plan'. IMPORTANT: Always provide conversational text response along with calling this tool - never call it silently.",
          parameters: {
            type: "OBJECT",
            properties: {
              query: {
                type: "STRING",
                description: "The user's search query or needs (e.g., 'family shelter', 'emergency bed', 'veterans housing')"
              }
            },
            required: ["query"]
          }
        },
        {
          name: "provide_detailed_resource_info",
          description: "Provide detailed information about specific resources including amenities, services, accessibility. Use when user asks for more details, amenities, or specific features. Always accompany with conversational text.",
          parameters: {
            type: "OBJECT",
            properties: {
              resource_name: {
                type: "STRING",
                description: "Name of the resource to get details about"
              }
            },
            required: ["resource_name"]
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
                // Get 3 random resources with basic info only
                const shuffled = [...resourcesData].sort(() => 0.5 - Math.random());
                const selectedResources = shuffled.slice(0, 3);
                
                const recommendations = selectedResources.map(r => ({
                  id: r.id,
                  name: r.name,
                  type: r.resource_type,
                  address: r.address,
                  phone: r.phone || "Call 2-1-1 for info",
                  hours: r.hours_of_operation || "Contact for hours",
                  matchReason: `${r.resource_type} with ${r.total_beds || 'multiple'} beds available`
                }));
                
                console.log("Sending basic recommendations:", recommendations);
                
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
                // Find the resource and send detailed info
                const resourceName = toolCall.args?.resource_name;
                const resource = resourcesData.find(r => 
                  r.name.toLowerCase().includes(resourceName?.toLowerCase() || "")
                );
                
                if (resource) {
                  const detailedInfo = `
**Full Details for ${resource.name}:**

📍 **Location:** ${resource.address}
📞 **Phone:** ${resource.phone || "Call 2-1-1"}
⏰ **Hours:** ${resource.hours_of_operation}

**Resource Type:** ${resource.resource_type}
**Total Beds:** ${resource.total_beds || "Contact for availability"}

**Services Available:**
${resource.services_families ? "✓ Families" : ""}
${resource.services_male ? "✓ Men" : ""}
${resource.services_female ? "✓ Women" : ""}
${resource.services_youth ? "✓ Youth" : ""}
${resource.services_seniors ? "✓ Seniors" : ""}
${resource.services_veterans ? "✓ Veterans" : ""}
${resource.services_lgbtq ? "✓ LGBTQ+" : ""}
${resource.services_pets_allowed ? "✓ Pets Allowed" : "✗ No Pets"}

**Amenities:**
${resource.amenities?.map((a: string) => `• ${a}`).join("\n") || "Contact for details"}

**Intake Instructions:**
${resource.intake_instructions || "Contact directly for intake process"}

${resource.wheelchair_accessible ? "♿ Wheelchair Accessible" : ""}
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
