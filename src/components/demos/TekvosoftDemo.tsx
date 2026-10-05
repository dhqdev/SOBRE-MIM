import type { Demo, DemoSceneProps } from './DemoPlayer';
import { Cursor, Typing, reveal } from './parts';

const CONTACTS = [
  { initials: 'MC', name: 'Mariana Costa', color: '#6366f1' },
  { initials: 'RS', name: 'Rafael Souza', color: '#ec4899' },
  { initials: 'CL', name: 'Clínica Bem Estar', color: '#10b981' },
];

const COLUMNS = ['Novo', 'Atendendo', 'Fechado'];
/** Em que coluna do kanban o card da Mariana está em cada capítulo. */
const CARD_COLUMN = [-1, 0, 0, 1, 2];

const Scene = ({ step }: DemoSceneProps) => {
  const column = CARD_COLUMN[step];

  return (
    <div className="relative grid h-full w-full grid-cols-[150px_1fr_130px] bg-[#16161a] text-[12px] text-white/90">
      {/* conversas */}
      <div className="border-r border-white/[0.06] p-2">
        <div className="rounded-md bg-white/[0.05] px-2 py-1 text-[10px] text-white/40">Buscar conversa…</div>
        <div className="mt-2 space-y-1">
          {CONTACTS.map((contact, index) => {
            const isNew = index === 0;
            return (
              <div
                key={contact.initials}
                className={`flex items-center gap-2 rounded-md px-1.5 py-1.5 transition-colors duration-500 ${
                  isNew && step >= 0 ? 'bg-[#6366f1]/15' : ''
                }`}
              >
                <span
                  className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-[10px] font-semibold"
                  style={{ background: contact.color }}
                >
                  {contact.initials}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[11px] font-medium">{contact.name}</span>
                  <span className="block truncate text-[10px] text-white/45">
                    {isNew ? 'Quero saber dos planos 😊' : 'Obrigado pelo atendimento!'}
                  </span>
                </span>
                {isNew && step === 0 && (
                  <span className="grid h-4 w-4 place-items-center rounded-full bg-[#6366f1] text-[9px] animate-in zoom-in">
                    1
                  </span>
                )}
              </div>
            );
          })}
        </div>
        <div className="mt-3 border-t border-white/[0.06] pt-2 text-[10px] text-white/40">
          <p>Filas</p>
          <p className="mt-1 flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-sky-400" /> Suporte
          </p>
          <p
            className={`mt-1 flex items-center gap-1.5 transition-colors duration-500 ${
              step === 2 ? 'text-amber-300' : ''
            }`}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400" /> Vendas {step >= 2 && '· 1'}
          </p>
        </div>
      </div>

      {/* chat */}
      <div className="flex flex-col p-3">
        <div className="flex items-center gap-2 border-b border-white/[0.06] pb-2">
          <span className="grid h-6 w-6 place-items-center rounded-full bg-[#6366f1] text-[9px] font-semibold">
            MC
          </span>
          <span className="text-[11px] font-medium">Mariana Costa</span>
          <span className="ml-auto text-[10px] text-white/40">WhatsApp Comercial</span>
        </div>
        <div className="flex flex-1 flex-col justify-end gap-2 pt-2">
          <div
            className={reveal(step >= 0, 'max-w-[80%] self-start rounded-lg bg-white/[0.07] px-2.5 py-1.5')}
          >
            Oi! Vi o anúncio. Quero saber dos planos 😊
          </div>
          <div className={reveal(step >= 1, 'max-w-[85%] self-end rounded-lg bg-[#4f46e5]/40 px-2.5 py-1.5')}>
            <span className="block text-[9px] font-semibold text-emerald-300">🤖 Assistente com IA</span>
            Olá, Mariana! Quantos atendentes vão usar?
          </div>
          <div
            className={reveal(
              step >= 2,
              'self-center rounded-full border border-amber-300/30 bg-amber-300/10 px-2 py-0.5 text-[10px] text-amber-200',
            )}
          >
            → transferida para a fila Vendas
          </div>
          <div className={reveal(step >= 3, 'max-w-[85%] self-end rounded-lg bg-[#4f46e5]/40 px-2.5 py-1.5')}>
            <span className="block text-[9px] font-semibold text-sky-300">David</span>
            Oi, Mariana! Segue a proposta 📄
            <span className="mt-1 flex items-center gap-1.5 rounded bg-black/30 px-1.5 py-1 text-[10px]">
              <span className="rounded bg-red-500 px-1 text-[8px] font-bold">PDF</span> Proposta-Business.pdf
            </span>
          </div>
        </div>
        <div className="mt-2 flex items-center gap-2 rounded-full bg-white/[0.05] px-3 py-1.5 text-[10px] text-white/35">
          {step === 0 ? (
            <span className="inline-flex items-center gap-2 text-white/60">
              <Typing /> o chatbot está respondendo
            </span>
          ) : (
            'Digite uma mensagem…'
          )}
        </div>
      </div>

      {/* kanban */}
      <div className="border-l border-white/[0.06] p-2">
        <p className="text-[10px] font-medium text-white/60">Kanban</p>
        <div className="mt-2 space-y-2">
          {COLUMNS.map((name, index) => (
            <div key={name} className="rounded-md bg-white/[0.03] p-1.5">
              <p className="text-[9px] uppercase tracking-wider text-white/40">{name}</p>
              <div className="mt-1 min-h-[34px]">
                {column === index && (
                  <div
                    key={`${name}-${step}`}
                    className={`rounded border px-1.5 py-1 text-[10px] animate-in fade-in slide-in-from-top-2 duration-500 ${
                      index === 2
                        ? 'border-emerald-400/40 bg-emerald-400/10'
                        : 'border-white/10 bg-white/[0.06]'
                    }`}
                  >
                    Mariana Costa
                    <span className="block text-[9px] text-white/45">
                      {index === 2 ? 'venda fechada ✅' : 'plano Business'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <Cursor
        x={[60, 300, 120, 470, 480][step]}
        y={[40, 200, 140, 260, 250][step]}
        click={step === 3 ? step : undefined}
      />
    </div>
  );
};

export const tekvosoftDemo: Demo = {
  url: 'chat.tekvosoft.com',
  steps: [
    'Cliente chama no WhatsApp',
    'Chatbot com IA responde',
    'Vai pra fila de Vendas',
    'Atendente assume a conversa',
    'Kanban fecha a venda',
  ],
  Scene,
};
