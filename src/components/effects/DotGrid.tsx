import { useEffect, useRef } from 'react';

interface DotGridProps {
  /** Distância entre os pontos, em px. */
  gap?: number;
  /** Raio de alcance do cursor, em px. */
  proximity?: number;
  /** Cor de base dos pontos (r, g, b). */
  baseColor?: [number, number, number];
  /** Cor dos pontos perto do cursor (r, g, b). */
  activeColor?: [number, number, number];
}

// Fora do componente: um array literal como default seria recriado a cada
// render e faria o efeito reiniciar o canvas.
const WHITE: [number, number, number] = [255, 255, 255];
const VIOLET: [number, number, number] = [167, 139, 250];

/**
 * Inspirado no "Dot Grid" do React Bits: uma grade de pontos discreta que
 * acende em volta do cursor. Canvas 2D puro, redesenhado só quando o mouse
 * mexe — sem WebGL e sem loop rodando parado. Em telas de toque fica estática.
 */
const DotGrid = ({
  gap = 28,
  proximity = 160,
  baseColor = WHITE,
  activeColor = VIOLET,
}: DotGridProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) return;

    const pointer = { x: -9999, y: -9999 };
    let frame = 0;
    let width = 0;
    let height = 0;

    const draw = () => {
      frame = 0;
      context.clearRect(0, 0, width, height);
      const offsetX = (width % gap) / 2;
      const offsetY = (height % gap) / 2;

      for (let x = offsetX; x <= width; x += gap) {
        for (let y = offsetY; y <= height; y += gap) {
          const distance = Math.hypot(x - pointer.x, y - pointer.y);
          const t = Math.max(0, 1 - distance / proximity);
          const r = baseColor[0] + (activeColor[0] - baseColor[0]) * t;
          const g = baseColor[1] + (activeColor[1] - baseColor[1]) * t;
          const b = baseColor[2] + (activeColor[2] - baseColor[2]) * t;
          const alpha = 0.07 + t * 0.75;
          context.fillStyle = `rgba(${r | 0}, ${g | 0}, ${b | 0}, ${alpha})`;
          context.beginPath();
          context.arc(x, y, 1 + t * 0.8, 0, Math.PI * 2);
          context.fill();
        }
      }
    };

    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(draw);
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      schedule();
    };

    const onMove = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse') return;
      const rect = canvas.getBoundingClientRect();
      pointer.x = event.clientX - rect.left;
      pointer.y = event.clientY - rect.top;
      schedule();
    };

    const onLeave = () => {
      pointer.x = -9999;
      pointer.y = -9999;
      schedule();
    };

    resize();
    window.addEventListener('resize', resize);
    window.addEventListener('pointermove', onMove, { passive: true });
    document.documentElement.addEventListener('pointerleave', onLeave);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', onMove);
      document.documentElement.removeEventListener('pointerleave', onLeave);
    };
  }, [gap, proximity, baseColor, activeColor]);

  return <canvas ref={canvasRef} className="h-full w-full" aria-hidden="true" />;
};

export default DotGrid;
