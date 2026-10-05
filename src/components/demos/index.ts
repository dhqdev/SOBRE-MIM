import type { Demo } from './DemoPlayer';
import { bciDemo } from './BciDemo';
import { encontroDemo } from './EncontroDemo';
import { flappyDemo } from './FlappyDemo';
import { metaBotDemo } from './MetaBotDemo';
import { planejaiDemo } from './PlanejaiDemo';
import { tekvosoftDemo } from './TekvosoftDemo';

/** Demo de cada projeto, pelo nome (a parte do título antes do " - "). */
export const DEMOS: Record<string, Demo> = {
  'Meta-Bot': metaBotDemo,
  'Tekvosoft Chat': tekvosoftDemo,
  'Flappy Bird IA': flappyDemo,
  Planejai: planejaiDemo,
  'Encontro com Deus': encontroDemo,
  'BCI-ON1': bciDemo,
};
