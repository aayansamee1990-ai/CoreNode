import { useListGeminiConversations, GeminiConversation } from "@workspace/api-client-react";
import { Link, useLocation } from "wouter";
import { useState, useMemo } from "react";
import { MessageSquare, Plus, Code, FunctionSquare, LayoutGrid, Sparkles, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { isToday, isYesterday, parseISO } from "date-fns";

const baseUrl = import.meta.env.BASE_URL.replace(/\/$/, "");

interface ChatSidebarProps {
  currentConversationId?: number;
  onCloseMobile?: () => void;
}

export function ChatSidebar({ currentConversationId, onCloseMobile }: ChatSidebarProps) {
  const [, setLocation] = useLocation();
  const { data: conversations, isLoading } = useListGeminiConversations();
  const [search, setSearch] = useState("");

  const handleNewChat = () => {
    setLocation("/c/new");
    if (onCloseMobile) onCloseMobile();
  };

  const getModeIcon = (mode: string) => {
    switch (mode) {
      case "coding": return <Code className="h-3 w-3 text-sky-400" />;
      case "math": return <FunctionSquare className="h-3 w-3 text-emerald-400" />;
      case "all": return <Sparkles className="h-3 w-3 text-fuchsia-400" />;
      default: return <LayoutGrid className="h-3 w-3 text-amber-400" />;
    }
  };

  const filtered = useMemo(() => {
    if (!conversations) return [];
    const q = search.trim().toLowerCase();
    if (!q) return conversations;
    return conversations.filter((c) => (c.title || "").toLowerCase().includes(q));
  }, [conversations, search]);

  const today: GeminiConversation[] = [];
  const yesterday: GeminiConversation[] = [];
  const previous: GeminiConversation[] = [];

  filtered.forEach((conv) => {
    const date = parseISO(conv.createdAt);
    if (isToday(date)) today.push(conv);
    else if (isYesterday(date)) yesterday.push(conv);
    else previous.push(conv);
  });

  const renderGroup = (label: string, items: GeminiConversation[]) => {
    if (items.length === 0) return null;
    return (
      <div className="mb-5">
        <h3 className="px-2.5 text-[10.5px] font-semibold text-muted-foreground/80 uppercase tracking-wider mb-1.5">
          {label}
        </h3>
        <div className="space-y-0.5">
          {items.map((conv) => (
            <Link
              key={conv.id}
              href={`/c/${conv.id}`}
              onClick={() => onCloseMobile?.()}
              className={cn(
                "flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm transition-all group relative",
                currentConversationId === conv.id
                  ? "bg-primary/12 text-foreground border border-primary/25"
                  : "text-foreground/80 border border-transparent hover:bg-sidebar-accent hover:text-foreground"
              )}
            >
              <span className="flex-shrink-0">{getModeIcon(conv.mode)}</span>
              <span className="flex-1 truncate text-[13px] leading-tight">{conv.title || "Untitled"}</span>
            </Link>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-sidebar w-full">
      {/* Brand header */}
      <div className="px-4 pt-4 pb-3 flex items-center gap-2.5">
        <img src={`${baseUrl}/logo.svg`} alt="" className="h-7 w-7 rounded-lg" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold leading-tight">AayanSamee</p>
          <p className="text-[10.5px] text-muted-foreground leading-tight">AI Workbench</p>
        </div>
      </div>

      {/* New chat */}
      <div className="px-3 pb-2">
        <Button
          onClick={handleNewChat}
          className="w-full justify-start gap-2 font-medium h-9 bg-primary/10 hover:bg-primary/15 text-primary border border-primary/20 shadow-none"
          variant="ghost"
        >
          <Plus className="h-4 w-4" />
          New chat
        </Button>
      </div>

      {/* Search */}
      <div className="px-3 pb-3">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search chats..."
            className="w-full h-8 pl-8 pr-3 rounded-md bg-sidebar-accent/50 border border-transparent focus:border-border focus:outline-none text-xs placeholder:text-muted-foreground"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-2 pb-2 custom-scrollbar">
        {isLoading ? (
          <div className="px-2 py-2 space-y-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-9 bg-muted/50 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : !conversations || conversations.length === 0 ? (
          <div className="px-4 py-12 text-center text-muted-foreground text-xs flex flex-col items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-muted/40 flex items-center justify-center">
              <MessageSquare className="h-5 w-5 opacity-40" />
            </div>
            <p>No conversations yet.</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="px-4 py-8 text-center text-muted-foreground text-xs">
            No chats matching "{search}"
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
