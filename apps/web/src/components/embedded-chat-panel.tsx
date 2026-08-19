'use client';

import { useState } from 'react';
import { Sparkles, Send } from 'lucide-react';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

/**
 * Full-panel chat (as opposed to the floating data-chat widget) for the two
 * advisory areas -- Strategia and Normative. Both are consultative rather
 * than query-grounded, so unlike ChatWidget there's no generated-SQL trail
 * to show; the disclaimer footer is what stands in for that "don't just
 * trust this blindly" signal here.
 */
export function EmbeddedChatPanel({
  title,
  intro,
  suggestedQuestions,
  onAsk,
  disclaimer,
}: {
  title: string;
  intro: string;
  suggestedQuestions: string[];
  onAsk: (message: string) => Promise<string>;
  disclaimer: string;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  async function send(question: string) {
    if (!question.trim() || loading) return;
    setInput('');
    setMessages((m) => [...m, { role: 'user', content: question }]);
    setLoading(true);
    try {
      const answer = await onAsk(question);
      setMessages((m) => [...m, { role: 'assistant', content: answer }]);
    } catch {
      setMessages((m) => [...m, { role: 'assistant', content: 'Errore nel recupero della risposta.' }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="flex h-[560px] flex-col rounded-lg border"
      style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
    >
      <div className="flex items-center gap-2 border-b px-4 py-3" style={{ borderColor: 'var(--border)' }}>
        <div
          className="flex h-7 w-7 items-center justify-center rounded-md"
          style={{ background: 'var(--brand)', color: 'var(--brand-ink)' }}
        >
          <Sparkles size={14} />
        </div>
        <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{title}</p>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-4 text-sm">
        {messages.length === 0 && (
          <div className="space-y-3">
            <p style={{ color: 'var(--text-muted)' }}>{intro}</p>
            <div className="flex flex-col gap-2">
              {suggestedQuestions.map((q) => (
                <button
                  key={q}
                  onClick={() => send(q)}
                  className="rounded-md border px-3 py-2 text-left text-xs transition-colors hover:bg-black/[0.02]"
                  style={{ borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
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
            Sto elaborando una risposta…
          </div>
        )}
      </div>

      <p className="px-4 py-2 text-[11px]" style={{ color: 'var(--text-muted)', borderTop: '1px solid var(--border)' }}>
        {disclaimer}
      </p>

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
