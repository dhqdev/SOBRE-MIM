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
  run?: 'game' | 'cv' | 'ride';
}

export type RideType = 'coaster' | 'carousel' | 'swing' | 'viking' | 'ferris' | 'drop';

/** O brinquedo do parque que representa um projeto. */
export interface RideInfo {
  type: RideType;
  /** Nome do brinquedo (vai na placa). */
  name: string;
  on: string;
  off: string;
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
  ride?: RideInfo;
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

/**
 * Parque dos projetos: uma avenida saindo do terreiro pro leste, com um
 * brinquedo de cada lado. Cada projeto é um brinquedo.
 */
export const PARK = { x: 38, z: 1.5, from: 15, to: 54 };

/** Brinquedos na ordem dos projetos: centro do brinquedo e onde a pessoa embarca. */
export const RIDES: (RideInfo & { bx: number; bz: number; x: number; z: number; plaza: number })[] = [
  {
    type: 'coaster',
    name: 'Montanha-russa',
    on: 'Andar na montanha-russa',
    off: 'Descer da montanha-russa',
    bx: 67,
    bz: -1,
    x: 53.2,
    z: 1.5,
    plaza: 0,
  },
  {
    type: 'carousel',
    name: 'Carrossel',
    on: 'Andar no carrossel',
    off: 'Descer do carrossel',
    bx: 24,
    bz: -7,
    x: 24,
    z: -1.4,
    plaza: 6.2,
  },
  {
    type: 'swing',
    name: 'Chapéu mexicano',
    on: 'Voar no chapéu mexicano',
    off: 'Descer do chapéu mexicano',
    bx: 21,
    bz: 10.5,
    x: 21,
    z: 4.4,
    plaza: 6.6,
  },
  {
    type: 'viking',
    name: 'Barco viking',
    on: 'Andar no barco viking',
    off: 'Descer do barco viking',
    bx: 35,
    bz: 10.5,
    x: 35,
    z: 4.4,
    plaza: 6,
  },
  {
    type: 'ferris',
    name: 'Roda-gigante',
    on: 'Andar na roda-gigante',
    off: 'Descer da roda-gigante',
    bx: 36,
    bz: -7.5,
    x: 36,
    z: -1.5,
    plaza: 5.2,
  },
  {
    type: 'drop',
    name: 'Elevador',
    on: 'Andar no elevador',
    off: 'Descer do elevador',
    bx: 48.5,
    bz: -6.5,
    x: 48.5,
    z: -1.5,
    plaza: 4.6,
  },
];

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
  // avenida do parque e o caminho que sobe pra trilha
  {
    width: 3.4,
    points: [
      [PARK.from, 0.8],
      [28, 1.5],
      [PARK.to, 1.5],
    ],
  },
  {
    width: 2.4,
    points: [
      [54, 1.5],
      [57.2, 1.5],
    ],
  },
  { width: 2, points: [[43, 1.5], [43, -6], TRAIL[0]] },
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
      [44, 1.5],
      [44.5, 11],
      [41.6, 20.2],
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
  const { plaza: _plaza, bx, bz, x, z, ...ride } = RIDES[index % RIDES.length];
  void _plaza;
  const [name, ...rest] = project.title.split(' - ');
  const actions: StationAction[] = [{ label: ride.on, run: 'ride' }];
  if (project.game) actions.push({ label: 'Jogar agora', run: 'game' });
  actions.push({ label: 'Ver projeto', href: project.link });
  if (project.repo) actions.push({ label: 'Código', href: project.repo });
  return {
    id: `projeto-${index}`,
    kind: 'project',
    label: name,
    bx,
    bz,
    x,
    z,
    title: name,
    subtitle: `${ride.name} · ${rest.join(' - ') || 'Projeto'}`,
    text: project.description,
    image: project.image ?? project.poster,
    tags: project.tags,
    actions,
    ride,
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
    text: 'Oi! Eu sou o David, desenvolvedor full-stack apaixonado por automação e IA. Este sítio é o meu portfólio: desça a colina, atravesse o riacho e visite cada ponto roxo. Cada projeto meu virou um brinquedo no parque. Dá pra montar nos bichos, dirigir o bugue, remar no lago e procurar os ovos de ouro escondidos.',
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
