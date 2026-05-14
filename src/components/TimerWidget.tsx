"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { useTimerStore } from "@/stores/useTimerStore";
import { useChat } from "@/hooks/useChat";
import { TimerIdle } from "./TimerIdle";
import { TimerRunning } from "./TimerRunning";

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
  const { isRunning, isPaused, stopTimer } = useTimerStore();
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
      } catch (e) {
        console.error("Failed to load sidebar data:", e);
      }
    }
    if (!isRunning) load();
  }, [isRunning]);

  const pauseTimer = useCallback(async () => {
    useTimerStore.getState().pauseTimer();
    try {
      await fetch("/api/pomodoro/stop", { method: "POST" });
    } catch (e) {
      console.error("Failed to pause timer on server:", e);
    }
  }, []);

  const resumeTimer = useCallback(() => {
    useTimerStore.getState().resumeTimer();
  }, []);

  const handleStop = useCallback(async () => {
    stopTimer();
    try {
      await fetch("/api/pomodoro/stop", { method: "POST" });
    } catch (e) {
      console.error("Failed to stop timer on server:", e);
    }
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
          useTimerStore.setState({
            remainingSeconds: data.remainingSeconds,
            endAt: Date.now() + data.remainingSeconds * 1000,
          });
        }
      } catch (e) {
        console.error("Failed to sync timer from server:", e);
      }
    }
    sync();
  }, []);

  // Poll server for active sessions when idle — belt-and-suspenders fallback
  useEffect(() => {
    if (isRunning) return;
    const id = setInterval(async () => {
      try {
        const res = await fetch("/api/pomodoro/status");
        const data = await res.json();
        if (data.active) {
          console.log("[TimerWidget] Poll found active session, starting timer");
          useTimerStore.getState().startTimer({
            sessionId: data.sessionId,
            taskId: data.taskId || "",
            taskTitle: data.taskTitle,
            duration: data.duration,
            type: data.type,
          });
          useTimerStore.setState({
            remainingSeconds: data.remainingSeconds,
            endAt: Date.now() + data.remainingSeconds * 1000,
          });
        }
      } catch {}
    }, 2000);
    return () => clearInterval(id);
  }, [isRunning]);

  // Tick every second
  useEffect(() => {
    if (!isRunning || isPaused) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    intervalRef.current = setInterval(() => {
      useTimerStore.getState().tick();
      const state = useTimerStore.getState();
      if (state.remainingSeconds <= 0) {
        handleStop();
        if (typeof Notification !== "undefined" && Notification.permission === "granted") {
          new Notification("🍅 番茄钟完成！", {
            body: state.taskTitle ? `「${state.taskTitle}」已完成` : "干得好，休息一下吧！",
            icon: "/favicon.ico",
          });
        }
      }
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, isPaused, handleStop]);

  const handleTaskClick = useCallback(
    (title: string) => sendMessage(`开始做${title}`),
    [sendMessage],
  );

  if (!isRunning) {
    return <TimerIdle tasks={tasks} stats={stats} onTaskClick={handleTaskClick} />;
  }

  return <TimerRunning onPause={pauseTimer} onResume={resumeTimer} onStop={handleStop} />;
}
