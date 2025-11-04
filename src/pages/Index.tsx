import { useEffect } from 'react';
import TerminalHero from '@/components/TerminalHero';
import AboutSection from '@/components/AboutSection';
import ProjectsSection from '@/components/ProjectsSection';
import TechStackSection from '@/components/TechStackSection';
import ContactSection from '@/components/ContactSection';
import Footer from '@/components/Footer';
import TargetCursor from '@/components/TargetCursor';
import Header from '@/components/Header';
import { useScrollReveal } from '@/hooks/useScrollReveal';

const Index = () => {
  useScrollReveal();

  useEffect(() => {
    document.documentElement.style.scrollBehavior = 'smooth';
    
    return () => {
      document.documentElement.style.scrollBehavior = 'auto';
    };
  }, []);

  return (
    <div className="min-h-screen bg-background relative">
      <TargetCursor spinDuration={2} hideDefaultCursor={true} />
      <Header />
      
      {/* Subtle background effects */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute top-0 left-0 w-full h-screen bg-gradient-to-br from-primary/5 to-transparent"></div>
        <div className="absolute top-1/4 right-0 w-96 h-96 bg-accent/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 left-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl"></div>
      </div>
      
      <main>
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
