import { useState } from "react";
import { Send, Sparkles, Bookmark, MapPin, Phone, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { SavedResource } from "@/components/SourcesPanel";

interface Recommendation extends SavedResource {
  matchReason: string;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations?: { id: string; page: number; text: string }[];
  recommendations?: Recommendation[];
}

const quickReplies = [
  "Find bed",
  "Food today",
  "School transport",
  "Show my plan",
];

const mockMessages: Message[] = [
  {
    id: "1",
    role: "assistant",
    content: "Hi! I'm here to help you find the support you need. What can I help you with today?",
  },
  {
    id: "2",
    role: "user",
    content: "Find me a bed that I can get housing within one to two week time",
  },
  {
    id: "3",
    role: "assistant",
    content: "I found some emergency housing options that can help you within 1-2 weeks. Here are my top recommendations:",
    recommendations: [
      {
        id: "rec-1",
        name: "Youth Emergency Shelter",
        type: "Emergency Housing",
        address: "123 Main St",
        phone: "(555) 123-4567",
        hours: "24/7 intake",
        matchReason: "Immediate placement available for ages 12-24"
      },
      {
        id: "rec-2",
        name: "Safe Haven Transitional Housing",
        type: "Transitional Housing",
        address: "789 Elm St",
        phone: "(555) 345-6789",
        hours: "Mon-Fri 9am-6pm",
        matchReason: "1-2 week wait list, up to 6 month stay"
      }
    ]
  },
];

interface ChatPanelProps {
  savedResources: SavedResource[];
  onSaveResource: (resource: SavedResource) => void;
}

export const ChatPanel = ({ savedResources, onSaveResource }: ChatPanelProps) => {
  const [messages, setMessages] = useState<Message[]>(mockMessages);
  const [input, setInput] = useState("");

  const handleSaveResource = (rec: Recommendation) => {
    const { matchReason, ...resource } = rec;
    onSaveResource(resource);
  };

  const isResourceSaved = (resourceId: string) => {
    return savedResources.some(r => r.id === resourceId);
  };

  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
    };

    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: "assistant",
      content: `Emergency housing is available for youth ages 12-24 at several locations [1][2]. Services include safe overnight shelter, meals, and case management support [1].`,
      citations: [
        { id: "1", page: 3, text: "Emergency housing services available 24/7" },
        { id: "2", page: 5, text: "Youth ages 12-24 eligible for services" },
      ],
    };

    setMessages([...messages, userMessage, assistantMessage]);
    setInput("");
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
            GuideChat
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Ask me anything about available services
          </p>
        </div>
      </div>

      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4 max-w-3xl mx-auto">
          {messages.map((message) => (
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
          <Button onClick={handleSend} size="icon">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
