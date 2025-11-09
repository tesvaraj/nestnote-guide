import { Button } from "@/components/ui/button";

interface UserTypeSelectionProps {
  onSelectFirstTime: () => void;
  onSelectReturning: () => void;
}

export default function UserTypeSelection({ onSelectFirstTime, onSelectReturning }: UserTypeSelectionProps) {
  return (
    <div className="min-h-screen noise-overlay flex items-center justify-center px-4">
      <div className="max-w-2xl w-full text-center space-y-8 relative z-10">
        <h2 className="text-4xl md:text-5xl font-light text-white drop-shadow-lg mb-12">
          Are you a first time user?
        </h2>
        
        <div className="flex flex-col md:flex-row gap-6 justify-center">
          <Button 
            onClick={onSelectFirstTime}
            size="lg"
            className="w-full md:w-64 h-20 text-xl font-medium shadow-lg"
          >
            First Time User
          </Button>
          
          <Button 
            onClick={onSelectReturning}
            size="lg"
            variant="outline"
            className="w-full md:w-64 h-20 text-xl font-medium shadow-lg"
          >
            Returning User
          </Button>
        </div>
      </div>
    </div>
  );
}
