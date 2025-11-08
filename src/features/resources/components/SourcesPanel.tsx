// 📋 FRONTEND: Saved resources panel component
// Shows the user's saved/bookmarked resources

import { Bookmark, MapPin, Phone, Clock, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SavedResource } from "@/features/resources/types";

interface SourcesPanelProps {
  savedResources: SavedResource[];
  onRemoveResource: (id: string) => void;
}

export const SourcesPanel = ({ savedResources, onRemoveResource }: SourcesPanelProps) => {
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
                      onClick={() => onRemoveResource(resource.id)}
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
    </div>
  );
};
