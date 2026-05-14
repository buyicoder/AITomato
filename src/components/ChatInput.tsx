"use client";

import { useState, useRef, useCallback, FormEvent, KeyboardEvent } from "react";
import { useChat } from "@/hooks/useChat";

export function ChatInput() {
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { sendMessage, isLoading } = useChat();

  const autoResize = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 120) + "px";
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setInput(e.target.value);
    autoResize();
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    sendMessage(input);
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-end gap-2">
      <textarea
        ref={textareaRef}
        value={input}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder="输入你的想法，Enter 发送，Shift+Enter 换行..."
        rows={1}
        disabled={isLoading}
        className="flex-1 resize-none rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-sm placeholder:text-[var(--muted-light)] focus:outline-none focus:ring-2 focus:ring-[var(--tomato)]/40 focus:border-[var(--tomato-light)] disabled:opacity-50 transition-shadow"
      />
      <button
        type="submit"
        disabled={isLoading || !input.trim()}
        className="shrink-0 rounded-xl bg-[var(--tomato)] text-white px-5 py-2.5 text-sm font-semibold hover:bg-[var(--tomato-dark)] active:scale-95 disabled:opacity-40 disabled:scale-100 transition-all"
      >
        {isLoading ? (
          <span className="dot-typing">
            <span /><span /><span />
          </span>
        ) : (
          "发送"
        )}
      </button>
    </form>
  );
}
