import { useState } from "react";
import { Send, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations?: { id: string; page: number; text: string }[];
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
];

export const ChatPanel = () => {
  const [messages, setMessages] = useState<Message[]>(mockMessages);
  const [input, setInput] = useState("");

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
