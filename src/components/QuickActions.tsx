"use client";

import { useChatStore } from "@/stores/useChatStore";
import type { Message } from "@/stores/useChatStore";

export function QuickActions() {
  const quickActions = useChatStore((s) => s.quickActions);
  const addMessage = useChatStore((s) => s.addMessage);
  const setLoading = useChatStore((s) => s.setLoading);

  if (quickActions.length === 0) return null;

  async function handleClick(action: string) {
    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: action,
      createdAt: new Date().toISOString(),
    };
    addMessage(userMsg);
    setLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: action }),
      });

      if (!response.ok) throw new Error("Network error");

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No reader");

      const decoder = new TextDecoder();
      let buffer = "";
      const assistantId = (Date.now() + 1).toString();

      const { addMessage, appendContent, setAction } = useChatStore.getState();
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
            }
          } catch {
            // skip
          }
        }
      }
    } catch {
      addMessage({
        id: (Date.now() + 2).toString(),
        role: "assistant",
        content: "抱歉，出了点问题。请重试。",
        createdAt: new Date().toISOString(),
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex gap-2 mb-2 flex-wrap">
      {quickActions.map((action) => (
        <button
          key={action}
          onClick={() => handleClick(action)}
          className="text-xs rounded-full border border-[var(--border)] px-3 py-1.5 hover:bg-[var(--surface-hover)] transition-colors text-[var(--foreground)]"
        >
          {action}
        </button>
      ))}
    </div>
  );
}
