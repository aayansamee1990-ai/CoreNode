import { useState, useRef, KeyboardEvent, useEffect } from "react";
import { Send, Sparkles, Code, FunctionSquare, LayoutGrid, CornerDownLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ChatComposerProps {
  onSend: (content: string) => void;
  disabled?: boolean;
  mode: string;
}

export function ChatComposer({ onSend, disabled, mode }: ChatComposerProps) {
  const [content, setContent] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
    }
  };

  useEffect(() => {
    adjustHeight();
  }, [content]);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (content.trim() && !disabled) {
        onSend(content.trim());
        setContent("");
      }
    }
  };

  const getModeIcon = () => {
    switch (mode) {
      case "coding": return <Code className="h-3 w-3" />;
      case "math": return <FunctionSquare className="h-3 w-3" />;
      case "all": return <Sparkles className="h-3 w-3" />;
      default: return <LayoutGrid className="h-3 w-3" />;
    }
  };

  const getModeLabel = () => {
    switch (mode) {
      case "coding": return "Coding";
      case "math": return "Math";
      case "all": return "All-in-One";
      default: return "General";
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto px-4 pb-6 pt-2">
      <div className="relative rounded-2xl border bg-card shadow-sm transition-shadow focus-within:shadow-md focus-within:border-primary/40 overflow-hidden flex flex-col">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Message AayanSamee AI..."
          className="w-full resize-none bg-transparent px-4 py-3.5 text-[15px] outline-none placeholder:text-muted-foreground min-h-[56px] max-h-[200px]"
          rows={1}
          disabled={disabled}
        />
        
        <div className="flex items-center justify-between px-3 pb-2.5 pt-1">
          <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground bg-muted/50 px-2.5 py-1 rounded-full select-none">
            {getModeIcon()}
            <span>{getModeLabel()}</span>
          </div>
          
          <Button
            size="icon"
            onClick={() => {
              if (content.trim() && !disabled) {
                onSend(content.trim());
                setContent("");
              }
            }}
            disabled={!content.trim() || disabled}
            className={cn(
              "h-8 w-8 rounded-full transition-all duration-200",
              content.trim() && !disabled ? "bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-105" : "bg-muted text-muted-foreground opacity-50"
            )}
          >
            <Send className="h-4 w-4 ml-0.5" />
            <span className="sr-only">Send message</span>
          </Button>
        </div>
      </div>
      <div className="text-center mt-2.5">
        <p className="text-[11px] text-muted-foreground/70 select-none">
          AayanSamee AI can make mistakes. Consider verifying important information.
        </p>
      </div>
    </div>
  );
}
