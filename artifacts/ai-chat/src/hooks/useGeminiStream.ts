import { useState, useCallback, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getGetGeminiConversationQueryKey, getListGeminiConversationsQueryKey } from "@workspace/api-client-react";

export function useGeminiStream() {
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamedContent, setStreamedContent] = useState("");
  const queryClient = useQueryClient();
  const abortControllerRef = useRef<AbortController | null>(null);

  const startStream = useCallback(
    async (
      conversationId: number,
      content: string,
      attachments: Array<{ objectPath: string; name: string; mimeType: string; size: number }>,
      onDone?: () => void,
    ) => {
      setIsStreaming(true);
      setStreamedContent("");
      
      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      try {
        const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");
        const url = `${basePath}/api/gemini/conversations/${conversationId}/messages`;

        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ content, attachments }),
          credentials: "include",
          signal: abortController.signal,
        });

        if (!response.ok) {
          throw new Error(`Failed to send message: ${response.statusText}`);
        }

        if (!response.body) {
          throw new Error("No response body");
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let done = false;
        let accumulatedContent = "";

        while (!done) {
          const { value, done: readerDone } = await reader.read();
          done = readerDone;

          if (value) {
            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split("\n");

            for (const line of lines) {
              if (line.startsWith("data: ")) {
                const dataStr = line.slice(6).trim();
                if (!dataStr) continue;

                try {
                  const data = JSON.parse(dataStr);
                  
                  if (data.content) {
                    accumulatedContent += data.content;
                    setStreamedContent(accumulatedContent);
                  }
                  
                  if (data.done) {
                    done = true;
                  }
                } catch (e) {
                  console.error("Failed to parse SSE data", e, dataStr);
                }
              }
            }
          }
        }

        // On complete
        queryClient.invalidateQueries({
          queryKey: getGetGeminiConversationQueryKey(conversationId),
        });
        queryClient.invalidateQueries({
          queryKey: getListGeminiConversationsQueryKey(),
        });
        
        if (onDone) onDone();

      } catch (error: any) {
        if (error.name !== "AbortError") {
          console.error("Stream error:", error);
        }
      } finally {
        setIsStreaming(false);
        setStreamedContent("");
        abortControllerRef.current = null;
      }
    },
    [queryClient]
  );

  const stopStream = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsStreaming(false);
    }
  }, []);

  return { startStream, stopStream, isStreaming, streamedContent };
}
