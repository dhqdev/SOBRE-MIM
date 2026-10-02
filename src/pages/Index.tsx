import { useCallback, useState } from 'react';
import TerminalHero from '@/components/TerminalHero';
import AboutSection from '@/components/AboutSection';
import ProjectsSection from '@/components/ProjectsSection';
import TechStackSection from '@/components/TechStackSection';
import Footer from '@/components/Footer';
import Navbar from '@/components/Navbar';
import ExperiencesPanel from '@/components/ExperiencesPanel';
import ErrorBoundary from '@/components/ErrorBoundary';
import DotGrid from '@/components/effects/DotGrid';
import { useScrollReveal } from '@/hooks/useScrollReveal';

const Index = () => {
  const [isExperiencesOpen, setIsExperiencesOpen] = useState(false);

  useScrollReveal();

  const openExperiences = useCallback(() => setIsExperiencesOpen(true), []);
  const closeExperiences = useCallback(() => setIsExperiencesOpen(false), []);

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-background">
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:rounded-lg focus:bg-foreground focus:text-background focus:font-medium"
      >
        Pular para o conteúdo
      </a>

      {/* Fundo: grade de pontos que acende perto do cursor, sumindo nas
          bordas. Se quebrar, a página continua de pé sem ela. */}
      <div
        className="pointer-events-none fixed inset-0 z-0 [mask-image:radial-gradient(ellipse_at_top,black_10%,transparent_70%)]"
        aria-hidden="true"
      >
        <ErrorBoundary>
          <DotGrid />
        </ErrorBoundary>
      </div>
      {/* Luz suave no topo */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 z-0 h-[600px] bg-[radial-gradient(ellipse_60%_50%_at_50%_-10%,rgba(110,231,183,0.08),transparent)]"
        aria-hidden="true"
      />

      <Navbar onOpenExperiences={openExperiences} />
      <ExperiencesPanel isOpen={isExperiencesOpen} onClose={closeExperiences} />

      <main id="conteudo" className="relative z-[2]">
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
