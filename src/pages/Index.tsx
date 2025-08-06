import { useEffect } from 'react';
import Navigation from '@/components/Navigation';
import TerminalHero from '@/components/TerminalHero';
import AboutSection from '@/components/AboutSection';
import ProjectsSection from '@/components/ProjectsSection';
import TechStackSection from '@/components/TechStackSection';
import FairasSection from '@/components/FairasSection';
import ContactSection from '@/components/ContactSection';
import Footer from '@/components/Footer';
import ParticleField from '@/components/ParticleField';
import { useScrollReveal } from '@/hooks/useScrollReveal';

const Index = () => {
  useScrollReveal();

  useEffect(() => {
    // Smooth scrolling for anchor links
    document.documentElement.style.scrollBehavior = 'smooth';
    
    return () => {
      document.documentElement.style.scrollBehavior = 'auto';
    };
  }, []);

  return (
    <div className="min-h-screen bg-background relative">
      {/* Particle Field */}
      <ParticleField />
      
      {/* Background Effects */}
      <div className="fixed inset-0 -z-10 opacity-[0.05]">
        <div className="absolute top-0 left-0 w-full h-screen bg-gradient-to-br from-primary/20 to-transparent"></div>
        <div className="absolute top-1/4 right-0 w-96 h-96 bg-neon-violet/10 rounded-full blur-3xl animate-pulse-neon"></div>
        <div className="absolute bottom-1/4 left-0 w-96 h-96 bg-neon-green/10 rounded-full blur-3xl animate-pulse-neon"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent/5 rounded-full blur-3xl animate-float"></div>
      </div>
      
      <Navigation />
      
      <main>
        <div id="home">
          <TerminalHero />
        </div>
        
        <AboutSection />
        <ProjectsSection />
        <TechStackSection />
        <FairasSection />
        <ContactSection />
      </main>
      
      <Footer />
    </div>
  );
};

export default Index;
