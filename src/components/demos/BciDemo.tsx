import type { Demo, DemoSceneProps } from './DemoPlayer';
import { Ticker, reveal } from './parts';

/** Linhas do log, agrupadas por capítulo. */
const LOG: { text: string; tone?: string }[][] = [
  [
    { text: '$ python bci_on1.py --dia 08' },
    { text: '→ abrindo portal Servopa…', tone: 'text-white/50' },
    { text: '✓ login feito (sessão segura)', tone: 'text-emerald-300' },
  ],
  [
    { text: '→ lendo tarefas do Todoist…', tone: 'text-white/50' },
    { text: '✓ 3 protocolos encontrados', tone: 'text-emerald-300' },
  ],
  [
    { text: '→ enviando lance #4821… ✓', tone: 'text-sky-300' },
    { text: '→ enviando lance #4822… ✓', tone: 'text-sky-300' },
    { text: '→ enviando lance #4823… ✓', tone: 'text-sky-300' },
  ],
  [{ text: '✓ 3 clientes avisados no WhatsApp', tone: 'text-emerald-300' }],
];

const CARDS = [
  { label: 'Protocolos', icon: '📄', values: ['0', '3', '3', '3'] },
  { label: 'Lances', icon: '🎯', values: ['0', '0', '3', '3'] },
  { label: 'Avisos', icon: '💬', values: ['0', '0', '0', '3'] },
];

const Scene = ({ step }: DemoSceneProps) => (
  <div className="relative grid h-full w-full grid-cols-[1fr_1.1fr] gap-3 bg-[#141826] p-4 text-[12px] text-white/90">
    {/* painel */}
    <div>
      <p className="flex items-center gap-2 text-[13px] font-semibold">
        <span className="grid h-6 w-6 place-items-center rounded-md bg-indigo-500 text-[11px]">👑</span>
        Painel BCI-ON1
      </p>
      <div className="mt-3 grid grid-cols-3 gap-2">
        {CARDS.map((card) => (
          <div key={card.label} className="rounded-lg border border-white/[0.07] bg-white/[0.03] p-2">
            <p className="text-sm">{card.icon}</p>
            <p className="mt-1 text-[9px] uppercase tracking-wider text-white/50">{card.label}</p>
            <p className="text-lg font-semibold">
              <Ticker value={card.values[step]} />
            </p>
          </div>
        ))}
      </div>
      <div className="mt-3 rounded-lg border border-white/[0.07] bg-white/[0.03] p-2.5">
        <p className="flex justify-between text-[11px]">
          Progresso do dia 08 <span className="text-white/60">{[0, 30, 75, 100][step]}%</span>
        </p>
        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-indigo-400 transition-[width] duration-1000 ease-out"
            style={{ width: `${[8, 30, 75, 100][step]}%` }}
          />
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2 text-[10px]">
          <span className="rounded-md bg-white/[0.04] px-2 py-1.5">
            Dia 08{' '}
            <span className={step >= 2 ? 'text-emerald-300' : 'text-amber-300'}>
              {step >= 2 ? '● rodando' : '● agendado'}
            </span>
          </span>
          <span className="rounded-md bg-white/[0.04] px-2 py-1.5">
            Dia 16 <span className="text-white/50">● agendado</span>
          </span>
        </div>
      </div>
    </div>

    {/* log */}
    <div className="flex flex-col rounded-lg border border-white/[0.07] bg-black/40 p-2.5 font-mono text-[11px] leading-relaxed">
      <p className="mb-1 text-[10px] text-white/40">automação · log</p>
      {LOG.map((group, index) =>
        group.map((line, lineIndex) => (
          <p
            key={`${index}-${lineIndex}`}
            className={`${reveal(index <= step)} ${line.tone ?? 'text-white/85'}`}
            style={{ transitionDelay: index === step ? `${lineIndex * 450}ms` : '0ms' }}
          >
            {line.text}
          </p>
        )),
      )}
    </div>

    {/* notificação do WhatsApp */}
    <div
      className={`absolute bottom-4 left-4 w-[230px] rounded-xl border border-white/15 bg-[#0f1a14] p-2.5 shadow-2xl transition-all duration-700 ${
        step === 3 ? 'translate-y-0 opacity-100' : 'translate-y-[140%] opacity-0'
      }`}
    >
      <p className="flex items-center gap-1.5 text-[10px] font-semibold text-emerald-300">
        <span className="grid h-4 w-4 place-items-center rounded-full bg-emerald-500 text-[8px] text-black">
          ✓
        </span>
        WhatsApp · agora
      </p>
      <p className="mt-1 text-[11px] leading-snug">Olá, Ana! Seu lance do grupo 1042 foi enviado hoje ✅</p>
    </div>
  </div>
);

export const bciDemo: Demo = {
  url: 'bci-on1 · painel',
  steps: [
    'Login automático no Servopa',
    'Puxa os protocolos do Todoist',
    'Envia os lances do dia',
    'Avisa o cliente no WhatsApp',
  ],
  stepMs: 3400,
  Scene,
};
