// 📋 FRONTEND: Resource cards and info panel
// Displays user profile, location, and available resources

import { useMemo, useState, useEffect } from "react";
import { MapPin, Bed, User, AlertCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { sampleShelters } from "@/data/shelters";
import { calculateDistance, formatDistance } from "@/lib/distanceUtils";
import { supabase } from "@/integrations/supabase/client";

interface CardsPanelProps {
  onUpdateProfile?: () => void;
  onSetLocation?: () => void;
  location?: { lat: number; lng: number; address: string } | null;
}

export const CardsPanel = ({ onUpdateProfile, onSetLocation, location }: CardsPanelProps) => {
  const [userName, setUserName] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('name')
          .eq('user_id', user.id)
          .single();
        
        if (profile?.name) {
          setUserName(profile.name);
        }
      }
    };
    fetchProfile();
  }, []);

  // Calculate distances for each shelter
  const sheltersWithDistance = useMemo(() => {
    if (!location) return sampleShelters.map(s => ({ ...s, distance: null }));
    
    return sampleShelters.map(shelter => ({
      ...shelter,
      distance: calculateDistance(
        location.lat,
        location.lng,
        shelter.lat,
        shelter.lng
      )
    })).sort((a, b) => (a.distance || 0) - (b.distance || 0)); // Sort by distance
  }, [location]);

  return (
    <div className="h-full flex flex-col bg-background">
      <div className="p-4 border-b border-panel-border">
        <h2 className="text-lg font-semibold text-foreground">Quick Access</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Your info and available resources
        </p>
      </div>

      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {/* Alert */}
          <Alert className="border-primary/20 bg-primary/5">
            <AlertCircle className="h-4 w-4 text-primary" />
            <AlertDescription className="text-sm">
              Update your profile for personalized recommendations
            </AlertDescription>
          </Alert>

          {/* Profile & Consent Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <User className="h-4 w-4 text-primary" />
                Profile
              </CardTitle>
              <CardDescription className="text-xs">
                {userName ? `Hi, ${userName}!` : "Your Profile"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">
                Add info to get better recommendations
              </p>
              <Button variant="outline" size="sm" className="w-full" onClick={onUpdateProfile}>
                Update Profile
              </Button>
            </CardContent>
          </Card>

          {/* Location Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                Location
              </CardTitle>
              <CardDescription className="text-xs">
                {location ? location.address.split(',').slice(0, 2).join(',') : 'Not set'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">
                {location 
                  ? "Update your location to find different nearby resources" 
                  : "Set your location to find nearby resources"}
              </p>
              <Button variant="outline" size="sm" className="w-full" onClick={onSetLocation}>
                {location ? "Change Location" : "Set Location"}
              </Button>
            </CardContent>
          </Card>

          {/* Available Beds Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Bed className="h-4 w-4 text-primary" />
                Available Beds
              </CardTitle>
              <CardDescription className="text-xs">
                {location ? "Sorted by distance from you" : "Set location to see distances"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {sheltersWithDistance.map((shelter) => (
                  <div key={shelter.id} className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-foreground font-medium">{shelter.name}</span>
                      <Badge variant="secondary">{shelter.availableBeds} beds</Badge>
                    </div>
                    {shelter.distance !== null ? (
                      <div className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-primary" />
                        <Badge variant="outline" className="text-xs font-bold">
                          {shelter.distance.toFixed(1)} miles away
                        </Badge>
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground/70 pl-5">Distance unknown</p>
                    )}
                  </div>
                ))}
                <Button variant="outline" size="sm" className="w-full mt-2">
                  Book a Bed
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </ScrollArea>
    </div>
  );
};
