import { Code } from 'lucide-react';

const TechStackSection = () => {
  const technologies = [
    { name: "Python", icon: "🐍", category: "Backend" },
    { name: "Java", icon: "☕", category: "Backend" },
    { name: "React", icon: "⚛️", category: "Frontend" },
    { name: "Vue.js", icon: "💚", category: "Frontend" },
    { name: "Node.js", icon: "�", category: "Backend" },
    { name: "MySQL", icon: "🗄️", category: "Database" },
    { name: "Docker", icon: "🐳", category: "DevOps" },
    { name: "Git", icon: "�", category: "Tools" },
    { name: "n8n", icon: "�", category: "Automation" },
    { name: "Tailwind", icon: "🎨", category: "Frontend" }
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
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6 scroll-reveal">
            {technologies.map((tech, index) => (
              <div 
                key={index}
                className="cursor-target flex flex-col items-center justify-center p-6 rounded-lg bg-card border border-border hover:border-primary transition-all duration-300 hover:shadow-lg group"
              >
                <span className="text-5xl mb-3 group-hover:scale-110 transition-transform duration-300">
                  {tech.icon}
                </span>
                <h4 className="font-semibold text-center mb-1">{tech.name}</h4>
                <p className="text-xs text-muted-foreground text-center">{tech.category}</p>
              </div>
            ))}
          </div>

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

export default TechStackSection;