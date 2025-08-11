import { useEffect } from 'react';
import Navigation from '@/components/Navigation';
import TerminalHero from '@/components/TerminalHero';
import AboutSection from '@/components/AboutSection';
import ProjectsSection from '@/components/ProjectsSection';
import TechStackSection from '@/components/TechStackSection';
import NubankExperienceSection from '@/components/NubankExperienceSection';

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
      
      {/* Background Effects with Personal Images */}
      <div className="fixed inset-0 -z-10 opacity-[0.05]">
        <div className="absolute top-0 left-0 w-full h-screen bg-gradient-to-br from-primary/20 to-transparent"></div>
        <div className="absolute top-1/4 right-0 w-96 h-96 bg-neon-violet/10 rounded-full blur-3xl animate-pulse-neon"></div>
        <div className="absolute bottom-1/4 left-0 w-96 h-96 bg-neon-green/10 rounded-full blur-3xl animate-pulse-neon"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent/5 rounded-full blur-3xl animate-float"></div>
        
        {/* Personal Background Images */}
        <div className="absolute top-10 right-10 w-80 h-60 opacity-[0.03] rotate-12 overflow-hidden rounded-lg">
          <img src="/lovable-uploads/824fad5f-9f3f-40ae-9b06-de5f253f2c42.png" alt="" className="w-full h-full object-cover blur-sm" />
        </div>
        <div className="absolute top-1/3 left-5 w-64 h-48 opacity-[0.04] -rotate-6 overflow-hidden rounded-lg">
          <img src="/lovable-uploads/d3c4c710-8a83-49a9-8d60-fbb658ad91d9.png" alt="" className="w-full h-full object-cover blur-sm" />
        </div>
        <div className="absolute bottom-20 right-1/4 w-72 h-54 opacity-[0.03] rotate-3 overflow-hidden rounded-lg">
          <img src="/lovable-uploads/1997c13f-e864-4e78-a5ed-bda3f90c503d.png" alt="" className="w-full h-full object-cover blur-sm" />
        </div>
        <div className="absolute top-2/3 right-20 w-60 h-80 opacity-[0.04] -rotate-12 overflow-hidden rounded-lg">
          <img src="/lovable-uploads/de807c02-9c26-4319-9a39-061fa78b4abb.png" alt="" className="w-full h-full object-cover blur-sm" />
        </div>
        <div className="absolute bottom-1/3 left-1/4 w-56 h-72 opacity-[0.03] rotate-6 overflow-hidden rounded-lg">
          <img src="/lovable-uploads/f167843c-2c45-4eb6-9c9d-090a66f6e603.png" alt="" className="w-full h-full object-cover blur-sm" />
        </div>
        <div className="absolute top-1/2 left-10 w-48 h-64 opacity-[0.04] -rotate-3 overflow-hidden rounded-lg">
          <img src="/lovable-uploads/6e3f3f43-8a98-4913-848e-6d7641d837f7.png" alt="" className="w-full h-full object-cover blur-sm" />
        </div>
        <div className="absolute bottom-10 left-1/3 w-40 h-56 opacity-[0.03] rotate-9 overflow-hidden rounded-lg">
          <img src="/lovable-uploads/d486ddbd-9aac-46d0-8c76-10ca539af0a3.png" alt="" className="w-full h-full object-cover blur-sm" />
        </div>
      </div>
      
      <Navigation />
      
      <main>
        <div id="home">
          <TerminalHero />
        </div>
        
        <AboutSection />
        <ProjectsSection />
        <TechStackSection />
        <NubankExperienceSection />
        <ContactSection />
      </main>
      
      <Footer />
    </div>
  );
};

export default Index;
