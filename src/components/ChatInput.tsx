"use client";

import { useState, useRef, FormEvent, KeyboardEvent } from "react";
import { useChatStore, type Message } from "@/stores/useChatStore";

export function ChatInput() {
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { addMessage, appendContent, setAction, setLoading, isLoading } = useChatStore();

  async function sendMessage(content: string) {
    if (!content.trim() || isLoading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: content.trim(),
      createdAt: new Date().toISOString(),
    };
    addMessage(userMsg);
    setInput("");
    setLoading(true);

    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

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

      // Add placeholder assistant message
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
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    sendMessage(input);
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-end gap-2">
      <textarea
        ref={textareaRef}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="输入你的想法，Enter 发送..."
        rows={1}
        disabled={isLoading}
        className="flex-1 resize-none rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 py-2.5 text-sm placeholder:text-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-[var(--tomato)]/30 disabled:opacity-50"
      />
      <button
        type="submit"
        disabled={isLoading || !input.trim()}
        className="shrink-0 rounded-xl bg-[var(--tomato)] text-white px-4 py-2.5 text-sm font-medium hover:bg-[var(--tomato-dark)] disabled:opacity-40 transition-colors"
      >
        {isLoading ? "思考中..." : "发送"}
      </button>
    </form>
  );
}
