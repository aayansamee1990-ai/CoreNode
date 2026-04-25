import { useState, useEffect, useRef } from "react";
import { useRoute, useLocation } from "wouter";
import { 
  useGetGeminiConversation, 
  useCreateGeminiConversation, 
  useUpdateGeminiConversation,
  getGetGeminiConversationQueryKey,
  getListGeminiConversationsQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Show, useUser, useClerk } from "@clerk/react";
import { Menu, PanelLeftClose, PanelLeft, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { ChatSidebar } from "@/components/ChatSidebar";
import { ChatMessageList } from "@/components/ChatMessageList";
import { ChatComposer } from "@/components/ChatComposer";
import { useGeminiStream } from "@/hooks/useGeminiStream";
import { cn } from "@/lib/utils";

export default function Chat() {
  const [match, params] = useRoute("/c/:id");
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { user } = useUser();
  const { signOut } = useClerk();
  
  const conversationId = match && params?.id && params.id !== "new" ? parseInt(params.id, 10) : undefined;
  
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mode, setMode] = useState<string>("general");
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState("");
  const [optimisticMessage, setOptimisticMessage] = useState<string | undefined>();
  
  const { data: conversation, isLoading: isLoadingConv } = useGetGeminiConversation(
    conversationId as number,
    { query: { enabled: !!conversationId, queryKey: getGetGeminiConversationQueryKey(conversationId as number) } }
  );

  const createConversation = useCreateGeminiConversation();
  const updateConversation = useUpdateGeminiConversation();
  const { startStream, isStreaming, streamedContent } = useGeminiStream();

  useEffect(() => {
    if (conversation) {
      setMode(conversation.mode);
      setTitleInput(conversation.title);
    } else if (!conversationId) {
      setMode("general");
      setTitleInput("New Chat");
    }
  }, [conversation, conversationId]);

  const handleModeChange = (newMode: string) => {
    setMode(newMode);
    if (conversationId) {
      updateConversation.mutate(
        { id: conversationId, data: { mode: newMode } },
        {
          onSuccess: (data) => {
            queryClient.setQueryData(getGetGeminiConversationQueryKey(conversationId), (old: any) => 
              old ? { ...old, mode: newMode } : old
            );
            queryClient.invalidateQueries({ queryKey: getListGeminiConversationsQueryKey() });
          }
        }
      );
    }
  };

  const handleTitleSubmit = () => {
    setIsEditingTitle(false);
    if (conversationId && titleInput.trim() && titleInput !== conversation?.title) {
      updateConversation.mutate(
        { id: conversationId, data: { title: titleInput.trim() } },
        {
          onSuccess: (data) => {
            queryClient.setQueryData(getGetGeminiConversationQueryKey(conversationId), (old: any) => 
              old ? { ...old, title: titleInput.trim() } : old
            );
            queryClient.invalidateQueries({ queryKey: getListGeminiConversationsQueryKey() });
          }
        }
      );
    } else if (conversation) {
      setTitleInput(conversation.title);
    }
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleTitleSubmit();
    } else if (e.key === "Escape") {
      setIsEditingTitle(false);
      setTitleInput(conversation?.title || "New Chat");
    }
  };

  const handleSend = async (content: string) => {
    if (isStreaming) return;

    if (!conversationId) {
      // Create new conversation
      const title = content.length > 50 ? content.slice(0, 50) + "..." : content;
      
      setOptimisticMessage(content);
      
      createConversation.mutate(
        { data: { title, mode } },
        {
          onSuccess: async (newConv) => {
            setLocation(`/c/${newConv.id}`);
            await startStream(newConv.id, content, () => setOptimisticMessage(undefined));
          },
          onError: () => {
            setOptimisticMessage(undefined);
          }
        }
      );
    } else {
      // Send to existing
      setOptimisticMessage(content);
      await startStream(conversationId, content, () => setOptimisticMessage(undefined));
    }
  };

  return (
    <Show when="signed-in">
      <div className="flex h-[100dvh] w-full bg-background overflow-hidden relative">
        
        {/* Desktop Sidebar */}
        <div 
          className={cn(
            "hidden md:flex flex-col border-r border-sidebar-border bg-sidebar transition-all duration-300 ease-in-out z-20",
            sidebarOpen ? "w-64" : "w-0 overflow-hidden border-r-0"
          )}
        >
          <div className="flex-1 overflow-hidden min-w-64 w-64">
            <ChatSidebar currentConversationId={conversationId} />
          </div>
          
          {/* User Profile Area */}
          <div className="p-3 border-t border-sidebar-border bg-sidebar/50 min-w-64 w-64">
            <div className="flex items-center gap-3 px-2 py-2 rounded-md hover:bg-sidebar-accent transition-colors">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user?.imageUrl} />
                <AvatarFallback className="bg-primary/10 text-primary text-xs">{user?.firstName?.[0]}</AvatarFallback>
              </Avatar>
              <div className="flex-1 overflow-hidden">
                <p className="text-sm font-medium truncate">{user?.fullName || user?.primaryEmailAddress?.emailAddress}</p>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => signOut()}>
                <LogOut className="h-4 w-4" />
                <span className="sr-only">Sign out</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0 bg-background relative z-10">
          
          {/* Header */}
          <header className="h-14 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex items-center justify-between px-4 z-20 sticky top-0">
            <div className="flex items-center gap-3 overflow-hidden">
              
              {/* Mobile Menu */}
              <div className="md:hidden">
                <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-9 w-9 -ml-2">
                      <Menu className="h-5 w-5" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="p-0 w-72 flex flex-col">
                    <div className="flex-1 overflow-hidden">
                      <ChatSidebar currentConversationId={conversationId} onCloseMobile={() => setMobileMenuOpen(false)} />
                    </div>
                    <div className="p-3 border-t bg-sidebar/50">
                      <div className="flex items-center gap-3 px-2 py-2 rounded-md hover:bg-sidebar-accent transition-colors">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={user?.imageUrl} />
                          <AvatarFallback className="bg-primary/10 text-primary">{user?.firstName?.[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 overflow-hidden">
                          <p className="text-sm font-medium truncate">{user?.fullName}</p>
                        </div>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => signOut()}>
                          <LogOut className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </SheetContent>
                </Sheet>
              </div>

              {/* Desktop Sidebar Toggle */}
              <Button 
                variant="ghost" 
                size="icon" 
                className="hidden md:flex h-9 w-9 -ml-2 text-muted-foreground hover:text-foreground"
                onClick={() => setSidebarOpen(!sidebarOpen)}
              >
                {sidebarOpen ? <PanelLeftClose className="h-5 w-5" /> : <PanelLeft className="h-5 w-5" />}
              </Button>

              {/* Title */}
              <div className="flex-1 min-w-0 flex items-center">
                {isEditingTitle ? (
                  <Input
                    autoFocus
                    value={titleInput}
                    onChange={(e) => setTitleInput(e.target.value)}
                    onBlur={handleTitleSubmit}
                    onKeyDown={handleTitleKeyDown}
                    className="h-8 text-sm font-medium px-2 py-1 max-w-[200px] border-primary/30 focus-visible:ring-1 focus-visible:ring-primary/50"
                  />
                ) : (
                  <button 
                    onClick={() => conversationId && setIsEditingTitle(true)}
                    className={cn(
                      "text-sm font-medium truncate px-2 py-1 rounded hover:bg-muted transition-colors max-w-[200px] text-left",
                      !conversationId && "pointer-events-none"
                    )}
                    disabled={!conversationId}
                  >
                    {titleInput}
                  </button>
                )}
              </div>
            </div>
          </header>

          {/* Messages */}
          <div className="flex-1 overflow-hidden relative">
            {isLoadingConv && conversationId ? (
              <div className="flex items-center justify-center h-full">
                <div className="flex space-x-2 animate-pulse">
                  <div className="w-2 h-2 bg-primary/40 rounded-full"></div>
                  <div className="w-2 h-2 bg-primary/40 rounded-full" style={{ animationDelay: "0.2s" }}></div>
                  <div className="w-2 h-2 bg-primary/40 rounded-full" style={{ animationDelay: "0.4s" }}></div>
                </div>
              </div>
            ) : (
              <ChatMessageList 
                messages={conversation?.messages || []}
                isStreaming={isStreaming}
                streamedContent={streamedContent}
                optimisticMessage={optimisticMessage}
                mode={mode}
                onSuggestionClick={handleSend}
              />
            )}
          </div>

          {/* Composer */}
          <div className="bg-background relative z-20">
            <ChatComposer 
              onSend={handleSend} 
              disabled={isStreaming || createConversation.isPending}
              mode={mode}
              onModeChange={handleModeChange}
            />
          </div>
        </div>

        {/* Global Watermark */}
        <div className="fixed bottom-6 right-6 z-[100] pointer-events-none">
          <div className="px-3 py-1.5 bg-background/80 backdrop-blur-md border border-border/50 rounded-full text-xs font-medium text-muted-foreground shadow-sm">
            AayanSamee
          </div>
        </div>

      </div>
    </Show>
  );
}
