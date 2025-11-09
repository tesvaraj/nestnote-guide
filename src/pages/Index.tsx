import { useState, useEffect } from "react";
import { Menu, X, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SourcesPanel } from "@/features/resources/components/SourcesPanel";
import { ChatPanel } from "@/features/chat/components/ChatPanel";
import { CardsPanel } from "@/features/resources/components/CardsPanel";
import { SavedResource } from "@/features/resources/types";
import GradientBackground from "@/components/GradientBackground";
import WelcomeScreen from "@/components/WelcomeScreen";
import IntakeForm from "@/components/IntakeForm";
import UpdateProfile from "@/components/UpdateProfile";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const [leftPanelOpen, setLeftPanelOpen] = useState(true);
  const [rightPanelOpen, setRightPanelOpen] = useState(true);
  const [savedResources, setSavedResources] = useState<SavedResource[]>([]);
  const [showWelcome, setShowWelcome] = useState(true);
  const [showIntakeForm, setShowIntakeForm] = useState(false);
  const [hasProfile, setHasProfile] = useState(false);
  const [showUpdateProfile, setShowUpdateProfile] = useState(false);

  useEffect(() => {
    checkProfile();
  }, []);

  const checkProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();
        
        if (profile) {
          setHasProfile(true);
          setShowWelcome(false);
        }
      }
    } catch (error) {
      console.log("No profile yet, showing onboarding");
    }
  };

  const handleWelcomeContinue = () => {
    setShowWelcome(false);
    setShowIntakeForm(true);
  };

  const handleIntakeComplete = () => {
    setShowIntakeForm(false);
    setHasProfile(true);
  };

  const handleSaveResource = (resource: SavedResource) => {
    setSavedResources(prev => {
      if (prev.some(r => r.id === resource.id)) return prev;
      return [...prev, resource];
    });
  };

  // Show onboarding if no profile
  if (showWelcome) {
    return (
      <>
        <GradientBackground />
        <WelcomeScreen onContinue={handleWelcomeContinue} />
      </>
    );
  }

  if (showIntakeForm) {
    return (
      <>
        <GradientBackground />
        <IntakeForm onComplete={handleIntakeComplete} />
      </>
    );
  }

  // Main app view
  return (
    <>
      <GradientBackground />
      <div className="h-screen flex flex-col relative z-10">
        {/* Header */}
        <header className="h-14 border-b border-panel-border flex items-center justify-between px-4 relative overflow-hidden">
          {/* Gradient background matching intake stage */}
          <div className="absolute inset-0 bg-gradient-to-br from-[hsl(var(--gradient-yellow))] via-[hsl(var(--gradient-blue-light))] to-[hsl(var(--gradient-blue))] -z-10" />
          
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLeftPanelOpen(!leftPanelOpen)}
              className="lg:hidden text-white hover:bg-white/20"
            >
              {leftPanelOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
            <h1 className="text-3xl font-['Cute_Font'] text-white drop-shadow-lg">
              Haven
            </h1>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowUpdateProfile(true)}
              className="text-white hover:bg-white/20"
              title="Update Profile"
            >
              <User className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setRightPanelOpen(!rightPanelOpen)}
              className="lg:hidden text-white hover:bg-white/20"
            >
              {rightPanelOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </header>

        {/* Update Profile Dialog */}
        <UpdateProfile open={showUpdateProfile} onOpenChange={setShowUpdateProfile} />

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
    </>
  );
};

export default Index;
