"use client";

import { useTimerStore } from "@/stores/useTimerStore";

interface TimerRunningProps {
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
}

export function TimerRunning({ onPause, onResume, onStop }: TimerRunningProps) {
  const remainingSeconds = useTimerStore((s) => s.remainingSeconds);
  const duration = useTimerStore((s) => s.duration);
  const type = useTimerStore((s) => s.type);
  const isPaused = useTimerStore((s) => s.isPaused);
  const taskTitle = useTimerStore((s) => s.taskTitle);

  const totalSeconds = duration * 60;
  const progress = remainingSeconds / totalSeconds;
  const radius = 100;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress);
  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;

  return (
    <div className="flex flex-col items-center justify-center h-full p-6 gap-6">
      {/* Timer Ring */}
      <div className="relative shrink-0">
        <svg width="240" height="240" className="-rotate-90"
          role="progressbar"
          aria-valuenow={remainingSeconds} aria-valuemin={0} aria-valuemax={totalSeconds}
          aria-label={`剩余 ${minutes} 分 ${seconds} 秒`}>
          <circle cx="120" cy="120" r={radius} fill="none"
            stroke="var(--border-strong)" strokeWidth="10" opacity="0.5" />
          <circle cx="120" cy="120" r={radius} fill="none"
            stroke={type === "BREAK" ? "#66bb6a" : "var(--tomato)"}
            strokeWidth="10" strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="timer-ring"
            filter={type === "FOCUS" ? "drop-shadow(0 0 6px var(--tomato))" : undefined} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-5xl font-mono font-bold tracking-tight tabular-nums">
            {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
          </span>
          <span className="text-xs text-[var(--muted)] mt-1 font-medium">
            {isPaused ? "已暂停" : type === "BREAK" ? "☕ 休息" : "🔥 专注"}
          </span>
        </div>
      </div>

      {taskTitle && (
        <p className="text-sm font-semibold text-center px-4 leading-snug max-w-full truncate">
          {taskTitle}
        </p>
      )}

      <div className="w-full max-w-[180px] h-1.5 rounded-full bg-[var(--border)] overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-300 ${
          type === "BREAK" ? "bg-green-400" : "bg-[var(--tomato)]"
        }`} style={{ width: `${progress * 100}%` }} />
      </div>

      <div className="flex gap-3">
        {isPaused ? (
          <button onClick={onResume}
            className="rounded-full bg-[var(--tomato)] text-white px-6 py-2.5 text-sm font-semibold hover:bg-[var(--tomato-dark)] active:scale-95 transition-all shadow-sm shadow-[var(--tomato)]/30">
            继续
          </button>
        ) : (
          <button onClick={onPause}
            className="rounded-full border-2 border-[var(--border-strong)] px-6 py-2.5 text-sm font-semibold hover:bg-[var(--surface-hover)] hover:border-[var(--muted)] active:scale-95 transition-all">
            暂停
          </button>
        )}
        <button onClick={onStop}
          className="rounded-full border-2 border-red-300 dark:border-red-800 px-6 py-2.5 text-sm font-semibold text-red-500 hover:bg-red-50 dark:hover:bg-red-950 active:scale-95 transition-all">
          结束
        </button>
      </div>
    </div>
  );
}
