import { MapPin, Bed, User, AlertCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";

export const CardsPanel = () => {
  return (
    <div className="h-full flex flex-col bg-background border-l border-panel-border">
      <div className="p-4 border-b border-panel-border">
        <h2 className="text-lg font-semibold text-foreground">Quick Actions</h2>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {/* Safety Banner */}
          <Alert className="border-accent/50 bg-accent/5">
            <AlertCircle className="h-4 w-4 text-accent" />
            <AlertDescription className="text-sm">
              You're safe here. All conversations are confidential and we're here to help.
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

          {/* Map Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                Nearby Providers
              </CardTitle>
              <CardDescription className="text-xs">
                Services in your area
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 mb-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-foreground">Safe Haven Youth Center</span>
                  <Badge variant="secondary" className="text-xs">0.3 mi</Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-foreground">Hope House</span>
                  <Badge variant="secondary" className="text-xs">0.8 mi</Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-foreground">Community Shelter</span>
                  <Badge variant="secondary" className="text-xs">1.2 mi</Badge>
                </div>
              </div>
              <Button variant="outline" size="sm" className="w-full">
                Show on Map
              </Button>
            </CardContent>
          </Card>

          {/* Book a Bed Card */}
          <Card className="border-primary/30 bg-primary/5">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Bed className="h-4 w-4 text-primary" />
                Book a Bed
              </CardTitle>
              <CardDescription className="text-xs">
                Request emergency housing
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">
                Get connected with available beds tonight
              </p>
              <Button size="sm" className="w-full">
                Request Bed
              </Button>
            </CardContent>
          </Card>

        </div>
      </ScrollArea>
    </div>
  );
};
