"use client";

import { useEffect, useRef, useCallback } from "react";
import { useTimerStore } from "@/stores/useTimerStore";

export function TimerWidget() {
  const {
    isRunning,
    isPaused,
    taskTitle,
    duration,
    remainingSeconds,
    type,
    tick,
    stopTimer,
  } = useTimerStore();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const pauseTimer = useCallback(async () => {
    useTimerStore.getState().pauseTimer();
    try { await fetch("/api/pomodoro/stop", { method: "POST" }); } catch {}
  }, []);

  const resumeTimer = useCallback(() => {
    useTimerStore.getState().resumeTimer();
  }, []);

  const handleStop = useCallback(async () => {
    stopTimer();
    try { await fetch("/api/pomodoro/stop", { method: "POST" }); } catch {}
  }, [stopTimer]);

  // Sync from server on mount
  useEffect(() => {
    async function sync() {
      try {
        const res = await fetch("/api/pomodoro/status");
        const data = await res.json();
        if (data.active) {
          useTimerStore.getState().startTimer({
            sessionId: data.sessionId,
            taskId: data.taskId || "",
            taskTitle: data.taskTitle,
            duration: data.duration,
            type: data.type,
          });
          useTimerStore.setState({ remainingSeconds: data.remainingSeconds });
        }
      } catch {}
    }
    sync();
  }, []);

  // Tick every second; CSS transition 0.3s on the ring handles smooth animation
  useEffect(() => {
    if (!isRunning || isPaused) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    intervalRef.current = setInterval(() => {
      const state = useTimerStore.getState();
      if (state.remainingSeconds <= 0) {
        handleStop();
        // Browser notification
        if (typeof Notification !== "undefined" && Notification.permission === "granted") {
          new Notification("🍅 番茄钟完成！", {
            body: state.taskTitle ? `「${state.taskTitle}」已完成` : "干得好，休息一下吧！",
            icon: "/favicon.ico",
          });
        }
      } else {
        tick();
      }
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, isPaused, tick, handleStop]);

  const totalSeconds = duration * 60;
  // Interpolate progress smoothly between whole seconds
  const progress = remainingSeconds / totalSeconds;
  const radius = 110;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress);

  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;

  return (
    <div className="flex flex-col items-center justify-center h-full p-6 gap-6">
      {!isRunning ? (
        <div className="text-center">
          <div className="text-6xl mb-4 opacity-70">🍅</div>
          <p className="text-[var(--muted)] text-sm font-medium">等待开始</p>
          <p className="text-[var(--muted-light)] text-xs mt-1.5 leading-relaxed">
            在聊天框中输入「开始做XX」
            <br />
            来启动番茄钟
          </p>
        </div>
      ) : (
        <>
          {/* Timer Ring */}
          <div className="relative shrink-0">
            <svg width="260" height="260" className="-rotate-90">
              {/* Track ring — use muted with transparency for visibility in both modes */}
              <circle
                cx="130" cy="130" r={radius}
                fill="none"
                stroke="var(--border-strong)"
                strokeWidth="10"
                opacity="0.5"
              />
              {/* Progress ring */}
              <circle
                cx="130" cy="130" r={radius}
                fill="none"
                stroke={type === "BREAK" ? "#66bb6a" : "var(--tomato)"}
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                className="timer-ring"
                filter={type === "FOCUS" ? "drop-shadow(0 0 6px var(--tomato))" : undefined}
              />
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

          {/* Task Title */}
          {taskTitle && (
            <p className="text-sm font-semibold text-center px-4 leading-snug max-w-full truncate">
              {taskTitle}
            </p>
          )}

          {/* Progress bar as secondary indicator */}
          <div className="w-full max-w-[200px] h-1.5 rounded-full bg-[var(--border)] overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                type === "BREAK" ? "bg-green-400" : "bg-[var(--tomato)]"
              }`}
              style={{ width: `${progress * 100}%` }}
            />
          </div>

          {/* Controls */}
          <div className="flex gap-3">
            {isPaused ? (
              <button
                onClick={resumeTimer}
                className="rounded-full bg-[var(--tomato)] text-white px-6 py-2.5 text-sm font-semibold hover:bg-[var(--tomato-dark)] active:scale-95 transition-all shadow-sm shadow-[var(--tomato)]/30"
              >
                继续
              </button>
            ) : (
              <button
                onClick={pauseTimer}
                className="rounded-full border-2 border-[var(--border-strong)] px-6 py-2.5 text-sm font-semibold hover:bg-[var(--surface-hover)] hover:border-[var(--muted)] active:scale-95 transition-all"
              >
                暂停
              </button>
            )}
            <button
              onClick={handleStop}
              className="rounded-full border-2 border-red-300 dark:border-red-800 px-6 py-2.5 text-sm font-semibold text-red-500 hover:bg-red-50 dark:hover:bg-red-950 active:scale-95 transition-all"
            >
              结束
            </button>
          </div>
        </>
      )}
    </div>
  );
}
