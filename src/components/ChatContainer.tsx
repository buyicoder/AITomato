"use client";

import { useRef, useEffect } from "react";
import { useChatStore } from "@/stores/useChatStore";
import { useChat } from "@/hooks/useChat";
import { MessageList } from "./MessageList";
import { ChatInput } from "./ChatInput";
import { QuickActions } from "./QuickActions";

const SUGGESTIONS = [
  { text: "添加任务：写周报，明天交", icon: "📝" },
  { text: "开始做写周报", icon: "▶️" },
  { text: "今天做了什么", icon: "📊" },
];

export function ChatContainer() {
  const { isLoading, messages } = useChatStore();
  const { sendMessage } = useChat();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-6 py-6">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-4">
              <div className="text-7xl mb-6">🍅</div>
              <h2 className="text-2xl font-bold mb-2 tracking-tight">欢迎使用 AITomato</h2>
              <p className="text-[var(--muted)] max-w-sm leading-relaxed mb-8 text-sm">
                用自然语言管理你的专注时间，AI 帮你搞定一切
              </p>
              <div className="flex flex-col gap-2.5 w-full max-w-[300px]">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s.text}
                    onClick={() => sendMessage(s.text)}
                    disabled={isLoading}
                    className="flex items-center gap-3 text-left text-sm border border-[var(--border)] rounded-xl px-5 py-3.5 hover:bg-[var(--tomato-soft)] hover:text-[var(--tomato)] hover:border-[var(--tomato-light)] active:scale-[0.98] transition-all disabled:opacity-50 group"
                  >
                    <span className="text-lg group-hover:scale-110 transition-transform">{s.icon}</span>
                    <span>{s.text}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <MessageList />
          )}
        </div>
      </div>
      <div className="shrink-0 border-t border-[var(--border)] bg-[var(--surface)]">
        <div className="max-w-3xl mx-auto p-4">
          <QuickActions />
          <ChatInput />
        </div>
      </div>
    </div>
  );
}
