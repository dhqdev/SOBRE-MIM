import type { Demo, DemoSceneProps } from './DemoPlayer';
import { Cursor, Typing, reveal } from './parts';

const FIELDS = [
  { label: 'Nome', value: 'Ana Souza' },
  { label: 'WhatsApp', value: '(19) 99999-0000' },
  { label: 'Encontro', value: 'Novembro · 3 dias' },
];

const Scene = ({ step }: DemoSceneProps) => (
  <div className="relative h-full w-full overflow-hidden bg-[#1a1410] text-[12px] text-white">
    {/* Recorte do site real (o hero do retiro), sem os selos do print. */}
    <div
      className={`absolute inset-0 transition-[filter,transform] duration-700 ${
        step >= 1 ? 'scale-[1.03] blur-[2px] brightness-50' : ''
      }`}
      style={{
        backgroundImage: 'url(/media/projects/encontro-com-deus.webp)',
        backgroundSize: '1280px 800px',
        backgroundPosition: '-264px -240px',
      }}
    />

    {/* inscrição */}
    <div
      className={reveal(
        step === 1 || step === 2,
        'absolute left-1/2 top-1/2 w-[260px] -translate-x-1/2 -translate-y-1/2 rounded-xl border border-white/15 bg-[#1c1712]/95 p-4 shadow-2xl',
      )}
    >
      <p className="text-center font-serif text-[15px]">Quero participar 🧡</p>
      {step === 2 ? (
        <div className="mt-4 text-center animate-in fade-in zoom-in-95 duration-500">
          <p className="text-2xl">🙌</p>
          <p className="mt-1 text-[13px] font-medium">Inscrição confirmada!</p>
          <p className="mt-1 text-[11px] text-white/60">Os detalhes chegam no seu WhatsApp.</p>
        </div>
      ) : (
        <div className="mt-3 space-y-2">
          {FIELDS.map((field, index) => (
            <label key={field.label} className="block">
              <span className="text-[10px] text-white/50">{field.label}</span>
              <span className="mt-0.5 block h-7 overflow-hidden rounded-md border border-white/10 bg-white/[0.05] px-2 leading-7">
                <span
                  className="inline-block overflow-hidden whitespace-nowrap align-top transition-[max-width] duration-700 ease-linear"
                  style={{
                    maxWidth: step === 1 ? '200px' : '0px',
                    transitionDelay: `${300 + index * 700}ms`,
                  }}
                >
                  {field.value}
                </span>
              </span>
            </label>
          ))}
          <span className="mt-1 block rounded-md bg-orange-500 py-1.5 text-center text-[11px] font-semibold">
            Confirmar inscrição
          </span>
        </div>
      )}
    </div>

    {/* assistente com IA */}
    <div
      className={reveal(
        step === 3,
        'absolute bottom-14 right-4 w-[250px] rounded-xl border border-white/15 bg-[#1c1712]/95 p-3 shadow-2xl',
      )}
    >
      <p className="flex items-center gap-1.5 text-[11px] font-semibold">
        <span className="h-2 w-2 rounded-full bg-emerald-400" /> Assistente do Encontro
      </p>
      <div className="mt-2 space-y-1.5">
        <p className="ml-auto w-fit max-w-[85%] rounded-lg bg-orange-500/80 px-2 py-1 text-[11px]">
          Tô ansiosa. Como me preparo?
        </p>
        <div className="max-w-[92%] rounded-lg bg-white/10 px-2 py-1.5 text-[11px] leading-snug">
          {step === 3 ? (
            <span className="block animate-in fade-in duration-700 [animation-delay:900ms] [animation-fill-mode:both]">
              Que lindo passo, Ana! 🙏 Vá de coração aberto. "Vinde a mim, todos os que estão cansados." (Mt
              11:28)
            </span>
          ) : (
            <Typing />
          )}
        </div>
      </div>
    </div>

    {/* botão do chat */}
    <span
      className={`absolute bottom-3 right-4 grid h-9 w-9 place-items-center rounded-full bg-purple-600 text-sm shadow-lg transition-transform duration-500 ${
        step === 3 ? 'scale-110' : ''
      }`}
    >
      💬
    </span>

    <Cursor
      x={[290, 300, 300, 540][step]}
      y={[245, 215, 215, 315][step]}
      click={step === 0 || step === 3 ? step : undefined}
    />
  </div>
);

export const encontroDemo: Demo = {
  url: 'encontro-com-deus.vercel.app',
  steps: [
    'Conheça o retiro',
    'Inscrição em 1 minuto',
    'Confirmação no WhatsApp',
    'Assistente com IA aconselha',
  ],
  stepMs: 3600,
  Scene,
};
