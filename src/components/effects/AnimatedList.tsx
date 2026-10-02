import { useInView } from '@/hooks/useInView';

interface AnimatedListProps {
  children: React.ReactNode[];
  className?: string;
  /** Atraso entre um item e o próximo, em ms. */
  stagger?: number;
}

/**
 * Inspirado no "Animated List" do React Bits: os itens entram um depois do
 * outro, subindo e saindo do desfoque. Funciona com conteúdo que chega depois
 * (ex.: dados da API do GitHub), porque cada lista observa a si mesma.
 */
const AnimatedList = ({ children, className = '', stagger = 70 }: AnimatedListProps) => {
  const [ref, inView] = useInView<HTMLUListElement>(0.1);

  return (
    <ul ref={ref} className={`list-none p-0 ${className}`}>
      {children.map((child, index) => (
        <li
          key={index}
          style={{
            opacity: inView ? 1 : 0,
            transform: inView ? 'none' : 'translateY(14px) scale(0.98)',
            filter: inView ? 'none' : 'blur(6px)',
            transition:
              'opacity 0.6s cubic-bezier(0.22,1,0.36,1), transform 0.6s cubic-bezier(0.22,1,0.36,1), filter 0.6s cubic-bezier(0.22,1,0.36,1)',
            transitionDelay: `${index * stagger}ms`,
          }}
        >
          {child}
        </li>
      ))}
    </ul>
  );
};

export default AnimatedList;
