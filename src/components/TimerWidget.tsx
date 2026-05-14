"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { useTimerStore } from "@/stores/useTimerStore";
import { useChat } from "@/hooks/useChat";

interface TaskItem {
  id: string;
  title: string;
  status: string;
  priority: string;
  estimatedPomodoros: number;
  completedPomodoros: number;
}

interface TodayStats {
  completedPomodoros: number;
  focusMinutes: number;
}

export function TimerWidget() {
  const {
    isRunning, isPaused, taskTitle, duration,
    remainingSeconds, type, tick, stopTimer,
  } = useTimerStore();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const { sendMessage } = useChat();

  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [stats, setStats] = useState<TodayStats>({ completedPomodoros: 0, focusMinutes: 0 });

  // Fetch tasks and stats for idle state
  useEffect(() => {
    async function load() {
      try {
        const [tRes, iRes] = await Promise.all([
          fetch("/api/tasks"),
          fetch("/api/insights?days=1"),
        ]);
        if (tRes.ok) setTasks(await tRes.json());
        if (iRes.ok) setStats(await iRes.json());
      } catch {}
    }
    if (!isRunning) load();
  }, [isRunning]);

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
            sessionId: data.sessionId, taskId: data.taskId || "",
            taskTitle: data.taskTitle, duration: data.duration, type: data.type,
          });
          useTimerStore.setState({ remainingSeconds: data.remainingSeconds });
        }
      } catch {}
    }
    sync();
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
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isRunning, isPaused, tick, handleStop]);

  const totalSeconds = duration * 60;
  const progress = remainingSeconds / totalSeconds;
  const radius = 100;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress);
  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;

  const pendingTasks = tasks.filter((t) => t.status !== "DONE");
  const dailyGoal = 8;
  const goalProgress = Math.min(stats.completedPomodoros / dailyGoal, 1);

  // --- IDLE STATE ---
  if (!isRunning) {
    return (
      <div className="flex flex-col h-full p-5 gap-5 overflow-y-auto">
        {/* Today overview card */}
        <div className="rounded-2xl bg-[var(--background)] border border-[var(--border)] p-4 text-center">
          <p className="text-xs text-[var(--muted-light)] mb-2 font-medium">今日番茄</p>
          <div className="flex items-center justify-center gap-4">
            <div>
              <span className="text-3xl font-bold tabular-nums">{stats.completedPomodoros}</span>
              <p className="text-[10px] text-[var(--muted-light)]">已完成</p>
            </div>
            <div className="w-px h-8 bg-[var(--border)]" />
            <div>
              <span className="text-3xl font-bold tabular-nums">{stats.focusMinutes}</span>
              <p className="text-[10px] text-[var(--muted-light)]">专注分钟</p>
            </div>
          </div>
          {/* Goal ring */}
          <div className="relative mt-3 inline-flex">
            <svg width="72" height="72" className="-rotate-90">
              <circle cx="36" cy="36" r="30" fill="none" stroke="var(--border)" strokeWidth="6" />
              <circle cx="36" cy="36" r="30" fill="none" stroke="var(--tomato)" strokeWidth="6"
                strokeLinecap="round" strokeDasharray={2 * Math.PI * 30}
                strokeDashoffset={2 * Math.PI * 30 * (1 - goalProgress)}
                className="timer-ring" />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs font-bold">{stats.completedPomodoros}/{dailyGoal}</span>
            </div>
          </div>
          <p className="text-[10px] text-[var(--muted-light)] mt-1">今日目标</p>
        </div>

        {/* Pending tasks */}
        <div className="flex-1 min-h-0">
          <p className="text-xs font-semibold text-[var(--muted)] mb-2 uppercase tracking-wider">
            待办任务 {pendingTasks.length > 0 && `(${pendingTasks.length})`}
          </p>
          {pendingTasks.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-4xl mb-2 opacity-50">📋</p>
              <p className="text-xs text-[var(--muted-light)]">暂无任务</p>
              <p className="text-[10px] text-[var(--muted-light)] mt-1">
                在聊天框说「添加任务：XXX」来创建
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-1.5">
              {pendingTasks.slice(0, 6).map((t) => (
                <button
                  key={t.id}
                  onClick={() => sendMessage(`开始做${t.title}`)}
                  className="flex items-center gap-2.5 w-full text-left p-2.5 rounded-xl hover:bg-[var(--tomato-soft)] transition-all group active:scale-[0.98]"
                >
                  <span className={`text-xs shrink-0 w-5 h-5 rounded flex items-center justify-center ${
                    t.priority === "HIGH"
                      ? "bg-red-100 text-red-500 dark:bg-red-900 dark:text-red-300"
                      : t.priority === "LOW"
                        ? "bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500"
                        : "bg-orange-100 text-orange-500 dark:bg-orange-900 dark:text-orange-300"
                  }`}>
                    {t.priority === "HIGH" ? "!" : t.priority === "LOW" ? "-" : "·"}
                  </span>
                  <span className="flex-1 text-sm truncate group-hover:text-[var(--tomato)] transition-colors">
                    {t.title}
                  </span>
                  <span className="text-[10px] text-[var(--muted-light)] shrink-0">
                    {t.completedPomodoros}/{t.estimatedPomodoros}🍅
                  </span>
                </button>
              ))}
              {pendingTasks.length > 6 && (
                <p className="text-[10px] text-[var(--muted-light)] text-center mt-1">
                  还有 {pendingTasks.length - 6} 个任务...
                </p>
              )}
            </div>
          )}
        </div>

        {/* Quick start hint */}
        <p className="text-[10px] text-[var(--muted-light)] text-center shrink-0">
          点击任务开始计时，或在聊天框说话
        </p>
      </div>
    );
  }

  // --- RUNNING STATE ---
  return (
    <div className="flex flex-col items-center justify-center h-full p-6 gap-6">
      {/* Timer Ring */}
      <div className="relative shrink-0">
        <svg width="240" height="240" className="-rotate-90">
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
          <button onClick={resumeTimer}
            className="rounded-full bg-[var(--tomato)] text-white px-6 py-2.5 text-sm font-semibold hover:bg-[var(--tomato-dark)] active:scale-95 transition-all shadow-sm shadow-[var(--tomato)]/30">
            继续
          </button>
        ) : (
          <button onClick={pauseTimer}
            className="rounded-full border-2 border-[var(--border-strong)] px-6 py-2.5 text-sm font-semibold hover:bg-[var(--surface-hover)] hover:border-[var(--muted)] active:scale-95 transition-all">
            暂停
          </button>
        )}
        <button onClick={handleStop}
          className="rounded-full border-2 border-red-300 dark:border-red-800 px-6 py-2.5 text-sm font-semibold text-red-500 hover:bg-red-50 dark:hover:bg-red-950 active:scale-95 transition-all">
          结束
        </button>
      </div>
    </div>
  );
}
