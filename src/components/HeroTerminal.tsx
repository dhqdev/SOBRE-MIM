import { useEffect, useRef, useState } from 'react';
import { Play, RotateCcw } from 'lucide-react';
import TiltedCard from './effects/TiltedCard';
import { useInView } from '@/hooks/useInView';
import { burstConfetti } from '@/lib/confetti';
import {
  GITHUB_URL,
  GITHUB_USER,
  fetchGitHubData,
  timeAgo,
  type ContributionDay,
  type GitHubData,
} from '@/lib/github';

const COMMAND = 'git log --oneline -5';
const TYPE_MS = 45;
const LINE_MS = 160;
const WEEKS_SHOWN = 18;

const LEVEL_COLORS = [
  'rgba(255,255,255,0.06)',
  'rgba(167,139,250,0.3)',
  'rgba(167,139,250,0.55)',
  'rgba(167,139,250,0.8)',
  'rgba(196,181,253,1)',
];

/** As falas do "git push" — a parte divertida do terminal. */
const PUSH_LINES = [
  { text: 'Enumerating objects: 42, done.', tone: 'muted' },
  { text: 'Compressing objects: 100% (42/42), done.', tone: 'muted' },
  { text: 'Writing objects: 100% (42/42), café ☕ incluso', tone: 'muted' },
  { text: `To github.com/${GITHUB_USER}/portfolio.git`, tone: 'muted' },
  { text: '   main -> main  ✓ deploy feito!', tone: 'ok' },
  { text: 'Obrigado pela visita 💜 bora conversar?', tone: 'accent' },
] as const;

const lastWeeks = (days: ContributionDay[]) => {
  // Mantém só as semanas mais recentes, em colunas de 7 dias.
  const recent = days.slice(-WEEKS_SHOWN * 7);
  const weeks: ContributionDay[][] = [];
  for (let i = 0; i < recent.length; i += 7) weeks.push(recent.slice(i, i + 7));
  return weeks;
};

const HeroTerminal = () => {
  const [ref, inView] = useInView<HTMLDivElement>(0.2);
  const [data, setData] = useState<GitHubData | null>(null);
  const [failed, setFailed] = useState(false);
  const [typed, setTyped] = useState(0);
  const [linesShown, setLinesShown] = useState(0);
  const [pushStep, setPushStep] = useState(-1);
  const pushButtonRef = useRef<HTMLButtonElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    fetchGitHubData()
      .then((result) => !cancelled && setData(result))
      .catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
    };
  }, []);

  const reduced =
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const commits = data?.commits.slice(0, 5) ?? [];

  // 1) digita o comando
  useEffect(() => {
    if (!inView) return;
    if (reduced) {
      setTyped(COMMAND.length);
      return;
    }
    if (typed >= COMMAND.length) return;
    const id = window.setTimeout(() => setTyped((n) => n + 1), TYPE_MS);
    return () => window.clearTimeout(id);
  }, [inView, reduced, typed]);

  // 2) mostra os commits um a um, quando os dados chegarem
  useEffect(() => {
    if (typed < COMMAND.length || commits.length === 0) return;
    if (reduced) {
      setLinesShown(commits.length);
      return;
    }
    if (linesShown >= commits.length) return;
    const id = window.setTimeout(() => setLinesShown((n) => n + 1), LINE_MS);
    return () => window.clearTimeout(id);
  }, [commits.length, linesShown, reduced, typed]);

  // 3) o "git push": uma linha por vez e confete no final
  useEffect(() => {
    if (pushStep < 0 || pushStep >= PUSH_LINES.length) return;
    const id = window.setTimeout(
      () => {
        const next = pushStep + 1;
        setPushStep(next);
        if (next === PUSH_LINES.length - 1 && pushButtonRef.current) {
          const rect = pushButtonRef.current.getBoundingClientRect();
          burstConfetti(rect.left + rect.width / 2, rect.top + rect.height / 2);
        }
      },
      reduced ? 0 : 380,
    );
    return () => window.clearTimeout(id);
  }, [pushStep, reduced]);

  // Mantém a última linha à vista quando o push adiciona texto.
  useEffect(() => {
    const body = bodyRef.current;
    if (body) body.scrollTop = body.scrollHeight;
  }, [pushStep, linesShown]);

  const isPushing = pushStep >= 0 && pushStep < PUSH_LINES.length - 1;
  const pushDone = pushStep >= PUSH_LINES.length - 1;
  const ready = typed >= COMMAND.length && (linesShown >= commits.length || failed);
  const weeks = data?.contributions ? lastWeeks(data.contributions.days) : [];
  const lastCommit = data?.commits[0];

  return (
    <div ref={ref} className="relative">
      {/* Brilho roxo atrás do card */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -inset-10 rounded-[3rem] bg-[radial-gradient(closest-side,rgba(167,139,250,0.18),transparent)] blur-2xl"
      />

      <TiltedCard maxTilt={4} className="rounded-2xl">
        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#0d0d10]/90 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.7)] backdrop-blur-xl">
          {/* Barra de título */}
          <div className="flex items-center gap-2 border-b border-white/[0.06] px-4 py-3">
            <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
            <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
            <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
            <span className="ml-2 truncate font-mono text-xs text-muted-foreground">
              {GITHUB_USER}@github: ~
            </span>
            <span className="ml-auto inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-online opacity-70" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-online" />
              </span>
              ao vivo
            </span>
          </div>

          {/* Corpo */}
          <div
            ref={bodyRef}
            className="h-[248px] overflow-y-auto px-4 py-4 font-mono text-[12.5px] leading-relaxed [scrollbar-width:none] sm:h-[264px] sm:px-5 sm:text-[13px]"
            aria-live="polite"
          >
            <p className="text-foreground">
              <span className="text-accent">❯</span> {COMMAND.slice(0, typed)}
              {typed < COMMAND.length && <span className="animate-pulse text-accent">▌</span>}
            </p>

            {typed >= COMMAND.length && !data && !failed && (
              <p className="mt-2 animate-pulse text-muted-foreground">buscando commits…</p>
            )}

            {failed && (
              <p className="mt-2 text-muted-foreground">
                sem conexão com a API agora.{' '}
                <a
                  href={GITHUB_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent underline-offset-2 hover:underline"
                >
                  ver no GitHub ↗
                </a>
              </p>
            )}

            <ul className="mt-2 space-y-1 list-none p-0">
              {commits.slice(0, linesShown).map((commit) => (
                <li
                  key={commit.url}
                  className="flex gap-3 animate-in fade-in slide-in-from-left-1 duration-300"
                >
                  <a
                    href={commit.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex min-w-0 flex-1 gap-3"
                  >
                    <span className="shrink-0 text-accent">{commit.sha}</span>
                    <span className="truncate text-foreground/85 group-hover:text-foreground">
                      {commit.message}
                    </span>
                    <span className="ml-auto hidden shrink-0 text-muted-foreground/70 sm:inline">
                      {timeAgo(commit.date)}
                    </span>
                  </a>
                </li>
              ))}
            </ul>

            {pushStep >= 0 && (
              <div className="mt-3">
                <p className="text-foreground">
                  <span className="text-accent">❯</span> git push origin main
                </p>
                {PUSH_LINES.slice(0, pushStep + 1).map((line) => (
                  <p
                    key={line.text}
                    className={`animate-in fade-in duration-300 ${
                      line.tone === 'ok'
                        ? 'text-online'
                        : line.tone === 'accent'
                          ? 'text-accent'
                          : 'text-muted-foreground'
                    }`}
                  >
                    {line.text}
                  </p>
                ))}
              </div>
            )}

            {ready && !isPushing && (
              <p className="mt-3 text-foreground">
                <span className="text-accent">❯</span> <span className="animate-pulse text-accent">▌</span>
              </p>
            )}
          </div>

          {/* Rodapé: mini gráfico + botão */}
          <div className="flex items-center justify-between gap-4 border-t border-white/[0.06] px-4 py-3 sm:px-5">
            <div className="flex min-w-0 items-center gap-3">
              {weeks.length > 0 && (
                <div className="hidden grid-flow-col grid-rows-7 gap-[2px] sm:grid" aria-hidden="true">
                  {weeks.flatMap((week, w) =>
                    week.map((day, d) => (
                      <span
                        key={`${w}-${d}`}
                        className="h-[6px] w-[6px] rounded-[1.5px]"
                        style={{ background: LEVEL_COLORS[day.level] }}
                      />
                    )),
                  )}
                </div>
              )}
              <p className="truncate text-xs text-muted-foreground">
                {data?.contributions
                  ? `${data.contributions.total} contribuições no último ano`
                  : data
                    ? `${data.profile.publicRepos} repositórios públicos`
                    : 'github.com/' + GITHUB_USER}
              </p>
            </div>

            <button
              ref={pushButtonRef}
              type="button"
              disabled={isPushing}
              onClick={() => setPushStep(0)}
              className="group inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-accent/30 bg-accent/10 px-3 py-1.5 font-mono text-xs text-accent transition-colors hover:bg-accent/20 disabled:opacity-50"
            >
              {pushDone ? (
                <RotateCcw className="h-3 w-3" aria-hidden="true" />
              ) : (
                <Play className="h-3 w-3 fill-current" aria-hidden="true" />
              )}
              {isPushing ? 'enviando…' : pushDone ? 'de novo' : 'git push'}
            </button>
          </div>
        </div>
      </TiltedCard>

      {/* Selo flutuante com o último commit */}
      {lastCommit && (
        <div className="absolute -right-4 -top-5 hidden animate-float-soft items-center gap-2 rounded-xl border border-white/10 bg-background/80 px-3 py-2 shadow-xl backdrop-blur-md xl:flex">
          <span className="h-2 w-2 rounded-full bg-online" />
          <span className="text-xs text-muted-foreground">
            último commit <span className="text-foreground">{timeAgo(lastCommit.date)}</span>
          </span>
        </div>
      )}
    </div>
  );
};

export default HeroTerminal;
