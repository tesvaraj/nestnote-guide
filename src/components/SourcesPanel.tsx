import { Bookmark, MapPin, Phone, Clock, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

export interface SavedResource {
  id: string;
  name: string;
  type: string;
  address: string;
  phone?: string;
  hours?: string;
  notes?: string;
}

interface SourcesPanelProps {
  savedResources: SavedResource[];
}

export const SourcesPanel = ({ savedResources }: SourcesPanelProps) => {
  const [expandedResource, setExpandedResource] = useState<string | null>(null);

  return (
    <div className="h-full flex flex-col bg-background border-r border-panel-border">
      <div className="p-4 border-b border-panel-border">
        <div className="flex items-center gap-2">
          <Bookmark className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold text-foreground">Saved Resources</h2>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          {savedResources.length} saved from chat
        </p>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-3 space-y-2">
          {savedResources.length === 0 ? (
            <div className="text-center py-8 px-4">
              <Bookmark className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                No saved resources yet. Start chatting to get recommendations!
              </p>
            </div>
          ) : (
            savedResources.map((resource) => (
              <Card
                key={resource.id}
                className="p-3 hover:bg-secondary/50 transition-colors cursor-pointer"
                onClick={() =>
                  setExpandedResource(expandedResource === resource.id ? null : resource.id)
                }
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-2 mb-1">
                      <p className="font-medium text-sm text-foreground">
                        {resource.name}
                      </p>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {resource.type}
                    </Badge>
                  </div>
                  {expandedResource === resource.id ? (
                    <ChevronUp className="h-4 w-4 text-muted-foreground ml-2" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground ml-2" />
                  )}
                </div>

                {expandedResource === resource.id && (
                  <div className="mt-3 pt-3 border-t border-border space-y-2 text-xs">
                    <div className="flex items-start gap-2">
                      <MapPin className="h-3.5 w-3.5 text-muted-foreground mt-0.5" />
                      <span className="text-foreground">{resource.address}</span>
                    </div>
                    {resource.phone && (
                      <div className="flex items-start gap-2">
                        <Phone className="h-3.5 w-3.5 text-muted-foreground mt-0.5" />
                        <span className="text-foreground">{resource.phone}</span>
                      </div>
                    )}
                    {resource.hours && (
                      <div className="flex items-start gap-2">
                        <Clock className="h-3.5 w-3.5 text-muted-foreground mt-0.5" />
                        <span className="text-foreground">{resource.hours}</span>
                      </div>
                    )}
                    {resource.notes && (
                      <div className="mt-2 pt-2 border-t border-border">
                        <p className="text-muted-foreground italic">{resource.notes}</p>
                      </div>
                    )}
                  </div>
                )}
              </Card>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
};
