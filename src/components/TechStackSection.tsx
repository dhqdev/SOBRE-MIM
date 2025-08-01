import { 
  Code2, 
  Database, 
  Server, 
  Palette, 
  Smartphone, 
  Cloud,
  GitBranch,
  Wrench,
  Globe,
  Zap,
  Heart
} from 'lucide-react';

const TechStackSection = () => {
  const techCategories = [
    {
      title: "Frontend",
      icon: Palette,
      color: "neon-violet",
      techs: [
        { name: "Vue.js", level: 90, icon: "🚀" },
        { name: "React", level: 85, icon: "⚛️" },
        { name: "Tailwind CSS", level: 95, icon: "🎨" },
        { name: "JavaScript", level: 90, icon: "💛" }
      ]
    },
    {
      title: "Backend",
      icon: Server,
      color: "primary",
      techs: [
        { name: "Python", level: 88, icon: "🐍" },
        { name: "Node.js", level: 80, icon: "💚" },
        { name: "Frappe", level: 85, icon: "⚡" },
        { name: "API Design", level: 90, icon: "🔗" }
      ]
    },
    {
      title: "Database",
      icon: Database,
      color: "neon-yellow",
      techs: [
        { name: "MySQL", level: 85, icon: "🗄️" },
        { name: "MongoDB", level: 80, icon: "🍃" },
        { name: "Redis", level: 75, icon: "🔴" },
        { name: "PostgreSQL", level: 70, icon: "🐘" }
      ]
    },
    {
      title: "DevOps & Tools",
      icon: Wrench,
      color: "neon-green",
      techs: [
        { name: "Docker", level: 80, icon: "🐳" },
        { name: "Git", level: 95, icon: "📝" },
        { name: "n8n", level: 85, icon: "🔄" },
        { name: "Postman", level: 90, icon: "📮" }
      ]
    }
  ];

  return (
    <section id="tecnologias" className="py-20 relative">
      <div className="container mx-auto px-6">
        <div className="max-w-6xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-16 scroll-reveal">
            <h2 className="text-4xl font-bold mb-4">
              <span className="neon-glow">Tecnologias que</span>{' '}
              <span className="neon-glow-violet">Domino</span>
            </h2>
            <p className="text-xl text-muted-foreground mb-6">
              Ferramentas que uso para criar soluções impactantes
            </p>
            <div className="w-20 h-1 bg-gradient-to-r from-primary to-accent mx-auto"></div>
          </div>

          {/* Tech Categories Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
            {techCategories.map((category, index) => (
              <div 
                key={index}
                className="portfolio-card group"
                style={{ animationDelay: `${index * 0.2}s` }}
              >
                {/* Category Header */}
                <div className="flex items-center gap-3 mb-6">
                  <div className={`p-3 rounded-lg bg-${category.color}/10 border border-${category.color}/30 group-hover:bg-${category.color}/20 transition-all duration-300`}>
                    <category.icon className={`w-6 h-6 text-${category.color}`} />
                  </div>
                  <h3 className={`font-semibold text-lg text-${category.color}`}>
                    {category.title}
                  </h3>
                </div>

                {/* Tech List */}
                <div className="space-y-4">
                  {category.techs.map((tech, techIndex) => (
                    <div key={techIndex} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{tech.icon}</span>
                          <span className="text-sm font-medium text-foreground">
                            {tech.name}
                          </span>
                        </div>
                        <span className={`text-xs text-${category.color} font-semibold`}>
                          {tech.level}%
                        </span>
                      </div>
                      
                      {/* Progress Bar */}
                      <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                        <div 
                          className={`h-full bg-gradient-to-r from-${category.color}/60 to-${category.color} rounded-full transition-all duration-1000 ease-out`}
                          style={{ 
                            width: `${tech.level}%`,
                            animationDelay: `${(index * 0.2) + (techIndex * 0.1)}s`
                          }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Additional Skills */}
          <div className="scroll-reveal">
            <div className="portfolio-card hologram">
              <h3 className="text-2xl font-semibold mb-6 text-center">
                <span className="neon-glow">Competências Extras</span>
              </h3>
              
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center">
                  <Smartphone className="w-8 h-8 text-primary mx-auto mb-3" />
                  <h4 className="font-semibold text-foreground mb-2">Mobile First</h4>
                  <p className="text-sm text-muted-foreground">
                    Design responsivo e experiência otimizada para dispositivos móveis
                  </p>
                </div>
                
                <div className="text-center">
                  <Globe className="w-8 h-8 text-accent mx-auto mb-3" />
                  <h4 className="font-semibold text-foreground mb-2">APIs & Integrações</h4>
                  <p className="text-sm text-muted-foreground">
                    WhatsApp API, automação com n8n e integrações complexas
                  </p>
                </div>
                
                <div className="text-center">
                  <Heart className="w-8 h-8 text-neon-yellow mx-auto mb-3" />
                  <h4 className="font-semibold text-foreground mb-2">Desenvolvimento Cristão</h4>
                  <p className="text-sm text-muted-foreground">
                    Criação de ferramentas digitais para ministérios e organizações cristãs
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Code Philosophy */}
          <div className="mt-16 scroll-reveal">
            <div className="max-w-3xl mx-auto text-center">
              <blockquote className="text-2xl italic text-muted-foreground mb-4">
                "Clean code always looks like it was written by someone who cares."
              </blockquote>
              <cite className="text-primary font-semibold">- Robert C. Martin</cite>
              
              <div className="mt-8 p-6 bg-card/50 border border-primary/20 rounded-lg">
                <div className="font-mono text-sm text-left">
                  <span className="text-neon-green">const</span>{' '}
                  <span className="text-neon-yellow">filosofia</span>{' '}
                  <span className="text-foreground">=</span>{' '}
                  <span className="text-primary">{`{`}</span>
                  <br />
                  <span className="text-muted-foreground ml-4">
                    qualidade: <span className="text-neon-violet">'sempre'</span>,
                  </span>
                  <br />
                  <span className="text-muted-foreground ml-4">
                    proposito: <span className="text-neon-violet">'servir ao Reino'</span>,
                  </span>
                  <br />
                  <span className="text-muted-foreground ml-4">
                    impacto: <span className="text-neon-violet">'transformar vidas'</span>
                  </span>
                  <br />
                  <span className="text-primary">{`}`}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TechStackSection;