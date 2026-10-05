import { useInView } from '@/hooks/useInView';
import { SIGNATURE } from '@/lib/signature';

/** Tempo total pra "escrever" a assinatura, dividido entre os traços. */
const DRAW_MS = 2600;

/**
 * A assinatura do David se escrevendo sozinha quando o rodapé aparece: cada
 * traço tem o contorno desenhado em sequência (stroke-dashoffset) e, no fim,
 * a tinta preenche tudo.
 */
const Signature = ({ className = '' }: { className?: string }) => {
  const [ref, inView] = useInView<HTMLDivElement>(0.4);
  const step = DRAW_MS / SIGNATURE.paths.length;

  return (
    <div ref={ref} className={className}>
      <svg
        viewBox={`0 0 ${SIGNATURE.width} ${SIGNATURE.height}`}
        className={`signature h-auto w-full overflow-visible text-accent ${inView ? 'is-drawn' : ''}`}
        role="img"
        aria-label="Assinatura de David Fernandes"
      >
        {SIGNATURE.paths.map((d, index) => (
          <path
            key={index}
            d={d}
            pathLength={1}
            style={
              {
                '--stroke-delay': `${index * step}ms`,
                '--stroke-duration': `${Math.max(step * 2.2, 260)}ms`,
                '--fill-delay': `${DRAW_MS}ms`,
              } as React.CSSProperties
            }
          />
        ))}
      </svg>
    </div>
  );
};

export default Signature;
