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

  startTimer: (opts: { sessionId: string; taskId: string; taskTitle: string; duration: number; type?: "FOCUS" | "BREAK" }) => void;
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

  startTimer: (opts) =>
    set({
      isRunning: true,
      isPaused: false,
      sessionId: opts.sessionId,
      taskId: opts.taskId,
      taskTitle: opts.taskTitle,
      duration: opts.duration,
      remainingSeconds: opts.duration * 60,
      type: opts.type || "FOCUS",
    }),

  tick: () => {
    const { remainingSeconds } = get();
    if (remainingSeconds <= 0) return;
    set({ remainingSeconds: remainingSeconds - 1 });
  },

  pauseTimer: () => set({ isPaused: true }),

  resumeTimer: () => set({ isPaused: false }),

  stopTimer: () =>
    set({
      isRunning: false,
      isPaused: false,
      sessionId: null,
      taskId: null,
      taskTitle: "",
      remainingSeconds: 0,
      type: "FOCUS",
    }),
}));

// The timer interval will be managed in the TimerWidget component
