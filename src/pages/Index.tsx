import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SourcesPanel } from "@/features/resources/components/SourcesPanel";
import { ChatPanel } from "@/features/chat/components/ChatPanel";
import { CardsPanel } from "@/features/resources/components/CardsPanel";
import { SavedResource } from "@/features/resources/types";
import GradientBackground from "@/components/GradientBackground";
import SignupWelcome from "@/components/SignupWelcome";
import IntakeForm from "@/components/IntakeForm";
import UpdateProfile from "@/components/UpdateProfile";
import SetLocation from "@/components/SetLocation";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const navigate = useNavigate();
  const [leftPanelOpen, setLeftPanelOpen] = useState(true);
  const [rightPanelOpen, setRightPanelOpen] = useState(true);
  const [savedResources, setSavedResources] = useState<SavedResource[]>([]);
  const [showWelcome, setShowWelcome] = useState(true);
  const [showIntakeForm, setShowIntakeForm] = useState(false);
  const [hasProfile, setHasProfile] = useState(false);
  const [showUpdateProfile, setShowUpdateProfile] = useState(false);
  const [showSetLocation, setShowSetLocation] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lng: number; address: string } | null>(null);
  const [user, setUser] = useState<any>(null);
  const [session, setSession] = useState<any>(null);
  const [signupCredentials, setSignupCredentials] = useState<{ email: string; password: string } | null>(null);
  const [profileData, setProfileData] = useState<any>(null);

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, currentSession) => {
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      
      // Defer profile check
      if (currentSession?.user) {
        setTimeout(() => {
          checkProfile();
        }, 0);
      }
    });

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      if (currentSession?.user) {
        checkProfile();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkProfile = async () => {
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (currentUser && !currentUser.is_anonymous) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', currentUser.id)
          .single();
        
        if (profile) {
          setProfileData(profile);
          setHasProfile(true);
          setShowWelcome(false);
          setShowIntakeForm(false);
        } else {
          // User exists but no profile - show intake
          setShowWelcome(false);
          setShowIntakeForm(true);
        }
      }
    } catch (error) {
      console.log("No profile yet");
    }
  };

  const handleWelcomeContinue = (email: string, password: string) => {
    setSignupCredentials({ email, password });
    setShowWelcome(false);
    setShowIntakeForm(true);
  };

  const handleIntakeComplete = () => {
    setShowIntakeForm(false);
    setHasProfile(true);
    setSignupCredentials(null);
    checkProfile();
  };

  const handleSaveResource = (resource: SavedResource) => {
    setSavedResources(prev => {
      if (prev.some(r => r.id === resource.id)) return prev;
      return [...prev, resource];
    });
  };

  // Show signup welcome if no user
  if (showWelcome && !user) {
    return (
      <>
        <GradientBackground />
        <SignupWelcome 
          onContinue={handleWelcomeContinue}
          onLogin={() => navigate("/auth")}
        />
      </>
    );
  }

  if (showIntakeForm) {
    return (
      <div className="relative min-h-screen">
        {/* Background with main interface */}
        <div className="absolute inset-0">
          <GradientBackground />
          {/* Show blurred main interface in background */}
          <div className="h-screen flex flex-col blur-sm opacity-50 pointer-events-none">
            <header className="h-14 border-b border-panel-border flex items-center justify-between px-4 bg-gradient-to-br from-[hsl(var(--gradient-yellow))] via-[hsl(var(--gradient-blue-light))] to-[hsl(var(--gradient-blue))]">
              <h1 className="text-3xl font-['Cute_Font'] text-white drop-shadow-lg">
                Haven
              </h1>
            </header>
            <div className="flex-1 grid grid-cols-3 overflow-hidden">
              <div className="border-r border-panel-border bg-background"></div>
              <div className="border-r border-panel-border bg-background"></div>
              <div className="bg-background"></div>
            </div>
          </div>
        </div>

        {/* Sheer white overlay */}
        <div className="absolute inset-0 bg-white/40 backdrop-blur-sm"></div>

        {/* Intake form modal */}
        <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
          <div className="bg-background/95 backdrop-blur-md rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
            <div className="overflow-y-auto max-h-[90vh] p-8">
              <IntakeForm 
                onComplete={handleIntakeComplete}
                email={signupCredentials?.email}
                password={signupCredentials?.password}
              />
            </div>
          </div>
        </div>
      </div>
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
            {user && !user.is_anonymous ? (
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/20"
                onClick={async () => {
                  await supabase.auth.signOut();
                  navigate("/auth");
                }}
              >
                Logout
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/20"
                onClick={() => navigate("/auth")}
              >
                Login
              </Button>
            )}
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
        
        {/* Set Location Dialog */}
        <SetLocation 
          open={showSetLocation} 
          onOpenChange={setShowSetLocation}
          onLocationSet={setLocation}
        />

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
              location={location}
            />
          </div>

          {/* Middle Panel - Chat */}
          <div className="flex-1 min-w-0 border-r border-panel-border">
              <ChatPanel 
                savedResources={savedResources}
                onSaveResource={handleSaveResource}
                location={location}
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
            <CardsPanel 
              onUpdateProfile={() => setShowUpdateProfile(true)}
              onSetLocation={() => setShowSetLocation(true)}
              location={location}
            />
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
