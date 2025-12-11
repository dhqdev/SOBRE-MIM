import { useState, useEffect } from 'react';
import ContactSection from './ContactSection';
import LinkedInTooltip from './LinkedInTooltip';
import GitHubTooltip from './GitHubTooltip';
import { Code2, Briefcase, Rocket, Terminal } from 'lucide-react';
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
    <section className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Sophisticated background */}
      <div className="absolute inset-0">
        {/* Mesh gradient orbs */}
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[150px] animate-pulse" />
        <div className="absolute top-1/3 right-0 w-[600px] h-[600px] bg-accent/15 rounded-full blur-[180px] animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-neon-green/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '0.5s' }} />
        <div className="absolute top-1/2 right-1/4 w-[300px] h-[300px] bg-primary/15 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1.5s' }} />
        
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `linear-gradient(hsl(var(--primary)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)`,
          backgroundSize: '60px 60px'
        }} />
        
        {/* Radial vignette */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,hsl(var(--background))_70%)]" />
        
        {/* Scan lines effect */}
        <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, hsl(var(--foreground)) 2px, hsl(var(--foreground)) 4px)',
        }} />
      </div>
      
      <div className="container mx-auto px-4 md:px-6 relative z-10 py-16 sm:py-20 lg:py-0">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-10 lg:gap-16 items-center max-w-7xl mx-auto">
          
          {/* Left Column: Main Content */}
          <div className="text-center lg:text-left space-y-5 sm:space-y-6 lg:space-y-8">
            {/* Status Badge */}
            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-primary/30 bg-primary/5 backdrop-blur-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-neon-green opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-neon-green"></span>
              </span>
              <span className="text-base text-muted-foreground font-mono">Disponível para projetos</span>
            </div>

            {/* Profile Photo - Mobile Only */}
            <div className="lg:hidden flex justify-center">
              <div className="relative group">
                <div className="absolute -inset-2 bg-gradient-to-r from-primary via-accent to-primary rounded-full blur-xl opacity-50" />
                
                {/* Floating Emojis - Mobile */}
                <div className="absolute -left-6 top-2 text-2xl animate-emoji-float-1 cursor-default">💻</div>
                <div className="absolute -right-6 top-4 text-xl animate-emoji-float-2 cursor-default">⚡</div>
                <div className="absolute -left-5 bottom-8 text-xl animate-emoji-float-3 cursor-default">🚀</div>
                <div className="absolute -right-5 bottom-10 text-2xl animate-emoji-float-4 cursor-default">✨</div>
                <div className="absolute left-2 -top-2 text-xl animate-emoji-float-5 cursor-default">🎯</div>
                
                <div className="relative w-28 h-28 sm:w-36 sm:h-36 rounded-full overflow-hidden border-2 border-primary/50 shadow-2xl">
                  <img
                    src={davidProfile}
                    alt="David Fernandes"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </div>

            {/* Terminal-style intro */}
            <div className="hidden lg:block font-mono text-base text-muted-foreground">
              <span className="text-neon-green">david@portfolio</span>
              <span className="text-muted-foreground">:</span>
              <span className="text-primary">~</span>
              <span className="text-muted-foreground">$ </span>
              <span className="text-foreground">whoami</span>
            </div>

            {/* Main Heading */}
            <div className="space-y-3 sm:space-y-4">
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold leading-tight tracking-tight">
                <span className="block text-foreground">Olá, eu sou</span>
                <span className="block bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient">
                  David Fernandes
                </span>
              </h1>
              
              {/* Typing Animation */}
              <div className="h-8 sm:h-10 md:h-12 flex items-center justify-center lg:justify-start">
                <Terminal className="w-4 h-4 sm:w-5 sm:h-5 text-primary mr-2 hidden sm:block" />
                <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-muted-foreground font-mono">
                  {displayedText}
                  <span className="animate-pulse text-primary">|</span>
                </p>
              </div>
            </div>

            {/* Description */}
            <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-xl mx-auto lg:mx-0 leading-relaxed px-2 sm:px-0">
              Transformando <span className="text-primary font-medium">ideias</span> em soluções digitais. 
              Especializado em criar aplicações web modernas, 
              sistemas de automação e integrações que fazem a diferença.
            </p>

            {/* Stats */}
            <div className="flex justify-center lg:justify-start gap-4 sm:gap-6 md:gap-8 pt-2 sm:pt-4">
              {stats.map((stat, index) => (
                <div 
                  key={index}
                  className="text-center group cursor-default"
                >
                  <div className="flex items-center justify-center mb-2">
                    <stat.icon className="w-5 h-5 sm:w-6 sm:h-6 text-primary mr-2 opacity-60 group-hover:opacity-100 transition-opacity" />
                    <span className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground group-hover:text-primary transition-colors">
                      {stat.value}
                    </span>
                  </div>
                  <span className="text-xs sm:text-sm md:text-base text-muted-foreground font-medium">
                    {stat.label}
                  </span>
                </div>
              ))}
            </div>

            {/* Social Buttons */}
            <div className="flex flex-wrap justify-center lg:justify-start gap-4 sm:gap-6 pt-4 sm:pt-6 items-center">
              <LinkedInTooltip />
              <GitHubTooltip />
            </div>
          </div>

          {/* Right Column: Contact Form & Profile (Desktop) */}
          <div className="hidden lg:block">
            {/* Profile Photo - Desktop */}
            <div className="flex justify-center mb-4 -mt-8">
              <div className="relative group">
                <div className="absolute -inset-2 bg-gradient-to-r from-primary via-accent to-primary rounded-2xl blur-lg opacity-40 group-hover:opacity-70 transition-opacity duration-500 animate-pulse" />
                
                {/* Floating Emojis */}
                <div className="absolute -left-8 top-4 text-3xl animate-emoji-float-1 cursor-default hover:scale-125 transition-transform">💻</div>
                <div className="absolute -right-8 top-8 text-2xl animate-emoji-float-2 cursor-default hover:scale-125 transition-transform">⚡</div>
                <div className="absolute -left-6 bottom-12 text-2xl animate-emoji-float-3 cursor-default hover:scale-125 transition-transform">🚀</div>
                <div className="absolute -right-6 bottom-16 text-3xl animate-emoji-float-4 cursor-default hover:scale-125 transition-transform">✨</div>
                <div className="absolute left-4 -top-4 text-2xl animate-emoji-float-5 cursor-default hover:scale-125 transition-transform">🎯</div>
                
                <div className="relative">
                  <div className="w-56 h-56 rounded-2xl overflow-hidden border-2 border-primary/30 shadow-2xl transform rotate-3 group-hover:rotate-0 transition-transform duration-500">
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
