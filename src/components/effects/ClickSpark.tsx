import { useEffect, useRef } from 'react';

interface Spark {
  x: number;
  y: number;
  angle: number;
  start: number;
}

const SPARK_COUNT = 8;
const DURATION_MS = 420;
const RADIUS = 22;
const LENGTH = 9;

/**
 * Inspirado no "Click Spark" do React Bits: cada clique solta pequenas faíscas
 * roxas em volta do ponteiro. Um canvas fixo por cima da página, que ignora
 * cliques e só anima enquanto há faíscas no ar.
 */
const ClickSpark = ({ color = 'rgba(196, 181, 253, 0.9)' }: { color?: string }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let sparks: Spark[] = [];
    let frame = 0;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const draw = (now: number) => {
      context.clearRect(0, 0, window.innerWidth, window.innerHeight);
      sparks = sparks.filter((spark) => now - spark.start < DURATION_MS);

      for (const spark of sparks) {
        const t = (now - spark.start) / DURATION_MS;
        const eased = t * (2 - t);
        const distance = eased * RADIUS;
        const length = LENGTH * (1 - eased);
        const x1 = spark.x + distance * Math.cos(spark.angle);
        const y1 = spark.y + distance * Math.sin(spark.angle);
        const x2 = spark.x + (distance + length) * Math.cos(spark.angle);
        const y2 = spark.y + (distance + length) * Math.sin(spark.angle);
        context.strokeStyle = color;
        context.lineWidth = 2;
        context.lineCap = 'round';
        context.beginPath();
        context.moveTo(x1, y1);
        context.lineTo(x2, y2);
        context.stroke();
      }

      frame = sparks.length > 0 ? requestAnimationFrame(draw) : 0;
    };

    const onClick = (event: MouseEvent) => {
      const now = performance.now();
      for (let i = 0; i < SPARK_COUNT; i += 1) {
        sparks.push({ x: event.clientX, y: event.clientY, angle: (2 * Math.PI * i) / SPARK_COUNT, start: now });
      }
      if (!frame) frame = requestAnimationFrame(draw);
    };

    resize();
    window.addEventListener('resize', resize);
    window.addEventListener('click', onClick);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', resize);
      window.removeEventListener('click', onClick);
    };
  }, [color]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[90] h-screen w-screen"
    />
  );
};

export default ClickSpark;
