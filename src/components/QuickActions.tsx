"use client";

import { useChatStore } from "@/stores/useChatStore";
import { useChat } from "@/hooks/useChat";

export function QuickActions() {
  const quickActions = useChatStore((s) => s.quickActions);
  const { sendMessage } = useChat();

  if (quickActions.length === 0) return null;

  return (
    <div className="flex gap-2 mb-2 flex-wrap">
      {quickActions.map((action) => (
        <button
          key={action}
          onClick={() => sendMessage(action)}
          className="text-xs sm:text-sm rounded-full border border-[var(--border)] px-3 py-1.5 hover:bg-[var(--tomato-soft)] hover:border-[var(--tomato-light)] hover:text-[var(--tomato)] active:scale-95 transition-all"
        >
          {action}
        </button>
      ))}
    </div>
  );
}
