'use client';

import { apiClient } from '@/lib/api-client';
import { EmbeddedChatPanel } from '@/components/embedded-chat-panel';
import { suggestedStrategyQuestions } from '@/mocks/strategy-regulations-data';

export default function StrategyPage() {
  async function ask(message: string) {
    const { data } = await apiClient.post('/ai/strategy-chat', { message });
    return data.answer as string;
  }

  return (
    <div>
      <h1 className="mb-1 text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
        Strategia
      </h1>
      <p className="mb-6 text-sm" style={{ color: 'var(--text-secondary)' }}>
        Un consulente AI che ragiona a partire dai tuoi dati reali — margini, canali, magazzino,
        fornitori, rete vendita — per suggerire dove e come migliorare.
      </p>

      <EmbeddedChatPanel
        title="Consulente strategico AI"
        intro="Fai una domanda sulla strategia commerciale, es. &ldquo;come possiamo aumentare il margine medio?&rdquo;"
        suggestedQuestions={suggestedStrategyQuestions}
        onAsk={ask}
        disclaimer="Le risposte sono generate dall'AI a partire dai tuoi dati e dal contesto di mercato: sono un punto di partenza per la discussione, non una decisione da eseguire senza verifica del tuo team."
      />
    </div>
  );
}
