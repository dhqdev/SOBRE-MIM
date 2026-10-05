import { projects } from '@/lib/projects';
import { milestones } from '@/lib/milestones';
import { EMAIL, LINKEDIN_URL } from '@/lib/site';
import { GITHUB_URL } from '@/lib/github';
import { INSTAGRAM_URL, WHATSAPP_URL } from '@/lib/contact';

export type StationKind = 'info' | 'project' | 'milestone';

export interface StationAction {
  label: string;
  href?: string;
  /** Ações que o próprio site resolve. */
  run?: 'game' | 'cv';
}

/**
 * Um ponto da ilha. `x`/`z` é onde a pessoa para pra interagir; a construção
 * fica em `bx`/`bz`, virada pra esse ponto.
 */
export interface Station {
  id: string;
  kind: StationKind;
  /** Nome curto que flutua em cima da estação. */
  label: string;
  x: number;
  z: number;
  bx: number;
  bz: number;
  title: string;
  subtitle?: string;
  text: string;
  image?: string;
  tags?: string[];
  actions?: StationAction[];
}

/** Põe a construção `distance` atrás do ponto, olhando pra `face`. */
const place = (bx: number, bz: number, faceX: number, faceZ: number, distance: number) => {
  const dx = faceX - bx;
  const dz = faceZ - bz;
  const length = Math.hypot(dx, dz) || 1;
  return { bx, bz, x: bx + (dx / length) * distance, z: bz + (dz / length) * distance };
};

/** Centro da galeria de projetos; os telões ficam num arco em volta. */
export const GALLERY = { x: -22, z: -7, radius: 9 };
const GALLERY_ANGLES = [-100, -136, -172, 152, 116, 80];

const projectStations: Station[] = projects.map((project, index) => {
  const angle = (GALLERY_ANGLES[index] * Math.PI) / 180;
  const bx = GALLERY.x + Math.cos(angle) * GALLERY.radius;
  const bz = GALLERY.z + Math.sin(angle) * GALLERY.radius;
  const [name, ...rest] = project.title.split(' - ');
  const actions: StationAction[] = [];
  if (project.game) actions.push({ label: 'Jogar agora', run: 'game' });
  actions.push({ label: 'Ver projeto', href: project.link });
  if (project.repo) actions.push({ label: 'Código', href: project.repo });
  return {
    id: `projeto-${index}`,
    kind: 'project',
    label: name,
    ...place(bx, bz, GALLERY.x, GALLERY.z, 2.8),
    title: name,
    subtitle: rest.join(' - ') || 'Projeto',
    text: project.description,
    image: project.image ?? project.poster,
    tags: project.tags,
    actions,
  };
});

/** A trilha da carreira serpenteia pelo leste da ilha. */
export const TRAIL: [number, number][] = [
  [9, 20],
  [14, 22.5],
  [19, 21],
  [23, 17],
  [26, 12],
  [28, 6],
  [29, 0],
  [27.5, -6],
  [24, -11],
];

const milestoneStations: Station[] = milestones.map((item, index) => {
  const [x, z] = TRAIL[index];
  return {
    id: `marco-${index}`,
    kind: 'milestone',
    label: item.date,
    x,
    z,
    bx: x,
    bz: z,
    title: item.title,
    subtitle: `${item.date} · ${item.place}`,
    text: item.text,
  };
});

export const STATIONS: Station[] = [
  {
    id: 'inicio',
    kind: 'info',
    label: 'Bem-vindo',
    ...place(4.6, 27, 0, 27, 2.4),
    title: 'Bem-vindo à Ilha do David!',
    subtitle: 'Desenvolvedor Full-Stack',
    text: 'Oi! Eu sou o David, desenvolvedor full-stack apaixonado por automação e IA. Esta ilha é o meu portfólio: cada luz roxa é um ponto pra visitar. Ande pelas trilhas, entre na galeria de projetos, siga a trilha da carreira e procure os disquetes escondidos.',
    tags: ['Vue & React', 'Python', 'Automação', 'Agentes de IA'],
  },
  {
    id: 'sobre',
    kind: 'info',
    label: 'Minha casa',
    ...place(-17, 15, -2, 11, 4.2),
    title: 'Sobre mim',
    subtitle: 'Software Engineer na GRV Software',
    text: 'Comecei consertando rede e servidor e hoje lidero o módulo financeiro de um ERP: contas a pagar e receber, faturamento, fluxo de caixa e conciliação bancária. Nas horas vagas eu crio agentes de IA, automações e jogos. Sou bacharel em Ciência da Computação e estou na pós em Agentes de IA na FIAP.',
    tags: ['2+ anos de experiência', '10+ projetos entregues'],
  },
  {
    id: 'contato',
    kind: 'info',
    label: 'Correio',
    ...place(-10.5, 20, -4, 23, 1.8),
    title: 'Caixa de correio',
    subtitle: 'Bora conversar?',
    text: 'Estou disponível para projetos freelance e oportunidades full-time. O jeito mais rápido de falar comigo é pelo WhatsApp.',
    actions: [
      { label: 'WhatsApp', href: WHATSAPP_URL },
      { label: 'E-mail', href: `mailto:${EMAIL}` },
      { label: 'LinkedIn', href: LINKEDIN_URL },
    ],
  },
  {
    id: 'cafe',
    kind: 'info',
    label: 'Café',
    ...place(10.5, 4, 0, 10, 3.2),
    title: 'Quiosque do café',
    subtitle: 'Combustível de desenvolvedor',
    text: 'Todo código desta ilha foi movido a café. No site tem um café-o-metro onde dá pra me pagar um cafezinho virtual (de graça, prometo).',
  },
  {
    id: 'github',
    kind: 'info',
    label: 'Árvore do GitHub',
    ...place(2, -17, 0, 10, 4.6),
    title: 'Árvore dos commits',
    subtitle: 'Código aberto toda semana',
    text: 'Cada bolinha desta árvore é um repositório e cada quadradinho no chão é um dia de commits. Meus projetos pessoais, experimentos e automações ficam todos no GitHub.',
    actions: [{ label: 'Abrir GitHub', href: GITHUB_URL }],
  },
  {
    id: 'stack',
    kind: 'info',
    label: 'Torre da Stack',
    ...place(18, -21, 8, -7, 3.6),
    title: 'Torre das tecnologias',
    subtitle: 'O que eu uso no dia a dia',
    text: 'Os cubos que giram em volta da torre são as ferramentas que eu mais uso: do front ao back, do banco ao deploy, e as automações no meio do caminho.',
    tags: [
      'Python',
      'TypeScript',
      'React',
      'Vue.js',
      'Node.js',
      'FastAPI',
      'Java',
      'MySQL',
      'Docker',
      'n8n',
      'Git',
      'Tailwind',
    ],
  },
  {
    id: 'redes',
    kind: 'info',
    label: 'Farol',
    ...place(35, 17, 25, 13, 3.4),
    title: 'O farol',
    subtitle: 'Me acompanhe por aí',
    text: 'Daqui de cima dá pra ver a ilha inteira. Também dá pra me achar nas redes.',
    actions: [
      { label: 'Instagram', href: INSTAGRAM_URL },
      { label: 'LinkedIn', href: LINKEDIN_URL },
      { label: 'GitHub', href: GITHUB_URL },
    ],
  },
  {
    id: 'curriculo',
    kind: 'info',
    label: 'Baú',
    ...place(-25, -27, -18, -19, 2.4),
    title: 'Baú do tesouro',
    subtitle: 'Você achou o currículo!',
    text: 'Tudo o que está nesta ilha, só que em PDF: experiência, formação e projetos.',
    actions: [{ label: 'Baixar currículo', run: 'cv' }],
  },
  ...projectStations,
  ...milestoneStations,
];

/** Disquetes escondidos pela ilha. */
export const FLOPPIES: [number, number][] = [
  [12, 51],
  [-37.5, 12],
  [33, 21],
  [-28, -30],
  [0, -23],
  [25, -27],
  [-37, -6],
  [-6, 37],
  [31, -18],
  [-15, 26],
  [17, 11],
  [-9, -31],
];

export const SPAWN = { x: 0, z: 35 };
