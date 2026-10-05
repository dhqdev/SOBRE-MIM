import type { Demo, DemoSceneProps } from './DemoPlayer';
import { Cursor, Ticker, reveal } from './parts';

const BALANCE = ['R$ 3.240,00', 'R$ 3.057,10', 'R$ 3.057,10', 'R$ 3.057,10', 'R$ 3.057,10'];

/** Fatias do gráfico: categoria, % e cor. */
const SLICES = [
  { name: 'Alimentação', value: 34, color: '#f97316' },
  { name: 'Moradia', value: 28, color: '#a855f7' },
  { name: 'Transporte', value: 18, color: '#ec4899' },
  { name: 'Lazer', value: 12, color: '#38bdf8' },
  { name: 'Outros', value: 8, color: '#64748b' },
];

const ROWS = [
  { name: 'Salário', value: '+ R$ 4.800,00', tone: 'text-emerald-300', tag: 'Renda' },
  { name: 'Aluguel', value: '− R$ 1.350,00', tone: 'text-white/80', tag: 'Moradia' },
];

const Donut = ({ show }: { show: boolean }) => {
  let offset = 0;
  return (
    <svg viewBox="0 0 42 42" className="h-[104px] w-[104px] -rotate-90">
      <circle cx="21" cy="21" r="15.9" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
      {SLICES.map((slice, index) => {
        const dash = show ? slice.value : 0;
        const circle = (
          <circle
            key={slice.name}
            cx="21"
            cy="21"
            r="15.9"
            fill="none"
            stroke={slice.color}
            strokeWidth="6"
            strokeDasharray={`${dash} ${100 - dash}`}
            strokeDashoffset={-offset}
            pathLength={100}
            className="transition-[stroke-dasharray] duration-700 ease-out"
            style={{ transitionDelay: `${index * 120}ms` }}
          />
        );
        offset += slice.value;
        return circle;
      })}
    </svg>
  );
};

const Scene = ({ step }: DemoSceneProps) => (
  <div className="relative grid h-full w-full grid-cols-[120px_1fr] bg-[#0f0d14] text-[12px] text-white/90">
    {/* menu */}
    <div className="border-r border-white/[0.06] p-3">
      <div className="flex items-center gap-2">
        <span className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-to-br from-orange-500 via-rose-500 to-purple-600 text-[13px]">
          🐷
        </span>
        <span className="text-[13px] font-semibold">Planejai</span>
      </div>
      <div className="mt-4 space-y-1 text-[11px] text-white/50">
        {['Visão geral', 'Lançamentos', 'Relatórios', 'Metas'].map((item, index) => (
          <p
            key={item}
            className={`rounded-md px-2 py-1 transition-colors duration-500 ${
              (step <= 1 && index === 1) || (step === 2 && index === 2) || (step >= 3 && index === 3)
                ? 'bg-white/[0.07] text-white'
                : ''
            }`}
          >
            {item}
          </p>
        ))}
      </div>
    </div>

    <div className="p-3">
      <div className="grid grid-cols-[1fr_auto] items-start gap-3">
        <div className="rounded-xl border border-white/[0.06] bg-gradient-to-br from-purple-600/25 to-orange-500/10 p-3">
          <p className="text-[10px] uppercase tracking-wider text-white/55">Saldo do mês</p>
          <p className="mt-0.5 text-xl font-semibold tracking-tight">
            <Ticker value={BALANCE[step]} />
          </p>
        </div>
        <button
          type="button"
          tabIndex={-1}
          className={`rounded-lg px-3 py-2 text-[11px] font-medium transition-colors duration-300 ${
            step === 0 ? 'bg-white text-black' : 'bg-white/10 text-white'
          }`}
        >
          + Novo gasto
        </button>
      </div>

      <div className="mt-3 grid grid-cols-[1fr_150px] gap-3">
        {/* lançamentos */}
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-2.5">
          <p className="text-[10px] uppercase tracking-wider text-white/45">Lançamentos</p>
          <div className="mt-1.5 space-y-1.5">
            <div
              className={reveal(
                step >= 0,
                'flex items-center gap-2 rounded-md border border-orange-400/30 bg-orange-400/[0.06] px-2 py-1.5',
              )}
            >
              <span>🛒</span>
              <span className="flex-1">
                Mercado
                <span
                  className={`ml-1.5 rounded px-1 py-0.5 text-[9px] transition-all duration-500 ${
                    step >= 1 ? 'bg-orange-400/20 text-orange-200 opacity-100' : 'opacity-0'
                  }`}
                >
                  Alimentação · automático
                </span>
              </span>
              <span>− R$ 182,90</span>
            </div>
            {ROWS.map((row) => (
              <div key={row.name} className="flex items-center gap-2 rounded-md px-2 py-1.5 text-white/70">
                <span>{row.name === 'Salário' ? '💼' : '🏠'}</span>
                <span className="flex-1">{row.name}</span>
                <span className={row.tone}>{row.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* gráfico */}
        <div className="flex flex-col items-center rounded-xl border border-white/[0.06] bg-white/[0.02] p-2">
          <Donut show={step >= 2} />
          <div className={reveal(step >= 2, 'mt-1 w-full space-y-0.5 text-[9px] text-white/60')}>
            {SLICES.slice(0, 3).map((slice) => (
              <p key={slice.name} className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: slice.color }} />
                {slice.name} <span className="ml-auto">{slice.value}%</span>
              </p>
            ))}
          </div>
        </div>
      </div>

      {/* meta */}
      <div className={reveal(step >= 3, 'mt-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-2.5')}>
        <p className="flex items-center text-[11px]">
          🎯 Meta: guardar R$ 500 este mês
          <span className={`ml-auto transition-colors ${step >= 4 ? 'text-emerald-300' : 'text-white/50'}`}>
            {step >= 4 ? 'batida! ✅' : '62%'}
          </span>
        </p>
        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-orange-500 to-purple-500 transition-[width] duration-1000 ease-out"
            style={{ width: step >= 4 ? '100%' : step >= 3 ? '62%' : '0%' }}
          />
        </div>
      </div>
    </div>

    <Cursor
      x={[520, 330, 470, 420, 420][step]}
      y={[42, 112, 150, 300, 300][step]}
      click={step === 0 ? 0 : undefined}
    />
  </div>
);

export const planejaiDemo: Demo = {
  url: 'planejai.tekvosoft.com',
  steps: [
    'Lança um gasto',
    'Categoriza sozinho',
    'Mostra pra onde vai o dinheiro',
    'Acompanha a meta',
    'Meta batida',
  ],
  Scene,
};
