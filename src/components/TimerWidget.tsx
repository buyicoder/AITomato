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
    try {
      await fetch("/api/pomodoro/stop", { method: "POST" });
    } catch {
      // ignore
    }
  }, []);

  const resumeTimer = useCallback(() => {
    useTimerStore.getState().resumeTimer();
  }, []);

  const handleStop = useCallback(async () => {
    stopTimer();
    try {
      await fetch("/api/pomodoro/stop", { method: "POST" });
    } catch {
      // ignore
    }
  }, [stopTimer]);

  // Sync timer state from server on mount
  useEffect(() => {
    async function syncTimer() {
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
          // Adjust remaining seconds to server time
          useTimerStore.setState({ remainingSeconds: data.remainingSeconds });
        }
      } catch {
        // ignore
      }
    }
    syncTimer();
  }, []);

  // Tick every second
  useEffect(() => {
    if (!isRunning || isPaused) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    intervalRef.current = setInterval(() => {
      const state = useTimerStore.getState();
      if (state.remainingSeconds <= 0) {
        handleStop();
      } else {
        tick();
      }
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, isPaused, tick, handleStop]);

  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  const progress = remainingSeconds / (duration * 60);
  const radius = 110;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <div className="flex flex-col items-center justify-center h-full p-6 gap-5">
      {!isRunning ? (
        <div className="text-center">
          <div className="text-6xl mb-4">🍅</div>
          <p className="text-[var(--muted)] text-sm">等待开始</p>
          <p className="text-[var(--muted)] text-xs mt-1">
            在聊天框中说「开始做XX」来启动番茄钟
          </p>
        </div>
      ) : (
        <>
          {/* Timer Ring */}
          <div className="relative">
            <svg width="260" height="260" className="-rotate-90">
              <circle
                cx="130"
                cy="130"
                r={radius}
                fill="none"
                stroke="var(--border)"
                strokeWidth="8"
              />
              <circle
                cx="130"
                cy="130"
                r={radius}
                fill="none"
                stroke={type === "BREAK" ? "#4caf50" : "var(--tomato)"}
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                className="timer-ring"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-5xl font-mono font-bold tracking-tight">
                {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
              </span>
              <span className="text-xs text-[var(--muted)] mt-1">
                {type === "BREAK" ? "休息" : "专注"}
              </span>
            </div>
          </div>

          {/* Task Title */}
          {taskTitle && (
            <p className="text-sm font-medium text-center px-4 leading-snug">
              {taskTitle}
            </p>
          )}

          {/* Controls */}
          <div className="flex gap-3">
            {isPaused ? (
              <button
                onClick={resumeTimer}
                className="rounded-full bg-[var(--tomato)] text-white px-6 py-2 text-sm font-medium hover:bg-[var(--tomato-dark)] transition-colors"
              >
                继续
              </button>
            ) : (
              <button
                onClick={pauseTimer}
                className="rounded-full border border-[var(--border)] px-6 py-2 text-sm font-medium hover:bg-[var(--surface-hover)] transition-colors"
              >
                暂停
              </button>
            )}
            <button
              onClick={handleStop}
              className="rounded-full border border-[var(--border)] px-6 py-2 text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
            >
              结束
            </button>
          </div>
        </>
      )}
    </div>
  );
}
