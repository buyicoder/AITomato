"use client";

import { useCallback } from "react";
import { useChatStore, type Message } from "@/stores/useChatStore";

export function useChat() {
  const { addMessage, appendContent, setAction, setLoading, isLoading } =
    useChatStore();

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || isLoading) return;

      const userMsg: Message = {
        id: Date.now().toString(),
        role: "user",
        content: content.trim(),
        createdAt: new Date().toISOString(),
      };
      addMessage(userMsg);
      setLoading(true);

      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: content.trim() }),
        });

        if (!response.ok) throw new Error("Network error");

        const reader = response.body?.getReader();
        if (!reader) throw new Error("No reader");

        const decoder = new TextDecoder();
        let buffer = "";
        const assistantId = (Date.now() + 1).toString();

        addMessage({
          id: assistantId,
          role: "assistant",
          content: "",
          createdAt: new Date().toISOString(),
        });

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            try {
              const data = JSON.parse(line.slice(6));
              if (data.type === "text") {
                appendContent(assistantId, data.content);
              } else if (data.type === "done") {
                if (data.action) {
                  setAction(assistantId, data.action, data.quickActions || []);
                }
              } else if (data.type === "error") {
                appendContent(assistantId, "\n\n⚠️ 出错了，请重试");
              }
            } catch {
              // skip malformed JSON
            }
          }
        }
      } catch {
        addMessage({
          id: (Date.now() + 2).toString(),
          role: "assistant",
          content: "抱歉，连接出了问题。请检查网络后重试。",
          createdAt: new Date().toISOString(),
        });
      } finally {
        setLoading(false);
      }
    },
    [addMessage, appendContent, setAction, setLoading, isLoading],
  );

  return { sendMessage, isLoading };
}
