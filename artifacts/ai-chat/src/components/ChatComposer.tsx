import { useState, useRef, KeyboardEvent, useEffect } from "react";
import { Send, Sparkles, Code, FunctionSquare, LayoutGrid, Paperclip, X, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useUpload } from "@workspace/object-storage-web";

export interface ComposerAttachment {
  objectPath: string;
  name: string;
  mimeType: string;
  size: number;
  previewUrl?: string;
}

interface ChatComposerProps {
  onSend: (content: string, attachments: ComposerAttachment[]) => void;
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

const ACCEPT = "image/*,video/*,audio/*,application/pdf,text/*";
const MAX_BYTES = 25 * 1024 * 1024;
const basePathPrefix = import.meta.env.BASE_URL.replace(/\/$/, "");

export function ChatComposer({ onSend, disabled, mode, onModeChange }: ChatComposerProps) {
  const [content, setContent] = useState("");
  const [attachments, setAttachments] = useState<ComposerAttachment[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { uploadFile, isUploading } = useUpload({
    basePath: `${basePathPrefix}/api/storage`,
    onError: (e) => setUploadError(e.message),
  });

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

  const canSend = (content.trim().length > 0 || attachments.length > 0) && !disabled && !isUploading;

  const submit = () => {
    if (!canSend) return;
    const toSend = attachments.map(({ previewUrl, ...rest }) => rest);
    onSend(content.trim(), toSend);
    setContent("");
    attachments.forEach((a) => a.previewUrl && URL.revokeObjectURL(a.previewUrl));
    setAttachments([]);
    setUploadError(null);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploadError(null);
    for (const file of Array.from(files)) {
      if (file.size > MAX_BYTES) {
        setUploadError(`${file.name} exceeds 25 MB limit`);
        continue;
      }
      const previewUrl = file.type.startsWith("image/") ? URL.createObjectURL(file) : undefined;
      const result = await uploadFile(file);
      if (result) {
        setAttachments((prev) => [
          ...prev,
          {
            objectPath: result.objectPath,
            name: file.name,
            mimeType: file.type || "application/octet-stream",
            size: file.size,
            previewUrl,
          },
        ]);
      } else if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeAttachment = (idx: number) => {
    setAttachments((prev) => {
      const next = [...prev];
      const [removed] = next.splice(idx, 1);
      if (removed?.previewUrl) URL.revokeObjectURL(removed.previewUrl);
      return next;
    });
  };

  return (
    <div className="w-full max-w-3xl mx-auto px-4 pb-6 pt-2">
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

      <div className="relative rounded-3xl border border-border/60 bg-card/60 backdrop-blur-md shadow-lg shadow-black/20 transition-all focus-within:border-primary/40 focus-within:shadow-primary/10 overflow-hidden flex flex-col">
        {(attachments.length > 0 || isUploading) && (
          <div className="flex flex-wrap gap-2 px-3 pt-3">
            {attachments.map((att, i) => (
              <div
                key={`${att.objectPath}-${i}`}
                className="group relative flex items-center gap-2 rounded-lg border border-border/60 bg-muted/40 pr-2 pl-1 py-1 max-w-[220px]"
              >
                {att.previewUrl ? (
                  <img
                    src={att.previewUrl}
                    alt={att.name}
                    className="h-10 w-10 rounded object-cover"
                  />
                ) : (
                  <div className="h-10 w-10 rounded bg-primary/10 text-primary flex items-center justify-center">
                    <FileText className="h-5 w-5" />
                  </div>
                )}
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-medium truncate">{att.name}</span>
                  <span className="text-[10px] text-muted-foreground">{att.mimeType.split("/")[0] || "file"}</span>
                </div>
                <button
                  type="button"
                  onClick={() => removeAttachment(i)}
                  className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-foreground text-background flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label="Remove attachment"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
            {isUploading && (
              <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Uploading…
              </div>
            )}
          </div>
        )}

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
          <div className="flex items-center gap-1">
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPT}
              multiple
              hidden
              onChange={(e) => handleFiles(e.target.files)}
            />
            <Button
              size="icon"
              variant="ghost"
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled || isUploading}
              className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground"
              aria-label="Attach file"
            >
              <Paperclip className="h-4 w-4" />
            </Button>
            {uploadError && (
              <span className="text-[11px] text-destructive ml-1 truncate max-w-[260px]">{uploadError}</span>
            )}
          </div>
          <Button
            size="icon"
            onClick={submit}
            disabled={!canSend}
            className={cn(
              "h-9 w-9 rounded-full transition-all duration-200",
              canSend
                ? "bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-105 shadow-md shadow-primary/30"
                : "bg-muted text-muted-foreground opacity-50"
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
