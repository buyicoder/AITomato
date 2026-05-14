"use client";

import { useRef, useEffect } from "react";
import { useChatStore } from "@/stores/useChatStore";
import { MessageList } from "./MessageList";
import { ChatInput } from "./ChatInput";
import { QuickActions } from "./QuickActions";

export function ChatContainer() {
  const { isLoading, messages } = useChatStore();
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
            <span className="text-5xl mb-4">🍅</span>
            <h2 className="text-xl font-semibold mb-2">欢迎使用 AITomato</h2>
            <p className="text-[var(--muted)] max-w-sm leading-relaxed">
              用自然语言管理你的专注时间。
              <br />
              试试说：「添加任务：写周报，明天交」
              <br />
              或者直接说：「开始干活」
            </p>
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
