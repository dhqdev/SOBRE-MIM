import { useState, useEffect } from 'react';
import ContactSection from './ContactSection';
import LinkedInTooltip from './LinkedInTooltip';
import GitHubTooltip from './GitHubTooltip';
import { Code2, Briefcase, Rocket, Terminal, ChevronDown } from 'lucide-react';
import davidProfile from '@/assets/david-profile.jpg';

const TerminalHero = () => {
  const [displayedText, setDisplayedText] = useState('');
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);
  const phrases = [
    "Desenvolvedor Full-Stack",
    "Especialista em Vue & React",
    "Automação & Integração",
    "Frappe Framework"
  ];
  
  useEffect(() => {
    let currentIndex = 0;
    const currentPhrase = phrases[currentPhraseIndex];
    
    const typeInterval = setInterval(() => {
      if (currentIndex <= currentPhrase.length) {
        setDisplayedText(currentPhrase.slice(0, currentIndex));
        currentIndex++;
      } else {
        clearInterval(typeInterval);
        // Wait 2 seconds then start erasing
        setTimeout(() => {
          let eraseIndex = currentPhrase.length;
          const eraseInterval = setInterval(() => {
            if (eraseIndex > 0) {
              eraseIndex--;
              setDisplayedText(currentPhrase.slice(0, eraseIndex));
            } else {
              clearInterval(eraseInterval);
              setCurrentPhraseIndex((prev) => (prev + 1) % phrases.length);
            }
          }, 50);
        }, 2000);
      }
    }, 80);

    return () => clearInterval(typeInterval);
  }, [currentPhraseIndex]);

  const stats = [
    { icon: Code2, value: "2+", label: "Anos de XP" },
    { icon: Briefcase, value: "10+", label: "Projetos" },
    { icon: Rocket, value: "5+", label: "Tecnologias" },
  ];

  const scrollToProjects = () => {
    document.getElementById('projetos')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="min-h-screen flex items-center justify-center relative overflow-visible">
      {/* Decorative elements */}
      <div className="absolute top-20 left-10 w-32 h-32 bg-primary/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-20 right-10 w-40 h-40 bg-accent/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      <div className="absolute top-1/2 left-1/4 w-24 h-24 bg-neon-green/5 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '0.5s' }} />
      
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-card/30" />
      <div className="absolute left-0 right-0 -bottom-80 h-[32rem] bg-gradient-to-b from-card/30 via-card/15 to-transparent" />
      
      <div className="container mx-auto px-4 md:px-6 relative z-10 py-20 lg:py-0">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center max-w-7xl mx-auto">
          
          {/* Left Column: Main Content */}
          <div className="text-center lg:text-left space-y-8">
            {/* Status Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/30 bg-primary/5 backdrop-blur-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-neon-green opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-neon-green"></span>
              </span>
              <span className="text-sm text-muted-foreground font-mono">Disponível para projetos</span>
            </div>

            {/* Profile Photo - Mobile Only */}
            <div className="lg:hidden flex justify-center">
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-primary via-accent to-primary rounded-full blur-md opacity-60 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative w-32 h-32 rounded-full overflow-hidden border-2 border-primary/50">
                  <img
                    src={davidProfile}
                    alt="David Fernandes"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </div>

            {/* Terminal-style intro */}
            <div className="hidden lg:block font-mono text-sm text-muted-foreground">
              <span className="text-neon-green">david@portfolio</span>
              <span className="text-muted-foreground">:</span>
              <span className="text-primary">~</span>
              <span className="text-muted-foreground">$ </span>
              <span className="text-foreground">whoami</span>
            </div>

            {/* Main Heading */}
            <div className="space-y-4">
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-tight tracking-tight">
                <span className="block text-foreground">Olá, eu sou</span>
                <span className="block bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient">
                  David Fernandes
                </span>
              </h1>
              
              {/* Typing Animation */}
              <div className="h-10 md:h-12 flex items-center justify-center lg:justify-start">
                <Terminal className="w-5 h-5 text-primary mr-2 hidden sm:block" />
                <p className="text-lg sm:text-xl md:text-2xl text-muted-foreground font-mono">
                  {displayedText}
                  <span className="animate-pulse text-primary">|</span>
                </p>
              </div>
            </div>

            {/* Description */}
            <p className="text-base md:text-lg text-muted-foreground max-w-xl mx-auto lg:mx-0 leading-relaxed">
              Transformando <span className="text-primary font-medium">ideias</span> em soluções digitais. 
              Especializado em criar aplicações web modernas, 
              sistemas de automação e integrações que fazem a diferença.
            </p>

            {/* Stats */}
            <div className="flex justify-center lg:justify-start gap-6 md:gap-10 pt-4">
              {stats.map((stat, index) => (
                <div 
                  key={index}
                  className="text-center group cursor-default"
                >
                  <div className="flex items-center justify-center mb-2">
                    <stat.icon className="w-5 h-5 text-primary mr-2 opacity-60 group-hover:opacity-100 transition-opacity" />
                    <span className="text-2xl md:text-3xl font-bold text-foreground group-hover:text-primary transition-colors">
                      {stat.value}
                    </span>
                  </div>
                  <span className="text-xs md:text-sm text-muted-foreground font-medium">
                    {stat.label}
                  </span>
                </div>
              ))}
            </div>

            {/* Social Buttons */}
            <div className="flex flex-wrap justify-center lg:justify-start gap-6 pt-6 items-center">
              <LinkedInTooltip />
              <GitHubTooltip />
            </div>

            {/* Scroll indicator - desktop only */}
            <div className="hidden lg:flex justify-start pt-8">
              <button 
                onClick={scrollToProjects}
                className="flex flex-col items-center gap-2 text-muted-foreground hover:text-primary transition-colors cursor-target"
              >
                <span className="text-sm font-mono">Ver projetos</span>
                <ChevronDown className="w-5 h-5 animate-bounce" />
              </button>
            </div>
          </div>

          {/* Right Column: Contact Form & Profile (Desktop) */}
          <div className="hidden lg:block">
            {/* Profile Photo - Desktop */}
            <div className="flex justify-center mb-8">
              <div className="relative group">
                <div className="absolute -inset-2 bg-gradient-to-r from-primary via-accent to-primary rounded-2xl blur-lg opacity-40 group-hover:opacity-70 transition-opacity duration-500 animate-pulse" />
                <div className="relative">
                  <div className="w-40 h-40 rounded-2xl overflow-hidden border-2 border-primary/30 shadow-2xl transform rotate-3 group-hover:rotate-0 transition-transform duration-500">
                    <img
                      src={davidProfile}
                      alt="David Fernandes"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  {/* Floating badge */}
                  <div className="absolute -bottom-3 -right-3 bg-card border border-primary/30 rounded-lg px-3 py-1.5 shadow-lg">
                    <span className="text-xs font-mono text-primary">GRV Software</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Contact Form */}
            <ContactSection isInHero={true} />
          </div>
        </div>
      </div>
    </section>
  );
};

export default TerminalHero;
