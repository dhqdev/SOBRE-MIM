import { Code } from 'lucide-react';
import styled from 'styled-components';

const TechStackSection = () => {
  const technologies = [
    { 
      name: "Python", 
      icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/python/python-original.svg", 
      category: "Backend",
      color: "#3776AB"
    },
    { 
      name: "Java", 
      icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/java/java-original.svg", 
      category: "Backend",
      color: "#007396"
    },
    { 
      name: "React", 
      icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg", 
      category: "Frontend",
      color: "#61DAFB"
    },
    { 
      name: "Vue.js", 
      icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/vuejs/vuejs-original.svg", 
      category: "Frontend",
      color: "#42B883"
    },
    { 
      name: "Node.js", 
      icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nodejs/nodejs-original.svg", 
      category: "Backend",
      color: "#339933"
    },
    { 
      name: "MySQL", 
      icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/mysql/mysql-original.svg", 
      category: "Database",
      color: "#4479A1"
    },
    { 
      name: "Docker", 
      icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/docker/docker-original.svg", 
      category: "DevOps",
      color: "#2496ED"
    },
    { 
      name: "Git", 
      icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/git/git-original.svg", 
      category: "Tools",
      color: "#F05032"
    },
    { 
      name: "n8n", 
      icon: "https://avatars.githubusercontent.com/u/45487711?s=200&v=4", 
      category: "Automation",
      color: "#EA4B71"
    },
    { 
      name: "Tailwind", 
      icon: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/tailwindcss/tailwindcss-original.svg", 
      category: "Frontend",
      color: "#06B6D4"
    }
  ];

  return (
    <section id="tecnologias" className="py-20 relative">
      <div className="container mx-auto px-6">
        <div className="max-w-6xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-16 scroll-reveal">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="text-primary">Habilidades</span>
            </h2>
            <div className="w-20 h-1 bg-gradient-to-r from-primary to-accent mx-auto mb-6"></div>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Tecnologias que domino:
            </p>
          </div>

          {/* Tech Grid */}
          <StyledWrapper>
            <div className="tech-grid scroll-reveal">
              {technologies.map((tech, index) => (
                <div 
                  key={index}
                  className="tech-card cursor-target"
                  style={{ 
                    '--tech-color': tech.color,
                    '--delay': `${index * 0.1}s`
                  } as React.CSSProperties}
                >
                  <div className="tech-glow"></div>
                  <div className="tech-icon-wrapper">
                    <img 
                      src={tech.icon} 
                      alt={tech.name}
                      className="tech-icon"
                      loading="lazy"
                    />
                  </div>
                  <h4 className="tech-name">{tech.name}</h4>
                  <p className="tech-category">{tech.category}</p>
                  
                  {/* Particles effect */}
                  <div className="particles">
                    <span className="particle"></span>
                    <span className="particle"></span>
                    <span className="particle"></span>
                  </div>
                </div>
              ))}
            </div>
          </StyledWrapper>

          {/* Quote */}
          <div className="mt-16 text-center scroll-reveal">
            <div className="max-w-2xl mx-auto p-6 rounded-lg bg-card border border-border">
              <Code className="w-12 h-12 text-primary mx-auto mb-4" />
              <blockquote className="text-lg italic text-muted-foreground mb-2">
                "Clean code always looks like it was written by someone who cares."
              </blockquote>
              <cite className="text-primary font-semibold">- Robert C. Martin</cite>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const StyledWrapper = styled.div`
  .tech-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
    gap: 2rem;
    perspective: 1000px;
  }

  .tech-card {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 2rem 1.5rem;
    background: rgba(24, 24, 27, 0.8);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 1rem;
    overflow: hidden;
    transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    animation: fadeInUp 0.6s ease-out backwards;
    animation-delay: var(--delay);
  }

  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(30px) rotateX(-10deg);
    }
    to {
      opacity: 1;
      transform: translateY(0) rotateX(0);
    }
  }

  .tech-card:hover {
    transform: translateY(-10px) scale(1.05);
    border-color: var(--tech-color);
    box-shadow: 
      0 20px 40px rgba(0, 0, 0, 0.4),
      0 0 40px var(--tech-color);
  }

  .tech-glow {
    position: absolute;
    inset: -100%;
    background: radial-gradient(
      circle at center,
      var(--tech-color),
      transparent 70%
    );
    opacity: 0;
    transition: opacity 0.4s ease;
  }

  .tech-card:hover .tech-glow {
    opacity: 0.3;
  }

  .tech-icon-wrapper {
    position: relative;
    width: 80px;
    height: 80px;
    margin-bottom: 1rem;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 1rem;
    transition: all 0.4s ease;
  }

  .tech-card:hover .tech-icon-wrapper {
    background: rgba(255, 255, 255, 0.1);
    transform: rotateY(360deg) scale(1.1);
    box-shadow: 0 0 30px var(--tech-color);
  }

  .tech-icon {
    width: 55px;
    height: 55px;
    object-fit: contain;
    filter: drop-shadow(0 0 10px var(--tech-color));
    transition: all 0.4s ease;
  }

  .tech-card:hover .tech-icon {
    filter: drop-shadow(0 0 20px var(--tech-color));
  }

  .tech-name {
    font-size: 1.1rem;
    font-weight: 700;
    color: #fff;
    margin-bottom: 0.3rem;
    transition: all 0.3s ease;
  }

  .tech-card:hover .tech-name {
    color: var(--tech-color);
    transform: scale(1.05);
  }

  .tech-category {
    font-size: 0.85rem;
    color: #9ca3af;
    transition: all 0.3s ease;
  }

  .tech-card:hover .tech-category {
    color: #d1d5db;
  }

  /* Particles effect */
  .particles {
    position: absolute;
    inset: 0;
    pointer-events: none;
  }

  .particle {
    position: absolute;
    width: 4px;
    height: 4px;
    background: var(--tech-color);
    border-radius: 50%;
    opacity: 0;
  }

  .tech-card:hover .particle {
    animation: particleFloat 2s ease-in-out infinite;
  }

  .particle:nth-child(1) {
    top: 20%;
    left: 20%;
    animation-delay: 0s;
  }

  .particle:nth-child(2) {
    top: 60%;
    right: 20%;
    animation-delay: 0.7s;
  }

  .particle:nth-child(3) {
    bottom: 20%;
    left: 50%;
    animation-delay: 1.4s;
  }

  @keyframes particleFloat {
    0%, 100% {
      opacity: 0;
      transform: translateY(0) scale(0);
    }
    50% {
      opacity: 1;
      transform: translateY(-20px) scale(1);
    }
  }

  @media (max-width: 768px) {
    .tech-grid {
      grid-template-columns: repeat(2, 1fr);
      gap: 1.5rem;
    }

    .tech-card {
      padding: 1.5rem 1rem;
    }

    .tech-icon-wrapper {
      width: 60px;
      height: 60px;
    }

    .tech-icon {
      width: 40px;
      height: 40px;
    }
  }
`;

export default TechStackSection;