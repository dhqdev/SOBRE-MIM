import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { ArrowLeft, Check, Copy, Lock } from 'lucide-react';
import { OUTFITS, type Outfit } from '@/world/outfits';
import { pixPayload } from '@/lib/pix';

/**
 * Lojinha de roupas do boneco. As pagas desbloqueiam com um Pix direto pro
 * David (sem servidor: o desbloqueio é na confiança e fica salvo no navegador).
 */

const Swatch = ({ outfit }: { outfit: Outfit }) => (
  <div className="relative mx-auto h-16 w-12">
    {outfit.cape && (
      <div className="absolute left-1 top-4 h-10 w-10 rounded-sm" style={{ background: outfit.cape }} />
    )}
    <div className="absolute left-2.5 top-0 h-5 w-7 rounded-sm bg-[#e2a878]" />
    {outfit.hat !== 'nenhum' && (
      <div
        className="absolute -top-1 left-1 h-2.5 w-10 rounded-sm"
        style={{ background: outfit.hatColor, opacity: outfit.hat === 'capacete' ? 0.6 : 1 }}
      />
    )}
    <div
      className="absolute left-1.5 top-5 h-6 w-9 rounded-sm"
      style={{
        background: outfit.plaid
          ? `repeating-linear-gradient(90deg, ${outfit.shirt} 0 6px, ${outfit.plaid} 6px 8px), ${outfit.shirt}`
          : outfit.shirt,
      }}
    />
    <div className="absolute left-2 top-11 h-4 w-3.5 rounded-sm" style={{ background: outfit.pants }} />
    <div className="absolute left-6 top-11 h-4 w-3.5 rounded-sm" style={{ background: outfit.pants }} />
    <div
      className="absolute left-2 top-[3.6rem] h-1.5 w-3.5 rounded-sm"
      style={{ background: outfit.shoes }}
    />
    <div
      className="absolute left-6 top-[3.6rem] h-1.5 w-3.5 rounded-sm"
      style={{ background: outfit.shoes }}
    />
  </div>
);

const PayView = ({ outfit, onPaid, onBack }: { outfit: Outfit; onPaid: () => void; onBack: () => void }) => {
  const payload = pixPayload(outfit.price, `ROUPA${outfit.id.toUpperCase()}`);
  const [qr, setQr] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let alive = true;
    void QRCode.toDataURL(payload, {
      margin: 1,
      width: 360,
      color: { dark: '#140c26', light: '#ffffff' },
    }).then((url) => alive && setQr(url));
    return () => {
      alive = false;
    };
  }, [payload]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(payload);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // sem permissão de copiar: o texto fica selecionável ali embaixo
    }
  };

  return (
    <div className="p-5">
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-1 text-sm text-white/70 hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Voltar
      </button>
      <h2 className="mt-3 text-lg font-semibold">
        {outfit.emoji} {outfit.name} · R$ {outfit.price},00
      </h2>
      <p className="mt-1 text-sm leading-relaxed text-white/75">
        Escaneie o QR no app do banco ou use o Pix copia e cola. O dinheiro vai direto pro David e ajuda a
        manter o sítio de pé. Valeu demais!
      </p>
      <div className="mx-auto mt-4 grid w-56 place-items-center rounded-xl bg-white p-2">
        {qr ? (
          <img src={qr} alt={`QR code do Pix de R$ ${outfit.price},00`} className="h-52 w-52" />
        ) : (
          <div className="h-52 w-52 animate-pulse rounded-lg bg-violet-100" />
        )}
      </div>
      <button
        type="button"
        onClick={copy}
        className="mx-auto mt-3 flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-4 py-2 text-sm font-semibold hover:bg-white/10"
      >
        {copied ? <Check className="h-4 w-4 text-emerald-300" /> : <Copy className="h-4 w-4" />}
        {copied ? 'Copiado!' : 'Copiar Pix copia e cola'}
      </button>
      <p className="mt-2 break-all rounded-lg bg-black/30 p-2 font-mono text-[10px] leading-snug text-white/50 select-all">
        {payload}
      </p>
      <button
        type="button"
        onClick={onPaid}
        className="mt-4 w-full rounded-full bg-violet-500 px-4 py-3 text-sm font-semibold transition hover:bg-violet-400 active:scale-95"
      >
        Já fiz o Pix, quero vestir!
      </button>
      <p className="mt-2 text-center text-[11px] text-white/50">
        O desbloqueio é na confiança e fica salvo neste navegador.
      </p>
    </div>
  );
};

const OutfitShop = ({
  current,
  owned,
  onWear,
  onUnlock,
  onClose,
}: {
  current: string;
  owned: string[];
  onWear: (outfit: Outfit) => void;
  onUnlock: (outfit: Outfit) => void;
  onClose: () => void;
}) => {
  const [paying, setPaying] = useState<Outfit | null>(null);

  return (
    <div className="absolute inset-0 z-20 grid place-items-center bg-black/50 p-3" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="loja-titulo"
        className="max-h-[90vh] w-[min(94vw,32rem)] animate-[world-pop_0.3s_ease-out] overflow-y-auto rounded-2xl border border-violet-300/30 bg-[#140c26]/95 shadow-2xl shadow-black/50"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 border-b border-white/10 px-5 py-3">
          <p id="loja-titulo" className="text-xs font-semibold uppercase tracking-wider text-amber-300">
            Guarda-roupa do David
          </p>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full px-2 py-1 text-sm text-white/70 hover:bg-white/10 hover:text-white"
            aria-label="Fechar"
          >
            ✕
          </button>
        </div>
        {paying ? (
          <PayView
            outfit={paying}
            onBack={() => setPaying(null)}
            onPaid={() => {
              onUnlock(paying);
              setPaying(null);
            }}
          />
        ) : (
          <div className="p-4">
            <p className="px-1 text-sm leading-relaxed text-white/75">
              Troque a roupa do boneco. As de graça são suas; as outras você libera com um Pix de R$ 5 ou R$
              10 pra ajudar o David.
            </p>
            <ul className="mt-4 grid grid-cols-3 gap-2">
              {OUTFITS.map((outfit) => {
                const unlocked = outfit.price === 0 || owned.includes(outfit.id);
                const wearing = current === outfit.id;
                return (
                  <li key={outfit.id}>
                    <button
                      type="button"
                      onClick={() => (unlocked ? onWear(outfit) : setPaying(outfit))}
                      className={`flex w-full flex-col items-center gap-1.5 rounded-xl border px-2 pb-2 pt-3 text-center transition active:scale-95 ${
                        wearing
                          ? 'border-amber-300 bg-amber-300/10'
                          : 'border-white/10 bg-white/5 hover:border-violet-300/60 hover:bg-white/10'
                      }`}
                    >
                      <Swatch outfit={outfit} />
                      <span className="text-xs font-semibold leading-tight">
                        {outfit.emoji} {outfit.name}
                      </span>
                      <span
                        className={`flex items-center gap-1 text-[11px] font-semibold ${
                          wearing ? 'text-amber-300' : unlocked ? 'text-emerald-300' : 'text-violet-200'
                        }`}
                      >
                        {wearing ? (
                          'Vestindo'
                        ) : unlocked ? (
                          outfit.price ? (
                            'Liberada'
                          ) : (
                            'Grátis'
                          )
                        ) : (
                          <>
                            <Lock className="h-3 w-3" aria-hidden="true" /> R$ {outfit.price}
                          </>
                        )}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default OutfitShop;
