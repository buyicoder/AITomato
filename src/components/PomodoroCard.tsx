"use client";

import { useTimerStore } from "@/stores/useTimerStore";

interface PomodoroCardProps {
  taskTitle: string;
  duration: number;
}

export function PomodoroCard({ taskTitle, duration }: PomodoroCardProps) {
  const isRunning = useTimerStore((s) => s.isRunning);
  const remainingSeconds = useTimerStore((s) => s.remainingSeconds);
  const type = useTimerStore((s) => s.type);

  return (
    <div className="mt-2.5 p-3 rounded-xl bg-[var(--tomato-soft)] border border-[var(--tomato)]/20">
      <div className="flex items-center gap-3">
        <div className={`text-2xl ${isRunning ? "timer-active-indicator" : ""}`}>🍅</div>
        <div className="min-w-0">
          <p className="text-sm font-semibold truncate">{taskTitle}</p>
          <p className="text-xs text-[var(--muted)]">
            {isRunning && remainingSeconds > 0
              ? `剩余 ${Math.floor(remainingSeconds / 60)}:${String(remainingSeconds % 60).padStart(2, "0")}`
              : `${duration} 分钟`}
            {" · "}
            {type === "BREAK" ? "休息中" : "专注中"}
          </p>
        </div>
      </div>
    </div>
  );
}
