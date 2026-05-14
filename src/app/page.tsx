"use client";

import { ChatContainer } from "@/components/ChatContainer";
import { TimerWidget } from "@/components/TimerWidget";

export default function Home() {
  return (
    <main className="flex h-screen max-w-5xl mx-auto overflow-hidden">
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0 border-r border-[var(--border)]">
        <header className="flex items-center gap-3 px-4 py-3 border-b border-[var(--border)] shrink-0">
          <span className="text-2xl">🍅</span>
          <h1 className="font-bold text-lg">AITomato</h1>
          <span className="text-xs text-[var(--muted)] ml-auto">AI 驱动的番茄钟</span>
        </header>
        <ChatContainer />
      </div>

      {/* Sidebar Timer */}
      <aside className="w-80 shrink-0 hidden md:flex flex-col bg-[var(--surface)]">
        <TimerWidget />
      </aside>
    </main>
  );
}
