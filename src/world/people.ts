import * as THREE from 'three';
import { groundHeight, WATER_Y } from './terrain';
import { bake, box, group, keep, lambert, live, mesh, shared, solid, type Kit, type Obstacle } from './props';
import { cottage } from './buildings';
import { makeBubble } from './textures';

/**
 * Os moradores do sítio: cada um tem a sua casinha, sai de manhã pra fazer
 * o seu serviço (capinar, regar, pescar, varrer...) e volta pra casa de noite.
 * Quando a pessoa chega perto, param, acenam e puxam conversa.
 */

type Job =
  | 'enxada'
  | 'regar'
  | 'tratar'
  | 'pescar'
  | 'carregar'
  | 'varrer'
  | 'vigiar'
  | 'vender'
  | 'brincar'
  | 'pintar';

/** Ponto do serviço: onde fica, pra onde olha e quanto tempo fica (0 = só passa). */
interface Spot {
  x: number;
  z: number;
  fx?: number;
  fz?: number;
  stay?: number;
}

interface Look {
  skin: string;
  shirt: string;
  pants: string;
  hair: string;
  hat?: 'palha' | 'bone' | 'lenco';
  hatColor?: string;
  skirt?: boolean;
  kid?: boolean;
}

interface Spec {
  name: string;
  job: Job;
  look: Look;
  /** Casa própria (ou `null` pra quem mora com alguém / trabalha de noite). */
  home: { x: number; z: number; fx: number; fz: number; wall: string; roof: string; trim?: string } | null;
  /** Porta de casa de quem mora com alguém. */
  livesWith?: string;
  spots: Spot[];
  lines: string[];
  /** Trabalha de noite também (o porteiro). */
  nightShift?: boolean;
}

const LAKE_BOBBERS: Record<string, [number, number]> = {
  bank: [60.5, 72.5],
  pier: [73.5, 47.5],
};

const SPECS: Spec[] = [
  {
    name: 'Seu Juca',
    job: 'vigiar',
    look: {
      skin: '#8d5a3b',
      shirt: '#2a1650',
      pants: '#33334a',
      hair: '#d9d4cc',
      hat: 'bone',
      hatColor: '#2a1650',
    },
    home: null,
    nightShift: true,
    spots: [
      { x: 3.2, z: 113.2, fx: 0, fz: 116, stay: 9 },
      { x: 3.0, z: 109.6, fx: 0, fz: 108, stay: 6 },
    ],
    lines: [
      'Bem-vindo ao sítio do David! Pode entrar que a cancela sobe sozinha.',
      'Fica à vontade. Só não deixa as galinhas fugirem, hein!',
      'De noite eu fico aqui de olho em tudo, pode passear tranquilo.',
      'Já pegou o barquinho no lago? É a coisa mais gostosa daqui.',
    ],
  },
  {
    name: 'Dona Cida',
    job: 'regar',
    look: {
      skin: '#c68a62',
      shirt: '#ff7eb6',
      pants: '#6d28d9',
      hair: '#4a3020',
      hat: 'lenco',
      hatColor: '#ffd166',
      skirt: true,
    },
    home: { x: -60, z: 66, fx: -48, fz: 58, wall: '#ffe2ec', roof: '#c2415d' },
    spots: [
      { x: -48, z: 61.4, fx: -48, fz: 57, stay: 9 },
      { x: -44.2, z: 57, fx: -48, fz: 57, stay: 8 },
      { x: -51.8, z: 56, fx: -48, fz: 57, stay: 8 },
    ],
    lines: [
      'Essa alface aqui eu plantei semana passada, olha que bonita!',
      'Quer um tomate? Tá docinho, docinho.',
      'O segredo da horta é regar bem cedinho.',
      'O David vem aqui pegar couve pro almoço, todo domingo.',
    ],
  },
  {
    name: 'Zé do Milho',
    job: 'enxada',
    look: {
      skin: '#a8714c',
      shirt: '#4f9d4a',
      pants: '#3a4f7a',
      hair: '#2b1d14',
      hat: 'palha',
      hatColor: '#e6c36a',
    },
    home: { x: -44, z: 82, fx: -34, fz: 70, wall: '#fff1c9', roof: '#8a5a34' },
    spots: [
      { x: -34, z: 57.2, fx: -34, fz: 52, stay: 10 },
      { x: -27, z: 57.4, fx: -27, fz: 52, stay: 10 },
      { x: -12.6, z: 48.8, fx: -12.6, fz: 44, stay: 9 },
    ],
    lines: [
      'Esse milho vai dar pamonha pra festa inteira!',
      'Cuidado que o espantalho é bravo, viu?',
      'Ô solzinho bom pra roça hoje.',
      'Capinar é que nem programar: tirar o mato pro que importa crescer.',
    ],
  },
  {
    name: 'Tonho Pescador',
    job: 'pescar',
    look: {
      skin: '#7a4a2e',
      shirt: '#2f80c9',
      pants: '#5a4632',
      hair: '#1a1326',
      hat: 'palha',
      hatColor: '#d9b45a',
    },
    home: { x: 46, z: 84, fx: 54, fz: 76, wall: '#d9f0ff', roof: '#2f6db3' },
    spots: [
      { x: 54.5, z: 76, fx: 60.5, fz: 72.5, stay: 22 },
      { x: 52, z: 64, stay: 0 },
      { x: 58, z: 56, stay: 0 },
      { x: 60.8, z: 47.8, stay: 0 },
      { x: 68.8, z: 47.5, fx: 75, fz: 47.5, stay: 22 },
      { x: 60.8, z: 47.8, stay: 0 },
      { x: 58, z: 56, stay: 0 },
      { x: 52, z: 64, stay: 0 },
    ],
    lines: [
      'Hoje o lago tá pra peixe!',
      'Tem um tucunaré gigante aqui que ninguém consegue pegar...',
      'Pega o barquinho no deque, rema pro meio do lago e aperta Pescar. Quando aparecer "Fisgou!", puxa!',
      'Dizem que na Lagoa Escondida, depois do canal, tem peixe que nem cabe no barco.',
      'Peixe grande gosta de silêncio. Shhh.',
    ],
  },
  {
    name: 'Dona Rosa',
    job: 'vender',
    look: { skin: '#d79a6e', shirt: '#ffd166', pants: '#e8443a', hair: '#8a8a8a', skirt: true },
    home: { x: 52, z: 22, fx: 44, fz: 18, wall: '#fff3b0', roof: '#e8443a' },
    spots: [{ x: 40, z: 19.4, fx: 40, fz: 10, stay: 30 }],
    lines: [
      'Olha a pamonha quentinha! Milho verde, curau!',
      'Cada brinquedo do parque é um projeto do David. Já andou em todos?',
      'Meus netos não param quietos um minuto!',
      'De noite o parque acende todinho, vale a pena voltar.',
    ],
  },
  {
    name: 'Pedrinho',
    job: 'brincar',
    look: {
      skin: '#c68a62',
      shirt: '#5ec8f2',
      pants: '#33407a',
      hair: '#2b1d14',
      hat: 'bone',
      hatColor: '#e8443a',
      kid: true,
    },
    home: null,
    livesWith: 'Dona Rosa',
    spots: ring(46, 25.5, 3.4, 8, 0),
    lines: [
      'Pega-pega! Tá com você!',
      'Já achou os ovos de ouro? Tem um lá na ilha do lago!',
      'Bora na montanha-russa? Eu não tenho medo não!',
    ],
  },
  {
    name: 'Ana',
    job: 'brincar',
    look: { skin: '#c68a62', shirt: '#c4b5fd', pants: '#ff7eb6', hair: '#3a2416', kid: true, skirt: true },
    home: null,
    livesWith: 'Dona Rosa',
    spots: ring(46, 25.5, 3.4, 8, 4),
    lines: [
      'Eu corro mais rápido que o Pedrinho!',
      'Sabia que dá pra andar a cavalo? Chega pertinho e aperta Montar.',
      'O vovô Tonho pescou um peixe ENORME ontem.',
    ],
  },
  {
    name: 'Benedito',
    job: 'carregar',
    look: {
      skin: '#6b3f26',
      shirt: '#e07a2f',
      pants: '#3a3a4a',
      hair: '#1a1326',
      hat: 'palha',
      hatColor: '#e6c36a',
    },
    home: { x: 32, z: -64, fx: 28, fz: -50, wall: '#e9f7d9', roof: '#4f7a3a' },
    spots: [
      { x: 26, z: -35, fx: 28, fz: -37.8, stay: 3 },
      { x: 41, z: -22.6, fx: 42.7, fz: -19.6, stay: 3 },
    ],
    lines: [
      'Ufa! Essa caixa tá pesada.',
      'Levando o feno pro galpão, já volto.',
      'O trator é do David, mas quem dirige sou eu.',
      'Trabalho pesado, mas a vista daqui compensa.',
    ],
  },
  {
    name: 'Seu Lauro',
    job: 'tratar',
    look: {
      skin: '#e2a878',
      shirt: '#a0522d',
      pants: '#33407a',
      hair: '#bdb6aa',
      hat: 'palha',
      hatColor: '#c9a46b',
    },
    home: { x: -68, z: -64, fx: -60, fz: -50, wall: '#f4e4d0', roof: '#7a4a2e' },
    spots: [
      { x: -42.6, z: -44, fx: -50, fz: -42, stay: 10 },
      { x: -42, z: -33.8, stay: 0 },
      { x: -61, z: -33.8, stay: 0 },
      { x: -62.6, z: -37, fx: -74, fz: -38, stay: 10 },
      { x: -61, z: -33.8, stay: 0 },
      { x: -42, z: -33.8, stay: 0 },
    ],
    lines: [
      'Hora da lavagem dos porquinhos!',
      'As ovelhas comem que nem gente grande.',
      'Dá pra montar no cavalo, sabia? Chega perto e aperta Montar.',
      'Bicho bem tratado é bicho feliz.',
      'Eles adoram peixe fresquinho! Pesca um no lago e traz pra eles.',
    ],
  },
  {
    name: 'Dona Nena',
    job: 'varrer',
    look: {
      skin: '#b07850',
      shirt: '#7c3aed',
      pants: '#4a3a6a',
      hair: '#e8e4dc',
      hat: 'lenco',
      hatColor: '#f4f0ff',
      skirt: true,
    },
    home: { x: -20, z: -84, fx: -16, fz: -60, wall: '#efe6ff', roof: '#6d28d9' },
    spots: [
      { x: -14.5, z: -24, fx: -10, fz: -20, stay: 12 },
      { x: -3, z: -15, fx: 2.8, fz: -7, stay: 12 },
    ],
    lines: [
      'Varro esse terreiro todo dia e a poeira não acaba!',
      'O David passa o dia no computador, programando. Às vezes até de madrugada.',
      'Toma um café antes de ir, fio. Tá passado agora.',
      'Já viu o fogão a lenha lá atrás da casa?',
    ],
  },
  {
    name: 'Lúcia',
    job: 'pintar',
    look: {
      skin: '#e2a878',
      shirt: '#f4f0ff',
      pants: '#2f80c9',
      hair: '#c2415d',
      hat: 'lenco',
      hatColor: '#7c3aed',
      skirt: true,
    },
    home: { x: -30, z: 100, fx: -17, fz: 90, wall: '#dff7f0', roof: '#2e8f7a' },
    spots: [{ x: -17, z: 91, fx: -17, fz: 80, stay: 40 }],
    lines: [
      'Tô pintando o sítio aqui de cima. Dá pra ver tudo!',
      'Volta de tarde que a luz fica dourada.',
      'De noite, com o parque aceso, esse quadro fica outro.',
    ],
  },
];

function ring(cx: number, cz: number, r: number, n: number, start: number): Spot[] {
  return Array.from({ length: n }, (_, i) => {
    const a = ((i + start) / n) * Math.PI * 2;
    return { x: cx + Math.cos(a) * r, z: cz + Math.sin(a) * r, stay: i % 4 === 3 ? 1.2 : 0 };
  });
}

/* --------------------------------------------------------- cenário deles */

/** Canteiros da horta da Dona Cida. */
const garden = (kit: Kit, x: number, z: number) => {
  const g = group(kit, x, z);
  const soil = lambert('#6b4423');
  const plank = lambert('#9e7044');
  const greens = ['#4f9d4a', '#7fbf55', '#3f7f3a'].map((c) => lambert(c));
  for (let row = 0; row < 3; row++) {
    const rz = -1.6 + row * 1.6;
    box(g, [5.2, 0.3, 1.1], [0, 0.15, rz], soil);
    box(g, [5.4, 0.34, 0.08], [0, 0.17, rz - 0.58], plank);
    box(g, [5.4, 0.34, 0.08], [0, 0.17, rz + 0.58], plank);
    for (let i = 0; i < 7; i++) {
      const px = -2.2 + i * 0.73;
      if (row === 1) {
        // tomateiro com estaca e tomatinho
        box(g, [0.05, 0.9, 0.05], [px, 0.7, rz], plank);
        box(g, [0.34, 0.5, 0.34], [px, 0.62, rz], greens[2]);
        box(g, [0.14, 0.14, 0.14], [px + 0.15, 0.6, rz + 0.12], lambert('#e8443a'));
      } else if (row === 0) {
        // alface
        const s = 0.36 + (i % 2) * 0.06;
        box(g, [s, 0.22, s], [px, 0.4, rz], greens[i % 2]);
      } else {
        // cenoura: folhinha em cima, laranjinha aparecendo
        box(g, [0.1, 0.32, 0.1], [px, 0.46, rz], greens[1]);
        box(g, [0.12, 0.08, 0.12], [px, 0.32, rz], lambert('#f28c28'));
      }
    }
  }
  // regador esquecido e placa
  box(g, [0.3, 0.3, 0.4], [3.1, 0.15, 1.8], lambert('#4f9d4a'));
  box(g, [0.06, 1.0, 0.06], [-3.0, 0.5, 2.4], plank);
  box(g, [0.9, 0.45, 0.06], [-3.0, 1.0, 2.43], lambert('#fff1c9'));
  kit.walls.push(
    { ax: x - 2.7, az: z - 2.2, bx: x + 2.7, bz: z - 2.2 },
    { ax: x - 2.7, az: z + 1.0, bx: x + 2.7, bz: z + 1.0 },
  );
};

/** Barraquinha de pamonha e milho verde da Dona Rosa. */
const cornStand = (kit: Kit, x: number, z: number, faceX: number, faceZ: number) => {
  const g = group(kit, x, z);
  g.rotation.y = Math.atan2(faceX - x, faceZ - z);
  const wood = lambert('#9e7044');
  box(g, [2.6, 1.0, 0.9], [0, 0.5, 0], lambert('#ffd166'));
  box(g, [2.8, 0.1, 1.1], [0, 1.05, 0], wood);
  for (const sx of [-1.25, 1.25]) box(g, [0.1, 2.4, 0.1], [sx, 1.2, -0.4], wood);
  // toldo listrado
  for (let i = 0; i < 6; i++) {
    const strip = box(
      g,
      [0.5, 0.08, 1.5],
      [-1.25 + i * 0.5, 2.45, 0.05],
      lambert(i % 2 ? '#ffffff' : '#e8443a'),
    );
    strip.rotation.x = 0.18;
  }
  // milho e panela
  for (let i = 0; i < 5; i++) {
    const cob = box(g, [0.14, 0.14, 0.42], [-1.0 + i * 0.18, 1.17, 0.1], lambert('#ffcf3a'));
    cob.rotation.y = 0.3 * (i - 2);
  }
  mesh(g, shared(new THREE.CylinderGeometry(0.32, 0.28, 0.4, 10)), lambert('#8a8a9a'), [0.75, 1.3, 0.05]);
  box(g, [2.4, 0.5, 0.06], [0, 0.6, 0.47], lambert('#fff8e0'));
  solid(kit, g, 0, 0, 1.2);
  return g;
};

/** Cavalete da pintora com o quadro do sítio. */
const easel = (kit: Kit, x: number, z: number, faceX: number, faceZ: number) => {
  const g = group(kit, x, z);
  g.rotation.y = Math.atan2(faceX - x, faceZ - z);
  const wood = lambert('#8a5a34');
  for (const sx of [-0.4, 0.4]) {
    const leg = box(g, [0.06, 1.9, 0.06], [sx, 0.95, 0], wood);
    leg.rotation.z = sx > 0 ? -0.1 : 0.1;
  }
  const back = box(g, [0.06, 1.8, 0.06], [0, 0.9, -0.45], wood);
  back.rotation.x = 0.25;
  box(g, [1.0, 0.75, 0.05], [0, 1.45, 0.06], lambert('#fffdf6'));
  // a pintura: céu, morro, lago e um ipê roxo
  box(g, [0.9, 0.3, 0.02], [0, 1.62, 0.1], lambert('#9fd6ef'));
  box(g, [0.9, 0.25, 0.02], [0, 1.36, 0.1], lambert('#6fb04a'));
  box(g, [0.3, 0.1, 0.02], [0.2, 1.3, 0.11], lambert('#3a8ee0'));
  box(g, [0.18, 0.18, 0.02], [-0.25, 1.52, 0.11], lambert('#a78bfa'));
  box(g, [0.9, 0.06, 0.08], [0, 1.06, 0.08], wood);
  solid(kit, g, 0, 0, 0.5);
};

/** Banquinho e balde de peixe do Tonho. */
const fishingStool = (kit: Kit, x: number, z: number) => {
  const g = group(kit, x, z);
  box(g, [0.5, 0.06, 0.5], [0, 0.45, 0], lambert('#9e7044'));
  for (const [sx, sz] of [
    [-0.2, -0.2],
    [0.2, -0.2],
    [-0.2, 0.2],
    [0.2, 0.2],
  ])
    box(g, [0.06, 0.45, 0.06], [sx, 0.22, sz], lambert('#6b4423'));
  mesh(g, shared(new THREE.CylinderGeometry(0.22, 0.18, 0.4, 10)), lambert('#5ec8f2'), [0.6, 0.2, 0.1]);
};

/* -------------------------------------------------------------- o boneco */

const CAN = lambert('#4f9d4a');
const WOOD = lambert('#9e7044');
const METAL = lambert('#8a8a9a');

const tool = (arm: THREE.Group, job: Job) => {
  switch (job) {
    case 'enxada':
      box(arm, [0.07, 1.6, 0.07], [0, -1.05, 0.05], WOOD);
      box(arm, [0.4, 0.08, 0.32], [0, -1.82, 0.16], METAL);
      break;
    case 'regar':
      box(arm, [0.3, 0.3, 0.42], [0, -0.82, 0.06], CAN);
      box(arm, [0.07, 0.07, 0.4], [0, -0.78, 0.4], CAN).rotation.x = -0.5;
      box(arm, [0.05, 0.22, 0.05], [0, -0.6, 0.06], CAN);
      break;
    case 'tratar':
      box(arm, [0.34, 0.36, 0.34], [0, -0.86, 0.04], lambert('#d9b45a'));
      break;
    case 'varrer':
      box(arm, [0.06, 1.5, 0.06], [0, -1.0, 0], WOOD);
      box(arm, [0.55, 0.26, 0.14], [0, -1.8, 0], lambert('#d9b45a'));
      break;
    case 'pescar': {
      const rod = keep(new THREE.Group());
      rod.position.set(0, -0.62, 0);
      rod.rotation.x = 1.25;
      arm.add(rod);
      box(rod, [0.05, 2.8, 0.05], [0, -1.35, 0], lambert('#3b3350'));
      box(rod, [0.1, 0.1, 0.12], [0, -0.1, 0.06], lambert('#2a2a33'));
      bake(rod);
      break;
    }
    case 'pintar':
      box(arm, [0.04, 0.38, 0.04], [0, -0.82, 0.04], WOOD);
      box(arm, [0.06, 0.08, 0.06], [0, -1.02, 0.04], lambert('#a78bfa'));
      break;
    default:
      break;
  }
};

const buildBody = (kit: Kit, look: Look, job: Job) => {
  const root = live(new THREE.Group());
  kit.scene.add(root);
  const body = new THREE.Group();
  root.add(body);
  const skin = lambert(look.skin);
  const shirt = lambert(look.shirt);
  const pants = lambert(look.pants);
  const hair = lambert(look.hair);
  const legs = [-0.17, 0.17].map((side) => {
    const hip = new THREE.Group();
    hip.position.set(side, 0.76, 0);
    body.add(hip);
    box(hip, [0.28, 0.6, 0.3], [0, -0.3, 0], look.skirt ? skin : pants);
    box(hip, [0.3, 0.16, 0.4], [0, -0.68, 0.05], lambert('#3b2a1e'));
    return hip;
  });
  const torso = new THREE.Group();
  torso.position.y = 0.76;
  body.add(torso);
  box(torso, [0.76, 0.76, 0.44], [0, 0.4, 0], shirt);
  if (look.skirt) box(torso, [0.84, 0.46, 0.5], [0, -0.1, 0], pants);
  else box(torso, [0.78, 0.14, 0.46], [0, 0.04, 0], pants);
  if (job === 'vender') box(torso, [0.6, 0.66, 0.04], [0, 0.22, 0.23], lambert('#fffdf6'));
  // cabeça
  box(torso, [0.66, 0.62, 0.62], [0, 1.12, 0], skin);
  box(torso, [0.7, 0.18, 0.66], [0, 1.47, -0.02], hair);
  box(torso, [0.7, 0.42, 0.14], [0, 1.24, -0.27], hair);
  for (const side of [-0.14, 0.14]) box(torso, [0.09, 0.12, 0.04], [side, 1.15, 0.32], lambert('#1a1326'));
  box(torso, [0.14, 0.04, 0.04], [0, 0.97, 0.32], lambert('#9b4a3a'));
  if (look.skirt && !look.hat) box(torso, [0.3, 0.3, 0.3], [0, 1.55, -0.3], hair);
  const hatColor = lambert(look.hatColor ?? '#e6c36a');
  if (look.hat === 'palha') {
    mesh(torso, shared(new THREE.CylinderGeometry(0.68, 0.68, 0.06, 12)), hatColor, [0, 1.56, 0]);
    mesh(torso, shared(new THREE.CylinderGeometry(0.34, 0.38, 0.3, 10)), hatColor, [0, 1.72, 0]);
  } else if (look.hat === 'bone') {
    box(torso, [0.7, 0.2, 0.68], [0, 1.58, -0.01], hatColor);
    box(torso, [0.6, 0.06, 0.34], [0, 1.5, 0.45], hatColor);
  } else if (look.hat === 'lenco') {
    box(torso, [0.72, 0.2, 0.68], [0, 1.52, -0.02], hatColor);
    box(torso, [0.2, 0.3, 0.1], [0, 1.3, -0.36], hatColor);
  }
  const arms = [-0.5, 0.5].map((side, i) => {
    const shoulder = new THREE.Group();
    shoulder.position.set(side, 0.7, 0);
    torso.add(shoulder);
    box(shoulder, [0.22, 0.6, 0.26], [0, -0.28, 0], shirt);
    box(shoulder, [0.2, 0.16, 0.22], [0, -0.64, 0], skin);
    if (i === 1) tool(shoulder, job);
    return shoulder;
  });
  // caixote que o Benedito leva (aparece só quando está carregando)
  const crate = keep(new THREE.Group());
  crate.position.set(0, 0.42, 0.55);
  torso.add(crate);
  box(crate, [0.7, 0.55, 0.5], [0, 0, 0], lambert('#b8874e'));
  box(crate, [0.74, 0.08, 0.54], [0, 0.18, 0], lambert('#8a5a34'));
  box(crate, [0.5, 0.2, 0.35], [0, 0.35, 0], lambert('#e6c36a'));
  crate.visible = false;
  bake(crate);
  if (look.kid) root.scale.setScalar(0.7);
  bake(root);
  return { root, body, torso, legs, arms, crate };
};

/* ---------------------------------------------------------------- morador */

const WALK = 1.6;
const RUN = 3.3;
const TALK_IN = 3.4;
const TALK_OUT = 5.2;

/** Linha fininha entre dois pontos (fio da vara de pesca). */
export const stretchLine = (line: THREE.Mesh, a: THREE.Vector3, b: THREE.Vector3) => {
  line.position.copy(a).add(b).multiplyScalar(0.5);
  line.scale.set(1, 1, Math.max(0.01, a.distanceTo(b)));
  line.lookAt(b);
};

export const fishingLine = (kit: Kit) => {
  const line = live(
    new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.025, 1), new THREE.MeshBasicMaterial({ color: '#f4f0ff' })),
  );
  kit.scene.add(line);
  const bobber = live(new THREE.Group());
  kit.scene.add(bobber);
  box(bobber, [0.2, 0.12, 0.2], [0, 0.06, 0], lambert('#ffffff'));
  box(bobber, [0.2, 0.12, 0.2], [0, -0.06, 0], lambert('#e8443a'));
  box(bobber, [0.04, 0.16, 0.04], [0, 0.18, 0], lambert('#e8443a'));
  bake(bobber);
  return { line, bobber };
};

class Villager {
  readonly root: THREE.Group;
  private rig: ReturnType<typeof buildBody>;
  x: number;
  z: number;
  angle = 0;
  private spot = 0;
  private stay = 0;
  private walking = true;
  private inside = false;
  private talking = false;
  private line = 0;
  private bubbles = new Map<number, THREE.Sprite>();
  private bubble: THREE.Sprite | null = null;
  private phase = Math.random() * 10;
  private nextFx = 0;
  private obstacle: Obstacle;
  private fishing: ReturnType<typeof fishingLine> | null = null;
  private tip = new THREE.Vector3();
  private bob = new THREE.Vector3();
  private bobberAt: [number, number] | null = null;

  constructor(
    private kit: Kit,
    readonly spec: Spec,
    readonly door: [number, number] | null,
    private index: number,
  ) {
    this.rig = buildBody(kit, spec.look, spec.job);
    this.root = this.rig.root;
    const first = spec.spots[0];
    // começa já no serviço (de dia) ou em casa (de noite)
    this.x = first.x;
    this.z = first.z;
    this.obstacle = { x: this.x, z: this.z, r: spec.look.kid ? 0.3 : 0.42 };
    kit.obstacles.push(this.obstacle);
    if (spec.job === 'pescar') this.fishing = fishingLine(kit);
  }

  private get night() {
    return !this.spec.nightShift && this.kit.env.night > 0.55 + (this.index % 4) * 0.04;
  }

  private target(): [number, number] {
    if (this.night && this.door) return this.door;
    const s = this.spec.spots[this.spot];
    return [s.x, s.z];
  }

  private say() {
    const lines = this.spec.lines;
    const i = this.line % lines.length;
    this.line++;
    let sprite = this.bubbles.get(i);
    if (!sprite) {
      sprite = makeBubble(this.spec.name, lines[i], this.spec.look.kid ? 1.05 : 1.2);
      this.kit.scene.add(sprite);
      this.bubbles.set(i, sprite);
    }
    if (this.bubble && this.bubble !== sprite) this.bubble.visible = false;
    this.bubble = sprite;
    sprite.visible = true;
  }

  private hush() {
    if (this.bubble) this.bubble.visible = false;
    this.bubble = null;
  }

  update(t: number, dt: number, player: { x: number; z: number }, camera: THREE.Vector3, onTalk: () => void) {
    const rig = this.rig;
    const night = this.night;
    // de noite some dentro de casa; de manhã sai pela porta
    if (this.inside) {
      if (night) return;
      this.inside = false;
      this.walking = true;
    }
    const near = Math.hypot(player.x - this.x, player.z - this.z);
    if (!this.talking && near < TALK_IN && !this.inside) {
      this.talking = true;
      this.say();
      onTalk();
    } else if (this.talking && near > TALK_OUT) {
      this.talking = false;
      this.hush();
    }

    let moving = 0;
    const [tx, tz] = this.target();
    const kid = this.spec.look.kid;
    if (this.talking) {
      const want = Math.atan2(player.x - this.x, player.z - this.z);
      this.turn(want, dt * 6);
    } else if (this.walking) {
      const dx = tx - this.x;
      const dz = tz - this.z;
      const d = Math.hypot(dx, dz);
      const speed = this.spec.job === 'brincar' ? RUN : night ? WALK * 1.3 : WALK;
      if (d < 0.15) {
        this.walking = false;
        if (night && this.door) {
          this.inside = true;
          this.hush();
          this.root.visible = false;
          this.obstacle.r = 0;
          if (this.fishing) this.fishing.line.visible = this.fishing.bobber.visible = false;
          return;
        }
        this.stay = this.spec.spots[this.spot].stay ?? 0;
        if (this.spec.job === 'carregar') rig.crate.visible = this.spot === 0;
      } else {
        const step = Math.min(d, speed * dt);
        this.x += (dx / d) * step;
        this.z += (dz / d) * step;
        this.turn(Math.atan2(dx, dz), dt * 8);
        moving = speed;
      }
    } else {
      const s = this.spec.spots[this.spot];
      if (s.fx !== undefined && s.fz !== undefined)
        this.turn(Math.atan2(s.fx - this.x, s.fz - this.z), dt * 4);
      this.stay -= dt;
      if (this.stay <= 0 || night) {
        if (!night) this.spot = (this.spot + 1) % this.spec.spots.length;
        this.walking = true;
      }
    }
    this.obstacle.x = this.x;
    this.obstacle.z = this.z;
    this.obstacle.r = kid ? 0.3 : 0.42;

    const far = Math.hypot(camera.x - this.x, camera.z - this.z) > 75;
    this.root.visible = !far;
    const working = !this.walking && !this.talking && !night;
    if (this.fishing) this.updateFishing(t, working && !far);
    if (far) return;

    // animação
    this.phase += dt * (moving ? 3 + moving * 1.6 : 1);
    const k = moving ? 1 : 0;
    const swing = Math.sin(this.phase) * 0.8 * k;
    const y = groundHeight(this.x, this.z);
    const hop =
      this.spec.job === 'brincar' && !this.walking && !this.talking ? Math.abs(Math.sin(t * 7)) * 0.5 : 0;
    this.root.position.set(this.x, y + hop, this.z);
    this.root.rotation.y = this.angle;
    rig.body.position.y = moving ? Math.abs(Math.sin(this.phase)) * 0.08 : 0;
    rig.legs[0].rotation.x = swing;
    rig.legs[1].rotation.x = -swing;
    rig.torso.rotation.set(0, 0, 0);
    const [left, right] = rig.arms;
    left.rotation.set(-swing * 0.8, 0, -0.05);
    right.rotation.set(swing * 0.8, 0, 0.05);
    if (this.spec.job === 'carregar' && rig.crate.visible) {
      left.rotation.set(-1.25, 0, 0.25);
      right.rotation.set(-1.25, 0, -0.25);
    }
    if (this.talking) {
      // aceno
      right.rotation.set(0, 0, 2.5 + Math.sin(t * 9) * 0.35);
      if (this.bubble) this.bubble.position.set(this.x, y + (kid ? 1.9 : 2.75), this.z);
      return;
    }
    if (working) this.work(t, y);
  }

  private turn(want: number, rate: number) {
    let diff = want - this.angle;
    diff = Math.atan2(Math.sin(diff), Math.cos(diff));
    this.angle += diff * Math.min(1, rate);
  }

  /** O serviço de cada um (braços, ferramenta e um pouquinho de partícula). */
  private work(t: number, y: number) {
    const [left, right] = this.rig.arms;
    const torso = this.rig.torso;
    const ahead = (d: number, h: number): [number, number, number] => [
      this.x + Math.sin(this.angle) * d,
      y + h,
      this.z + Math.cos(this.angle) * d,
    ];
    const fx = t > this.nextFx;
    switch (this.spec.job) {
      case 'enxada': {
        const c = Math.sin(t * 2.6);
        right.rotation.set(-2.4 + (c + 1) * 0.9, 0, 0);
        left.rotation.set(-2.2 + (c + 1) * 0.85, 0, 0.3);
        torso.rotation.x = (1 - c) * 0.12;
        if (fx && c < -0.9) {
          this.nextFx = t + 1.5;
          this.kit.particles.burst(ahead(1.6, 0.1), ['#8a5a36', '#a87a4a'], 5, 1.2);
        }
        break;
      }
      case 'regar':
        right.rotation.set(-1.15, 0, 0.1);
        this.rig.arms[1].rotation.z = 0.25 + Math.sin(t * 1.4) * 0.1;
        torso.rotation.y = Math.sin(t * 0.8) * 0.3;
        if (fx) {
          this.nextFx = t + 0.12;
          this.kit.particles.spawn(ahead(1.2, 0.85), {
            color: '#9be7ff',
            velocity: [Math.sin(this.angle) * 0.6, -1.4, Math.cos(this.angle) * 0.6],
            size: 0.07,
            grow: 0.6,
            life: 0.5,
            opacity: 0.9,
          });
        }
        break;
      case 'tratar': {
        const c = Math.max(0, Math.sin(t * 2.2));
        right.rotation.set(-0.3 - c * 1.6, 0, 0);
        left.rotation.set(-0.9, 0, 0.2);
        if (fx && c > 0.95) {
          this.nextFx = t + 1.2;
          this.kit.particles.burst(ahead(1.3, 1.4), ['#ffd166', '#e6c36a', '#c9a46b'], 8, 1.4);
        }
        break;
      }
      case 'varrer': {
        const c = Math.sin(t * 3);
        right.rotation.set(-0.75, 0, 0.2);
        left.rotation.set(-0.6, 0, -0.2);
        torso.rotation.y = c * 0.45;
        if (fx && Math.abs(c) > 0.95) {
          this.nextFx = t + 0.5;
          this.kit.particles.spawn(ahead(1.2, 0.15), {
            color: '#e9dcc2',
            velocity: [Math.cos(this.angle) * c, 0.5, -Math.sin(this.angle) * c],
            size: 0.16,
            grow: 1.4,
            life: 0.7,
            opacity: 0.7,
          });
        }
        break;
      }
      case 'pescar':
        right.rotation.set(-0.85 + Math.sin(t * 0.9) * 0.05, 0, 0);
        left.rotation.set(-0.85, 0, -0.2);
        break;
      case 'vigiar':
        left.rotation.set(0.35, 0, 0.25);
        right.rotation.set(0.35, 0, -0.25);
        torso.rotation.y = Math.sin(t * 0.5) * 0.6;
        break;
      case 'vender': {
        const call = Math.sin(t * 0.7) > 0.6;
        right.rotation.set(0, 0, call ? 2.6 + Math.sin(t * 8) * 0.3 : 0.05);
        left.rotation.set(-0.5, 0, 0.1);
        break;
      }
      case 'brincar':
        left.rotation.set(0, 0, -2.4);
        right.rotation.set(0, 0, 2.4);
        break;
      case 'pintar':
        right.rotation.set(-1.35 + Math.sin(t * 3) * 0.12, 0, 0.1 + Math.cos(t * 3) * 0.12);
        left.rotation.set(-0.4, 0, -0.1);
        torso.rotation.x = Math.sin(t * 0.4) * 0.05;
        break;
    }
  }

  /** Vara, linha e boia do pescador; de vez em quando sai um peixe. */
  private updateFishing(t: number, show: boolean) {
    const f = this.fishing!;
    const s = this.spec.spots[this.spot];
    const where = s.stay ? (s.z > 60 ? LAKE_BOBBERS.bank : LAKE_BOBBERS.pier) : null;
    show = show && Boolean(where);
    f.line.visible = f.bobber.visible = show;
    if (!show || !where) {
      this.bobberAt = null;
      return;
    }
    if (!this.bobberAt) this.bobberAt = where;
    const bite = Math.sin(t * 0.35 + this.index) > 0.93;
    const dip = bite ? Math.abs(Math.sin(t * 14)) * 0.12 : 0;
    this.bob.set(this.bobberAt[0], WATER_Y + 0.02 + Math.sin(t * 2) * 0.03 - dip, this.bobberAt[1]);
    f.bobber.position.copy(this.bob);
    // ponta da vara: a vara é filha do braço direito
    const rod = this.rig.arms[1].children.find((c) => c.userData.keep) as THREE.Object3D | undefined;
    if (rod) {
      rod.updateWorldMatrix(true, false);
      this.tip.set(0, -2.75, 0).applyMatrix4(rod.matrixWorld);
    }
    stretchLine(f.line, this.tip, this.bob);
    if (bite && t > this.nextFx) {
      this.nextFx = t + 3;
      this.kit.particles.burst([this.bob.x, WATER_Y + 0.1, this.bob.z], ['#ffffff', '#9be7ff'], 8, 1.6);
    }
  }
}

/** Monta as casinhas, o cenário de cada serviço e os moradores. */
export const villagers = (kit: Kit) => {
  garden(kit, -48, 57);
  cornStand(kit, 40, 17.6, 40, 10);
  easel(kit, -17, 89.6, -17, 80);
  fishingStool(kit, 53.4, 76.9);
  const doors = new Map<string, [number, number]>();
  SPECS.forEach((spec) => {
    if (!spec.home) return;
    const h = spec.home;
    doors.set(
      spec.name,
      cottage(kit, h.x, h.z, h.fx, h.fz, { wall: h.wall, roof: h.roof, trim: h.trim, name: spec.name }),
    );
  });
  const people = SPECS.map(
    (spec, i) => new Villager(kit, spec, doors.get(spec.livesWith ?? spec.name) ?? null, i),
  );
  /** Lugares que não podem ganhar árvore em cima (casa, horta, barraca). */
  const reserved: [number, number, number][] = [
    ...SPECS.filter((s) => s.home).map((s) => [s.home!.x, s.home!.z, 5.5] as [number, number, number]),
    [-48, 57, 5],
    [40, 17.6, 3],
    [-17, 90, 2.5],
    [53.4, 76.9, 2],
    [46, 25.5, 5],
    ...SPECS.flatMap((s) => s.spots.map((p) => [p.x, p.z, 1.2] as [number, number, number])),
  ];
  return {
    reserved,
    update: (
      t: number,
      dt: number,
      player: { x: number; z: number },
      camera: THREE.Vector3,
      onTalk: () => void,
    ) => people.forEach((p) => p.update(t, dt, player, camera, onTalk)),
  };
};
