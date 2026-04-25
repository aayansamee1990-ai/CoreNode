import { useListGeminiConversations, useCreateGeminiConversation, GeminiConversation } from "@workspace/api-client-react";
import { Link, useLocation } from "wouter";
import { MessageSquare, Plus, Code, FunctionSquare, LayoutGrid, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { isToday, isYesterday, parseISO } from "date-fns";

interface ChatSidebarProps {
  currentConversationId?: number;
  onCloseMobile?: () => void;
}

export function ChatSidebar({ currentConversationId, onCloseMobile }: ChatSidebarProps) {
  const [, setLocation] = useLocation();
  const { data: conversations, isLoading } = useListGeminiConversations();
  const createConversation = useCreateGeminiConversation();

  const handleNewChat = () => {
    setLocation("/c/new");
    if (onCloseMobile) onCloseMobile();
  };

  const getModeIcon = (mode: string) => {
    switch (mode) {
      case "coding": return <Code className="h-3.5 w-3.5 text-blue-500" />;
      case "math": return <FunctionSquare className="h-3.5 w-3.5 text-emerald-500" />;
      case "all": return <Sparkles className="h-3.5 w-3.5 text-purple-500" />;
      default: return <LayoutGrid className="h-3.5 w-3.5 text-orange-500" />;
    }
  };

  const getModeLabel = (mode: string) => {
    switch (mode) {
      case "coding": return "Coding";
      case "math": return "Math";
      case "all": return "All-in-One";
      default: return "General";
    }
  };

  // Group conversations
  const today: GeminiConversation[] = [];
  const yesterday: GeminiConversation[] = [];
  const previous: GeminiConversation[] = [];

  if (conversations) {
    conversations.forEach(conv => {
      const date = parseISO(conv.createdAt);
      if (isToday(date)) today.push(conv);
      else if (isYesterday(date)) yesterday.push(conv);
      else previous.push(conv);
    });
  }

  const renderGroup = (label: string, items: GeminiConversation[]) => {
    if (items.length === 0) return null;
    return (
      <div className="mb-6">
        <h3 className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{label}</h3>
        <div className="space-y-1">
          {items.map(conv => (
            <Link
              key={conv.id}
              href={`/c/${conv.id}`}
              onClick={() => onCloseMobile?.()}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors group",
                currentConversationId === conv.id 
                  ? "bg-primary/10 text-primary font-medium" 
                  : "text-foreground hover:bg-muted"
              )}
            >
              <div className="flex-1 truncate overflow-hidden whitespace-nowrap">{conv.title || "Untitled Chat"}</div>
              <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5 px-1.5 py-0.5 rounded bg-background border text-[10px] text-muted-foreground">
                {getModeIcon(conv.mode)}
                <span className="hidden lg:inline">{getModeLabel(conv.mode)}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-sidebar border-r border-sidebar-border w-full">
      <div className="p-4 flex items-center gap-2">
        <Button onClick={handleNewChat} className="w-full justify-start gap-2 shadow-none font-medium h-10" variant="secondary">
          <Plus className="h-4 w-4" />
          New chat
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-2 scroll-smooth">
        {isLoading ? (
          <div className="px-4 py-4 space-y-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-8 bg-muted rounded animate-pulse" />
            ))}
          </div>
        ) : conversations?.length === 0 ? (
          <div className="px-4 py-8 text-center text-muted-foreground text-sm flex flex-col items-center gap-3">
            <MessageSquare className="h-8 w-8 opacity-20" />
            <p>No conversations yet.</p>
          </div>
        ) : (
          <>
            {renderGroup("Today", today)}
            {renderGroup("Yesterday", yesterday)}
            {renderGroup("Previous", previous)}
          </>
        )}
      </div>
    </div>
  );
}
