import { INSTAGRAM_URL, WHATSAPP_URL } from './contact';
import { GITHUB_URL } from './github';

export const EMAIL = 'david@tekvosoft.dev';
export const LINKEDIN_URL = 'https://www.linkedin.com/in/david-fernandes-77a663229/';
export const CV_URL = '/CV-David.pdf';
export const CV_FILENAME = 'CV-David-Fernandes.pdf';

/** Seções da página, na ordem em que aparecem. O id é o mesmo do HTML. */
export const SECTIONS = [
  { id: 'home', label: 'Início', aliases: ['inicio', 'home', 'topo'] },
  { id: 'projetos', label: 'Projetos', aliases: ['projetos', 'projects'] },
  { id: 'sobre', label: 'Sobre mim', aliases: ['sobre', 'about'] },
  {
    id: 'trajetoria',
    label: 'Trajetória',
    aliases: ['trajetoria', 'carreira', 'timeline'],
  },
  {
    id: 'tecnologias',
    label: 'Stack',
    aliases: ['stack', 'tecnologias', 'skills'],
  },
  { id: 'github', label: 'GitHub', aliases: ['github'] },
  { id: 'mural', label: 'Mural de recados', aliases: ['mural'] },
  { id: 'contato', label: 'Contato', aliases: ['contato', 'contact'] },
] as const;

export type SectionId = (typeof SECTIONS)[number]['id'];

export const LINKS = {
  github: GITHUB_URL,
  linkedin: LINKEDIN_URL,
  instagram: INSTAGRAM_URL,
  whatsapp: WHATSAPP_URL,
};

export const scrollToSection = (id: string) => {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // O mural só aparece quando a API responde; sem ele, a seção do GitHub serve.
  const target = document.getElementById(id) ?? (id === 'mural' ? document.getElementById('github') : null);
  target?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
};

export const openExternal = (url: string) => {
  window.open(url, '_blank', 'noopener,noreferrer');
};

export const downloadCv = () => {
  const link = document.createElement('a');
  link.href = CV_URL;
  link.download = CV_FILENAME;
  link.click();
};

/** Copia texto; devolve false se o navegador não deixar. */
export const copyText = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
};

/**
 * A paleta de comandos e o terminal do hero conversam por eventos do window,
 * assim nenhum dos dois precisa conhecer o outro.
 */
export const OPEN_PALETTE_EVENT = 'site:open-palette';
export const OPEN_GAME_EVENT = 'site:open-game';
export const TERMINAL_EVENT = 'site:terminal';

/** Atalho mostrado nos botões: ⌘K no Mac, Ctrl K no resto. */
export const shortcutLabel = () =>
  typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform) ? '⌘K' : 'Ctrl K';

export const openPalette = () => window.dispatchEvent(new Event(OPEN_PALETTE_EVENT));

/** Abre o Flappy Bird jogável. */
export const openGame = () => window.dispatchEvent(new Event(OPEN_GAME_EVENT));

/** Rola até o terminal e roda um comando nele, como se a pessoa tivesse digitado. */
export const runInTerminal = (command: string) => {
  scrollToSection('home');
  window.dispatchEvent(new CustomEvent<string>(TERMINAL_EVENT, { detail: command }));
};
