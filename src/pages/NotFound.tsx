import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Terminal } from 'lucide-react';

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error('Erro 404: rota inexistente acessada:', location.pathname);
  }, [location.pathname]);

  return (
    <main className="min-h-screen flex items-center justify-center bg-background px-6">
      <div className="text-center max-w-lg">
        <div className="inline-flex items-center gap-2 px-4 py-2 mb-8 rounded-full border border-primary/30 bg-primary/5 font-mono text-sm text-muted-foreground">
          <Terminal className="w-4 h-4 text-primary" aria-hidden="true" />
          <span>
            cd {location.pathname} → <span className="text-destructive">no such file or directory</span>
          </span>
        </div>

        <h1 className="text-7xl md:text-8xl font-bold mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          404
        </h1>

        <p className="text-xl text-foreground mb-3">Essa página não existe.</p>
        <p className="text-muted-foreground mb-10">
          O link pode estar quebrado ou a página foi movida. Que tal voltar ao início e dar uma
          olhada nos projetos?
        </p>

        <Link
          to="/"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground font-semibold transition-transform duration-300 hover:-translate-y-0.5"
        >
          <Home className="w-4 h-4" aria-hidden="true" />
          Voltar para o início
        </Link>
      </div>
    </main>
  );
};

export default NotFound;
