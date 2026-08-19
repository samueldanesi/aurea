'use client';

import { AlertTriangle } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { EmbeddedChatPanel } from '@/components/embedded-chat-panel';
import { regulationCategories, suggestedRegulationQuestions } from '@/mocks/strategy-regulations-data';

export default function RegulationsPage() {
  async function ask(message: string) {
    const { data } = await apiClient.post('/ai/regulatory-chat', { message });
    return data.answer as string;
  }

  return (
    <div>
      <h1 className="mb-1 text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
        Normative
      </h1>
      <p className="mb-4 text-sm" style={{ color: 'var(--text-secondary)' }}>
        Riferimento normativo su ambiente, dogana/fiscale, sicurezza e privacy, rilevante per la
        tua attività — con una chat per domande specifiche.
      </p>

      <div
        className="mb-6 flex items-start gap-2 rounded-lg border p-3 text-xs"
        style={{ background: 'rgba(250,178,25,0.08)', borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
      >
        <AlertTriangle size={14} style={{ color: 'var(--status-warning)', flexShrink: 0, marginTop: 1 }} />
        <span>
          Indicazioni generali generate dall&rsquo;AI, non consulenza legale, fiscale o ambientale
          certificata. Per decisioni operative, verifica sempre con un consulente qualificato.
        </span>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {regulationCategories.map((cat) => (
          <div
            key={cat.id}
            className="rounded-lg border p-4"
            style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
          >
            <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{cat.title}</p>
            <p className="mt-0.5 mb-3 text-xs" style={{ color: 'var(--text-secondary)' }}>{cat.summary}</p>
            <ul className="space-y-1.5">
              {cat.items.map((item, i) => (
                <li key={i} className="flex gap-2 text-xs" style={{ color: 'var(--text-primary)' }}>
                  <span style={{ color: 'var(--text-muted)' }}>—</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <EmbeddedChatPanel
        title="Assistente normativo AI"
        intro="Fai una domanda su una normativa specifica, es. &ldquo;cosa devo fare per smaltire i RAEE?&rdquo;"
        suggestedQuestions={suggestedRegulationQuestions}
        onAsk={ask}
        disclaimer="Indicazioni generali generate dall'AI, non consulenza legale, fiscale o ambientale certificata. Verifica sempre con un consulente qualificato prima di agire."
      />
    </div>
  );
}
