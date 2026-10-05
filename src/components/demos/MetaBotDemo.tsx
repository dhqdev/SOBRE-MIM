import type { Demo, DemoSceneProps } from './DemoPlayer';
import { Ticker, reveal } from './parts';

const AGENTS = [
  { id: 'N', name: 'Nina', role: 'notícias', color: '#f472b6' },
  { id: 'R', name: 'Rita', role: 'risco', color: '#f87171' },
  { id: 'G', name: 'Gustavo', role: 'gerente', color: '#fbbf24' },
  { id: 'E', name: 'Estela', role: 'estratégias', color: '#a78bfa' },
  { id: 'C', name: 'Caio', role: 'execução', color: '#34d399' },
  { id: 'A', name: 'Aurora', role: 'auditoria', color: '#60a5fa' },
];

/** Quem fala em cada capítulo e o que diz. */
const LINES = [
  { agent: 0, text: 'CPI dos EUA sai às 9h30. Volatilidade alta hoje 📰' },
  { agent: 1, text: 'Risco ok: no máximo 0,5% por operação 🛡️' },
  { agent: 2, text: 'Reunião das 19h: foco em EURUSD, nada de ouro.' },
  { agent: 4, text: 'Ordem executada: COMPRA EURUSD 0.10 ✅' },
  { agent: 5, text: 'Dia fechado: +R$ 182,40 (+1,8%) 📈' },
];

const PNL = ['R$ 0,00', 'R$ 0,00', 'R$ 0,00', '+R$ 61,20', '+R$ 182,40'];

const Scene = ({ step }: DemoSceneProps) => {
  const speaking = LINES[step].agent;
  const meeting = step === 2;

  return (
    <div className="relative h-full w-full bg-[#0b0b10] p-4 font-sans text-[13px] text-white/90">
      {/* topo */}
      <div className="flex items-center gap-2">
        <span className="font-mono text-[12px] font-bold tracking-wider text-[#a78bfa]">META-BOT</span>
        <span className="rounded bg-white/[0.06] px-1.5 py-0.5 font-mono text-[10px] text-white/60">
          escritório
        </span>
        <span className="ml-auto rounded border border-emerald-400/30 bg-emerald-400/10 px-1.5 py-0.5 font-mono text-[10px] text-emerald-300">
          ● ESCRITÓRIO ABERTO
        </span>
      </div>

      <div className="mt-3 grid grid-cols-[1.25fr_1fr] gap-3">
        {/* escritório */}
        <div className="relative h-[214px] overflow-hidden rounded-lg border border-white/[0.06] bg-[repeating-linear-gradient(45deg,#1a1520_0_12px,#1d1824_12px_24px)]">
          <div className="grid grid-cols-3 gap-x-3 gap-y-6 p-4">
            {AGENTS.map((agent, index) => {
              const active = index === speaking || (meeting && index <= 5);
              return (
                <div key={agent.id} className="flex flex-col items-center">
                  <div
                    className={`grid h-10 w-10 place-items-center rounded-md font-mono text-sm font-bold text-black transition-all duration-500 ${
                      active ? 'scale-110 shadow-[0_0_18px_currentColor]' : 'opacity-60'
                    }`}
                    style={{ background: agent.color, color: active ? agent.color : undefined }}
                  >
                    <span className="text-black">{agent.id}</span>
                  </div>
                  <div className="mt-1 h-1.5 w-12 rounded-sm bg-white/20" />
                  <span className="mt-1 text-[10px] text-white/60">{agent.name}</span>
                </div>
              );
            })}
          </div>
          {/* mesa de reunião */}
          <div
            className={`absolute inset-x-10 bottom-3 rounded-md border border-amber-300/40 bg-amber-300/10 py-1 text-center font-mono text-[10px] text-amber-200 transition-all duration-500 ${
              meeting ? 'opacity-100' : 'opacity-0'
            }`}
          >
            reunião diária · 19:00
          </div>
        </div>

        {/* conversa */}
        <div className="flex h-[214px] flex-col rounded-lg border border-white/[0.06] bg-white/[0.02] p-2.5">
          <span className="text-[11px] font-medium text-white/70">Conversa da equipe</span>
          <div className="mt-2 flex flex-1 flex-col justify-end gap-1.5 overflow-hidden">
            {LINES.map((line, index) => {
              const agent = AGENTS[line.agent];
              return (
                <div
                  key={index}
                  className={reveal(
                    index <= step,
                    `rounded-md border-l-2 bg-white/[0.04] px-2 py-1 text-[11px] leading-snug ${index < step - 2 ? 'hidden' : ''}`,
                  )}
                  style={{ borderColor: agent.color }}
                >
                  <span className="font-semibold" style={{ color: agent.color }}>
                    {agent.name}
                  </span>{' '}
                  {line.text}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* rodapé com números */}
      <div className="mt-3 grid grid-cols-3 gap-3">
        <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2">
          <p className="text-[10px] uppercase tracking-wider text-white/50">hoje</p>
          <p
            className={`font-mono text-base font-semibold ${step >= 3 ? 'text-emerald-300' : 'text-white/80'}`}
          >
            <Ticker value={PNL[step]} />
          </p>
        </div>
        <div className="col-span-2 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2">
          <p className="text-[10px] uppercase tracking-wider text-white/50">EURUSD</p>
          <svg viewBox="0 0 200 26" className="h-[26px] w-full">
            <polyline
              key={step >= 3 ? 'on' : 'off'}
              points="0,20 20,18 40,21 60,15 80,17 100,12 120,14 140,8 160,10 180,5 200,3"
              fill="none"
              stroke={step >= 3 ? '#34d399' : 'rgba(255,255,255,0.25)'}
              strokeWidth="2"
              pathLength={1}
              strokeDasharray="1"
              className="[animation:demo-draw_1.4s_ease-out_both]"
            />
          </svg>
        </div>
      </div>

      {/* celular com a notificação */}
      <div
        className={`absolute bottom-5 right-5 w-[150px] rounded-2xl border border-white/15 bg-[#121218] p-2 shadow-2xl transition-all duration-700 ${
          step === 4 ? 'translate-y-0 opacity-100' : 'translate-y-[120%] opacity-0'
        }`}
      >
        <div className="mx-auto mb-2 h-1 w-8 rounded-full bg-white/20" />
        <div className="rounded-lg bg-white/[0.06] p-2">
          <p className="text-[10px] font-semibold text-[#a78bfa]">Meta-Bot · agora</p>
          <p className="text-[11px] leading-snug">Dia positivo: +1,8% 📈</p>
        </div>
      </div>
    </div>
  );
};

export const metaBotDemo: Demo = {
  url: 'meta-bot · escritório',
  steps: [
    'Nina lê as notícias',
    'Rita confere o risco',
    'Reunião das 19h',
    'Caio executa a ordem',
    'Resultado no celular',
  ],
  Scene,
};
