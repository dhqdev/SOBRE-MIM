import { Code2, Heart, Zap, Users } from 'lucide-react';
import davidProfile from '/lovable-uploads/c9fdf4ce-13b8-42e0-b0bd-2a380f0342d6.png';
import SkillsCarousel from './SkillsCarousel';

const AboutSection = () => {
  const highlights = [
    {
      icon: Code2,
      title: "1+ ano em Vue, React, Python, Frappe",
      description: "Experiência sólida em desenvolvimento full-stack"
    },
    {
      icon: Zap,
      title: "Integrações com APIs, Docker, WhatsApp, n8n",
      description: "Automação e integração de sistemas complexos"
    },
    {
      icon: Heart,
      title: "Fé, Ética e Código com propósito",
      description: "Tecnologia a serviço do Reino e das pessoas"
    }
  ];

  return (
    <section id="sobre" className="py-20 relative">
      <div className="container mx-auto px-6">
        <div className="max-w-4xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-16 scroll-reveal">
            <h2 className="text-4xl font-bold mb-4">
              <span className="neon-glow">Além do</span>{' '}
              <span className="neon-glow-violet">Código</span>
            </h2>
            <div className="w-20 h-1 bg-gradient-to-r from-primary to-accent mx-auto"></div>
          </div>

          {/* Main Content */}
          <div className="grid lg:grid-cols-2 gap-12 items-center mb-16">
            {/* Profile Image */}
            <div className="scroll-reveal flex justify-center lg:justify-start">
              <div className="relative group profile-3d">
                <div className="neon-pulse-border w-64 h-64 rounded-full overflow-hidden shadow-lg hover:shadow-neon transition-all duration-500 floating-3d">
                  <img
                    src={davidProfile}
                    alt="David Fernandes - Desenvolvedor Full-Stack"
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                </div>
                <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 to-accent/20 rounded-full blur-lg opacity-70 group-hover:opacity-100 transition-opacity duration-500 -z-10"></div>
              </div>
            </div>

            {/* Text Content */}
            <div className="scroll-reveal">
              <div className="space-y-6 text-lg leading-relaxed text-muted-foreground">
                <p className="text-foreground">
                  Me chamo <span className="neon-glow font-semibold">David Fernandes</span>, 
                  sou desenvolvedor full-stack com mais de 1 ano de experiência, especializado em 
                  Vue.js, React, Python e Frappe Framework. Acredito que a tecnologia deve servir 
                  ao Reino de Deus e transformar vidas.
                </p>
                
                <p>
                  Atualmente trabalho na <span className="text-primary font-semibold">GRV Software</span>, 
                  onde desenvolvo soluções ERP robustas e sistemas integrados. Minha expertise inclui 
                  desenvolvimento full-stack, integração de APIs, automação com Docker e n8n, e 
                  criação de dashboards analíticos que impactam diretamente os resultados das empresas.
                </p>

                <p>
                  Já participei de importantes feiras de tecnologia como EXPOMAFE e MOBIPE na 
                  Unimetrocamp, onde apresentei projetos inovadores e construí networking valioso 
                  no setor tech. Tenho experiência em WhatsApp Business API, sistemas de CRM 
                  personalizados e integrações complexas.
                </p>
                
                <p>
                  Além da programação, sou músico, professor cristão e mentor de jovens universitários. 
                  Acredito na importância de usar nossos talentos para glorificar a Deus e servir 
                  ao próximo através da tecnologia. Minha missão é criar soluções que não apenas 
                  resolvem problemas técnicos, mas também agregam valor humano e espiritual.
                </p>
                
                <blockquote className="border-l-4 border-primary pl-4 italic text-primary">
                  "Servi uns aos outros, cada um conforme o dom que recebeu." 
                  <br />
                  <span className="text-sm text-muted-foreground">- 1 Pedro 4:10</span>
                </blockquote>
              </div>
            </div>
          </div>

          {/* Highlights */}
          <div className="scroll-reveal">
            <div className="grid md:grid-cols-3 gap-6 mb-16">
              {highlights.map((highlight, index) => (
                <div 
                  key={index}
                  className="portfolio-card group cursor-pointer"
                  style={{ animationDelay: `${index * 0.2}s` }}
                >
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-lg bg-primary/10 border border-primary/20 group-hover:bg-primary/20 transition-all duration-300">
                      <highlight.icon className="w-6 h-6 text-primary group-hover:scale-110 transition-transform duration-300" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-2 group-hover:text-primary transition-colors duration-300">
                        {highlight.title}
                      </h3>
                      <p className="text-muted-foreground text-sm">
                        {highlight.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Skills Carousel */}
          <SkillsCarousel />
        </div>
      </div>
    </section>
  );
};

export default AboutSection;