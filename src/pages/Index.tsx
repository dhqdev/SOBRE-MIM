import { useEffect } from 'react';
import TerminalHero from '@/components/TerminalHero';
import AboutSection from '@/components/AboutSection';
import ProjectsSection from '@/components/ProjectsSection';
import TechStackSection from '@/components/TechStackSection';
import ContactSection from '@/components/ContactSection';
import Footer from '@/components/Footer';
import TargetCursor from '@/components/TargetCursor';
import DownloadCV from '@/components/DownloadCV';
import Iridescence from '@/components/Iridescence';
import { useScrollReveal } from '@/hooks/useScrollReveal';

interface IndexProps {
  isMenuOpen?: boolean;
}

const Index = ({ isMenuOpen = false }: IndexProps) => {
  useScrollReveal();

  useEffect(() => {
    document.documentElement.style.scrollBehavior = 'smooth';
    
    return () => {
      document.documentElement.style.scrollBehavior = 'auto';
    };
  }, []);

  return (
    <div className="min-h-screen bg-background relative overflow-x-hidden">
      <TargetCursor spinDuration={2} hideDefaultCursor={true} />
      <DownloadCV isMenuOpen={isMenuOpen} />
      
      {/* Iridescence animated background */}
      <div className="fixed inset-0 w-screen h-screen" style={{ zIndex: 0 }}>
        <Iridescence
          color={[0.3, 0.95, 0.95]}
          mouseReact={true}
          amplitude={0.2}
          speed={0.6}
        />
      </div>
      
      {/* Overlay gradient for better readability - ajustado para mobile */}
      <div className="fixed inset-0 bg-gradient-to-b from-background/80 via-background/60 to-background/80 md:from-background/70 md:via-background/50 md:to-background/70 pointer-events-none" style={{ zIndex: 1 }}></div>
      
      <main className="relative" style={{ zIndex: 2 }}>
        <div id="home">
          <TerminalHero />
        </div>
        
        {/* Formulário de contato separado (apenas mobile) */}
        <ContactSection />
        
        {/* Projetos */}
        <div id="projetos">
          <ProjectsSection />
        </div>
        
        <AboutSection />
        <TechStackSection />
      </main>
      
      <Footer />
    </div>
  );
};

export default Index;
