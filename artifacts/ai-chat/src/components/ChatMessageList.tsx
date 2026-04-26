import { useEffect, useRef } from "react";
import { GeminiMessage, MessageAttachment } from "@workspace/api-client-react";
import { MarkdownContent } from "./MarkdownContent";
import { cn } from "@/lib/utils";
import { Bot, User, FileText, FileVideo, FileAudio, FileType, Sparkles } from "lucide-react";
import { useUser } from "@clerk/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const basePathPrefix = import.meta.env.BASE_URL.replace(/\/$/, "");

function attachmentSrc(att: MessageAttachment) {
  return `${basePathPrefix}/api/storage${att.objectPath}`;
}

function FileIcon({ mimeType }: { mimeType: string }) {
  if (mimeType.startsWith("video/")) return <FileVideo className="h-5 w-5" />;
  if (mimeType.startsWith("audio/")) return <FileAudio className="h-5 w-5" />;
  if (mimeType === "application/pdf") return <FileType className="h-5 w-5" />;
  return <FileText className="h-5 w-5" />;
}

function AttachmentList({ attachments, isUser }: { attachments: MessageAttachment[]; isUser: boolean }) {
  if (!attachments || attachments.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-2 mb-2">
      {attachments.map((att, i) => {
        const src = attachmentSrc(att);
        if (att.mimeType.startsWith("image/")) {
          return (
            <a
              key={i}
              href={src}
              target="_blank"
              rel="noreferrer"
              className="block overflow-hidden rounded-lg border border-border/40"
            >
              <img src={src} alt={att.name} className="max-h-64 max-w-xs object-cover" />
            </a>
          );
        }
        if (att.mimeType.startsWith("video/")) {
          return (
            <video key={i} src={src} controls className="max-h-64 max-w-xs rounded-lg border border-border/40" />
          );
        }
        if (att.mimeType.startsWith("audio/")) {
          return <audio key={i} src={src} controls className="max-w-xs" />;
        }
        return (
          <a
            key={i}
            href={src}
            target="_blank"
            rel="noreferrer"
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-lg border max-w-[260px]",
              isUser ? "bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground" : "bg-muted/40 border-border/60",
            )}
          >
            <FileIcon mimeType={att.mimeType} />
            <span className="text-xs font-medium truncate">{att.name}</span>
          </a>
        );
      })}
    </div>
  );
}

interface ChatMessageListProps {
  messages: GeminiMessage[];
  isStreaming: boolean;
  streamedContent: string;
  optimisticMessage?: string;
  mode: string;
  onSuggestionClick?: (suggestion: string) => void;
}

export function ChatMessageList({ messages, isStreaming, streamedContent, optimisticMessage, mode, onSuggestionClick }: ChatMessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const { user } = useUser();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, streamedContent, optimisticMessage]);

  const allMessages = [...messages];
  if (optimisticMessage) {
    allMessages.push({
      id: -1,
      conversationId: -1,
      role: "user",
      content: optimisticMessage,
      attachments: [],
      createdAt: new Date().toISOString(),
    });
  }

  const renderEmptyState = () => {
    type Suggestion = { text: string; category: string };
    let suggestions: Suggestion[] = [];
    let title = "How can I help you today?";
    let subtitle = "Ask anything, share a file, or pick a starter below.";
    let accentClass = "from-amber-400/30 via-primary/30 to-fuchsia-400/30";

    switch (mode) {
      case "coding":
        title = "Ready to code?";
        subtitle = "Debug, refactor, learn — paste code or screenshots.";
        accentClass = "from-sky-400/30 via-primary/30 to-cyan-400/30";
        suggestions = [
          { text: "Explain how React Server Components work", category: "Concept" },
          { text: "Write a Python script to scrape a website", category: "Build" },
          { text: "Help me debug a CORS error in my API", category: "Debug" },
          { text: "Refactor this code to be more readable", category: "Refactor" },
        ];
        break;
      case "math":
        title = "Math & Logic";
        subtitle = "From algebra to advanced calculus, with clean LaTeX.";
        accentClass = "from-emerald-400/30 via-primary/30 to-teal-400/30";
        suggestions = [
          { text: "Explain the Fourier transform intuitively", category: "Intuition" },
          { text: "Solve this system of linear equations", category: "Solve" },
          { text: "Difference between a derivative and integral?", category: "Concept" },
          { text: "Help me understand matrix multiplication", category: "Learn" },
        ];
        break;
      case "all":
        title = "All-in-One Assistant";
        subtitle = "Your versatile AI companion for any task.";
        accentClass = "from-fuchsia-400/30 via-primary/30 to-pink-400/30";
        suggestions = [
          { text: "Draft an email to my manager about a delay", category: "Write" },
          { text: "Summarize the key themes of 'Dune'", category: "Analyze" },
          { text: "Create a 7-day workout plan for beginners", category: "Plan" },
          { text: "Some quick, healthy dinner recipes?", category: "Ideas" },
        ];
        break;
      default:
        suggestions = [
          { text: "Help me plan a weekend trip to Tokyo", category: "Plan" },
          { text: "What are the benefits of meditation?", category: "Learn" },
          { text: "How do I negotiate a salary offer?", category: "Advice" },
          { text: "Explain quantum computing to a 5 year old", category: "ELI5" },
        ];
        break;
    }

    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 max-w-3xl mx-auto w-full">
        <div className="relative mb-6">
          <div className={cn("absolute inset-0 rounded-2xl bg-gradient-to-br blur-xl opacity-80", accentClass)} />
          <div className="relative w-16 h-16 bg-card border border-border/60 rounded-2xl flex items-center justify-center shadow-xl">
            <Sparkles className="h-7 w-7 text-primary" />
          </div>
        </div>
        <h2 className="text-3xl md:text-4xl font-semibold mb-3 tracking-tight text-center">
          <span className="text-gradient">{title}</span>
        </h2>
        <p className="text-muted-foreground text-center mb-10 text-[15px] max-w-md">{subtitle}</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full max-w-2xl">
          {suggestions.map((s, i) => (
            <button
              key={i}
              onClick={() => onSuggestionClick?.(s.text)}
              className="text-left p-4 rounded-2xl border border-border/60 bg-card/40 hover:bg-card hover:border-primary/30 transition-all group backdrop-blur-sm"
            >
              <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 mb-1">
                {s.category}
              </div>
              <div className="text-sm leading-snug text-foreground/90 group-hover:text-foreground transition-colors">
                {s.text}
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  };

  if (allMessages.length === 0 && !isStreaming) {
    return (
      <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col h-full w-full">
        {renderEmptyState()}
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar pb-6 pt-4 h-full w-full">
      <div className="max-w-3xl mx-auto w-full px-4 flex flex-col gap-6">
        {allMessages.map((msg, index) => {
          const isUser = msg.role === "user";
          
          return (
            <div 
              key={msg.id === -1 ? `opt-${index}` : msg.id} 
              className={cn("flex w-full", isUser ? "justify-end" : "justify-start")}
            >
              <div className={cn(
                "flex max-w-[85%] md:max-w-[75%]", 
                isUser ? "flex-row-reverse" : "flex-row"
              )}>
                {/* Avatar */}
                <div className={cn("flex-shrink-0", isUser ? "ml-2.5" : "mr-2.5")}>
                  {isUser ? (
                    <Avatar className="h-7 w-7 border border-border/40 shadow-sm">
                      <AvatarImage src={user?.imageUrl} />
                      <AvatarFallback className="bg-primary/10 text-primary text-xs"><User className="h-3.5 w-3.5" /></AvatarFallback>
                    </Avatar>
                  ) : (
                    <div className="h-7 w-7 rounded-full bg-gradient-to-br from-primary/30 to-fuchsia-500/30 text-primary flex items-center justify-center border border-primary/30 shadow-sm">
                      <Sparkles className="h-3.5 w-3.5" />
                    </div>
                  )}
                </div>

                {/* Message Bubble */}
                <div className={cn(
                  "px-4 py-3 rounded-2xl text-[15px] leading-relaxed",
                  isUser
                    ? "bg-primary text-primary-foreground rounded-tr-md shadow-md shadow-primary/20"
                    : "bg-card/70 border border-border/50 rounded-tl-md text-foreground backdrop-blur-sm"
                )}>
                  <AttachmentList attachments={msg.attachments ?? []} isUser={isUser} />
                  {msg.content && (
                    isUser ? (
                      <div className="whitespace-pre-wrap">{msg.content}</div>
                    ) : (
                      <MarkdownContent content={msg.content} />
                    )
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {/* Streaming Content */}
        {isStreaming && streamedContent && (
          <div className="flex w-full justify-start animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex max-w-[85%] md:max-w-[75%] flex-row">
              <div className="flex-shrink-0 mr-2.5">
                <div className="h-7 w-7 rounded-full bg-gradient-to-br from-primary/30 to-fuchsia-500/30 text-primary flex items-center justify-center border border-primary/30 shadow-sm">
                  <Sparkles className="h-3.5 w-3.5" />
                </div>
              </div>
              <div className="px-4 py-3 rounded-2xl text-[15px] leading-relaxed bg-card/70 border border-border/50 rounded-tl-md text-foreground w-full backdrop-blur-sm">
                <MarkdownContent content={streamedContent} />
                <span className="inline-block w-1.5 h-4 ml-1 bg-primary animate-pulse align-middle rounded-sm"></span>
              </div>
            </div>
          </div>
        )}

        {/* Loading Indicator */}
        {isStreaming && !streamedContent && (
          <div className="flex w-full justify-start animate-in fade-in duration-300">
            <div className="flex max-w-[85%] md:max-w-[75%] flex-row">
              <div className="flex-shrink-0 mr-2.5">
                <div className="h-7 w-7 rounded-full bg-gradient-to-br from-primary/30 to-fuchsia-500/30 text-primary flex items-center justify-center border border-primary/30 shadow-sm">
                  <Sparkles className="h-3.5 w-3.5 animate-pulse" />
                </div>
              </div>
              <div className="px-4 py-3.5 rounded-2xl bg-card/70 border border-border/50 rounded-tl-md text-foreground flex items-center gap-1 backdrop-blur-sm">
                <div className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: "0ms" }}></div>
                <div className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: "150ms" }}></div>
                <div className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: "300ms" }}></div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={bottomRef} className="h-1 pb-4" />
      </div>
    </div>
  );
}
