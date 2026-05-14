"use client";

import { useRef, useEffect } from "react";
import { useChatStore } from "@/stores/useChatStore";
import { useChat } from "@/hooks/useChat";
import { MessageList } from "./MessageList";
import { ChatInput } from "./ChatInput";
import { QuickActions } from "./QuickActions";

const SUGGESTIONS = [
  "添加任务：写周报，明天交",
  "开始做写周报",
  "今天做了什么",
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
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="text-6xl mb-5 opacity-80">🍅</div>
            <h2 className="text-xl font-bold mb-2 tracking-tight">欢迎使用 AITomato</h2>
            <p className="text-[var(--muted)] max-w-sm leading-relaxed mb-6 text-sm">
              用自然语言管理你的专注时间，
              <br />
              AI 帮你搞定一切。
            </p>
            <div className="flex flex-col gap-2 w-full max-w-[260px]">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => sendMessage(s)}
                  disabled={isLoading}
                  className="text-sm text-[var(--muted)] border border-[var(--border)] rounded-xl px-4 py-2.5 hover:bg-[var(--tomato-soft)] hover:text-[var(--tomato)] hover:border-[var(--tomato-light)] active:scale-[0.98] transition-all disabled:opacity-50"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <MessageList />
        )}
      </div>
      <div className="shrink-0 border-t border-[var(--border)] p-3">
        <QuickActions />
        <ChatInput />
      </div>
    </div>
  );
}
