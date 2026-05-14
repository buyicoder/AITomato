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
    <div className="mt-3 p-3 rounded-xl bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950 dark:to-orange-950 border border-red-200 dark:border-red-800">
      <div className="flex items-center gap-3">
        <span className="text-2xl">🍅</span>
        <div>
          <p className="text-sm font-medium">{taskTitle}</p>
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
