import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

    // Check if this is a resource search query
    const lastMessage = messages[messages.length - 1]?.content?.toLowerCase() || "";
    const isResourceQuery = lastMessage.includes("bed") || 
                           lastMessage.includes("shelter") || 
                           lastMessage.includes("housing") ||
                           lastMessage.includes("find") ||
                           lastMessage.includes("need");

    // Build conversation history in Gemini format
    const contents = messages.map((msg: any) => ({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [{ text: msg.content }]
    }));

    // System instruction for the agent
    const systemInstruction = `You are a helpful and empathetic housing assistant for NestNote, a platform that helps people experiencing homelessness find resources and support.

Your role:
- Provide clear, compassionate guidance about housing resources, shelters, and support services
- Help users understand their options based on their profile and situation
- When users search for beds, shelters, or housing, provide 3-5 specific resource recommendations
- Answer questions about available beds, locations, and how to access services
- Be supportive and encouraging while maintaining professionalism
- When relevant, suggest updating their profile to get better-matched resources

Context:
- Users may be in vulnerable situations - always be respectful and supportive
- Focus on actionable information and next steps
- Keep responses concise but helpful
- The platform has resources including shelters, beds, and support services

Current capabilities:
- General guidance about housing and homelessness resources
- Information about the NestNote platform
- Help with understanding how to use the service
- Emotional support and encouragement
- Providing specific shelter and bed recommendations that users can save`;

    // Define the tool for resource recommendations
    const tools = isResourceQuery ? [{
      function_declarations: [{
        name: "provide_resource_recommendations",
        description: "Provide 3-5 specific shelter or housing resource recommendations based on the user's needs",
        parameters: {
          type: "OBJECT",
          properties: {
            recommendations: {
              type: "ARRAY",
              description: "List of 3-5 resource recommendations",
              items: {
                type: "OBJECT",
                properties: {
                  id: {
                    type: "STRING",
                    description: "Unique identifier for the resource"
                  },
                  name: {
                    type: "STRING",
                    description: "Name of the shelter or resource"
                  },
                  type: {
                    type: "STRING",
                    description: "Type of resource (e.g., 'Emergency Shelter', 'Transitional Housing', 'Day Center')"
                  },
                  address: {
                    type: "STRING",
                    description: "Full address of the resource"
                  },
                  phone: {
                    type: "STRING",
                    description: "Contact phone number"
                  },
                  hours: {
                    type: "STRING",
                    description: "Operating hours or availability"
                  },
                  matchReason: {
                    type: "STRING",
                    description: "Brief explanation of why this resource matches the user's needs"
                  }
                },
                required: ["id", "name", "type", "address", "matchReason"]
              }
            }
          },
          required: ["recommendations"]
        }
      }]
    }] : undefined;

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
                  if (functionCall && functionCall.name === "provide_resource_recommendations") {
                    toolCalls.push(functionCall);
                  }
                } catch (e) {
                  console.error('Failed to parse SSE data:', e);
                }
              }
            }
          }
          
          // After streaming text, send recommendations if any tool calls were made
          if (toolCalls.length > 0 && toolCalls[0].args?.recommendations) {
            const recommendations = toolCalls[0].args.recommendations;
            console.log("Sending recommendations:", recommendations);
            
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
