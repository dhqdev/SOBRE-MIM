import { Heart, Code2, Cross } from 'lucide-react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative py-12 border-t border-border/50">
      <div className="container mx-auto px-6">
        <div className="max-w-4xl mx-auto">
          {/* Main Footer Content */}
          <div className="text-center space-y-6">
            {/* Logo and Tagline */}
            <div className="flex flex-col items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-primary/10 border border-primary/30">
                  <Code2 className="w-6 h-6 text-primary" />
                </div>
                <span className="font-mono font-bold text-xl text-foreground">
                  david<span className="text-primary">.</span>dev
                </span>
              </div>
              
              <p className="text-muted-foreground max-w-2xl">
                Desenvolvedor Full-Stack cristão, criando soluções digitais que fazem a diferença 
                no Reino e transformam vidas através da tecnologia.
              </p>
            </div>

            {/* Bible Verse */}
            <div className="portfolio-card max-w-2xl mx-auto">
              <blockquote className="text-lg italic text-primary mb-2">
                "Servi uns aos outros, cada um conforme o dom que recebeu, 
                como bons despenseiros da multiforme graça de Deus."
              </blockquote>
              <cite className="text-sm text-muted-foreground">
                1 Pedro 4:10
              </cite>
            </div>

            {/* Links */}
            <div className="flex flex-wrap justify-center gap-6 text-sm">
              <a 
                href="#sobre" 
                className="text-muted-foreground hover:text-primary transition-colors duration-300"
              >
                Sobre
              </a>
              <a 
                href="#projetos" 
                className="text-muted-foreground hover:text-primary transition-colors duration-300"
              >
                Projetos
              </a>
              <a 
                href="#tecnologias" 
                className="text-muted-foreground hover:text-primary transition-colors duration-300"
              >
                Tecnologias
              </a>
              <a 
                href="#contato" 
                className="text-muted-foreground hover:text-primary transition-colors duration-300"
              >
                Contato
              </a>
            </div>

            {/* Divider */}
            <div className="w-full h-px bg-gradient-to-r from-transparent via-border to-transparent"></div>

            {/* Copyright */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <span>© {currentYear} David Fernandes</span>
                <span>•</span>
                <span>Todos os direitos reservados</span>
              </div>
              
              <div className="flex items-center gap-2">
                <span>✨ Desenvolvido por</span>
                <span className="text-primary font-semibold">David Fernandes</span>
                <span>|</span>
                <span>Powered by</span>
                <div className="flex items-center gap-1">
                  <Cross className="w-4 h-4 text-neon-yellow" />
                  <span className="text-neon-yellow font-semibold">Jesus</span>
                </div>
                <span>&</span>
                <span className="text-neon-violet font-semibold">JavaScript™</span>
              </div>
            </div>

            {/* Fun Terminal Line */}
            <div className="font-mono text-xs text-muted-foreground bg-card/50 border border-border/30 rounded-lg p-3 max-w-md mx-auto">
              <span className="text-neon-green">$</span>{' '}
              <span className="text-foreground">echo</span>{' '}
              <span className="text-primary">"Feito com</span>{' '}
              <Heart className="w-3 h-3 inline text-red-500" />{' '}
              <span className="text-primary">e muito ☕"</span>
            </div>
          </div>
        </div>
      </div>

      {/* Background Effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute bottom-0 left-1/4 w-px h-20 bg-gradient-to-t from-primary/30 to-transparent"></div>
        <div className="absolute bottom-0 right-1/4 w-px h-16 bg-gradient-to-t from-accent/30 to-transparent"></div>
        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-20 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent"></div>
      </div>
    </footer>
  );
};

export default Footer;