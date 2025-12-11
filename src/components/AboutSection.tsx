import styled from 'styled-components';
import { Code2, Database, Zap, Globe, Bot, BarChart3 } from 'lucide-react';

const AboutSection = () => {
  const skills = [
    { icon: Code2, title: "Frontend", items: ["Vue.js", "React", "TypeScript"] },
    { icon: Database, title: "Backend", items: ["Python", "Frappe", "Node.js"] },
    { icon: Zap, title: "Automação", items: ["n8n", "Docker", "APIs"] },
    { icon: BarChart3, title: "Analytics", items: ["Dashboards", "ERP", "BI"] },
  ];

  return (
    <section id="sobre" className="py-24 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-0 left-1/4 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-accent/5 rounded-full blur-3xl" />
      
      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-6xl mx-auto">
          
          {/* Section Header */}
          <div className="text-center mb-16 scroll-reveal">
            <span className="inline-block text-primary font-mono text-base mb-4 px-5 py-2 rounded-full border border-primary/30 bg-primary/5">
              &lt;sobre-mim /&gt;
            </span>
            <h2 className="text-5xl md:text-6xl font-bold mb-4">
              Conheça minha <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">jornada</span>
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-primary to-accent mx-auto rounded-full"></div>
          </div>

          {/* Main Content Grid */}
          <div className="grid lg:grid-cols-5 gap-12 items-start">
            
            {/* Left: Story Card */}
            <div className="lg:col-span-3 scroll-reveal">
              <StyledWrapper>
                <div className="notification cursor-target">
                  <div className="notiglow" />
                  <div className="notiborderglow" />
                  
                  <div className="notititle">
                    <span className="text-primary">{'>'}</span> Minha História
                  </div>
                  
                  <div className="notibody">
                    <p className="mb-5 text-lg leading-relaxed">
                      Sou desenvolvedor full-stack apaixonado por transformar desafios complexos em soluções elegantes. 
                      Com <strong>mais de 2 anos</strong> de experiência, construí uma base sólida trabalhando com 
                      tecnologias modernas e frameworks empresariais.
                    </p>

                    <p className="mb-5 leading-relaxed">
                      Atualmente na <strong>GRV Software</strong>, atuo no desenvolvimento com o 
                      <strong> Frappe Framework</strong>, criando integrações robustas e sistemas personalizados. 
                      Minha experiência inclui conhecimento profundo em <strong>ERP Protheus</strong> da TOTVS, 
                      permitindo conectar diferentes mundos de tecnologia.
                    </p>

                    <p className="leading-relaxed">
                      Além do código, domino automação com <strong>Docker e n8n</strong>, 
                      construção de dashboards analíticos e integração de APIs. 
                      Cada projeto é uma oportunidade de aprender algo novo e entregar valor real.
                    </p>

                    <div className="quote-section">
                      <p className="quote-text">
                        "As pessoas loucas o suficiente para pensar que podem mudar o mundo são as que o fazem."
                      </p>
                      <span className="quote-author">— Steve Jobs</span>
                    </div>
                  </div>
                </div>
              </StyledWrapper>
            </div>

            {/* Right: Skills Grid */}
            <div className="lg:col-span-2 space-y-4 scroll-reveal">
              <h3 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
                <Zap className="w-6 h-6 text-primary" />
                Especialidades
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                {skills.map((skill, index) => (
                  <div 
                    key={index}
                    className="group p-5 rounded-xl bg-card/50 border border-border/50 hover:border-primary/50 transition-all duration-300 cursor-target hover:shadow-lg hover:shadow-primary/5"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                        <skill.icon className="w-5 h-5" />
                      </div>
                      <span className="font-semibold text-foreground text-base">{skill.title}</span>
                    </div>
                    <ul className="space-y-1.5">
                      {skill.items.map((item, idx) => (
                        <li key={idx} className="text-sm text-muted-foreground flex items-center gap-1.5">
                          <span className="w-1 h-1 rounded-full bg-primary/50" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              {/* Quick Facts */}
              <div className="mt-8 p-6 rounded-xl bg-gradient-to-br from-primary/10 to-accent/5 border border-primary/20">
                <h4 className="font-semibold text-foreground mb-4 flex items-center gap-2 text-lg">
                  <Bot className="w-5 h-5 text-primary" />
                  Foco Atual
                </h4>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Globe className="w-5 h-5 text-muted-foreground" />
                    <span className="text-base text-muted-foreground">Frappe Framework & ERPNext</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Zap className="w-5 h-5 text-muted-foreground" />
                    <span className="text-base text-muted-foreground">Automação de processos</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <BarChart3 className="w-5 h-5 text-muted-foreground" />
                    <span className="text-base text-muted-foreground">Dashboards & Analytics</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const StyledWrapper = styled.div`
  .notification {
    display: flex;
    flex-direction: column;
    isolation: isolate;
    position: relative;
    width: 100%;
    min-height: auto;
    background: #29292c;
    border-radius: 1rem;
    overflow: hidden;
    font-family: 'Gill Sans', 'Gill Sans MT', Calibri, 'Trebuchet MS', sans-serif;
    font-size: 16px;
    --gradient: linear-gradient(to bottom, #2eadff, #3d83ff, #7e61ff);
    --color: #32a6ff;
    transition: transform 300ms ease;
  }

  .notification:hover {
    transform: translateY(-5px);
  }

  .notification:before {
    position: absolute;
    content: "";
    inset: 0.0625rem;
    border-radius: 0.9375rem;
    background: #18181b;
    z-index: 2;
  }

  .notification:after {
    position: absolute;
    content: "";
    width: 0.25rem;
    inset: 0.65rem auto 0.65rem 0.5rem;
    border-radius: 0.125rem;
    background: var(--gradient);
    transition: transform 300ms ease;
    z-index: 4;
  }

  .notification:hover:after {
    transform: translateX(0.15rem);
  }

  .notititle {
    color: var(--color);
    padding: 1.5rem 1.25rem 1rem 1.5rem;
    font-weight: 700;
    font-size: 1.75rem;
    transition: transform 300ms ease;
    z-index: 5;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .notification:hover .notititle {
    transform: translateX(0.15rem);
  }

  .notibody {
    color: #a1a1aa;
    padding: 0 1.5rem 1.5rem 1.5rem;
    line-height: 1.8;
    font-size: 1.05rem;
    transition: transform 300ms ease;
    z-index: 5;
  }

  .notibody p {
    margin-bottom: 1rem;
  }

  .notibody strong {
    color: var(--color);
    font-weight: 600;
  }

  .notification:hover .notibody {
    transform: translateX(0.25rem);
  }

  .quote-section {
    margin-top: 1.5rem;
    padding: 1.2rem;
    border-left: 3px solid var(--color);
    background: rgba(50, 166, 255, 0.08);
    border-radius: 0 0.5rem 0.5rem 0;
  }

  .quote-text {
    color: #d4d4d8;
    font-style: italic;
    font-size: 1.05rem;
    line-height: 1.6;
    margin-bottom: 0.5rem !important;
  }

  .quote-author {
    color: var(--color);
    font-weight: 600;
    font-size: 0.95rem;
  }

  .notiglow,
  .notiborderglow {
    position: absolute;
    width: 20rem;
    height: 20rem;
    transform: translate(-50%, -50%);
    background: radial-gradient(circle closest-side at center, white, transparent);
    opacity: 0;
    transition: opacity 300ms ease;
  }

  .notiglow {
    z-index: 3;
  }

  .notiborderglow {
    z-index: 1;
  }

  .notification:hover .notiglow {
    opacity: 0.1;
  }

  .notification:hover .notiborderglow {
    opacity: 0.1;
  }

  @media (max-width: 768px) {
    .notification {
      max-width: 100%;
    }

    .notititle {
      font-size: 1.25rem;
      padding: 1.2rem 1rem 0.8rem 1.2rem;
    }

    .notibody {
      font-size: 0.9rem;
      padding: 0 1.2rem 1.2rem 1.2rem;
    }
  }
`;

export default AboutSection;
