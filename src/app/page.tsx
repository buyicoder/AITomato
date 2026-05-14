"use client";

import { useState, useEffect, useRef } from "react";
import { ChatContainer } from "@/components/ChatContainer";
import { TimerWidget } from "@/components/TimerWidget";
import { useTimerStore } from "@/stores/useTimerStore";

function playChime() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    [523.25, 659.25, 783.99].forEach((freq, i) => {
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

export default function Home() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const isRunning = useTimerStore((s) => s.isRunning);
  const remainingSeconds = useTimerStore((s) => s.remainingSeconds);

  useEffect(() => {
    if (typeof Notification !== "undefined" && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    if (isRunning && remainingSeconds > 0) {
      const m = Math.floor(remainingSeconds / 60);
      const s = remainingSeconds % 60;
      document.title = `🍅 ${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")} · AITomato`;
    } else {
      document.title = "AITomato - AI 驱动的番茄钟";
    }
  }, [isRunning, remainingSeconds]);

  const prevRemaining = useRef(remainingSeconds);
  useEffect(() => {
    if (prevRemaining.current > 0 && remainingSeconds === 0 && !isRunning) {
      playChime();
    }
    prevRemaining.current = remainingSeconds;
  }, [remainingSeconds, isRunning]);

  return (
    <main className="flex max-w-6xl mx-auto overflow-hidden" style={{ height: "100dvh" }}>
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="flex items-center gap-3 px-5 py-3.5 border-b border-[var(--border)] shrink-0 bg-[var(--surface)]">
          <span className="text-2xl shrink-0">🍅</span>
          <div className="min-w-0">
            <h1 className="font-bold text-lg tracking-tight leading-none">AITomato</h1>
            <p className="text-[10px] text-[var(--muted-light)] hidden sm:block">AI 番茄工作法</p>
          </div>

          {/* Timer running indicator + sidebar toggle */}
          <div className="ml-auto flex items-center gap-2">
            {isRunning && (
              <span className="text-xs font-medium text-[var(--tomato)] bg-[var(--tomato-soft)] px-2.5 py-1 rounded-full hidden sm:block">
                🍅 计时中
              </span>
            )}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className={`shrink-0 w-8 h-8 rounded-lg border border-[var(--border)] flex items-center justify-center text-sm hover:bg-[var(--surface-hover)] transition-colors ${
                sidebarOpen ? "text-[var(--tomato)]" : "text-[var(--muted-light)]"
              }`}
              title={sidebarOpen ? "收起侧边栏" : "展开侧边栏"}
            >
              {sidebarOpen ? "⟩" : "⟨"}
            </button>
          </div>
        </header>
        <ChatContainer />
      </div>

      {/* Sidebar — always at edge, no overlay */}
      <aside
        className="shrink-0 border-l border-[var(--border)] bg-[var(--surface)] overflow-hidden transition-all duration-300 ease-in-out"
        style={{ width: sidebarOpen ? "288px" : "0px", opacity: sidebarOpen ? 1 : 0 }}
      >
        <div style={{ width: "288px" }} className="h-full">
          <TimerWidget />
        </div>
      </aside>
    </main>
  );
}
