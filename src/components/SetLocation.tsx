import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MapPin, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface SetLocationProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLocationSet: (location: { lat: number; lng: number; address: string }) => void;
}

export default function SetLocation({ open, onOpenChange, onLocationSet }: SetLocationProps) {
  const [loading, setLoading] = useState(false);
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualLocation, setManualLocation] = useState("");

  const handleUseCurrentLocation = async () => {
    setLoading(true);
    try {
      if (!navigator.geolocation) {
        toast.error("Geolocation is not supported by your browser");
        setShowManualInput(true);
        setLoading(false);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          
          // Reverse geocode to get address
          try {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
            );
            const data = await response.json();
            const address = data.display_name || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
            
            onLocationSet({ lat: latitude, lng: longitude, address });
            toast.success("Location set successfully!");
            onOpenChange(false);
          } catch (error) {
            console.error("Error getting address:", error);
            onLocationSet({ 
              lat: latitude, 
              lng: longitude, 
              address: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}` 
            });
            toast.success("Location set successfully!");
            onOpenChange(false);
          }
          setLoading(false);
        },
        (error) => {
          console.error("Error getting location:", error);
          toast.error("Unable to get your location. Please enter manually.");
          setShowManualInput(true);
          setLoading(false);
        }
      );
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to get location");
      setShowManualInput(true);
      setLoading(false);
    }
  };

  const handleManualSubmit = async () => {
    if (!manualLocation.trim()) {
      toast.error("Please enter a city or zip code");
      return;
    }

    setLoading(true);
    try {
      // Geocode the manual input
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(manualLocation)}&format=json&limit=1`
      );
      const data = await response.json();
      
      if (data && data.length > 0) {
        const { lat, lon, display_name } = data[0];
        onLocationSet({ 
          lat: parseFloat(lat), 
          lng: parseFloat(lon), 
          address: display_name 
        });
        toast.success("Location set successfully!");
        onOpenChange(false);
        setManualLocation("");
        setShowManualInput(false);
      } else {
        toast.error("Location not found. Please try a different search.");
      }
    } catch (error) {
      console.error("Error geocoding location:", error);
      toast.error("Failed to find location");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            Set Your Location
          </DialogTitle>
          <DialogDescription>
            Share your location to find nearby resources and see distances
          </DialogDescription>
        </DialogHeader>

        {!showManualInput ? (
          <div className="space-y-4 py-4">
            <Button 
              onClick={handleUseCurrentLocation} 
              disabled={loading}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Getting location...
                </>
              ) : (
                <>
                  <MapPin className="h-4 w-4 mr-2" />
                  Use My Current Location
                </>
              )}
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or</span>
              </div>
            </div>

            <Button 
              variant="outline" 
              onClick={() => setShowManualInput(true)}
              className="w-full"
            >
              Enter City or Zip Code
            </Button>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="location">City or Zip Code</Label>
              <Input
                id="location"
                placeholder="e.g., San Francisco or 94102"
                value={manualLocation}
                onChange={(e) => setManualLocation(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleManualSubmit()}
              />
            </div>

            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => setShowManualInput(false)}
                className="flex-1"
              >
                Back
              </Button>
              <Button 
                onClick={handleManualSubmit}
                disabled={loading}
                className="flex-1"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Finding...
                  </>
                ) : (
                  "Set Location"
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
