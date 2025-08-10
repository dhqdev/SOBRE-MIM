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

          <div className="grid lg:grid-cols-1 gap-8">
            {/* Nubank Experience Card */}
            <div className="portfolio-card group">
              <div className="grid md:grid-cols-2 gap-8 items-center">
                {/* Image Side */}
                <div className="relative">
                  <div className="relative overflow-hidden rounded-lg border border-primary/20">
                    <img 
                      src="/lovable-uploads/ed1efaa2-cca5-4005-8cb4-80d6f9fc5c3a.png"
                      alt="Experiência no Nubank"
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
                      Visita ao Nubank
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
                        <p className="text-xs text-muted-foreground">Ambiente inspirador</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-purple-500/10 border border-purple-500/30 flex items-center justify-center">
                        <Users className="w-5 h-5 text-purple-400" />
                      </div>
                      <div>
                        <h4 className="font-medium text-foreground">Network</h4>
                        <p className="text-xs text-muted-foreground">Conexões valiosas</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-purple-500/10 border border-purple-500/30 flex items-center justify-center">
                        <Lightbulb className="w-5 h-5 text-purple-400" />
                      </div>
                      <div>
                        <h4 className="font-medium text-foreground">Dinâmicas</h4>
                        <p className="text-xs text-muted-foreground">Metodologias ágeis</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-purple-500/10 border border-purple-500/30 flex items-center justify-center">
                        <Coffee className="w-5 h-5 text-purple-400" />
                      </div>
                      <div>
                        <h4 className="font-medium text-foreground">Cultura</h4>
                        <p className="text-xs text-muted-foreground">Inovação constante</p>
                      </div>
                    </div>
                  </div>

                  {/* Quote */}
                  <blockquote className="border-l-4 border-purple-500/30 pl-4 italic text-muted-foreground">
                    "Ver de perto como uma empresa pode revolucionar um setor inteiro através da tecnologia e foco no cliente."
                  </blockquote>
                </div>
              </div>
            </div>

            {/* ExpoMAFE Experience Card */}
            <div className="portfolio-card group">
              <div className="grid md:grid-cols-2 gap-8 items-center">
                {/* Content Side - First on mobile */}
                <div className="space-y-6 md:order-1">
                  <div>
                    <h3 className="text-2xl font-bold mb-3 text-foreground">
                      ExpoMAFE 2024
                    </h3>
                    <p className="text-muted-foreground leading-relaxed">
                      Participação na maior feira de tecnologia industrial da América Latina, representando a GRV Software. 
                      Uma imersão completa no universo da Indústria 4.0, onde pude explorar as mais avançadas soluções de 
                      automação e inteligência artificial aplicadas ao setor industrial.
                    </p>
                  </div>

                  {/* Experience Highlights */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center">
                        <Building2 className="w-5 h-5 text-blue-400" />
                      </div>
                      <div>
                        <h4 className="font-medium text-foreground">Indústria 4.0</h4>
                        <p className="text-xs text-muted-foreground">Automação avançada</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center">
                        <Lightbulb className="w-5 h-5 text-blue-400" />
                      </div>
                      <div>
                        <h4 className="font-medium text-foreground">IA Industrial</h4>
                        <p className="text-xs text-muted-foreground">Tecnologias emergentes</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center">
                        <Users className="w-5 h-5 text-blue-400" />
                      </div>
                      <div>
                        <h4 className="font-medium text-foreground">Networking</h4>
                        <p className="text-xs text-muted-foreground">Profissionais do setor</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center">
                        <Coffee className="w-5 h-5 text-blue-400" />
                      </div>
                      <div>
                        <h4 className="font-medium text-foreground">Inovação</h4>
                        <p className="text-xs text-muted-foreground">Soluções disruptivas</p>
                      </div>
                    </div>
                  </div>

                  {/* Quote */}
                  <blockquote className="border-l-4 border-blue-500/30 pl-4 italic text-muted-foreground">
                    "A ExpoMAFE me mostrou como a tecnologia está transformando completamente a manufatura brasileira."
                  </blockquote>
                </div>

                {/* Image Side - Second on mobile */}
                <div className="relative md:order-2">
                  <div className="relative overflow-hidden rounded-lg border border-primary/20">
                    <img 
                      src="/lovable-uploads/6381953a-762d-48e7-be57-adfc7ebf3a0e.png"
                      alt="ExpoMAFE 2024 - GRV Software"
                      className="w-full h-80 object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"></div>
                    
                    {/* Floating Badge */}
                    <div className="absolute top-4 left-4">
                      <span className="px-3 py-1 text-xs rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 backdrop-blur-sm">
                        ExpoMAFE 2024
                      </span>
                    </div>
                  </div>

                  {/* Decorative Elements */}
                  <div className="absolute -top-4 -left-4 w-24 h-24 bg-blue-500/10 rounded-full blur-xl animate-pulse"></div>
                  <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-primary/10 rounded-full blur-xl animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default NubankExperienceSection;