
import { ExternalLink, Github, Brain, MessageCircle, Calendar, Heart, Utensils, Clock } from 'lucide-react';

const ProjectsSection = () => {
  const projects = [
    {
      title: "ticket.tekvosoft.com", 
      description: "Chat corporativo com integração ao WhatsApp. Comunicação interna descomplicada e elegante.",
      icon: MessageCircle,
      color: "primary",
      link: "http://ticket.tekvosoft.com/",
      type: "Comunicação Corporativa",
      image: "/lovable-uploads/79117ada-5cfd-4c0b-920e-80810bd9a0d6.png"
    },
    {
      title: "Mesa Fácil – SaaS para Restaurantes",
      description: "Front-end completo para gestão de pedidos e mesas, com painel responsivo.",
      icon: Utensils,
      color: "neon-violet",
      link: "https://mesa-facil-gestao-saas-1.onrender.com/",
      type: "SaaS Business",
      image: "/lovable-uploads/97ee0758-207f-4450-9388-cdc6a5df76ad.png"
    },
    {
      title: "Agenda Online",
      description: "Sistema completo de agendamentos com back-end e front-end integrados.",
      icon: Calendar,
      color: "primary",
      link: "https://agenda-6f9x.onrender.com/",
      type: "Sistema Completo",
      image: "/lovable-uploads/d95001ff-46a0-4fb6-b6df-1f4b22ce8bee.png"
    }
  ];

  return (
    <section id="projetos" className="py-20 relative">
      <div className="container mx-auto px-6">
        <div className="max-w-6xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-16 scroll-reveal">
            <h2 className="text-4xl font-bold mb-4">
              <span className="neon-glow">Projetos com</span>{' '}
              <span className="neon-glow-violet">Alma</span>
            </h2>
            <p className="text-xl text-muted-foreground mb-6">
              Coisas que construí com propósito
            </p>
            <div className="w-20 h-1 bg-gradient-to-r from-primary to-accent mx-auto"></div>
          </div>

          {/* Projects Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {projects.map((project, index) => (
              <div 
                key={index}
                className="portfolio-card group relative overflow-hidden card-3d"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {/* Project Image */}
                <div className="mb-4 project-image-3d">
                  <img 
                    src={project.image}
                    alt={`Screenshot of ${project.title}`}
                    className="w-full h-48 object-cover rounded-lg border border-primary/20"
                  />
                </div>

                {/* Project Type Badge */}
                <div className="absolute top-6 right-6 z-10">
                  <span className={`px-2 py-1 text-xs rounded-full bg-${project.color}/20 text-${project.color} border border-${project.color}/30`}>
                    {project.type}
                  </span>
                </div>

                {/* Icon */}
                <div className={`w-12 h-12 rounded-lg bg-${project.color}/10 border border-${project.color}/30 flex items-center justify-center mb-4 floating-3d`}>
                  <project.icon className={`w-6 h-6 text-${project.color}`} />
                </div>

                {/* Content */}
                <div className="flex-1">
                  <h3 className="text-xl font-semibold mb-2 text-foreground group-hover:text-primary transition-colors duration-300">
                    {project.title}
                  </h3>
                  
                  <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                    {project.description}
                  </p>
                </div>

                {/* Action Button */}
                <div className="pt-4 border-t border-border/50">
                  <a 
                    href={project.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`inline-flex items-center gap-2 text-${project.color} hover:text-${project.color}/80 transition-colors duration-300 group-hover:translate-x-1 transform transition-transform duration-300`}
                  >
                    <span className="text-sm font-medium">Ver projeto</span>
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>

                {/* Holographic overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-transparent via-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProjectsSection;
