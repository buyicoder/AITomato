import { create } from "zustand";

interface TimerState {
  isRunning: boolean;
  isPaused: boolean;
  sessionId: string | null;
  taskId: string | null;
  taskTitle: string;
  duration: number;
  remainingSeconds: number;
  type: "FOCUS" | "BREAK";
  endAt: number;

  startTimer: (opts: {
    sessionId: string;
    taskId: string;
    taskTitle: string;
    duration: number;
    type?: "FOCUS" | "BREAK";
  }) => void;
  tick: () => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  stopTimer: () => void;
}

export const useTimerStore = create<TimerState>((set, get) => ({
  isRunning: false,
  isPaused: false,
  sessionId: null,
  taskId: null,
  taskTitle: "",
  duration: 25,
  remainingSeconds: 0,
  type: "FOCUS",
  endAt: 0,

  startTimer: (opts) => {
    const totalMs = opts.duration * 60 * 1000;
    set({
      isRunning: true,
      isPaused: false,
      sessionId: opts.sessionId,
      taskId: opts.taskId,
      taskTitle: opts.taskTitle,
      duration: opts.duration,
      remainingSeconds: opts.duration * 60,
      type: opts.type || "FOCUS",
      endAt: Date.now() + totalMs,
    });
  },

  tick: () => {
    const { endAt } = get();
    const remaining = Math.max(0, Math.ceil((endAt - Date.now()) / 1000));
    set({ remainingSeconds: remaining });
  },

  pauseTimer: () => set({ isPaused: true }),

  resumeTimer: () => {
    const { remainingSeconds } = get();
    if (remainingSeconds <= 0) {
      set({ isRunning: false, isPaused: false, remainingSeconds: 0, endAt: 0 });
      return;
    }
    set({
      isPaused: false,
      endAt: Date.now() + remainingSeconds * 1000,
    });
  },

  stopTimer: () =>
    set({
      isRunning: false,
      isPaused: false,
      sessionId: null,
      taskId: null,
      taskTitle: "",
      remainingSeconds: 0,
      type: "FOCUS",
      endAt: 0,
    }),
}));
