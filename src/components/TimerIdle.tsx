"use client";

import { DAILY_POMODORO_GOAL } from "@/lib/constants";

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

interface TimerIdleProps {
  tasks: TaskItem[];
  stats: TodayStats;
  onTaskClick: (taskTitle: string) => void;
}

export function TimerIdle({ tasks, stats, onTaskClick }: TimerIdleProps) {
  const pendingTasks = tasks.filter((t) => t.status !== "DONE");
  const goalProgress = Math.min(stats.completedPomodoros / DAILY_POMODORO_GOAL, 1);
  const goalRingCircumference = 2 * Math.PI * 30;

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
          <svg width="72" height="72" className="-rotate-90" role="progressbar"
            aria-valuenow={stats.completedPomodoros} aria-valuemin={0} aria-valuemax={DAILY_POMODORO_GOAL}
            aria-label={`今日完成 ${stats.completedPomodoros} 个番茄，目标 ${DAILY_POMODORO_GOAL} 个`}>
            <circle cx="36" cy="36" r="30" fill="none" stroke="var(--border)" strokeWidth="6" />
            <circle cx="36" cy="36" r="30" fill="none" stroke="var(--tomato)" strokeWidth="6"
              strokeLinecap="round" strokeDasharray={goalRingCircumference}
              strokeDashoffset={goalRingCircumference * (1 - goalProgress)}
              className="timer-ring" />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs font-bold">{stats.completedPomodoros}/{DAILY_POMODORO_GOAL}</span>
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
                onClick={() => onTaskClick(t.title)}
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
