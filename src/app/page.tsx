"use client";

import { useState, useEffect, useRef } from "react";
import { ChatContainer } from "@/components/ChatContainer";
import { TimerWidget } from "@/components/TimerWidget";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useTimerStore } from "@/stores/useTimerStore";
import { SIDEBAR_WIDTH_PX } from "@/lib/constants";

let _audioCtx: AudioContext | null = null;

function playChime() {
  try {
    if (!_audioCtx) {
      _audioCtx = new AudioContext();
    }
    const ctx = _audioCtx;
    if (ctx.state === "suspended") ctx.resume();
    const oscillators: OscillatorNode[] = [];
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
      oscillators.push(osc);
    });
    // Clean up AudioContext after the last sound ends
    const lastEnd = 2 * 0.15 + 0.4;
    setTimeout(() => {
      oscillators.forEach((o) => { try { o.disconnect(); } catch {} });
      if (_audioCtx) {
        _audioCtx.close();
        _audioCtx = null;
      }
    }, lastEnd * 1000 + 100);
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
    <main className="flex max-w-6xl mx-auto overflow-hidden h-dvh">
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="flex items-center gap-3 px-5 py-3.5 border-b border-[var(--border)] shrink-0 bg-[var(--surface)]">
          <span className="text-2xl shrink-0">🍅</span>
          <div className="min-w-0">
            <h1 className="font-bold text-lg tracking-tight leading-none">AITomato</h1>
            <p className="text-[10px] text-[var(--muted-light)] hidden sm:block">AI 番茄工作法</p>
          </div>

          {/* Timer running indicator + theme toggle + sidebar toggle */}
          <div className="ml-auto flex items-center gap-2">
            {isRunning && (
              <span className="text-xs font-medium text-[var(--tomato)] bg-[var(--tomato-soft)] px-2.5 py-1 rounded-full hidden sm:block">
                🍅 计时中
              </span>
            )}
            <ThemeToggle />
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="shrink-0 w-8 h-8 rounded-lg border border-[var(--border)] flex items-center justify-center text-sm hover:bg-[var(--surface-hover)] transition-colors text-[var(--muted)]"
              title={sidebarOpen ? "收起侧边栏" : "展开侧边栏"}
              aria-label={sidebarOpen ? "收起侧边栏" : "展开侧边栏"}
            >
              {sidebarOpen ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              )}
            </button>
          </div>
        </header>
        <ChatContainer />
      </div>

      {/* Sidebar — at edge, instant toggle, no animation */}
      <aside
        className="shrink-0 border-l border-[var(--border)] bg-[var(--surface)] overflow-hidden"
        style={{ width: sidebarOpen ? `${SIDEBAR_WIDTH_PX}px` : "0px" }}
      >
        <div style={{ width: `${SIDEBAR_WIDTH_PX}px` }} className="h-full">
          <TimerWidget />
        </div>
      </aside>
    </main>
  );
}
