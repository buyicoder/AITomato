import { create } from "zustand";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  action?: ActionData | null;
  quickActions?: string[];
  createdAt: string;
}

interface ActionData {
  action: string;
  data: Record<string, unknown>;
}

interface ChatState {
  messages: Message[];
  isLoading: boolean;
  quickActions: string[];

  addMessage: (msg: Message) => void;
  appendContent: (id: string, chunk: string) => void;
  setAction: (id: string, action: ActionData, quickActions: string[]) => void;
  setLoading: (loading: boolean) => void;
  setQuickActions: (actions: string[]) => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  isLoading: false,
  quickActions: [],

  addMessage: (msg) =>
    set((state) => ({
      messages: [...state.messages, msg],
    })),

  appendContent: (id, chunk) =>
    set((state) => ({
      messages: state.messages.map((m) =>
        m.id === id ? { ...m, content: m.content + chunk } : m,
      ),
    })),

  setAction: (id, action, quickActions) =>
    set((state) => ({
      messages: state.messages.map((m) =>
        m.id === id ? { ...m, action, quickActions } : m,
      ),
      quickActions,
    })),

  setLoading: (loading) => set({ isLoading: loading }),

  setQuickActions: (actions) => set({ quickActions: actions }),
}));

export type { Message, ActionData };
