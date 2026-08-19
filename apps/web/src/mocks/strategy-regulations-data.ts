// Fixtures for the two advisory areas -- distinct in kind from the data chat
// (apps/engine's NL-to-SQL grounded chat): these two are consultative, not
// query-grounded. Strategy reasons over the tenant's own KPIs to suggest
// action; Regulations answers from a curated compliance reference, not from
// warehouse data. Both are explicitly framed as "starting points", not
// certified advice -- see the disclaimer rendered with each panel.

export const suggestedStrategyQuestions = [
  'Come possiamo aumentare il margine medio aziendale?',
  'Conviene investire di più nel canale Marketplace o ridurlo?',
  'Come possiamo ridurre il valore di magazzino fermo?',
  'Ha senso espandersi verso nuovi paesi fornitori oltre a Cina e Germania?',
];

export function buildStrategyReply(message: string): string {
  const lower = message.toLowerCase();

  if (lower.includes('margin')) {
    return 'Guardando ai tuoi dati, tre leve concrete: 1) La Carrozzeria e telai ha il margine più alto (52%) ma pesa solo il 7% del fatturato — dai priorità ai lotti da disassemblaggio che generano questi pezzi. 2) Il Marketplace ha il margine più basso (22%) per via delle provvigioni: sposta gradualmente volumi verso Vendita diretta e B2B Officine (36-38%). 3) I €125.000 di magazzino fermo sono capitale immobilizzato: liquidarli anche a margine ridotto libera cassa da reinvestire in acquisti a marginalità più alta.';
  }
  if (lower.includes('marketplace')) {
    return 'Il Marketplace genera il 25% del fatturato (€96.000) ma il margine più basso (22%). La domanda giusta non è "aumentare o ridurre" ma "per cosa usarlo": è efficace per pezzi comuni ad alta rotazione, dove il volume compensa il margine basso — meno per pezzi rari o di alto valore, dove la vendita diretta o B2B rende molto di più. Segmenta il catalogo per canale invece di trattarli come alternativi.';
  }
  if (lower.includes('magazzino') || lower.includes('fermo') || lower.includes('scorte') || lower.includes('giacenz')) {
    return 'Hai €125.000 fermi, di cui €19.000 da oltre 12 mesi. Tre azioni tipiche in questo settore: sconti progressivi per fascia di anzianità (es. -20% dopo 6 mesi, -40% dopo 12), bundle con pezzi ad alta rotazione per smuovere lo stock lento, e la vendita massiva a un rivenditore di "lotti misti" per i pezzi fermi da oltre un anno, anche sotto costo, per liberare spazio e capitale.';
  }
  if (lower.includes('fornitor') || lower.includes('paese') || lower.includes('cina') || lower.includes('german') || lower.includes('espand')) {
    return 'La Cina pesa ancora tanto se sommata all\'Italia (usato/lotti): è un rischio di concentrazione su tempi di consegna e dazi. Prima di aggiungere nuovi paesi, verifica se puoi ribilanciare tra i fornitori già attivi — Taiwan e Turchia hanno margini di trattativa simili con minor rischio logistico. Un nuovo paese fornitore ha senso solo se risolve un problema specifico (costo, tempi, categoria non coperta), non solo per diversificare sulla carta.';
  }
  if (lower.includes('venditor') || lower.includes('commission') || lower.includes('provvig') || lower.includes('team')) {
    return 'Il tuo schema di provvigioni è già calcolato sul margine, non sul fatturato — è la scelta giusta perché disincentiva le vendite a basso margine. Il divario tra Marco Ferretti (€42.500 di margine) e Giulia Moretti (€10.600) è ampio: prima di aumentare le provvigioni, valuta se il mix di clienti assegnato a Giulia limita il suo potenziale, piuttosto che assumere sia un problema di impegno individuale.';
  }
  if (lower.includes('costi') || lower.includes('utile') || lower.includes('ebitda') || lower.includes('fiss')) {
    return 'I costi fissi (€92.000/mese, soprattutto personale) pesano il 24,3% sul fatturato, in calo rispetto al 28,2% di Marzo — l\'efficienza sta migliorando con la crescita del fatturato, che è l\'effetto leva tipico dei costi fissi. La priorità resta far crescere il fatturato a parità di struttura, non tagliare: nei mesi più deboli (Marzo-Maggio) l\'utile netto era vicino al pareggio, segno che il punto di equilibrio è vicino al fatturato medio attuale.';
  }

  return 'Non ho un\'analisi pronta su questo, ma posso ragionare a partire dai tuoi dati reali: fatturato, margini per categoria/canale, magazzino fermo, fornitori, o compensi del team vendite. Prova a chiedermi di uno di questi temi, oppure riformula la domanda in modo più specifico.';
}

export const regulationCategories = [
  {
    id: 'ambientale',
    title: 'Ambientale e gestione rifiuti',
    summary: 'Rottami, RAEE e oli esausti derivanti dal disassemblaggio',
    items: [
      'Iscrizione all’Albo Gestori Ambientali nella categoria adeguata per la gestione di rottami metallici',
      'Registro cronologico di carico/scarico rifiuti (transizione al RENTRI)',
      'Smaltimento RAEE secondo il D.Lgs. 49/2014 (recepimento direttiva WEEE)',
      'Conferimento oli esausti tramite consorzi autorizzati (es. CONOU)',
    ],
  },
  {
    id: 'doganale-fiscale',
    title: 'Doganale e fiscale',
    summary: 'Import da paesi extra-UE (Cina, Turchia) ed intra-UE (Germania)',
    items: [
      'Classificazione doganale TARIC dei ricambi importati',
      'Dazi doganali e IVA all’importazione sugli acquisti extra-UE',
      'Intrastat per gli acquisti intra-UE',
      'Fatturazione elettronica obbligatoria B2B e B2C',
    ],
  },
  {
    id: 'sicurezza',
    title: 'Sicurezza sul lavoro',
    summary: 'Smontaggio, movimentazione carichi e magazzino',
    items: [
      'Documento di Valutazione dei Rischi (DVR) ai sensi del D.Lgs. 81/2008',
      'Patentino per la conduzione di carrelli elevatori (Accordo Stato-Regioni)',
      'Dispositivi di protezione individuale per le attività di disassemblaggio',
      'Sorveglianza sanitaria per la movimentazione manuale dei carichi',
    ],
  },
  {
    id: 'privacy',
    title: 'Privacy e trattamento dati',
    summary: 'Dati di clienti, fornitori e rete vendita nel gestionale',
    items: [
      'Trattamento dati ai sensi del Regolamento UE 2016/679 (GDPR)',
      'Registro delle attività di trattamento',
      'Basi giuridiche per il trattamento dei dati commerciali',
      'Valutazione della necessità di un DPO in base alla dimensione aziendale',
    ],
  },
];

export const suggestedRegulationQuestions = [
  'Cosa devo fare per smaltire correttamente i RAEE?',
  'Serve un’autorizzazione per acquistare rottami metallici?',
  'Quali documenti servono per l’importazione dalla Cina?',
  'Serve il patentino per usare i carrelli elevatori in magazzino?',
];

export function buildRegulationReply(message: string): string {
  const lower = message.toLowerCase();

  if (lower.includes('raee') || lower.includes('elettr')) {
    return 'I RAEE derivanti dal disassemblaggio vanno gestiti secondo il D.Lgs. 49/2014: raccolta differenziata, conferimento a impianti autorizzati o consorzi di filiera, e registrazione nel registro di carico/scarico (in transizione verso il RENTRI). Verifica che l’impianto che li ritira sia autorizzato e richiedi sempre il formulario di identificazione rifiuto (FIR) come prova di corretto smaltimento.';
  }
  if (lower.includes('rottam') || lower.includes('albo') || lower.includes('gestori ambientali')) {
    return 'Generalmente sì: l’attività di commercio/gestione di rottami metallici richiede l’iscrizione all’Albo Nazionale Gestori Ambientali nella categoria pertinente (tipicamente categoria 5 per intermediazione senza detenzione, o categorie superiori se c’è stoccaggio/trattamento). Le soglie esatte dipendono dai volumi trattati — verifica la categoria corretta con un consulente ambientale.';
  }
  if (lower.includes('cina') || lower.includes('doganal') || lower.includes('import') || lower.includes('dazi') || lower.includes('taric')) {
    return 'Per importazioni extra-UE come dalla Cina servono: bolla doganale con classificazione TARIC corretta, fattura commerciale, documento di trasporto, e pagamento di dazi doganali + IVA all’importazione (variabile per categoria merceologica). Se il fornitore beneficia di accordi commerciali preferenziali, un certificato di origine può ridurre i dazi applicabili.';
  }
  if (lower.includes('carrell') || lower.includes('muletto') || lower.includes('patentino') || lower.includes('sicurezza')) {
    return 'Sì. L’Accordo Stato-Regioni richiede un’abilitazione specifica (corso teorico-pratico con verifica finale) per chiunque conduca carrelli elevatori semoventi, anche in un magazzino privato. È responsabilità del datore di lavoro garantire che gli operatori siano formati e che la formazione sia periodicamente aggiornata.';
  }
  if (lower.includes('privacy') || lower.includes('gdpr') || lower.includes('dati')) {
    return 'Il trattamento dei dati di clienti, fornitori e rete vendita nel gestionale ricade nel Regolamento UE 2016/679 (GDPR): serve una base giuridica per ogni trattamento (tipicamente contratto o legittimo interesse), un registro delle attività di trattamento, e una valutazione se la dimensione/attività aziendale richieda la nomina di un DPO.';
  }
  if (lower.includes('oli') || lower.includes('conou')) {
    return 'Gli oli esausti derivanti dalla manutenzione/disassemblaggio devono essere conferiti tramite consorzi autorizzati come il CONOU (Consorzio Nazionale di Gestione, Raccolta e Trattamento degli Oli Minerali Usati) — non possono essere smaltiti come rifiuto generico.';
  }

  return 'Non ho informazioni specifiche su questo nei dati demo. Le aree coperte sono: gestione rifiuti e RAEE, dazi e documentazione doganale, sicurezza sul lavoro, e privacy/GDPR. Nota: queste sono indicazioni generali, non consulenza legale, fiscale o ambientale certificata — per decisioni operative verifica sempre con un consulente qualificato.';
}
