import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SourcesPanel } from "@/features/resources/components/SourcesPanel";
import { ChatPanel } from "@/features/chat/components/ChatPanel";
import { CardsPanel } from "@/features/resources/components/CardsPanel";
import { SavedResource } from "@/features/resources/types";

const Index = () => {
  const [leftPanelOpen, setLeftPanelOpen] = useState(true);
  const [rightPanelOpen, setRightPanelOpen] = useState(true);
  const [savedResources, setSavedResources] = useState<SavedResource[]>([]);

  const handleSaveResource = (resource: SavedResource) => {
    setSavedResources(prev => {
      // Check if already saved
      if (prev.some(r => r.id === resource.id)) return prev;
      return [...prev, resource];
    });
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="h-14 border-b border-panel-border flex items-center justify-between px-4 bg-card">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLeftPanelOpen(!leftPanelOpen)}
            className="lg:hidden"
          >
            {leftPanelOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
          <h1 className="text-xl font-bold text-foreground">
            Find<span className="text-primary">Haven</span>
          </h1>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setRightPanelOpen(!rightPanelOpen)}
          className="lg:hidden"
        >
          {rightPanelOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </header>

      {/* Three-panel layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Sources */}
        <div
          className={`
            ${leftPanelOpen ? "w-full lg:w-80" : "w-0"}
            transition-all duration-300 overflow-hidden
            ${leftPanelOpen ? "block" : "hidden lg:block lg:w-0"}
            border-r border-panel-border
          `}
        >
          <SourcesPanel 
            savedResources={savedResources}
            onRemoveResource={(id) => setSavedResources(prev => prev.filter(r => r.id !== id))}
          />
        </div>

        {/* Middle Panel - Chat */}
        <div className="flex-1 min-w-0 border-r border-panel-border">
          <ChatPanel 
            savedResources={savedResources}
            onSaveResource={handleSaveResource}
          />
        </div>

        {/* Right Panel - Cards */}
        <div
          className={`
            ${rightPanelOpen ? "w-full lg:w-80" : "w-0"}
            transition-all duration-300 overflow-hidden
            ${rightPanelOpen ? "block" : "hidden lg:block lg:w-0"}
          `}
        >
          <CardsPanel />
        </div>
      </div>

      {/* Mobile panel toggles */}
      <div className="lg:hidden fixed bottom-4 left-4 right-4 flex gap-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            setLeftPanelOpen(true);
            setRightPanelOpen(false);
          }}
          className="flex-1"
        >
          Saved
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            setLeftPanelOpen(false);
            setRightPanelOpen(false);
          }}
          className="flex-1"
        >
          Chat
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            setLeftPanelOpen(false);
            setRightPanelOpen(true);
          }}
          className="flex-1"
        >
          Cards
        </Button>
      </div>
    </div>
  );
};

export default Index;
