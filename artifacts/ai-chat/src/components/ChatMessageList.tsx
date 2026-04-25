import { useEffect, useRef, useState } from "react";
import { GeminiMessage } from "@workspace/api-client-react";
import { MarkdownContent } from "./MarkdownContent";
import { cn } from "@/lib/utils";
import { Bot, User } from "lucide-react";
import { useUser } from "@clerk/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

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
      createdAt: new Date().toISOString(),
    });
  }

  const renderEmptyState = () => {
    let suggestions = [];
    let title = "What's on your mind?";
    let subtitle = "I can help you explore ideas, solve problems, or learn something new.";

    switch (mode) {
      case "coding":
        title = "Ready to code?";
        subtitle = "Let's build something together or debug an issue.";
        suggestions = [
          "Explain how React Server Components work",
          "Write a python script to scrape a website",
          "Help me debug a CORS error in my API",
          "Refactor this code to be more readable"
        ];
        break;
      case "math":
        title = "Math & Logic";
        subtitle = "From algebra to advanced calculus.";
        suggestions = [
          "Explain the Fourier transform intuitively",
          "Solve this system of linear equations",
          "What is the difference between a derivative and integral?",
          "Help me understand matrix multiplication"
        ];
        break;
      case "all":
        title = "All-in-One Assistant";
        subtitle = "Your versatile AI companion for any task.";
        suggestions = [
          "Draft an email to my manager about a project delay",
          "Summarize the key themes of 'Dune'",
          "Create a 7-day workout plan for beginners",
          "What are some quick, healthy dinner recipes?"
        ];
        break;
      default:
        suggestions = [
          "Help me plan a weekend trip to Tokyo",
          "What are the benefits of meditation?",
          "How do I negotiate a salary offer?",
          "Explain quantum computing to a 5 year old"
        ];
        break;
    }

    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 max-w-3xl mx-auto w-full mt-12 md:mt-24">
        <div className="w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mb-6 shadow-sm">
          <Bot className="h-8 w-8" />
        </div>
        <h2 className="text-3xl font-semibold mb-3 tracking-tight text-center">{title}</h2>
        <p className="text-muted-foreground text-center mb-10">{subtitle}</p>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
          {suggestions.map((suggestion, i) => (
            <button
              key={i}
              onClick={() => onSuggestionClick?.(suggestion)}
              className="text-left px-4 py-3 rounded-xl border bg-card hover:bg-accent hover:border-accent-foreground/20 transition-all text-sm shadow-sm group"
            >
              <span className="text-foreground group-hover:text-primary transition-colors">{suggestion}</span>
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
                <div className={cn("flex-shrink-0", isUser ? "ml-3" : "mr-3")}>
                  {isUser ? (
                    <Avatar className="h-8 w-8 border shadow-sm">
                      <AvatarImage src={user?.imageUrl} />
                      <AvatarFallback className="bg-primary/10 text-primary text-xs"><User className="h-4 w-4" /></AvatarFallback>
                    </Avatar>
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center border border-primary/20 shadow-sm">
                      <Bot className="h-4 w-4" />
                    </div>
                  )}
                </div>

                {/* Message Bubble */}
                <div className={cn(
                  "px-5 py-3.5 rounded-2xl shadow-sm text-[15px] leading-relaxed",
                  isUser 
                    ? "bg-primary text-primary-foreground rounded-tr-sm" 
                    : "bg-card border rounded-tl-sm text-foreground"
                )}>
                  {isUser ? (
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                  ) : (
                    <MarkdownContent content={msg.content} />
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
              <div className="flex-shrink-0 mr-3">
                <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center border border-primary/20 shadow-sm">
                  <Bot className="h-4 w-4" />
                </div>
              </div>
              <div className="px-5 py-3.5 rounded-2xl shadow-sm text-[15px] leading-relaxed bg-card border rounded-tl-sm text-foreground w-full">
                <MarkdownContent content={streamedContent} />
                <span className="inline-block w-2 h-4 ml-1 bg-primary animate-pulse align-middle"></span>
              </div>
            </div>
          </div>
        )}

        {/* Loading Indicator (if streaming hasn't yielded content yet) */}
        {isStreaming && !streamedContent && (
          <div className="flex w-full justify-start animate-in fade-in duration-300">
            <div className="flex max-w-[85%] md:max-w-[75%] flex-row">
              <div className="flex-shrink-0 mr-3">
                <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center border border-primary/20 shadow-sm">
                  <Bot className="h-4 w-4" />
                </div>
              </div>
              <div className="px-5 py-4 rounded-2xl shadow-sm bg-card border rounded-tl-sm text-foreground flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "0ms" }}></div>
                <div className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "150ms" }}></div>
                <div className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "300ms" }}></div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={bottomRef} className="h-1 pb-4" />
      </div>
    </div>
  );
}
