"use client";

import { useState, useEffect, useRef } from "react";
import { ChatContainer } from "@/components/ChatContainer";
import { TimerWidget } from "@/components/TimerWidget";
import { useTimerStore } from "@/stores/useTimerStore";

// Play a simple completion chime using Web Audio API
function playChime() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const frequencies = [523.25, 659.25, 783.99]; // C5, E5, G5
    frequencies.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.15, ctx.currentTime + i * 0.15);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.15 + 0.4);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + i * 0.15);
      osc.stop(ctx.currentTime + i * 0.15 + 0.4);
    });
  } catch {}
}

function MobileTimerBar() {
  const { isRunning, isPaused, taskTitle, remainingSeconds, type } = useTimerStore();
  if (!isRunning) return null;

  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;

  return (
    <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-[var(--surface-raised)] border-b border-[var(--border)] px-4 py-2 flex items-center gap-3 shadow-sm">
      <span className={`text-lg ${isPaused ? "" : "timer-active-indicator"}`}>🍅</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate">{taskTitle || "专注中"}</p>
        <p className="text-xs text-[var(--muted)]">
          {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
          {" · "}{isPaused ? "已暂停" : type === "BREAK" ? "休息" : "专注"}
        </p>
      </div>
    </div>
  );
}

export default function Home() {
  const [mobileTimerOpen, setMobileTimerOpen] = useState(false);
  const isRunning = useTimerStore((s) => s.isRunning);
  const remainingSeconds = useTimerStore((s) => s.remainingSeconds);

  // Request notification permission
  useEffect(() => {
    if (typeof Notification !== "undefined" && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  // Update page title with timer
  useEffect(() => {
    if (isRunning && remainingSeconds > 0) {
      const m = Math.floor(remainingSeconds / 60);
      const s = remainingSeconds % 60;
      document.title = `🍅 ${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")} · AITomato`;
    } else {
      document.title = "AITomato - AI 驱动的番茄钟";
    }
  }, [isRunning, remainingSeconds]);

  // Play chime when timer finishes
  const prevRemaining = useRef(remainingSeconds);
  useEffect(() => {
    if (prevRemaining.current > 0 && remainingSeconds === 0 && isRunning === false) {
      playChime();
    }
    prevRemaining.current = remainingSeconds;
  }, [remainingSeconds, isRunning]);

  return (
    <>
      <MobileTimerBar />
      <main className={`flex max-w-5xl mx-auto overflow-hidden ${isRunning ? "pt-10 md:pt-0" : ""}`}
        style={{ height: "100dvh" }}>
        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col min-w-0">
          <header className="flex items-center gap-3 px-4 py-3 border-b border-[var(--border)] shrink-0">
            <span className="text-2xl">🍅</span>
            <h1 className="font-bold text-lg tracking-tight">AITomato</h1>
            <span className="text-xs text-[var(--muted)] ml-auto hidden sm:block">AI 驱动的番茄钟</span>
            {isRunning && (
              <button
                onClick={() => setMobileTimerOpen(!mobileTimerOpen)}
                className="md:hidden ml-auto text-sm font-medium text-[var(--tomato)]"
              >
                {mobileTimerOpen ? "隐藏" : "计时"}
              </button>
            )}
          </header>
          <ChatContainer />
        </div>

        {/* Sidebar Timer */}
        <aside
          className={`w-80 shrink-0 flex-col bg-[var(--surface)] ${
            mobileTimerOpen
              ? "flex absolute inset-y-0 right-0 z-40 shadow-2xl md:shadow-none"
              : "hidden"
          } md:flex md:relative md:border-l md:border-[var(--border)]`}
        >
          {mobileTimerOpen && (
            <button
              onClick={() => setMobileTimerOpen(false)}
              className="md:hidden absolute top-3 right-3 text-[var(--muted)] text-xl w-8 h-8 flex items-center justify-center rounded-full hover:bg-[var(--surface-hover)]"
            >
              ✕
            </button>
          )}
          <TimerWidget />
        </aside>
      </main>
    </>
  );
}
