// 📋 FRONTEND: Resource cards and info panel
// Displays user profile, location, and available resources

import { MapPin, Bed, User, AlertCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";

export const CardsPanel = () => {
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
                Anonymous user
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">
                Add info to get better recommendations
              </p>
              <Button variant="outline" size="sm" className="w-full">
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
                Not set
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">
                Set your location to find nearby resources
              </p>
              <Button variant="outline" size="sm" className="w-full">
                Set Location
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
                Near you
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Emergency</span>
                  <Badge variant="secondary">12 beds</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Youth</span>
                  <Badge variant="secondary">5 beds</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Family</span>
                  <Badge variant="secondary">3 beds</Badge>
                </div>
                <Button variant="outline" size="sm" className="w-full mt-3">
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
