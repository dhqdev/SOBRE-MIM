import { ExternalLink, MessageCircle, Calendar, Utensils, Bot, DollarSign, Gamepad2 } from 'lucide-react';
import ScrollStack, { ScrollStackItem } from './ScrollStack';

interface Project {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  link: string;
  tags: string[];
  image?: string;
  video?: string;
}

const ProjectsSection = () => {
  const projects: Project[] = [
    {
      title: "Flappy Bird IA",
      description: "🤖 Ensinei uma IA a zerar o Flappy Bird — e ela aprendeu sozinha! Criei um experimento em Python onde 50 passarinhos-IA jogam Flappy Bird ao mesmo tempo. Eles evoluem, cruzam genes, sofrem mutação e ficam cada vez mais inteligentes. Depois de algumas gerações, começam a dominar o jogo com uma precisão absurda. Usei Algoritmo Genético, Rede Neural (4-5-1), Python + Pygame + NumPy. Resultado? Aprendizado 100% autônomo, zero jogadas humanas.",
      icon: Gamepad2,
      link: "https://github.com/dhqdev/Projeto_FlappyBird",
      tags: ["Python", "IA", "Algoritmo Genético", "Rede Neural"],
      video: "/lovable-uploads/flappy-bird-ai.mp4"
    },
    {
      title: "Planejai - Gestão financeira", 
      description: "Um software SaaS de gestão financeira desenvolvido para todo tipo de cliente que deseja ter um maior controle sobre o que gasta.",
      icon: MessageCircle,
      link: "https://planejai.tekvosoft.com/",
      tags: ["WhatsApp", "Chat", "Real-time"],
      image: "/lovable-uploads/logoporconew.png"
    },
    {
      title: "Encontro com Deus",
      description: "Site oficial do retiro espiritual Encontro com Deus - Um ministério de transformação dedicado a promover experiências profundas de renovação espiritual, cura e reconexão com Deus. TypeScript e React, com inteligência artificial que conversa e aconselha a pessoa.",
      icon: Calendar,
      link: "https://encontro-com-deus.vercel.app/",
      tags: ["React", "TypeScript", "IA"],
      image: "/lovable-uploads/encontro-com-deus.png"
    },
    {
      title: "Prato Flash",
      description: "Sistema completo de gestão para restaurantes, desenvolvido com React, TypeScript e shadcn/ui. Uma solução moderna e intuitiva para gerenciar todos os aspectos do seu estabelecimento.",
      icon: Utensils,
      link: "https://github.com/dhqdev/prato-flash",
      tags: ["React", "TypeScript", "shadcn/ui"],
      image: "/lovable-uploads/prato-flash.png"
    },
    {
      title: "BCI-ON1 - Automação Servopa",
      description: "O BCI-ON1 é um sistema de automação desenvolvido para simplificar e automatizar processos de licitação no portal Servopa. O sistema realiza login automático, extrai protocolos do Todoist, envia lances e notifica clientes via WhatsApp nos dias 8 e 16 de cada mês.",
      icon: Bot,
      link: "https://github.com/dhqdev/bci-on1?tab=readme-ov-file",
      tags: ["Automação", "Python", "Selenium"],
      image: "/lovable-uploads/bci-on1-dashboard.png"
    },
    {
      title: "Vozerão - Gerador de vozes com IA",
      description: "Vozerão é um saas desenvolvido para transcrever audio em texto, além de fazer um resumo do conteúdo e gerar uma voz artificial com base no texto. O sistema é construído com React, TypeScript e utiliza a API ElevenLabs para a geração de voz, oferecendo uma experiência completa de transcrição e síntese vocal.",
      icon: DollarSign,
      link: "https://vozerao.vercel.app/",
      tags: ["Site", "Design", "Corporativo"],
      image: "/lovable-uploads/vozerao.png"
    }
  ];

  return (
    <section id="projetos" className="py-20 relative overflow-hidden">
      <div className="container mx-auto px-6">
        {/* Section Header */}
        <div className="text-center mb-16 scroll-reveal">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="text-primary">Projetos</span>
          </h2>
          <div className="w-20 h-1 bg-gradient-to-r from-primary to-accent mx-auto mb-6"></div>
          <p className="text-xl text-muted-foreground">
            Feitos por mim
          </p>
        </div>

        {/* Mobile - Grid Simples */}
        <div className="md:hidden grid gap-6">
          {projects.map((project, index) => (
            <div 
              key={index}
              className="group rounded-2xl bg-card border border-border overflow-hidden"
            >
              {/* Project Image/Video */}
              <div className="overflow-hidden">
                {project.video ? (
                  <video 
                    src={project.video}
                    className="w-full h-48 object-cover"
                    autoPlay
                    loop
                    muted
                    playsInline
                  />
                ) : (
                  <img 
                    src={project.image}
                    alt={project.title}
                    className="w-full h-48 object-cover"
                    loading="lazy"
                  />
                )}
              </div>

              <div className="p-6">
                {/* Icon & Title */}
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <project.icon className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold">{project.title}</h3>
                </div>
                
                <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                  {project.description}
                </p>

                {/* Tags */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {project.tags.map((tag, i) => (
                    <span key={i} className="px-2 py-1 text-xs rounded-full bg-primary/10 text-primary font-medium">
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Link */}
                <a 
                  href={project.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-primary text-sm font-medium"
                >
                  Ver projeto <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop - ScrollStack */}
        <div className="hidden md:block w-full max-w-7xl mx-auto">
          <ScrollStack 
            itemDistance={120}
            itemStackDistance={50}
            stackPosition="20%"
            baseScale={0.92}
            rotationAmount={0}
            blurAmount={0}
            useWindowScroll={true}
          >
            {projects.map((project, index) => (
              <ScrollStackItem key={index}>
                <div className="cursor-target group rounded-3xl bg-card border-2 border-border overflow-hidden hover:border-primary transition-all duration-300 hover:shadow-2xl">
                  {/* Project Image/Video */}
                  <div className="overflow-hidden">
                    {project.video ? (
                      <video 
                        src={project.video}
                        className="w-full h-80 object-cover group-hover:scale-110 transition-transform duration-500"
                        autoPlay
                        loop
                        muted
                        playsInline
                      />
                    ) : (
                      <img 
                        src={project.image}
                        alt={project.title}
                        className="w-full h-80 object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    )}
                  </div>

                  <div className="p-10">
                    {/* Icon & Title */}
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center">
                        <project.icon className="w-7 h-7 text-primary" />
                      </div>
                      <h3 className="text-3xl font-bold">{project.title}</h3>
                    </div>
                    
                    <p className="text-muted-foreground text-lg leading-relaxed mb-6">
                      {project.description}
                    </p>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-3 mb-6">
                      {project.tags.map((tag, i) => (
                        <span key={i} className="px-4 py-2 text-sm rounded-full bg-primary/10 text-primary font-semibold">
                          {tag}
                        </span>
                      ))}
                    </div>

                    {/* Link */}
                    <a 
                      href={project.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors duration-300 text-lg font-semibold"
                    >
                      Ver projeto <ExternalLink className="w-5 h-5" />
                    </a>
                  </div>
                </div>
              </ScrollStackItem>
            ))}
          </ScrollStack>
        </div>
      </div>
    </section>
  );
};

export default ProjectsSection;