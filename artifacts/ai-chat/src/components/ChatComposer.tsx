import { useState, useRef, KeyboardEvent, useEffect } from "react";
import { Send, Sparkles, Code, FunctionSquare, LayoutGrid } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ChatComposerProps {
  onSend: (content: string) => void;
  disabled?: boolean;
  mode: string;
  onModeChange?: (mode: string) => void;
}

const MODES = [
  { value: "general", label: "General", Icon: LayoutGrid },
  { value: "coding", label: "Coding", Icon: Code },
  { value: "math", label: "Math", Icon: FunctionSquare },
  { value: "all", label: "All-in-One", Icon: Sparkles },
] as const;

export function ChatComposer({ onSend, disabled, mode, onModeChange }: ChatComposerProps) {
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

  return (
    <div className="w-full max-w-3xl mx-auto px-4 pb-6 pt-2">
      {/* Mode pills next to the chat */}
      <div className="flex items-center gap-1.5 mb-2 overflow-x-auto pb-1 -mx-1 px-1">
        {MODES.map(({ value, label, Icon }) => {
          const active = mode === value;
          return (
            <button
              key={value}
              type="button"
              onClick={() => onModeChange?.(value)}
              disabled={!onModeChange}
              className={cn(
                "flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border transition-all whitespace-nowrap select-none",
                active
                  ? "bg-primary/15 border-primary/40 text-primary"
                  : "bg-card/40 border-border/50 text-muted-foreground hover:bg-muted/40 hover:text-foreground hover:border-border",
                !onModeChange && "cursor-default"
              )}
            >
              <Icon className="h-3 w-3" />
              <span>{label}</span>
            </button>
          );
        })}
      </div>

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

        <div className="flex items-center justify-end px-3 pb-2.5 pt-1">
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
