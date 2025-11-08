import { FileText, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Source {
  id: string;
  title: string;
  type: string;
  chunks: number;
}

const mockSources: Source[] = [
  { id: "1", title: "Youth Services Guide", type: "PDF", chunks: 12 },
  { id: "2", title: "Emergency Housing Info", type: "Document", chunks: 8 },
  { id: "3", title: "School Resources", type: "PDF", chunks: 15 },
  { id: "4", title: "Food Bank Locations", type: "Document", chunks: 6 },
  { id: "5", title: "Transportation Help", type: "PDF", chunks: 10 },
];

export const SourcesPanel = () => {
  const [expandedSource, setExpandedSource] = useState<string | null>(null);

  return (
    <div className="h-full flex flex-col bg-background border-r border-panel-border">
      <div className="p-4 border-b border-panel-border">
        <h2 className="text-lg font-semibold text-foreground">Sources</h2>
        <p className="text-sm text-muted-foreground mt-1">
          {mockSources.length} documents loaded
        </p>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-3 space-y-2">
          {mockSources.map((source) => (
            <Card
              key={source.id}
              className="p-3 hover:bg-secondary/50 transition-colors cursor-pointer"
              onClick={() =>
                setExpandedSource(expandedSource === source.id ? null : source.id)
              }
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-2 flex-1">
                  <FileText className="h-4 w-4 mt-0.5 text-primary" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-foreground truncate">
                      {source.title}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {source.type} • {source.chunks} chunks
                    </p>
                  </div>
                </div>
                {expandedSource === source.id ? (
                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                )}
              </div>

              {expandedSource === source.id && (
                <div className="mt-3 pt-3 border-t border-border space-y-2">
                  <div className="text-xs bg-muted/50 p-2 rounded">
                    <span className="text-muted-foreground">Sample chunk:</span>
                    <p className="mt-1 text-foreground">
                      "Emergency housing services are available 24/7 for youth ages 12-24..."
                    </p>
                  </div>
                  <Button variant="ghost" size="sm" className="w-full text-xs">
                    View all chunks
                  </Button>
                </div>
              )}
            </Card>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};
