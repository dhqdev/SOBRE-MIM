import { useState } from 'react';
import { ExternalLink, Heart } from 'lucide-react';
import styled from 'styled-components';

interface HamburgerMenuProps {
  onMenuStateChange?: (isOpen: boolean) => void;
}

export const HamburgerMenu = ({ onMenuStateChange }: HamburgerMenuProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [key, setKey] = useState(0);

  const toggleMenu = () => {
    const newState = !isOpen;
    setIsOpen(newState);
    setKey(prev => prev + 1);
    
    // Previne scroll da página quando o modal está aberto
    if (newState) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    
    if (onMenuStateChange) {
      onMenuStateChange(newState);
    }
  };

  return (
    <>
      {/* Animated Button */}
      <StyledWrapper>
        <button 
          key={key}
          className={`button type1 cursor-target ${isOpen ? 'active' : ''}`}
          onClick={toggleMenu}
          aria-label="Experiências"
        />
      </StyledWrapper>

      {/* Overlay */}
      <div
        className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity duration-500 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={toggleMenu}
      />

      {/* Sliding Menu Panel */}
      <div
        className={`fixed top-0 right-0 h-full w-full md:w-[500px] bg-gradient-to-br from-black/95 via-purple-950/30 to-black/95 backdrop-blur-xl border-l border-white/10 z-50 transition-transform duration-500 ease-out overflow-hidden ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        onClick={(e) => e.stopPropagation()}
        onWheel={(e) => e.stopPropagation()}
      >
        <div 
          className="h-full overflow-y-auto overflow-x-hidden overscroll-contain scrollbar-thin scrollbar-thumb-purple-500/50 scrollbar-track-transparent" 
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {/* Header */}
          <div className="p-6 md:p-8 pt-20 pb-4">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-2 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Experiências
            </h2>
            <div className="h-1 w-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full" />
          </div>

          {/* Scrollable content */}
          <div className="px-6 md:px-8 pb-8 space-y-6">
            {/* Nubank Experience Card */}
            <div className="group relative bg-gradient-to-br from-purple-900/40 to-black/40 rounded-2xl overflow-hidden border border-purple-500/20 hover:border-purple-500/40 transition-all duration-500">
              {/* Purple accent line */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500" />
              
              {/* Large Logo at top */}
              <div className="relative w-full aspect-video bg-gradient-to-br from-purple-950/50 to-black/50 p-8 flex items-center justify-center overflow-hidden">
                <img 
                  src="/lovable-uploads/nubank.png" 
                  alt="Nubank" 
                  className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              </div>
              
              {/* Content */}
              <div className="p-6 space-y-4">
                {/* Title with hearts */}
                <div className="flex items-center gap-2 mb-3">
                  <h3 className="text-2xl font-bold text-white">Nubank</h3>
                  <Heart className="w-5 h-5 text-purple-500 fill-purple-500 animate-pulse" />
                </div>

                {/* Compact text */}
                <p className="text-white/70 leading-relaxed text-sm">
                  Participei de uma palestra incrível no escritório da Nubank sobre{' '}
                  <span className="text-purple-300 font-medium">Ciência de Dados</span> e{' '}
                  <span className="text-purple-300 font-medium">Engenharia de Software</span>.
                  <br/><br/>
                  Conheci <span className="text-purple-400 italic">"o jeitinho NUUU!"</span> e um time que realmente faz a diferença! 💜
                </p>

                {/* LinkedIn button */}
                <a
                  href="https://www.linkedin.com/feed/update/urn:li:activity:7359717825935998976/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-purple-600/30 hover:bg-purple-600/50 border border-purple-500/30 rounded-lg text-white/80 hover:text-white transition-all duration-300 text-sm group/link w-full justify-center"
                >
                  <span>Ver post completo</span>
                  <ExternalLink className="w-4 h-4 group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 transition-transform" />
                </a>
              </div>

              {/* Decorative shine */}
              <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-purple-500/10 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </div>

            {/* EXPOMAFE Experience Card */}
            <div className="group relative bg-gradient-to-br from-blue-900/40 to-black/40 rounded-2xl overflow-hidden border border-blue-500/20 hover:border-blue-500/40 transition-all duration-500">
              {/* Blue accent line */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-cyan-500 to-blue-500" />
              
              {/* Large Image at top */}
              <div className="relative w-full aspect-video bg-gradient-to-br from-blue-950/50 to-black/50 p-8 flex items-center justify-center overflow-hidden">
                <img 
                  src="/lovable-uploads/euexpo.png" 
                  alt="EXPOMAFE" 
                  className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              </div>
              
              {/* Content */}
              <div className="p-6 space-y-4">
                {/* Title with icon */}
                <div className="flex items-center gap-2 mb-3">
                  <h3 className="text-2xl font-bold text-white">EXPOMAFE</h3>
                  <span className="text-xl">🎉</span>
                </div>

                {/* Compact text */}
                <p className="text-white/70 leading-relaxed text-sm">
                  Sabe aquele momento que você sai da caixinha pela quantidade de ideias? Foi assim na{' '}
                  <span className="text-blue-300 font-medium">EXPOMAFE</span>!
                  <br/><br/>
                  Através de várias conversas com diferentes empresas, pude aprender muito e aprimorar minhas habilidades de trabalho! 🎉
                  <br/><br/>
                  Agradeço à <span className="text-blue-400 font-medium">GRV SOFTWARE</span> pela oportunidade!
                </p>

                {/* LinkedIn button */}
                <a
                  href="https://www.linkedin.com/feed/update/urn:li:activity:7326759044335980544/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600/30 hover:bg-blue-600/50 border border-blue-500/30 rounded-lg text-white/80 hover:text-white transition-all duration-300 text-sm group/link w-full justify-center"
                >
                  <span>Ver post completo</span>
                  <ExternalLink className="w-4 h-4 group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 transition-transform" />
                </a>
              </div>

              {/* Decorative shine */}
              <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-blue-500/10 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </div>

            {/* Placeholder for more experiences */}
            <div className="text-center py-8">
              <p className="text-sm text-white/30 font-light italic">
                Mais experiências em breve...
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

const StyledWrapper = styled.div`
  position: fixed;
  top: 24px;
  right: 24px;
  z-index: 60;

  @media (max-width: 768px) {
    top: 20px;
    right: 16px;
  }

  .button {
    height: 50px;
    width: 150px;
    border: none;
    border-radius: 10px;
    cursor: pointer;
    position: relative;
    overflow: hidden;
    transition: all 0.5s ease-in-out;

    @media (max-width: 768px) {
      height: 40px;
      width: 120px;
    }
  }

  .button:hover {
    box-shadow: .5px .5px 150px #252525;
  }

  .type1::after {
    content: "Experiências";
    height: 50px;
    width: 150px;
    background: linear-gradient(135deg, #9333ea 0%, #ec4899 100%);
    color: #fff;
    position: absolute;
    top: 0%;
    left: 0%;
    transform: translateY(50px);
    font-size: 1rem;
    font-weight: 600;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.5s ease-in-out;

    @media (max-width: 768px) {
      height: 40px;
      width: 120px;
      font-size: 0.85rem;
    }
  }

  .type1::before {
    content: "TOCA AQUI";
    height: 50px;
    width: 150px;
    background: linear-gradient(135deg, #a855f7 0%, #f472b6 100%);
    color: #fff;
    position: absolute;
    top: 0%;
    left: 0%;
    transform: translateY(0px) scale(1.2);
    font-size: 1rem;
    font-weight: 600;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.5s ease-in-out;

    @media (max-width: 768px) {
      height: 40px;
      width: 120px;
      font-size: 0.85rem;
    }
  }

  .type1:hover::after {
    transform: translateY(0) scale(1.2);
  }

  .type1:hover::before {
    transform: translateY(-50px) scale(0) rotate(120deg);
  }

  /* Removi o active state para permitir que a animação se repita */
`;
