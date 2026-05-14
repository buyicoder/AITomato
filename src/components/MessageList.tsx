"use client";

import { useChatStore } from "@/stores/useChatStore";
import { PomodoroCard } from "./PomodoroCard";

export function MessageList() {
  const { messages } = useChatStore();

  return (
    <div className="flex flex-col gap-3">
      {messages.map((msg) => (
        <div
          key={msg.id}
          className={`animate-fade-in-up flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
        >
          <div
            className={`max-w-[85%] rounded-2xl px-4 py-3 ${
              msg.role === "user"
                ? "bg-[var(--tomato)] text-white"
                : "bg-[var(--surface)] border border-[var(--border)]"
            }`}
          >
            <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.content}</p>
            {msg.action && msg.action.action === "start_pomodoro" && (
              <PomodoroCard
                taskTitle={(msg.action.data.taskTitle as string) || "专注中"}
                duration={(msg.action.data.duration as number) || 25}
              />
            )}
            {msg.action && msg.action.action === "create_task" && (
              <div className="mt-2 p-2 rounded-lg bg-[var(--background)] border border-[var(--border)]">
                <p className="text-xs text-[var(--muted)]">新建任务</p>
                <p className="font-medium text-sm">{msg.action.data.title as string}</p>
                {(msg.action.data.estimatedPomodoros as number) > 0 && (
                  <p className="text-xs text-[var(--muted)]">
                    🍅 {(msg.action.data.estimatedPomodoros as number)} 个番茄
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
