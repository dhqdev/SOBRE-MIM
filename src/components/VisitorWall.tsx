import { useEffect, useState } from 'react';
import { GitCommitHorizontal } from 'lucide-react';
import SpotlightCard from './effects/SpotlightCard';
import AnimatedList from './effects/AnimatedList';
import { timeAgo } from '@/lib/github';
import { fetchPushes, onNewPush, type VisitorPush } from '@/lib/guestbook';

const scrollToTerminal = (event: React.MouseEvent<HTMLAnchorElement>) => {
  event.preventDefault();
  document.getElementById('home')?.scrollIntoView({ behavior: 'smooth' });
};

/**
 * Mural com os recados que os visitantes mandam pelo "git push" do terminal.
 * Se a API do mural não estiver configurada, a seção simplesmente não aparece.
 */
const VisitorWall = () => {
  const [pushes, setPushes] = useState<VisitorPush[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchPushes()
      .then((result) => !cancelled && setPushes(result))
      .catch(() => !cancelled && setFailed(true));
    const stop = onNewPush((push) => {
      setFailed(false);
      setPushes((current) => [push, ...(current ?? []).filter((item) => item.id !== push.id)]);
    });
    return () => {
      cancelled = true;
      stop();
    };
  }, []);

  if (failed || !pushes) return null;

  return (
    <div id="mural" className="scroll-mt-28 pt-4">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-1">
        <h3 className="text-sm font-medium text-foreground">
          Mural do git push <span className="text-muted-foreground">· {pushes.length} recados</span>
        </h3>
        <a
          href="#home"
          onClick={scrollToTerminal}
          className="text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          Deixe o seu no terminal lá em cima ↑
        </a>
      </div>

      {pushes.length === 0 ? (
        <SpotlightCard
          className="p-6 text-sm text-muted-foreground"
          spotlightColor="rgba(167, 139, 250, 0.08)"
        >
          Ninguém deu push ainda. Aperte <span className="font-mono text-accent">git push</span> no terminal e
          seja o primeiro.
        </SpotlightCard>
      ) : (
        <AnimatedList className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3" stagger={50}>
          {pushes.map((push) => (
            <SpotlightCard key={push.id} className="h-full p-5" spotlightColor="rgba(167, 139, 250, 0.08)">
              <p className="flex items-center gap-2 font-mono text-[11px] text-muted-foreground">
                <GitCommitHorizontal className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
                <span className="text-accent">{push.id}</span>
                <span aria-hidden="true">·</span>
                <span>{timeAgo(push.date)}</span>
              </p>
              <p className="mt-3 break-words text-[15px] leading-relaxed text-foreground">{push.message}</p>
              <p className="mt-3 break-words text-sm text-muted-foreground">— {push.name}</p>
            </SpotlightCard>
          ))}
        </AnimatedList>
      )}
    </div>
  );
};

export default VisitorWall;
