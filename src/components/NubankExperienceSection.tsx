import { Building2, Users, Lightbulb, Coffee } from 'lucide-react';

const NubankExperienceSection = () => {
  return (
    <section className="py-20 relative overflow-hidden">
      <div className="container mx-auto px-6">
        <div className="max-w-6xl mx-auto">
          {/* Background Effects */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-purple-500 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-1/4 right-1/4 w-32 h-32 bg-primary rounded-full blur-3xl animate-pulse"></div>
          </div>

          {/* Section Header */}
          <div className="text-center mb-16 scroll-reveal">
            <h2 className="text-4xl font-bold mb-4">
              <span className="neon-glow">Experiências</span>{' '}
              <span className="neon-glow-violet">Únicas</span>
            </h2>
            <p className="text-xl text-muted-foreground mb-6">
              Momentos que marcaram minha jornada
            </p>
            <div className="w-20 h-1 bg-gradient-to-r from-primary to-accent mx-auto"></div>
          </div>

          {/* Nubank Experience Card */}
          <div className="portfolio-card max-w-4xl mx-auto group">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              {/* Image Side */}
              <div className="relative">
                <div className="relative overflow-hidden rounded-lg border border-primary/20">
                  <img 
                    src="/lovable-uploads/c9fdf4ce-13b8-42e0-b0bd-2a380f0342d6.png"
                    alt="David no escritório da Nubank"
                    className="w-full h-80 object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"></div>
                  
                  {/* Floating Badge */}
                  <div className="absolute top-4 left-4">
                    <span className="px-3 py-1 text-xs rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/30 backdrop-blur-sm">
                      Nubank Experience
                    </span>
                  </div>
                </div>

                {/* Decorative Elements */}
                <div className="absolute -top-4 -right-4 w-24 h-24 bg-purple-500/10 rounded-full blur-xl animate-pulse"></div>
                <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-primary/10 rounded-full blur-xl animate-pulse"></div>
              </div>

              {/* Content Side */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-2xl font-bold mb-3 text-foreground">
                    Dia no Escritório da{' '}
                    <span className="text-purple-400">Nubank</span>
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Uma experiência incrível conhecendo de perto uma das fintechs mais inovadoras do Brasil. 
                    Participei de dinâmicas, conheci a cultura da empresa e me inspirei com a visão de futuro 
                    que eles têm para o setor financeiro.
                  </p>
                </div>

                {/* Experience Highlights */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-purple-500/10 border border-purple-500/30 flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-purple-400" />
                    </div>
                    <div>
                      <h4 className="font-medium text-foreground">Escritório</h4>
                      <p className="text-sm text-muted-foreground">São Paulo</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center">
                      <Users className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-medium text-foreground">Networking</h4>
                      <p className="text-sm text-muted-foreground">Time Nubank</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-accent/10 border border-accent/30 flex items-center justify-center">
                      <Lightbulb className="w-5 h-5 text-accent" />
                    </div>
                    <div>
                      <h4 className="font-medium text-foreground">Dinâmicas</h4>
                      <p className="text-sm text-muted-foreground">Inovação</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-neon-green/10 border border-neon-green/30 flex items-center justify-center">
                      <Coffee className="w-5 h-5 text-neon-green" />
                    </div>
                    <div>
                      <h4 className="font-medium text-foreground">Cultura</h4>
                      <p className="text-sm text-muted-foreground">Tech & People</p>
                    </div>
                  </div>
                </div>

                {/* Quote */}
                <div className="relative pl-6 border-l-2 border-primary/30">
                  <p className="text-foreground italic">
                    "Estar lá me mostrou que o futuro da tecnologia financeira está sendo 
                    construído por pessoas que realmente se importam com impacto social."
                  </p>
                  <span className="text-sm text-muted-foreground mt-2 block">- Reflexão sobre a experiência</span>
                </div>
              </div>
            </div>

            {/* Holographic overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-transparent via-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-lg"></div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default NubankExperienceSection;