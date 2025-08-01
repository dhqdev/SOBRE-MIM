import { useState, useEffect } from 'react';
import { Github, Linkedin, Mail, ExternalLink } from 'lucide-react';
import techHeroBg from '@/assets/tech-hero-bg.jpg';

const TerminalHero = () => {
  const [currentTitle, setCurrentTitle] = useState(0);
  const [isTyping, setIsTyping] = useState(true);

  const titles = [
    "Desenvolvedor Full-Stack",
    "Construtor de Ferramentas Cristãs", 
    "Hacker do Bem",
    "Tech Missionário"
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setIsTyping(false);
      setTimeout(() => {
        setCurrentTitle((prev) => (prev + 1) % titles.length);
        setIsTyping(true);
      }, 500);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <section className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-20"
        style={{
          backgroundImage: `url(${techHeroBg})`,
        }}
      />
      
      {/* Digital Rain Overlay */}
      <div className="absolute inset-0 digital-rain" />
      
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-background/90 via-background/70 to-background/90" />
      
      <div className="container mx-auto px-6 text-center relative z-10">
        {/* Terminal Window */}
        <div className="max-w-4xl mx-auto">
          {/* Terminal Header */}
          <div className="bg-card border border-border rounded-t-lg p-4 flex items-center gap-2">
            <div className="flex gap-2">
              <div className="w-3 h-3 rounded-full bg-destructive"></div>
              <div className="w-3 h-3 rounded-full bg-neon-yellow"></div>
              <div className="w-3 h-3 rounded-full bg-neon-green"></div>
            </div>
            <div className="flex-1 text-center text-sm text-muted-foreground font-mono">
              david@portfolio:~$
            </div>
          </div>

          {/* Terminal Content */}
          <div className="bg-card/95 backdrop-blur-sm border-x border-b border-border rounded-b-lg p-8 font-mono text-left">
            <div className="space-y-2 mb-8">
              <div className="flex items-center gap-2">
                <span className="terminal-prompt">$</span>
                <span className="text-foreground">whoami</span>
              </div>
              <div className="terminal-output ml-4">
                {'>'} david_fernandes@tekvosoft.dev
              </div>
              
              <div className="flex items-center gap-2 mt-4">
                <span className="terminal-prompt">$</span>
                <span className="text-foreground">mission</span>
              </div>
              <div className="terminal-output ml-4">
                {'>'} Codar com propósito. Viver com propósito.
              </div>

              <div className="flex items-center gap-2 mt-4">
                <span className="terminal-prompt">$</span>
                <span className="text-foreground">echo $ROLE</span>
              </div>
              <div className="terminal-output ml-4 min-h-[24px]">
                {'>'} {isTyping && (
                  <span className="inline-block">
                    {titles[currentTitle]}
                    <span className="animate-blink-caret">|</span>
                  </span>
                )}
              </div>
            </div>

            {/* Main Message */}
            <div className="text-center mb-8">
              <h1 className="text-4xl md:text-6xl font-bold mb-4">
                <span className="neon-glow">Código limpo.</span>
                <br />
                <span className="neon-glow-violet">Coração firme.</span>
                <br />
                <span className="text-neon-yellow">Soluções que importam.</span>
              </h1>
              
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Desenvolvedor Full-Stack cristão, criando ferramentas digitais que fazem a diferença no Reino e no mundo.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap justify-center gap-4">
              <a 
                href="https://linkedin.com/in/david-fernandes-dev" 
                target="_blank" 
                rel="noopener noreferrer"
                className="btn-neon flex items-center gap-2 group"
              >
                <Linkedin className="w-5 h-5 group-hover:animate-pulse" />
                LinkedIn
              </a>
              
              <a 
                href="https://github.com/dhqdev" 
                target="_blank" 
                rel="noopener noreferrer"
                className="btn-violet flex items-center gap-2 group"
              >
                <Github className="w-5 h-5 group-hover:animate-pulse" />
                GitHub
              </a>
              
              <a 
                href="https://wa.me/5519995378302" 
                target="_blank" 
                rel="noopener noreferrer"
                className="bg-neon-green text-background px-6 py-3 rounded-lg font-medium flex items-center gap-2 hover:bg-neon-green/90 transition-all duration-300 group"
              >
                <Mail className="w-5 h-5 group-hover:animate-pulse" />
                Fale comigo
              </a>
            </div>

            {/* Terminal Cursor */}
            <div className="mt-8 flex items-center gap-2">
              <span className="terminal-prompt">$</span>
              <span className="animate-blink-caret">_</span>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-float">
          <div className="w-6 h-10 border-2 border-primary rounded-full flex justify-center">
            <div className="w-1 h-3 bg-primary rounded-full mt-2 animate-pulse-neon"></div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TerminalHero;