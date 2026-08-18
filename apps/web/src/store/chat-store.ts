import { create } from 'zustand';

interface ChatState {
  isOpen: boolean;
  pendingQuestion: string | null;
  open: () => void;
  close: () => void;
  ask: (question: string) => void;
  clearPending: () => void;
}

/** Lets other parts of the app (e.g. home page suggestion chips) open the chat
 * widget and pre-fill/send a question without prop-drilling through the layout. */
export const useChatStore = create<ChatState>((set) => ({
  isOpen: false,
  pendingQuestion: null,
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
  ask: (question) => set({ isOpen: true, pendingQuestion: question }),
  clearPending: () => set({ pendingQuestion: null }),
}));
