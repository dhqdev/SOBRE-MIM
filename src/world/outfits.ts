/** Roupas do boneco do David: algumas de graça, outras pra ajudar com um Pix. */

export type Hat = 'palha' | 'bone' | 'cowboy' | 'pescador' | 'coroa' | 'capacete' | 'nenhum';

export interface Outfit {
  id: string;
  name: string;
  /** Preço em reais (0 = de graça). */
  price: 0 | 5 | 10;
  emoji: string;
  shirt: string;
  /** Faixa da barra do moletom / detalhe do peito. */
  trim: string;
  pants: string;
  shoes: string;
  hat: Hat;
  hatColor: string;
  hatBand?: string;
  /** Camisa xadrez: cor das listras. */
  plaid?: string;
  cape?: string;
  /** Brilho no peito (o "botton" amarelo). */
  badge?: string;
}

export const OUTFITS: Outfit[] = [
  {
    id: 'padrao',
    name: 'Clássico',
    price: 0,
    emoji: '💜',
    shirt: '#7c3aed',
    trim: '#6d28d9',
    pants: '#33407a',
    shoes: '#f4f0ff',
    hat: 'palha',
    hatColor: '#e6c36a',
    hatBand: '#7c3aed',
    badge: '#ffd166',
  },
  {
    id: 'caipira',
    name: 'Caipira',
    price: 0,
    emoji: '🌽',
    shirt: '#c2413a',
    trim: '#8a2a24',
    pants: '#3a5a8a',
    shoes: '#6b4423',
    hat: 'palha',
    hatColor: '#e6c36a',
    hatBand: '#c2413a',
    plaid: '#f4f0ff',
  },
  {
    id: 'dev',
    name: 'Dev de madrugada',
    price: 5,
    emoji: '🌙',
    shirt: '#1f1a2e',
    trim: '#7c3aed',
    pants: '#2a2a33',
    shoes: '#a78bfa',
    hat: 'bone',
    hatColor: '#7c3aed',
    badge: '#5ec8f2',
  },
  {
    id: 'pescador',
    name: 'Pescador',
    price: 5,
    emoji: '🎣',
    shirt: '#4f7a3a',
    trim: '#e6c36a',
    pants: '#5a4632',
    shoes: '#2a2a33',
    hat: 'pescador',
    hatColor: '#c9b98a',
  },
  {
    id: 'cowboy',
    name: 'Peão de rodeio',
    price: 5,
    emoji: '🤠',
    shirt: '#5a8fd6',
    trim: '#3b6aa8',
    pants: '#2f3f6a',
    shoes: '#6b4423',
    hat: 'cowboy',
    hatColor: '#8a5a34',
    hatBand: '#3b2a1e',
    plaid: '#cfe3ff',
  },
  {
    id: 'junina',
    name: 'Festa junina',
    price: 5,
    emoji: '🎉',
    shirt: '#ff7eb6',
    trim: '#ffd166',
    pants: '#3a5a8a',
    shoes: '#6b4423',
    hat: 'palha',
    hatColor: '#e6c36a',
    hatBand: '#e8443a',
    plaid: '#ffd166',
  },
  {
    id: 'astronauta',
    name: 'Astronauta',
    price: 10,
    emoji: '🚀',
    shirt: '#f4f0ff',
    trim: '#e8443a',
    pants: '#e6e2f0',
    shoes: '#8a8a9a',
    hat: 'capacete',
    hatColor: '#f4f0ff',
    badge: '#5ec8f2',
  },
  {
    id: 'rei',
    name: 'Rei do sítio',
    price: 10,
    emoji: '👑',
    shirt: '#6d28d9',
    trim: '#ffd166',
    pants: '#2a1650',
    shoes: '#ffd166',
    hat: 'coroa',
    hatColor: '#ffd166',
    cape: '#c2415d',
    badge: '#ff4d6d',
  },
  {
    id: 'heroi',
    name: 'Super-dev',
    price: 10,
    emoji: '⚡',
    shirt: '#2f6db3',
    trim: '#e8443a',
    pants: '#2f6db3',
    shoes: '#e8443a',
    hat: 'nenhum',
    hatColor: '#000000',
    cape: '#e8443a',
    badge: '#ffd166',
  },
];

export const DEFAULT_OUTFIT = OUTFITS[0];
export const outfitById = (id: string | null) => OUTFITS.find((o) => o.id === id) ?? DEFAULT_OUTFIT;
