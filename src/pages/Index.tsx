import { useState } from 'react';
import TerminalHero from '@/components/TerminalHero';
import AboutSection from '@/components/AboutSection';
import ProjectsSection from '@/components/ProjectsSection';
import TechStackSection from '@/components/TechStackSection';
import Footer from '@/components/Footer';
import TargetCursor from '@/components/TargetCursor';
import DownloadCV from '@/components/DownloadCV';
import Iridescence from '@/components/Iridescence';
import { HamburgerMenu } from '@/components/HamburgerMenu';
import ErrorBoundary from '@/components/ErrorBoundary';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';

// Fora do componente: um literal inline viraria um array novo a cada render e
// forçaria o Iridescence a recriar o contexto WebGL.
const IRIDESCENCE_COLOR: [number, number, number] = [0.3, 0.95, 0.95];

const Index = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const prefersReducedMotion = usePrefersReducedMotion();

  useScrollReveal();

  return (
    <div className="min-h-screen bg-background relative overflow-x-hidden">
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:rounded-lg focus:bg-primary focus:text-primary-foreground focus:font-semibold"
      >
        Pular para o conteúdo
      </a>

      {/* Enfeites: se algum quebrar, a página continua de pé sem eles. */}
      <ErrorBoundary>
        {!prefersReducedMotion && <TargetCursor spinDuration={2} hideDefaultCursor={true} />}
      </ErrorBoundary>

      <HamburgerMenu onMenuStateChange={setIsMenuOpen} />
      <DownloadCV isMenuOpen={isMenuOpen} />

      {/* Fundo animado (WebGL). Sem GPU disponível ou com "reduzir movimento"
          ativo, o gradiente estático do CSS assume sozinho. */}
      <div className="fixed inset-0 w-screen h-screen" style={{ zIndex: 0 }}>
        <ErrorBoundary>
          <Iridescence
            color={IRIDESCENCE_COLOR}
            mouseReact={true}
            amplitude={0.2}
            speed={0.6}
          />
        </ErrorBoundary>
      </div>

      {/* Camada de contraste, para o texto continuar legível sobre o fundo */}
      <div
        className="fixed inset-0 bg-gradient-to-b from-background/80 via-background/60 to-background/80 md:from-background/70 md:via-background/50 md:to-background/70 pointer-events-none"
        style={{ zIndex: 1 }}
      />

      <main id="conteudo" className="relative" style={{ zIndex: 2 }}>
        <div id="home">
          <TerminalHero />
        </div>

        <ProjectsSection />
        <AboutSection />
        <TechStackSection />
      </main>

      <Footer />
    </div>
  );
};

export default Index;
