import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import Logo from "@/components/Logo";

interface WelcomeScreenProps {
  onContinue: (initialNeed?: string) => void;
}

export default function WelcomeScreen({ onContinue }: WelcomeScreenProps) {
  const [inputText, setInputText] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputText.trim()) {
      onContinue(inputText.trim());  // Pass the initial need to parent
    }
  };

  return (
    <div className="min-h-screen noise-overlay flex items-center justify-center px-4">
      <div className="max-w-3xl w-full text-center space-y-12 relative z-10">
        <div className="flex flex-col items-center mb-8">
          <Logo className="w-[500px] max-w-full h-auto" />
        </div>

        <p className="text-lg text-white/90 max-w-xl mx-auto mb-8">
          We're here to help connect you with critical resources (e.g. food, shelter) and make it easier to find what
          you need. You have full control of what information you choose to share.
        </p>

        <h1 className="text-5xl md:text-6xl font-light text-white drop-shadow-lg">How can we help?</h1>

        <form onSubmit={handleSubmit} className="space-y-6 max-w-xl mx-auto">
          <Textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Tell us about your situation..."
            className="min-h-[120px] text-lg border-2 border-glass-border bg-glass-bg/80 backdrop-blur-md text-glass-text placeholder:text-muted-foreground focus:ring-ring focus:border-glass-border resize-none shadow-sm"
          />

          <Button
            type="submit"
            size="lg"
            className="w-full md:w-auto px-12 font-medium shadow-lg"
            disabled={!inputText.trim()}
          >
            Continue
          </Button>
        </form>
      </div>
    </div>
  );
}
