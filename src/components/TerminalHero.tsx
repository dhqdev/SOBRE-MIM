import { useState, useEffect } from 'react';
import ContactSection from './ContactSection';
import LinkedInTooltip from './LinkedInTooltip';
import GitHubTooltip from './GitHubTooltip';

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
    <section className="min-h-[90vh] flex items-center justify-center relative overflow-hidden pt-20 pb-10">
      {/* Subtle background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-card/30" />
      
      <div className="container mx-auto px-6 relative z-10">
        {/* Layout em grid: conteúdo à esquerda, formulário à direita (desktop) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center max-w-7xl mx-auto">
          {/* Coluna Esquerda: Conteúdo Principal */}
          <div className="text-center lg:text-left space-y-10">
            {/* Main Content */}
            <div className="space-y-8">
              <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold">
                <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                  David Fernandes
                </span>
              </h1>
              
              <div className="h-16 flex items-center justify-center lg:justify-start">
                <p className="text-2xl md:text-3xl lg:text-4xl text-muted-foreground font-mono">
                  {displayedText}
                  <span className="animate-pulse">|</span>
                </p>
              </div>

              <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                💻 Transformando ideias em código.
              </p>
            </div>

            {/* Social Buttons */}
            <div className="flex flex-wrap justify-center lg:justify-start gap-12 pt-12 items-center">
              <LinkedInTooltip />
              
              <GitHubTooltip />
            </div>
          </div>

          {/* Coluna Direita: Formulário (visível apenas no desktop) */}
          <div className="hidden lg:block">
            <ContactSection isInHero={true} />
          </div>
        </div>
      </div>
    </section>
  );
};

export default TerminalHero;