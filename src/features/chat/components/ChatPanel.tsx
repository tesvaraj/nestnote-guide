// 🤖 AGENT: Main chat interface component
// Handles AI conversation with streaming responses from Gemini
// FRONTEND devs: UI and user interactions
// AGENT devs: Integration with edge function, message handling
// BACKEND devs: Edge function at supabase/functions/chat/index.ts

import { useState, useRef, useEffect } from "react";
import { Send, Sparkles, Bookmark, MapPin, Phone, Clock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { SavedResource } from "@/features/resources/types";
import { Message, Recommendation } from "@/features/chat/types";
import { calculateDistance } from "@/lib/distanceUtils";

const quickReplies = [
  "Find bed",
  "Food today",
  "School transport",
  "Show my plan",
];

const initialMessages: Message[] = [
  {
    id: "1",
    role: "assistant",
    content: "Hi! I'm here to help you find the support you need. What can I help you with today?",
  },
];

interface ChatPanelProps {
  savedResources: SavedResource[];
  onSaveResource: (resource: SavedResource) => void;
  location?: { lat: number; lng: number; address: string } | null;
  userProfile?: any;
  initialUserMessage?: string;  // Initial need from onboarding
}

export const ChatPanel = ({ savedResources, onSaveResource, location, userProfile, initialUserMessage }: ChatPanelProps) => {
  const [messages, setMessages] = useState<Message[]>(
    initialUserMessage 
      ? [
          initialMessages[0], // Keep the assistant greeting
          { id: "initial-user", role: "user", content: initialUserMessage } // Add user's initial need
        ]
      : initialMessages
  );
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [recDistances, setRecDistances] = useState<Record<string, number>>({});
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const handleSaveResource = (rec: Recommendation) => {
    const { matchReason, ...resource } = rec;
    onSaveResource(resource);
  };

  const isResourceSaved = (resourceId: string) => {
    return savedResources.some(r => r.id === resourceId);
  };

  // Calculate distances for recommendations
  useEffect(() => {
    if (!location) return;

    const allRecs = messages
      .filter(m => m.role === 'assistant' && m.recommendations)
      .flatMap(m => m.recommendations || []);

    const toFetch = allRecs.filter((r) => recDistances[r.id] === undefined && r.address);
    if (toFetch.length === 0) return;

    let cancelled = false;

    const fetchDistances = async () => {
      const entries: [string, number | null][] = await Promise.all(
        toFetch.map(async (r) => {
          try {
            const resp = await fetch(
              `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(r.address)}&format=json&limit=1`
            );
            const data = await resp.json();
            if (Array.isArray(data) && data.length > 0) {
              const lat = parseFloat(data[0].lat);
              const lon = parseFloat(data[0].lon);
              const miles = calculateDistance(location.lat, location.lng, lat, lon);
              return [r.id, miles] as [string, number];
            }
            return [r.id, null];
          } catch (e) {
            return [r.id, null];
          }
        })
      );

      if (!cancelled) {
        setRecDistances((prev) => {
          const next = { ...prev } as Record<string, number>;
          for (const [id, dist] of entries) {
            if (dist != null) next[id] = dist;
          }
          return next;
        });
      }
    };

    fetchDistances();
    return () => {
      cancelled = true;
    };
  }, [messages, location]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
    };

    const currentMessages = [...messages, userMessage];
    setMessages(currentMessages);
    setInput("");
    setIsLoading(true);

    try {
      // 🗄️ BACKEND: This calls the edge function at supabase/functions/chat/index.ts
      const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;
      
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: currentMessages.map(m => ({
            role: m.role,
            content: m.content
          })),
          userProfile: userProfile,
          userLocation: location
        }),
      });

      if (!resp.ok) {
        if (resp.status === 429) {
          toast({
            title: "Rate limit exceeded",
            description: "Please try again in a moment.",
            variant: "destructive",
          });
          setMessages(messages);
          return;
        }
        if (resp.status === 402) {
          toast({
            title: "Payment required",
            description: "Please add credits to continue using AI features.",
            variant: "destructive",
          });
          setMessages(messages);
          return;
        }
        throw new Error("Failed to get response");
      }

      if (!resp.body) throw new Error("No response body");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let streamDone = false;
      let assistantContent = "";

      // Add assistant message placeholder
      const assistantId = (Date.now() + 1).toString();
      setMessages([...currentMessages, {
        id: assistantId,
        role: "assistant",
        content: "",
      }]);

      // 🤖 AGENT: Stream processing - handles token-by-token AI responses
      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") {
            streamDone = true;
            break;
          }

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            const recs = parsed.choices?.[0]?.delta?.recommendations as Recommendation[] | undefined;
            
            if (content) {
              assistantContent += content;
              setMessages(prev => {
                const newMessages = [...prev];
                const lastMsg = newMessages[newMessages.length - 1];
                if (lastMsg?.role === "assistant") {
                  lastMsg.content = assistantContent;
                }
                return newMessages;
              });
            }

            if (recs) {
              setMessages(prev => {
                const newMessages = [...prev];
                const lastMsg = newMessages[newMessages.length - 1];
                if (lastMsg?.role === "assistant") {
                  lastMsg.recommendations = recs;
                }
                return newMessages;
              });
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }
    } catch (error) {
      console.error("Chat error:", error);
      toast({
        title: "Error",
        description: "Failed to get response. Please try again.",
        variant: "destructive",
      });
      setMessages(messages);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickReply = (reply: string) => {
    setInput(reply);
  };

  return (
    <div className="h-full flex flex-col bg-background">
      <div className="p-4 border-b border-panel-border flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Chat with Haven
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Ask me anything about available resources. I'm here to support you.
          </p>
        </div>
      </div>

      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4 max-w-3xl mx-auto">
          {messages.map((message, index) => (
            <div
              key={message.id}
              className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-4 ${
                  message.role === "user"
                    ? "bg-chat-user text-foreground"
                    : "bg-chat-assistant text-foreground border border-border"
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                
                {message.recommendations && message.recommendations.length > 0 && (
                  <div className="mt-4 space-y-3">
                    {message.recommendations.map((rec) => (
                      <Card key={rec.id} className="p-3 bg-secondary/30">
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div className="flex-1">
                            <h4 className="font-semibold text-sm text-foreground">{rec.name}</h4>
                            <Badge variant="secondary" className="text-xs mt-1">{rec.type}</Badge>
                          </div>
                          <Button
                            size="sm"
                            variant={isResourceSaved(rec.id) ? "secondary" : "default"}
                            onClick={() => handleSaveResource(rec)}
                            className="shrink-0"
                            disabled={isResourceSaved(rec.id)}
                          >
                            <Bookmark className="h-3.5 w-3.5 mr-1" />
                            {isResourceSaved(rec.id) ? "Saved" : "Save"}
                          </Button>
                        </div>
                        <div className="space-y-1.5 text-xs">
                          <div className="flex items-start gap-2">
                            <MapPin className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                            <span className="text-foreground">{rec.address}</span>
                          </div>
                          {rec.phone && (
                            <div className="flex items-start gap-2">
                              <Phone className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                              <span className="text-foreground">{rec.phone}</span>
                            </div>
                          )}
                          {rec.hours && (
                            <div className="flex items-start gap-2">
                              <Clock className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                              <span className="text-foreground">{rec.hours}</span>
                            </div>
                          )}
                          {location && recDistances[rec.id] !== undefined && (
                            <div className="flex items-center gap-2 pl-5">
                              <MapPin className="h-3.5 w-3.5 text-primary" />
                              <span className="text-foreground font-medium">
                                Number of miles is: {recDistances[rec.id].toFixed(1)} mi
                              </span>
                            </div>
                          )}
                          <div className="mt-2 pt-2 border-t border-border">
                            <p className="text-muted-foreground italic">{rec.matchReason}</p>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}

                {message.citations && message.citations.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-border/50 flex flex-wrap gap-1">
                    {message.citations.map((citation) => (
                      <Button
                        key={citation.id}
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-xs text-citation hover:text-citation-hover hover:bg-primary/10"
                      >
                        [{citation.id}]
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="max-w-[80%] rounded-lg p-4 bg-chat-assistant text-foreground border border-border flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Thinking...</span>
              </div>
            </div>
          )}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      <div className="p-4 border-t border-panel-border space-y-3">
        <div className="flex flex-wrap gap-2">
          {quickReplies.map((reply) => (
            <Badge
              key={reply}
              variant="secondary"
              className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
              onClick={() => handleQuickReply(reply)}
            >
              {reply}
            </Badge>
          ))}
        </div>

        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSend()}
            placeholder="Ask for help..."
            className="flex-1"
          />
          <Button onClick={handleSend} size="icon" disabled={isLoading || !input.trim()}>
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};
