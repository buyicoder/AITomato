"use client";

import { useChatStore } from "@/stores/useChatStore";
import { PomodoroCard } from "./PomodoroCard";

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" });
}

export function MessageList() {
  const { messages } = useChatStore();

  return (
    <div className="flex flex-col gap-5">
      {messages.map((msg) => (
        <div
          key={msg.id}
          className={`animate-fade-in-up flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
        >
          {/* Avatar */}
          <div
            className={`shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-sm ${
              msg.role === "user"
                ? "bg-[var(--tomato)] text-white"
                : "bg-[var(--surface-raised)] border border-[var(--border)]"
            }`}
          >
            {msg.role === "user" ? "U" : "🍅"}
          </div>

          {/* Bubble */}
          <div className={`flex flex-col max-w-[78%] ${msg.role === "user" ? "items-end" : "items-start"}`}>
            <div
              className={`rounded-2xl px-4 py-3 text-[15px] leading-relaxed shadow-sm ${
                msg.role === "user"
                  ? "bg-[var(--tomato)] text-white rounded-tr-md"
                  : "bg-[var(--surface-raised)] border border-[var(--border)] rounded-tl-md"
              }`}
            >
              {msg.content ? (
                <p className="whitespace-pre-wrap">{msg.content}</p>
              ) : (
                <span className="dot-typing"><span /><span /><span /></span>
              )}

              {/* Embedded Task Card */}
              {msg.action && msg.action.action === "create_task" && (
                <div className="mt-2.5 p-2.5 rounded-lg bg-[var(--background)] border border-[var(--border)]">
                  <p className="text-[10px] uppercase tracking-wider text-[var(--muted)] mb-0.5">新建任务</p>
                  <p className="font-semibold text-sm">{msg.action.data.title as string}</p>
                  {(msg.action.data.estimatedPomodoros as number) > 0 && (
                    <p className="text-xs text-[var(--muted)] mt-1">
                      {"🍅".repeat(Math.min((msg.action.data.estimatedPomodoros as number), 6))} {(msg.action.data.estimatedPomodoros as number)} 个番茄
                    </p>
                  )}
                </div>
              )}

              {/* Embedded Pomodoro Card */}
              {msg.action && msg.action.action === "start_pomodoro" && (
                <PomodoroCard
                  taskTitle={(msg.action.data.taskTitle as string) || "专注中"}
                  duration={(msg.action.data.duration as number) || 25}
                />
              )}
            </div>

            {/* Timestamp */}
            <span className="text-[10px] text-[var(--muted-light)] mt-1 px-1">
              {formatTime(msg.createdAt)}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
