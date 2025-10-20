import { useState, useEffect } from 'react';
import { Github, Linkedin } from 'lucide-react';

const TerminalHero = () => {
  const [displayedText, setDisplayedText] = useState('');
  const fullText = "Desenvolvedor Full-Stack";
  
  useEffect(() => {
    let currentIndex = 0;
    const interval = setInterval(() => {
      if (currentIndex <= fullText.length) {
        setDisplayedText(fullText.slice(0, currentIndex));
        currentIndex++;
      } else {
        clearInterval(interval);
      }
    }, 100);

    return () => clearInterval(interval);
  }, []);

  return (
    <section className="min-h-[85vh] flex items-center justify-center relative overflow-hidden pt-20">
      {/* Subtle background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-card/30" />
      
      <div className="container mx-auto px-6 text-center relative z-10">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Main Content */}
          <div className="space-y-6">
            <h1 className="text-5xl md:text-7xl font-bold">
              <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                David Fernandes
              </span>
            </h1>
            
            <div className="h-12 flex items-center justify-center">
              <p className="text-2xl md:text-3xl text-muted-foreground font-mono">
                {displayedText}
                <span className="animate-pulse">|</span>
              </p>
            </div>

            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              💻 Transformando ideias em código.
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-wrap justify-center gap-4 pt-8">
            <a 
              href="#contato"
              className="cursor-target px-8 py-4 bg-primary text-primary-foreground rounded-lg font-semibold hover:shadow-lg hover:shadow-primary/50 transition-all duration-300 hover:-translate-y-1"
            >
              Ver Portfólio
            </a>
            
            <a 
              href="https://www.linkedin.com/in/david-fernandes-77a663229/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="cursor-target px-8 py-4 border-2 border-primary text-primary rounded-lg font-semibold hover:bg-primary hover:text-primary-foreground transition-all duration-300 flex items-center gap-2"
            >
              <Linkedin className="w-5 h-5" />
              LinkedIn
            </a>
            
            <a 
              href="https://github.com/dhqdev" 
              target="_blank" 
              rel="noopener noreferrer"
              className="cursor-target px-8 py-4 border-2 border-accent text-accent rounded-lg font-semibold hover:bg-accent hover:text-accent-foreground transition-all duration-300 flex items-center gap-2"
            >
              <Github className="w-5 h-5" />
              GitHub
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TerminalHero;