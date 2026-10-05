import { useEffect, useRef, useState } from 'react';
import { fetchCoffee, sendCoffee } from '@/lib/arcade';

const MINE_KEY = 'coffee:mine';
/** Cliques juntados antes de mandar pra API (ela aceita até 10 por vez). */
const BATCH_MAX = 10;
const FLUSH_MS = 1200;

/** O que o David responde conforme a pessoa paga mais cafés. */
const reactionFor = (mine: number) => {
  if (mine === 0) return 'Me paga um café? É de mentirinha, mas a gratidão é real.';
  if (mine < 3) return 'Valeu! ☕ Já sinto o código saindo melhor.';
  if (mine < 6) return 'Agora sim, dá pra codar a madrugada inteira.';
  if (mine < 10) return 'Tô elétrico ⚡ alguém segura esse dev.';
  if (mine < 20) return 'Ok… meu coração tá em 140 bpm. 😵';
  return 'Você é oficialmente patrocinador deste portfólio. 🏆';
};

const readMine = () => {
  try {
    return Number(window.localStorage.getItem(MINE_KEY) ?? 0) || 0;
  } catch {
    return 0;
  }
};

/**
 * Café-o-metro: um contador global de "cafés" que os visitantes pagam pro
 * David com um clique. O total fica no Redis (/api/coffee); sem ele, o
 * contador mostra só os cafés de quem está visitando.
 */
const CoffeeMeter = () => {
  const [total, setTotal] = useState<number | null>(null);
  const [mine, setMine] = useState(readMine);
  const [pops, setPops] = useState<number[]>([]);
  const pending = useRef(0);
  const timer = useRef<number>();
  const popId = useRef(0);

  useEffect(() => {
    fetchCoffee()
      .then(setTotal)
      .catch(() => setTotal(null));
  }, []);

  const flush = () => {
    const cups = Math.min(pending.current, BATCH_MAX);
    pending.current = 0;
    if (cups <= 0) return;
    sendCoffee(cups)
      .then((value) => value !== null && setTotal((current) => Math.max(current ?? 0, value)))
      .catch(() => {});
  };

  // Manda o que estiver pendente se a pessoa sair da página.
  useEffect(() => {
    const onHide = () => {
      if (document.visibilityState === 'hidden') flush();
    };
    document.addEventListener('visibilitychange', onHide);
    return () => document.removeEventListener('visibilitychange', onHide);
  }, []);

  const pour = () => {
    const next = mine + 1;
    setMine(next);
    try {
      window.localStorage.setItem(MINE_KEY, String(next));
    } catch {
      // sem storage, só não lembra
    }
    setTotal((current) => (current === null ? current : current + 1));
    navigator.vibrate?.(12);

    popId.current += 1;
    const id = popId.current;
    setPops((items) => [...items.slice(-4), id]);
    window.setTimeout(() => setPops((items) => items.filter((item) => item !== id)), 900);

    pending.current += 1;
    window.clearTimeout(timer.current);
    if (pending.current >= BATCH_MAX) flush();
    else timer.current = window.setTimeout(flush, FLUSH_MS);
  };

  // A xícara enche um pouco a cada café e esvazia de 10 em 10.
  const level = mine === 0 ? 0.15 : 0.25 + ((mine - 1) % 10) * 0.075;
  const shown = total ?? mine;

  return (
    <div className="flex items-center gap-5 rounded-2xl border border-border bg-white/[0.02] p-5 sm:p-6">
      <button
        type="button"
        onClick={pour}
        aria-label="Pagar um café virtual pro David"
        className="group relative shrink-0 rounded-2xl p-1 transition-transform active:scale-90"
      >
        {pops.map((id) => (
          <span
            key={id}
            aria-hidden="true"
            className="pointer-events-none absolute left-1/2 top-0 font-mono text-sm font-semibold text-accent [animation:coffee-pop_900ms_ease-out_forwards]"
          >
            +1
          </span>
        ))}
        <svg
          viewBox="0 0 64 64"
          className="h-16 w-16 transition-transform group-hover:-rotate-6"
          aria-hidden="true"
        >
          <defs>
            <clipPath id="cup-inside">
              <path d="M14 22h30v20a12 12 0 0 1-12 12h-6a12 12 0 0 1-12-12z" />
            </clipPath>
          </defs>
          {/* vapor */}
          {[22, 30, 38].map((x, i) => (
            <path
              key={x}
              d={`M${x} 16c-3-3 3-5 0-9`}
              className="coffee-steam"
              style={{ animationDelay: `${i * 0.5}s`, transformOrigin: `${x}px 16px` }}
              fill="none"
              stroke="hsl(var(--accent) / 0.7)"
              strokeWidth="2"
              strokeLinecap="round"
            />
          ))}
          {/* café */}
          <g clipPath="url(#cup-inside)">
            <rect
              x="14"
              width="30"
              height="40"
              y={54 - 32 * level}
              fill="hsl(var(--accent) / 0.55)"
              className="transition-[y] duration-500 ease-out"
            />
          </g>
          {/* xícara */}
          <path
            d="M14 22h30v20a12 12 0 0 1-12 12h-6a12 12 0 0 1-12-12z"
            fill="none"
            stroke="hsl(var(--foreground) / 0.85)"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          <path
            d="M44 27h3a6 6 0 0 1 0 12h-3"
            fill="none"
            stroke="hsl(var(--foreground) / 0.85)"
            strokeWidth="2.5"
          />
          <path
            d="M10 58h38"
            stroke="hsl(var(--foreground) / 0.35)"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </svg>
      </button>

      <div className="min-w-0">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">café-o-metro</p>
        <p
          className="mt-1 text-3xl font-semibold tabular-nums tracking-tight text-foreground"
          aria-live="polite"
        >
          {shown.toLocaleString('pt-BR')}
          <span className="block text-sm font-normal text-muted-foreground sm:ml-2 sm:inline sm:text-base">
            {total !== null ? 'cafés pagos por visitantes' : shown === 1 ? 'café seu' : 'cafés seus'}
          </span>
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          {reactionFor(mine)}
          {mine > 0 && total !== null && <span className="text-accent"> ({mine} seus)</span>}
        </p>
      </div>
    </div>
  );
};

export default CoffeeMeter;
