'use client';

import { useEffect, useRef, useState } from 'react';
import { Sparkles, X, Send, Database } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { useChatStore } from '@/store/chat-store';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  generatedSql?: string | null;
}

export function ChatWidget() {
  const isOpen = useChatStore((s) => s.isOpen);
  const openChat = useChatStore((s) => s.open);
  const closeChat = useChatStore((s) => s.close);
  const pendingQuestion = useChatStore((s) => s.pendingQuestion);
  const clearPending = useChatStore((s) => s.clearPending);

  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const sendingPending = useRef(false);

  async function send(question: string) {
    if (!question.trim()) return;
    setInput('');
    setMessages((m) => [...m, { role: 'user', content: question }]);
    setLoading(true);
    try {
      const { data } = await apiClient.post('/ai/chat', { conversationId, message: question });
      setConversationId(data.conversationId);
      setMessages((m) => [...m, { role: 'assistant', content: data.answer, generatedSql: data.generatedSql }]);
    } catch {
      setMessages((m) => [...m, { role: 'assistant', content: 'Errore nel recupero della risposta.' }]);
    } finally {
      setLoading(false);
    }
  }

  // A suggestion chip elsewhere in the app (e.g. the home page) can push a
  // question here via the shared chat store -- opens the widget and sends it
  // immediately instead of just pre-filling the input.
  useEffect(() => {
    if (pendingQuestion && !sendingPending.current) {
      sendingPending.current = true;
      send(pendingQuestion).finally(() => {
        sendingPending.current = false;
      });
      clearPending();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingQuestion]);

  if (!isOpen) {
    return (
      <button
        onClick={openChat}
        className="fixed bottom-6 right-6 flex items-center gap-2 rounded-full px-4 py-3 text-sm font-medium text-white shadow-lg"
        style={{ background: 'var(--brand)' }}
      >
        <Sparkles size={15} />
        Chiedi ai tuoi dati
      </button>
    );
  }

  return (
    <div
      className="fixed bottom-6 right-6 flex h-[520px] w-96 flex-col overflow-hidden rounded-xl border shadow-2xl"
      style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
    >
      <div
        className="flex items-center justify-between px-4 py-3 text-white"
        style={{ background: 'var(--brand)' }}
      >
        <div className="flex items-center gap-2">
          <Sparkles size={15} />
          <p className="text-sm font-medium">Assistente dati Aurea</p>
        </div>
        <button onClick={closeChat} className="text-white/80 hover:text-white">
          <X size={16} />
        </button>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-4 text-sm">
        {messages.length === 0 && (
          <p style={{ color: 'var(--text-muted)' }}>
            Fai una domanda sui tuoi dati, es. &ldquo;qual è stato il fatturato questo mese?&rdquo;
          </p>
        )}
        {messages.map((m, i) => (
          <div key={i} className={m.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
            <div className={m.role === 'user' ? 'max-w-[85%]' : 'flex max-w-[85%] gap-2'}>
              {m.role === 'assistant' && (
                <div
                  className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full"
                  style={{ background: 'rgba(42,58,167,0.1)', color: 'var(--brand)' }}
                >
                  <Sparkles size={12} />
                </div>
              )}
              <div>
                <div
                  className="rounded-2xl px-3 py-2"
                  style={
                    m.role === 'user'
                      ? { background: 'var(--brand)', color: '#fff', borderBottomRightRadius: 4 }
                      : { background: 'var(--page)', color: 'var(--text-primary)', borderBottomLeftRadius: 4 }
                  }
                >
                  {m.content}
                </div>
                {m.generatedSql && (
                  <p
                    className="mt-1 flex items-center gap-1 truncate text-[11px]"
                    style={{ color: 'var(--text-muted)' }}
                    title={m.generatedSql}
                  >
                    <Database size={10} />
                    {m.generatedSql}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex items-center gap-2" style={{ color: 'var(--text-muted)' }}>
            <div
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full"
              style={{ background: 'rgba(42,58,167,0.1)', color: 'var(--brand)' }}
            >
              <Sparkles size={12} />
            </div>
            Sto interrogando i tuoi dati…
          </div>
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="flex gap-2 border-t p-3"
        style={{ borderColor: 'var(--border)' }}
      >
        <input
          className="flex-1 rounded-md border px-3 py-2 text-sm outline-none"
          style={{ borderColor: 'var(--border)' }}
          placeholder="Scrivi una domanda..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button
          className="flex items-center justify-center rounded-md px-3 py-2 text-sm text-white disabled:opacity-50"
          style={{ background: 'var(--brand)' }}
          disabled={loading}
        >
          <Send size={14} />
        </button>
      </form>
    </div>
  );
}
