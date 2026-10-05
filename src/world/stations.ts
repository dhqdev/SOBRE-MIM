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
 * Um ponto do sítio. `x`/`z` é onde a pessoa para pra interagir; a construção
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

/* ------------------------------------------------------------------ mapa */

/** Entrada no alto da colina, ao sul. */
export const SPAWN = { x: 0, z: 81 };
export const GATE = { x: 0, z: 77 };
/** Terreiro com o poço, no meio do sítio. */
export const YARD = { x: 2, z: -5 };

/** Feira dos projetos: barracas num arco aberto pro terreiro. */
export const FAIR = { x: 25, z: 2, radius: 9.5 };
const FAIR_ANGLES = [-112, -67, -22, 22, 67, 112];

/** Trilha da carreira subindo o morro do nordeste até o mirante. */
export const TRAIL: [number, number][] = [
  [42, -11],
  [46, -17],
  [49, -23],
  [52, -29],
  [55, -34],
  [57, -39],
  [58, -44],
  [57.5, -49],
  [55, -53],
];

export const PENS = {
  pigs: { x: -36, z: -30, w: 12, d: 9 },
  sheep: { x: -53, z: -27, w: 17, d: 13 },
  horses: { x: 3, z: -46, w: 16, d: 11 },
};

/** Estradinhas de terra (desenhadas no próprio chão). */
export const ROADS: { points: [number, number][]; width: number }[] = [
  {
    width: 3.4,
    points: [
      [0, 86],
      [0, 76],
      [0.5, 66],
      [3, 56],
      [-1.5, 46],
      [0.2, 34],
      [0.4, 25],
      [0.8, 19.3],
      [1.2, 13],
      [YARD.x, YARD.z + 3],
    ],
  },
  {
    width: 2.4,
    points: [
      [-3, -9],
      [-8, -14],
      [-12, -17],
    ],
  },
  {
    width: 2.2,
    points: [
      [-12, -17],
      [-22, -14],
      [-26, -14],
    ],
  },
  {
    width: 2.2,
    points: [
      [-14, -22],
      [-24, -26],
      [-29, -27],
    ],
  },
  {
    width: 2,
    points: [
      [-42, -27],
      [-44.5, -27],
    ],
  },
  {
    width: 2.4,
    points: [
      [6, -5],
      [13, -1],
      [17, 0.5],
    ],
  },
  {
    width: 2.4,
    points: [
      [6, -10],
      [10, -18],
      [12, -22],
    ],
  },
  {
    width: 2.2,
    points: [
      [16, -26],
      [25, -25],
      [28, -24],
    ],
  },
  {
    width: 2.4,
    points: [
      [2, -10],
      [3, -24],
      [3, -39],
    ],
  },
  { width: 2, points: [[33, -7], [38, -9], TRAIL[0]] },
  { width: 1.8, points: TRAIL },
  { width: 1.8, points: [TRAIL[8], [55.5, -57]] },
  {
    width: 2,
    points: [
      [-4, -4],
      [-14, -2],
      [-19, -1],
    ],
  },
  {
    width: 1.8,
    points: [
      [-24, 1],
      [-30, 4.8],
      [-33.4, 7.6],
      [-37, 10.6],
      [-42, 16],
    ],
  },
  {
    width: 2,
    points: [
      [30, 12],
      [35, 19],
      [39.6, 25.8],
      [45, 31],
      [52, 33],
    ],
  },
  {
    width: 2.2,
    points: [
      [0.2, 40],
      [5, 40],
      [8, 39],
    ],
  },
  {
    width: 2,
    points: [
      [-1.5, 46],
      [-10, 44],
      [-18, 41],
    ],
  },
  {
    width: 2,
    points: [
      [1.5, 50],
      [12, 48],
      [20, 45],
    ],
  },
];

/** Ovos de ouro escondidos pelo sítio. */
export const EGGS: [number, number][] = [
  [-8, 72],
  [-66, -4],
  [62, 36],
  [-56, 40],
  [62, -58],
  [-26, 49],
  [28, 52],
  [-38, -40],
  [40, -34],
  [14, -56],
  [-15, 6],
  [46, 6],
];

/* -------------------------------------------------------------- estações */

const projectStations: Station[] = projects.map((project, index) => {
  const angle = (FAIR_ANGLES[index] * Math.PI) / 180;
  const bx = FAIR.x + Math.cos(angle) * FAIR.radius;
  const bz = FAIR.z + Math.sin(angle) * FAIR.radius;
  const [name, ...rest] = project.title.split(' - ');
  const actions: StationAction[] = [];
  if (project.game) actions.push({ label: 'Jogar agora', run: 'game' });
  actions.push({ label: 'Ver projeto', href: project.link });
  if (project.repo) actions.push({ label: 'Código', href: project.repo });
  return {
    id: `projeto-${index}`,
    kind: 'project',
    label: name,
    ...place(bx, bz, FAIR.x, FAIR.z, 3),
    title: name,
    subtitle: rest.join(' - ') || 'Projeto',
    text: project.description,
    image: project.image ?? project.poster,
    tags: project.tags,
    actions,
  };
});

const milestoneStations: Station[] = milestones.map((item, index) => {
  const [x, z] = TRAIL[index];
  // a placa fica na beira da trilha, virada pra quem sobe
  const [nx, nz] = TRAIL[Math.min(index + 1, TRAIL.length - 1)];
  const [px, pz] = TRAIL[Math.max(index - 1, 0)];
  const dx = nx - px;
  const dz = nz - pz;
  const length = Math.hypot(dx, dz) || 1;
  const side = index % 2 ? 1 : -1;
  return {
    id: `marco-${index}`,
    kind: 'milestone',
    label: item.date,
    x,
    z,
    bx: x + (-dz / length) * 2.4 * side,
    bz: z + (dx / length) * 2.4 * side,
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
    ...place(5.6, 70, 0.5, 70, 2.8),
    title: 'Bem-vindo ao Sítio do David!',
    subtitle: 'Desenvolvedor Full-Stack',
    text: 'Oi! Eu sou o David, desenvolvedor full-stack apaixonado por automação e IA. Este sítio é o meu portfólio: desça a colina, atravesse o riacho e visite cada ponto roxo. Dá pra montar nos bichos, dirigir o bugue e procurar os ovos de ouro escondidos.',
    tags: ['Vue & React', 'Python', 'Automação', 'Agentes de IA'],
  },
  {
    id: 'sobre',
    kind: 'info',
    label: 'Casa do David',
    ...place(-17, -24, 0, -8, 6),
    title: 'Apresentação',
    subtitle: 'Software Engineer na GRV Software',
    text: 'Comecei consertando rede e servidor e hoje lidero o módulo financeiro de um ERP: contas a pagar e receber, faturamento, fluxo de caixa e conciliação bancária. Nas horas vagas eu crio agentes de IA, automações e jogos. Sou bacharel em Ciência da Computação e estou na pós em Agentes de IA na FIAP.',
    tags: ['2+ anos de experiência', '10+ projetos entregues'],
  },
  {
    id: 'contato',
    kind: 'info',
    label: 'Correio',
    ...place(-6, -12.5, 0, -6, 1.9),
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
    label: 'Fogão a lenha',
    ...place(-30, -14, -12, -10, 3.4),
    title: 'Cafezinho no fogão a lenha',
    subtitle: 'Combustível de desenvolvedor',
    text: 'Todo código deste sítio foi movido a café passado no coador. No site tem um café-o-metro onde dá pra me pagar um cafezinho virtual (de graça, prometo).',
  },
  {
    id: 'github',
    kind: 'info',
    label: 'Ipê do GitHub',
    ...place(-22, -1, 0, -5, 4.6),
    title: 'O ipê dos commits',
    subtitle: 'Código aberto toda semana',
    text: 'Cada flor deste ipê é um repositório e cada quadradinho no chão é um dia de commits. Meus projetos pessoais, experimentos e automações ficam todos no GitHub.',
    actions: [{ label: 'Abrir GitHub', href: GITHUB_URL }],
  },
  {
    id: 'stack',
    kind: 'info',
    label: 'Silo da stack',
    ...place(31, -25, 14, -10, 4.4),
    title: 'O silo das tecnologias',
    subtitle: 'O que eu uso no dia a dia',
    text: 'Os cubos que giram em volta do silo são as ferramentas que eu mais uso: do front ao back, do banco ao deploy, e as automações no meio do caminho.',
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
    id: 'curriculo',
    kind: 'info',
    label: 'Celeiro',
    ...place(14, -31, 9, -12, 5.6),
    title: 'O baú do celeiro',
    subtitle: 'Você achou o currículo!',
    text: 'Tudo o que tem neste sítio, só que em PDF: experiência, formação e projetos.',
    actions: [{ label: 'Baixar currículo', run: 'cv' }],
  },
  {
    id: 'redes',
    kind: 'info',
    label: 'Mirante',
    ...place(57, -61, 55.5, -55, 3.6),
    title: 'O mirante',
    subtitle: 'Me acompanhe por aí',
    text: 'Daqui de cima dá pra ver o sítio inteiro, o riacho e o lago. Também dá pra me achar nas redes.',
    actions: [
      { label: 'Instagram', href: INSTAGRAM_URL },
      { label: 'LinkedIn', href: LINKEDIN_URL },
      { label: 'GitHub', href: GITHUB_URL },
    ],
  },
  ...projectStations,
  ...milestoneStations,
];
