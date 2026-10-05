import { useEffect, useRef, useState } from 'react';
import type { Demo, DemoSceneProps } from './DemoPlayer';
import { Ticker } from './parts';

const HUD = [
  { generation: '1', alive: '50/50', best: '3' },
  { generation: '4', alive: '31/50', best: '18' },
  { generation: '9', alive: '44/50', best: '57' },
  { generation: '23', alive: '50/50', best: '∞' },
];

/** O vídeo real do experimento, com um placar por cima contando a evolução. */
const Scene = ({ step, playing }: DemoSceneProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [load, setLoad] = useState(false);

  // Só baixa o MP4 quando a demo roda pela primeira vez.
  useEffect(() => {
    if (playing) setLoad(true);
    const video = videoRef.current;
    if (!video) return;
    if (playing) video.play().catch(() => {});
    else video.pause();
  }, [playing, load]);

  const hud = HUD[step];

  return (
    <div className="relative h-full w-full bg-black">
      <video
        ref={videoRef}
        src={load ? '/media/flappy-bird-ai.mp4' : undefined}
        poster="/media/flappy-bird-poster.webp"
        muted
        loop
        playsInline
        preload="none"
        className="h-full w-full object-cover"
      />
      <div className="absolute left-3 top-3 rounded-lg border border-white/15 bg-black/60 px-3 py-2 font-mono text-[12px] text-white backdrop-blur-sm">
        <p>
          geração <Ticker value={hud.generation} className="text-[#c4b5fd]" />
        </p>
        <p className="text-white/70">
          vivos <Ticker value={hud.alive} />
        </p>
        <p className="text-white/70">
          recorde <Ticker value={hud.best} className="text-emerald-300" />
        </p>
      </div>
      <div className="absolute bottom-3 right-3 rounded-md bg-black/60 px-2 py-1 font-mono text-[10px] text-white/70">
        rede neural 4-5-1 · algoritmo genético
      </div>
    </div>
  );
};

export const flappyDemo: Demo = {
  url: 'flappy-bird-ia · python',
  steps: [
    '50 pássaros jogam juntos',
    'Os melhores passam os genes',
    'A mutação cria novidades',
    'A IA domina o jogo',
  ],
  stepMs: 3000,
  Scene,
};
