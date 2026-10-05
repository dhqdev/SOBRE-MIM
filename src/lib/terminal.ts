import { projects } from './projects';
import { buildWhatsAppUrl } from './contact';
import { EMAIL, LINKS, SECTIONS } from './site';

export type Tone = 'muted' | 'ok' | 'accent' | 'error' | 'text';

export interface OutLine {
  text: string;
  tone?: Tone;
  /** Vira link clicável no terminal. */
  href?: string;
  /** Linha em duas colunas: `text` é o rótulo, `value` vem ao lado. */
  value?: string;
}

export type TerminalAction =
  | { type: 'clear' }
  | { type: 'push' }
  | { type: 'log' }
  | { type: 'scroll'; to: string }
  | { type: 'open'; url: string }
  | { type: 'download' }
  | { type: 'confetti' }
  | { type: 'palette' };

export interface CommandResult {
  lines: OutLine[];
  action?: TerminalAction;
}

/** Atalhos que aparecem como botões embaixo do terminal (bom no celular). */
export const QUICK_COMMANDS = ['help', 'whoami', 'projetos', 'neofetch', 'contato', 'sudo contratar david'];

const HELP: [string, string][] = [
  ['whoami', 'quem é o david'],
  ['neofetch', 'a ficha técnica'],
  ['projetos', 'o que eu construí'],
  ['open <n>', 'abre o projeto n'],
  ['stack', 'tecnologias do dia a dia'],
  ['contato', 'onde me encontrar'],
  ['cd <seção>', 'vai até a seção'],
  ['cv', 'baixa o currículo'],
  ['git push', 'deixa um recado no mural'],
  ['git log', 'meus últimos commits'],
  ['menu', 'abre a paleta (Ctrl K)'],
  ['clear', 'limpa a tela'],
];

/** Nomes usados no autocompletar com Tab. */
export const COMMAND_NAMES = [
  'help',
  'whoami',
  'neofetch',
  'projetos',
  'open',
  'stack',
  'contato',
  'cd',
  'cv',
  'ls',
  'cat',
  'git push',
  'git log',
  'git status',
  'menu',
  'clear',
  'history',
  'sudo contratar david',
  'cafe',
  'echo',
  'date',
  'pwd',
  'exit',
  'vim',
];

const FILES: Record<string, string> = {
  'sobre.md': 'sobre',
  'stack.txt': 'stack',
  'contato.txt': 'contato',
};

const normalize = (value: string) =>
  value.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim().replace(/\s+/g, ' ');

const projectName = (title: string) => title.split(' - ')[0];

const findSection = (name: string) =>
  SECTIONS.find((section) => section.id === name || (section.aliases as readonly string[]).includes(name));

const notFound = (command: string): CommandResult => ({
  lines: [
    { text: `zsh: comando não encontrado: ${command}`, tone: 'error' },
    {
      text: 'digite help para ver o que dá pra fazer por aqui.',
      tone: 'muted',
    },
  ],
});

const commands: Record<string, (args: string[], raw: string, history: string[]) => CommandResult> = {
  help: () => ({
    lines: [
      { text: 'comandos disponíveis:', tone: 'muted' },
      ...HELP.map(([text, value]) => ({ text, value, tone: 'accent' as Tone })),
      {
        text: 'dica: tab completa, ↑ ↓ navegam no histórico. tem segredos também 👀',
        tone: 'muted',
      },
    ],
  }),

  whoami: () => ({
    lines: [
      { text: 'david fernandes', tone: 'text' },
      {
        text: 'software engineer na GRV Software · campinas, sp',
        tone: 'muted',
      },
      {
        text: 'erp em frappe, automação, integrações e agentes de ia.',
        tone: 'muted',
      },
    ],
  }),

  neofetch: () => ({
    lines: [
      { text: 'visitante@david.dev', tone: 'accent' },
      { text: '───────────────────', tone: 'muted' },
      { text: 'os', value: 'Portfólio OS 2026 (roxo edition)' },
      { text: 'host', value: 'GRV Software · P&D' },
      { text: 'uptime', value: '4 anos de tecnologia' },
      { text: 'shell', value: 'python · typescript · sql' },
      { text: 'frameworks', value: 'frappe · vue · react · fastapi' },
      { text: 'estudando', value: 'agentes de ia (pós FIAP)' },
      { text: 'café', value: '∞' },
    ],
  }),

  sobre: () => ({
    lines: [
      {
        text: 'full-stack apaixonado por transformar problema difícil em solução simples.',
        tone: 'text',
      },
      {
        text: 'comecei na infraestrutura, migrei pro código e hoje lidero o módulo',
        tone: 'muted',
      },
      {
        text: 'financeiro de um ERP em Frappe. nas horas vagas: IA e automação.',
        tone: 'muted',
      },
      { text: 'cd trajetoria para ver o caminho inteiro.', tone: 'accent' },
    ],
  }),

  projetos: () => ({
    lines: [
      ...projects.map((project, index) => ({
        text: `${index + 1}  ${projectName(project.title)}`,
        value: project.title.split(' - ')[1] ?? project.tags.slice(0, 2).join(' · '),
        href: project.link,
        tone: 'text' as Tone,
      })),
      {
        text: 'open <n> abre um projeto · cd projetos rola até eles',
        tone: 'muted',
      },
    ],
  }),

  open: (args) => {
    const query = args.join(' ');
    if (!query)
      return {
        lines: [{ text: 'uso: open <número ou nome do projeto>', tone: 'muted' }],
      };
    const byIndex = projects[Number(query) - 1];
    const project = byIndex ?? projects.find((item) => normalize(item.title).includes(query));
    if (!project)
      return {
        lines: [
          {
            text: `open: projeto "${query}" não encontrado. tente projetos`,
            tone: 'error',
          },
        ],
      };
    return {
      lines: [
        {
          text: `abrindo ${projectName(project.title)} ↗`,
          tone: 'ok',
          href: project.link,
        },
      ],
      action: { type: 'open', url: project.link },
    };
  },

  stack: () => ({
    lines: [
      { text: 'frontend', value: 'vue · react · typescript', tone: 'accent' },
      {
        text: 'backend',
        value: 'python · frappe · node · fastapi',
        tone: 'accent',
      },
      {
        text: 'automação',
        value: 'n8n · docker · selenium · apis',
        tone: 'accent',
      },
      { text: 'dados', value: 'sql · dashboards · power bi', tone: 'accent' },
      {
        text: 'ia',
        value: 'agentes · llms · algoritmo genético',
        tone: 'accent',
      },
    ],
  }),

  contato: () => ({
    lines: [
      {
        text: 'whatsapp',
        value: 'falar comigo ↗',
        href: LINKS.whatsapp,
        tone: 'accent',
      },
      { text: 'email', value: EMAIL, href: `mailto:${EMAIL}`, tone: 'accent' },
      {
        text: 'linkedin',
        value: 'david fernandes ↗',
        href: LINKS.linkedin,
        tone: 'accent',
      },
      {
        text: 'instagram',
        value: '@david_hqvf ↗',
        href: LINKS.instagram,
        tone: 'accent',
      },
      {
        text: 'github',
        value: '@dhqdev ↗',
        href: LINKS.github,
        tone: 'accent',
      },
    ],
  }),

  cv: () => ({
    lines: [{ text: 'baixando CV-David-Fernandes.pdf… ✓', tone: 'ok' }],
    action: { type: 'download' },
  }),

  ls: (args) => {
    if (args[0] === 'projetos' || args[0] === 'projetos/') return commands.projetos([], '', []);
    return {
      lines: [
        { text: 'projetos/   trajetoria/   mural/', tone: 'accent' },
        {
          text: 'sobre.md    stack.txt     contato.txt    cv.pdf',
          tone: 'text',
        },
      ],
    };
  },

  cat: (args, raw, history) => {
    const file = args[0];
    if (!file)
      return {
        lines: [{ text: 'uso: cat <arquivo> · tente ls', tone: 'muted' }],
      };
    if (file === 'cv.pdf')
      return {
        lines: [
          {
            text: 'cat: cv.pdf é binário 🙃 use cv para baixar',
            tone: 'muted',
          },
        ],
      };
    const target = FILES[file];
    if (!target)
      return {
        lines: [{ text: `cat: ${file}: arquivo não encontrado`, tone: 'error' }],
      };
    return commands[target]([], raw, history);
  },

  cd: (args) => {
    const raw = (args[0] ?? '~').replace(/\/$/, '');
    const name = raw === '~' || raw === '..' || raw === '/' ? 'home' : raw;
    const section = findSection(name);
    if (!section) {
      return {
        lines: [
          { text: `cd: ${raw}: diretório não encontrado`, tone: 'error' },
          {
            text: `tente: ${SECTIONS.slice(1)
              .map((item) => item.aliases[0])
              .join(' · ')}`,
            tone: 'muted',
          },
        ],
      };
    }
    return {
      lines: [{ text: `→ ${section.label}`, tone: 'ok' }],
      action: { type: 'scroll', to: section.id },
    };
  },

  git: (args) => {
    const sub = args[0];
    if (sub === 'push') return { lines: [], action: { type: 'push' } };
    if (sub === 'log') return { lines: [], action: { type: 'log' } };
    if (sub === 'status') {
      return {
        lines: [
          { text: 'On branch main', tone: 'text' },
          {
            text: 'Your branch is up to date with origin/main.',
            tone: 'muted',
          },
          {
            text: 'nada pra commitar… mas você pode deixar um git push no mural 😉',
            tone: 'accent',
          },
        ],
      };
    }
    if (sub === 'blame')
      return {
        lines: [
          {
            text: 'a culpa é sempre do estagiário… ah, espera. 😅',
            tone: 'muted',
          },
        ],
      };
    return {
      lines: [
        {
          text: `git: '${sub ?? ''}' não é um comando git que eu ensinei pra esse terminal.`,
          tone: 'error',
        },
        { text: 'tente git push, git log ou git status.', tone: 'muted' },
      ],
    };
  },

  sudo: (args) => {
    const rest = args.join(' ');
    if (/^(contratar|hire)( (o )?david)?$/.test(rest)) {
      return {
        lines: [
          { text: '[sudo] senha para visitante: ••••••••', tone: 'muted' },
          { text: 'verificando orçamento… ok', tone: 'muted' },
          { text: 'verificando café… ok', tone: 'muted' },
          { text: '✓ permissão concedida! bora conversar?', tone: 'ok' },
          {
            text: 'abrir conversa no WhatsApp ↗',
            tone: 'accent',
            href: buildWhatsAppUrl(
              'Olá, David! Rodei "sudo contratar david" no seu portfólio 😄 Vamos conversar?',
            ),
          },
        ],
        action: { type: 'confetti' },
      };
    }
    if (rest.startsWith('rm')) return commands.rm(args.slice(1), rest, []);
    return {
      lines: [
        { text: '[sudo] senha para visitante: ••••••••', tone: 'muted' },
        {
          text: 'visitante não está no arquivo sudoers. este incidente será reportado. 🚨',
          tone: 'error',
        },
        { text: '(psiu: tente sudo contratar david)', tone: 'muted' },
      ],
    };
  },

  rm: () => ({
    lines: [
      {
        text: 'nem pensar 😅 esse site custou muito café pra ficar pronto.',
        tone: 'error',
      },
    ],
  }),

  menu: () => ({
    lines: [{ text: 'abrindo a paleta de comandos…', tone: 'muted' }],
    action: { type: 'palette' },
  }),

  history: (_args, _raw, history) => ({
    lines: history.length
      ? history.map((item, index) => ({
          text: `${String(index + 1).padStart(3)}  ${item}`,
          tone: 'muted' as Tone,
        }))
      : [{ text: 'histórico vazio', tone: 'muted' }],
  }),

  echo: (_args, raw) => ({
    lines: [{ text: raw.replace(/^echo\s*/i, ''), tone: 'text' }],
  }),

  date: () => ({
    lines: [
      {
        text: new Date().toLocaleString('pt-BR', {
          dateStyle: 'full',
          timeStyle: 'short',
        }),
        tone: 'text',
      },
    ],
  }),

  pwd: () => ({
    lines: [{ text: '/home/visitante/portfolio-do-david', tone: 'text' }],
  }),

  exit: () => ({
    lines: [
      {
        text: 'logout… brincadeira, ninguém sai daqui tão cedo 😄',
        tone: 'muted',
      },
    ],
  }),

  vim: () => ({
    lines: [
      { text: 'você entrou no vim. boa sorte pra sair… 🫠', tone: 'muted' },
      { text: '(dica de amigo: :q)', tone: 'muted' },
    ],
  }),

  ':q': () => ({
    lines: [{ text: 'ufa, você saiu do vim. poucos conseguem. 🏆', tone: 'ok' }],
  }),

  cafe: () => ({
    lines: [
      { text: '☕ passando um café…', tone: 'muted' },
      { text: '[████████████████] 100%', tone: 'accent' },
      { text: 'pronto! agora sim dá pra codar.', tone: 'ok' },
    ],
  }),

  oi: () => ({
    lines: [
      {
        text: 'oi! 👋 que bom te ver por aqui. digite help pra começar.',
        tone: 'text',
      },
    ],
  }),

  clear: () => ({ lines: [], action: { type: 'clear' } }),
};

const ALIASES: Record<string, string> = {
  ajuda: 'help',
  '?': 'help',
  about: 'sobre',
  projects: 'projetos',
  skills: 'stack',
  contact: 'contato',
  curriculo: 'cv',
  resume: 'cv',
  cls: 'clear',
  limpar: 'clear',
  vi: 'vim',
  nano: 'vim',
  ':wq': ':q',
  ':q!': ':q',
  coffee: 'cafe',
  ola: 'oi',
  hello: 'oi',
  hi: 'oi',
  k: 'menu',
  quit: 'exit',
  logout: 'exit',
};

/** Roda uma linha digitada no terminal e diz o que mostrar e fazer. */
export const runCommand = (input: string, history: string[]): CommandResult => {
  const clean = normalize(input);
  const [first, ...args] = clean.split(' ');
  const name = ALIASES[first] ?? first;
  const handler = commands[name];
  if (!handler) return notFound(input.trim().split(' ')[0]);
  return handler(args, input.trim(), history);
};

/** Completa com Tab: devolve o único comando que começa com o texto, se houver. */
export const complete = (input: string) => {
  const clean = normalize(input);
  if (!clean) return null;
  const matches = COMMAND_NAMES.filter((name) => name.startsWith(clean));
  return matches.length === 1 ? matches[0] : null;
};
