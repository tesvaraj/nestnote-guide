// 📋 FRONTEND: Saved resources panel component
// Shows the user's saved/bookmarked resources

import { useState, useEffect } from "react";
import { Bookmark, MapPin, Phone, Clock, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { SavedResource } from "@/features/resources/types";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { calculateDistance } from "@/lib/distanceUtils";

interface SourcesPanelProps {
  savedResources: SavedResource[];
  onRemoveResource: (id: string) => void;
  location?: { lat: number; lng: number; address: string } | null;
}

export const SourcesPanel = ({ savedResources, onRemoveResource, location }: SourcesPanelProps) => {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedResource, setSelectedResource] = useState<SavedResource | null>(null);
  const [interacted, setInteracted] = useState<string>("");
  const [feedback, setFeedback] = useState("");
  const [distances, setDistances] = useState<Record<string, number>>({});

  // Calculate distances when location or resources change
  useEffect(() => {
    if (!location || savedResources.length === 0) return;

    const toFetch = savedResources.filter((r) => distances[r.id] === undefined && r.address);
    if (toFetch.length === 0) return;

    let cancelled = false;

    const fetchDistances = async () => {
      const entries: [string, number | null][] = await Promise.all(
        toFetch.map(async (r) => {
          try {
            const resp = await fetch(
              `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(r.address)}&format=json&limit=1`
            );
            const data = await resp.json();
            if (Array.isArray(data) && data.length > 0) {
              const lat = parseFloat(data[0].lat);
              const lon = parseFloat(data[0].lon);
              const miles = calculateDistance(location.lat, location.lng, lat, lon);
              return [r.id, miles] as [string, number];
            }
            return [r.id, null];
          } catch (e) {
            return [r.id, null];
          }
        })
      );

      if (!cancelled) {
        setDistances((prev) => {
          const next = { ...prev } as Record<string, number>;
          for (const [id, dist] of entries) {
            if (dist != null) next[id] = dist;
          }
          return next;
        });
      }
    };

    fetchDistances();
    return () => {
      cancelled = true;
    };
  }, [savedResources, location]);

  const handleDeleteClick = (resource: SavedResource) => {
    setSelectedResource(resource);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (selectedResource) {
      // Save feedback to database
      const { error } = await supabase
        .from('resource_feedback')
        .insert({
          resource_id: selectedResource.id,
          resource_name: selectedResource.name,
          feedback_data: {
            interacted,
            feedback,
            resource_type: selectedResource.type,
            timestamp: new Date().toISOString()
          }
        });

      if (error) {
        console.error("Error saving feedback:", error);
        toast({
          title: "Error",
          description: "Failed to save feedback, but resource will be removed.",
          variant: "destructive"
        });
      }

      onRemoveResource(selectedResource.id);
      setDeleteDialogOpen(false);
      setSelectedResource(null);
      setInteracted("");
      setFeedback("");
    }
  };

  const handleCancelDelete = () => {
    setDeleteDialogOpen(false);
    setSelectedResource(null);
    setInteracted("");
    setFeedback("");
  };

  return (
    <div className="h-full flex flex-col bg-background">
      <div className="p-4 border-b border-panel-border">
        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Bookmark className="h-5 w-5 text-primary" />
          Saved Resources
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          {savedResources.length} saved
        </p>
      </div>

      <ScrollArea className="flex-1 p-4">
        {savedResources.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Bookmark className="h-12 w-12 mx-auto mb-3 opacity-20" />
            <p className="text-sm">No saved resources yet</p>
            <p className="text-xs mt-1">Save resources from chat to see them here</p>
          </div>
        ) : (
          <div className="space-y-3">
            {savedResources.map((resource) => (
              <Card key={resource.id} className="relative group">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <CardTitle className="text-base">{resource.name}</CardTitle>
                      <Badge variant="secondary" className="text-xs mt-1">
                        {resource.type}
                      </Badge>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handleDeleteClick(resource)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                    <span className="text-foreground">{resource.address}</span>
                  </div>
                  {location && distances[resource.id] !== undefined && (
                    <div className="flex items-center gap-2 pl-6">
                      <MapPin className="h-4 w-4 text-primary" />
                      <span className="text-foreground font-medium text-xs">
                        Number of miles is: {distances[resource.id].toFixed(1)} mi
                      </span>
                    </div>
                  )}
                  {resource.phone && (
                    <div className="flex items-start gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                      <span className="text-foreground">{resource.phone}</span>
                    </div>
                  )}
                  {resource.hours && (
                    <div className="flex items-start gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                      <span className="text-foreground">{resource.hours}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </ScrollArea>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Remove Resource</DialogTitle>
            <DialogDescription>
              Before removing "{selectedResource?.name}", we'd love to hear about your experience.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Did you interact with this resource?</Label>
              <RadioGroup value={interacted} onValueChange={setInteracted}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="yes" id="yes" />
                  <Label htmlFor="yes" className="font-normal cursor-pointer">
                    Yes, I contacted or visited them
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="no" id="no" />
                  <Label htmlFor="no" className="font-normal cursor-pointer">
                    No, I didn't reach out
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label htmlFor="feedback">Feedback (optional)</Label>
              <Textarea
                id="feedback"
                placeholder="Tell us about your experience or why you're removing this resource..."
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                className="resize-none"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={handleCancelDelete}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleConfirmDelete}>
              Remove Resource
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
