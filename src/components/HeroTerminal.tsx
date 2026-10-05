import { useCallback, useEffect, useRef, useState } from 'react';
import { CornerDownLeft, Play, RotateCcw } from 'lucide-react';
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
import { MESSAGE_MAX, NAME_MAX, sendPush, type VisitorPush } from '@/lib/guestbook';
import { TERMINAL_EVENT, downloadCv, openExternal, openGame, openPalette, scrollToSection } from '@/lib/site';
import { QUICK_COMMANDS, complete, runCommand, type OutLine, type Tone } from '@/lib/terminal';
import { GREETINGS, periodOf } from '@/lib/period';

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

/** Resposta do mural: o push salvo ou o motivo de não ter salvado. */
type PushResult = { push?: VisitorPush; error?: string };

/** As falas do "git push" — a parte divertida do terminal. */
const PUSH_LINES: { text: string; tone: Tone }[] = [
  { text: 'Enumerating objects: 42, done.', tone: 'muted' },
  { text: 'Compressing objects: 100% (42/42), done.', tone: 'muted' },
  { text: 'Writing objects: 100% (42/42), café ☕ incluso', tone: 'muted' },
  { text: `To github.com/${GITHUB_USER}/mural.git`, tone: 'muted' },
];

/** O final do push depende de a mensagem ter sido salva no mural. */
const resultLines = (result: PushResult): { text: string; tone: Tone }[] =>
  result.push
    ? [
        {
          text: `   main -> main  ✓ ${result.push.name}, seu push está no mural!`,
          tone: 'ok',
        },
        { text: 'Obrigado pela visita 💜 bora conversar?', tone: 'accent' },
      ]
    : [
        { text: `   ✗ ${result.error}`, tone: 'error' },
        {
          text: 'Obrigado pela visita 💜 tenta de novo daqui a pouco?',
          tone: 'accent',
        },
      ];

const TONE_CLASS: Record<Tone, string> = {
  muted: 'text-muted-foreground',
  ok: 'text-online',
  accent: 'text-accent',
  error: 'text-red-400',
  text: 'text-foreground/90',
};

/** Um comando digitado pelo visitante e o que ele respondeu. */
type Entry = { id: number; command: string; lines: OutLine[] };

const OutputLine = ({ line }: { line: OutLine }) => {
  const tone = TONE_CLASS[line.tone ?? 'text'];
  const content = line.value ? (
    <span className="flex gap-3">
      <span className={`w-24 shrink-0 sm:w-28 ${tone}`}>{line.text}</span>
      <span className="min-w-0 break-words text-muted-foreground">{line.value}</span>
    </span>
  ) : (
    <span className={`break-words ${tone}`}>{line.text}</span>
  );

  if (!line.href) return <p className="animate-in fade-in duration-200">{content}</p>;
  return (
    <p className="animate-in fade-in duration-200">
      <a
        href={line.href}
        target={line.href.startsWith('mailto:') ? undefined : '_blank'}
        rel="noopener noreferrer"
        className="block rounded underline-offset-2 hover:bg-white/[0.03] hover:underline"
      >
        {content}
      </a>
    </p>
  );
};

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
  const [formOpen, setFormOpen] = useState(false);
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [website, setWebsite] = useState('');
  const [sent, setSent] = useState<{ name: string; message: string } | null>(null);
  const [result, setResult] = useState<PushResult | null>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const pushButtonRef = useRef<HTMLButtonElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [greeting] = useState(() => GREETINGS[periodOf()]);
  const entryId = useRef(0);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number | null>(null);
  const [cleared, setCleared] = useState(false);

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

  // 3) o "git push": uma linha por vez; o final espera a resposta do mural
  const pushLines = result ? [...PUSH_LINES, ...resultLines(result)] : PUSH_LINES;
  const totalLines = PUSH_LINES.length + 2;
  useEffect(() => {
    if (pushStep < 0 || pushStep >= pushLines.length - 1) return;
    const id = window.setTimeout(
      () => {
        const next = pushStep + 1;
        setPushStep(next);
        if (next === PUSH_LINES.length && result?.push && pushButtonRef.current) {
          const rect = pushButtonRef.current.getBoundingClientRect();
          burstConfetti(rect.left + rect.width / 2, rect.top + rect.height / 2);
        }
      },
      reduced ? 0 : 380,
    );
    return () => window.clearTimeout(id);
  }, [pushStep, pushLines.length, result, reduced]);

  // Mantém a última linha à vista quando o push adiciona texto.
  useEffect(() => {
    const body = bodyRef.current;
    if (body) body.scrollTop = body.scrollHeight;
  }, [pushStep, linesShown, formOpen, entries]);

  const isPushing = pushStep >= 0 && pushStep < totalLines - 1;
  const pushDone = pushStep >= totalLines - 1;

  const openForm = useCallback(() => {
    setEntries([]);
    setFormOpen(true);
    setPushStep(-1);
    setSent(null);
    setResult(null);
    window.setTimeout(() => nameRef.current?.focus({ preventScroll: true }), 0);
  }, []);

  // Roda um comando: mostra a resposta e faz o que ele pedir (rolar, abrir…).
  const execute = useCallback(
    (raw: string) => {
      const command = raw.trim();
      if (command) setHistory((items) => [...items, command].slice(-50));
      setHistoryIndex(null);
      const result = command ? runCommand(command, history) : { lines: [] };
      const action = result.action;

      if (action?.type === 'clear') {
        setEntries([]);
        setCleared(true);
        setPushStep(-1);
        setSent(null);
        return;
      }
      if (action?.type === 'push') {
        setCleared(false);
        openForm();
        return;
      }
      if (action?.type === 'log') {
        setEntries([]);
        setCleared(false);
        setPushStep(-1);
        setSent(null);
        return;
      }

      entryId.current += 1;
      setEntries((items) => [...items.slice(-30), { id: entryId.current, command, lines: result.lines }]);

      if (!action) return;
      if (action.type === 'scroll') window.setTimeout(() => scrollToSection(action.to), 350);
      if (action.type === 'open') openExternal(action.url);
      if (action.type === 'download') downloadCv();
      if (action.type === 'palette') window.setTimeout(openPalette, 250);
      if (action.type === 'game') window.setTimeout(openGame, 400);
      if (action.type === 'confetti') {
        const rect = (inputRef.current ?? bodyRef.current)?.getBoundingClientRect();
        if (rect) window.setTimeout(() => burstConfetti(rect.left + 80, rect.top), 900);
      }
    },
    [history, openForm],
  );

  // A paleta de comandos manda comandos pra cá (ex.: "git push").
  useEffect(() => {
    const onCommand = (event: Event) => {
      const command = (event as CustomEvent<string>).detail;
      if (typeof command === 'string') execute(command);
    };
    window.addEventListener(TERMINAL_EVENT, onCommand);
    return () => window.removeEventListener(TERMINAL_EVENT, onCommand);
  }, [execute]);

  const submitCommand = (event: React.FormEvent) => {
    event.preventDefault();
    execute(input);
    setInput('');
  };

  const onInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Tab') {
      const completion = complete(input);
      if (completion) {
        event.preventDefault();
        setInput(
          `${completion}${completion === 'open' || completion === 'cd' || completion === 'cat' || completion === 'echo' ? ' ' : ''}`,
        );
      }
      return;
    }
    if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
      if (history.length === 0) return;
      event.preventDefault();
      const current = historyIndex ?? history.length;
      const next = event.key === 'ArrowUp' ? Math.max(0, current - 1) : current + 1;
      if (next >= history.length) {
        setHistoryIndex(null);
        setInput('');
      } else {
        setHistoryIndex(next);
        setInput(history[next]);
      }
      return;
    }
    if (event.key === 'l' && event.ctrlKey) {
      event.preventDefault();
      execute('clear');
    }
  };

  // Clicar no terminal (com mouse) foca o prompt, como num terminal de verdade.
  const focusPrompt = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!window.matchMedia('(pointer: fine)').matches) return;
    if ((event.target as HTMLElement).closest('a, button, input, form')) return;
    if (window.getSelection()?.toString()) return;
    inputRef.current?.focus({ preventScroll: true });
  };

  const submitPush = (event: React.FormEvent) => {
    event.preventDefault();
    const entry = { name: name.trim(), message: message.trim() };
    if (!entry.name || !entry.message) return;
    setFormOpen(false);
    setSent(entry);
    setResult(null);
    setPushStep(0);
    setMessage('');
    sendPush({ ...entry, website })
      .then((push) => setResult({ push }))
      .catch((error: Error) => setResult({ error: error.message }));
  };

  const inputClass =
    'min-w-0 flex-1 rounded-md border border-white/10 bg-white/[0.03] px-2 py-1 text-base text-foreground sm:text-[13px] placeholder:text-muted-foreground/50 outline-none transition-colors focus:border-accent/60';
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
            onClick={focusPrompt}
          >
            {!cleared && (
              <>
                <p className="mb-1 text-muted-foreground/70">
                  # {greeting.text}, visitante {greeting.emoji}
                </p>
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
              </>
            )}

            {formOpen && (
              <form id="push-form" onSubmit={submitPush} className="mt-3 space-y-2">
                <p className="text-foreground">
                  <span className="text-accent">❯</span> git commit -m{' '}
                  <span className="text-muted-foreground">"deixe seu recado no mural"</span>
                </p>
                <label className="flex items-center gap-2">
                  <span className="w-[4.5rem] shrink-0 text-muted-foreground">nome</span>
                  <input
                    ref={nameRef}
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    maxLength={NAME_MAX}
                    required
                    autoComplete="given-name"
                    placeholder="seu nome"
                    className={inputClass}
                  />
                </label>
                <label className="flex items-center gap-2">
                  <span className="w-[4.5rem] shrink-0 text-muted-foreground">mensagem</span>
                  <input
                    value={message}
                    onChange={(event) => setMessage(event.target.value)}
                    maxLength={MESSAGE_MAX}
                    required
                    placeholder="curti o site!"
                    className={inputClass}
                  />
                </label>
                {/* Armadilha para robôs: invisível para pessoas. */}
                <input
                  value={website}
                  onChange={(event) => setWebsite(event.target.value)}
                  tabIndex={-1}
                  autoComplete="off"
                  aria-hidden="true"
                  className="hidden"
                />
                <p className="flex items-center gap-3 text-[11px] text-muted-foreground/70">
                  <span>enter para enviar · fica público no mural</span>
                  <button
                    type="button"
                    onClick={() => setFormOpen(false)}
                    className="text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
                  >
                    cancelar
                  </button>
                </p>
              </form>
            )}

            {pushStep >= 0 && sent && (
              <div className="mt-3">
                <p className="break-words text-foreground">
                  <span className="text-accent">❯</span> git commit -m "{sent.message}"
                </p>
                <p className="text-foreground">
                  <span className="text-accent">❯</span> git push origin main
                </p>
                {pushLines.slice(0, pushStep + 1).map((line, index) => (
                  <p
                    key={index}
                    className={`animate-in fade-in break-words duration-300 ${TONE_CLASS[line.tone]}`}
                  >
                    {line.text}
                  </p>
                ))}
                {pushDone && result?.push && (
                  <a href="#mural" className="text-accent underline-offset-2 hover:underline">
                    ver o mural ↓
                  </a>
                )}
              </div>
            )}

            {entries.map((entry) => (
              <div key={entry.id} className="mt-3">
                <p className="break-words text-foreground">
                  <span className="text-accent">❯</span> {entry.command}
                </p>
                {entry.lines.map((line, index) => (
                  <OutputLine key={index} line={line} />
                ))}
              </div>
            ))}

            {(ready || cleared) && !isPushing && !formOpen && (
              <form
                onSubmit={submitCommand}
                className={`flex items-center gap-2 ${cleared && entries.length === 0 ? '' : 'mt-3'}`}
              >
                <label htmlFor="terminal-prompt" className="text-accent">
                  ❯<span className="sr-only">Digite um comando no terminal</span>
                </label>
                <input
                  id="terminal-prompt"
                  ref={inputRef}
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  onKeyDown={onInputKeyDown}
                  placeholder={entries.length === 0 ? 'digite help e aperte enter' : ''}
                  autoComplete="off"
                  autoCapitalize="off"
                  autoCorrect="off"
                  spellCheck={false}
                  enterKeyHint="send"
                  maxLength={80}
                  className="min-w-0 flex-1 bg-transparent text-base text-foreground caret-accent outline-none placeholder:text-muted-foreground/45 sm:text-[13px]"
                />
              </form>
            )}
          </div>

          {/* Atalhos: no celular é bem mais fácil tocar do que digitar */}
          {(ready || cleared) && (
            <div className="flex gap-1.5 overflow-x-auto border-t border-white/[0.06] px-4 py-2.5 [scrollbar-width:none] sm:px-5 [&::-webkit-scrollbar]:hidden">
              {QUICK_COMMANDS.map((command) => (
                <button
                  key={command}
                  type="button"
                  onClick={() => execute(command)}
                  disabled={isPushing}
                  className="shrink-0 rounded-md border border-white/[0.08] bg-white/[0.02] px-2.5 py-1.5 font-mono text-[11px] text-muted-foreground transition-colors hover:border-accent/40 hover:text-accent disabled:opacity-40 sm:py-1"
                >
                  {command}
                </button>
              ))}
            </div>
          )}

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
              type={formOpen ? 'submit' : 'button'}
              form={formOpen ? 'push-form' : undefined}
              disabled={isPushing}
              onClick={formOpen ? undefined : openForm}
              className="group inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-accent/30 bg-accent/10 px-3 py-1.5 font-mono text-xs text-accent transition-colors hover:bg-accent/20 disabled:opacity-50"
            >
              {formOpen ? (
                <CornerDownLeft className="h-3 w-3" aria-hidden="true" />
              ) : pushDone ? (
                <RotateCcw className="h-3 w-3" aria-hidden="true" />
              ) : (
                <Play className="h-3 w-3 fill-current" aria-hidden="true" />
              )}
              {formOpen ? 'enviar push' : isPushing ? 'enviando…' : pushDone ? 'outro push' : 'git push'}
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
