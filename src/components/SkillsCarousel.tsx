import React, { useState, useEffect } from 'react';
import { Code2, Database, Globe, Smartphone, Cloud, Zap } from 'lucide-react';

const skills = [
  { icon: Code2, name: 'Frontend', description: 'React, Vue.js, Tailwind CSS', color: 'text-primary' },
  { icon: Database, name: 'Backend', description: 'Python, Node.js, API REST', color: 'text-neon-violet' },
  { icon: Globe, name: 'Full-Stack', description: 'Frappe Framework, ERPNext', color: 'text-neon-green' },
  { icon: Cloud, name: 'DevOps', description: 'Docker, n8n, Automação', color: 'text-neon-yellow' },
  { icon: Smartphone, name: 'Integração', description: 'WhatsApp API, CRM', color: 'text-accent' },
  { icon: Zap, name: 'Performance', description: 'Otimização, Analytics', color: 'text-primary' }
];

const SkillsCarousel = () => {
  const [currentSkill, setCurrentSkill] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSkill((prev) => (prev + 1) % skills.length);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="scroll-reveal">
      <div className="portfolio-card hologram relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 cyber-grid opacity-20" />
        
        <div className="relative z-10">
          <h3 className="text-2xl font-bold text-center mb-8 neon-glow">
            Expertise Tecnológica
          </h3>
          
          {/* Main Skill Display */}
          <div className="text-center mb-8">
          <div className="relative inline-block">
            <div className={`w-20 h-20 mx-auto mb-4 rounded-full border-2 border-current ${skills[currentSkill].color} flex items-center justify-center neon-pulse-border`}>
              {React.createElement(skills[currentSkill].icon, { className: "w-10 h-10" })}
            </div>
              <h4 className={`text-2xl font-bold mb-2 ${skills[currentSkill].color}`}>
                {skills[currentSkill].name}
              </h4>
              <p className="text-muted-foreground">
                {skills[currentSkill].description}
              </p>
            </div>
          </div>
          
          {/* Skill Indicators */}
          <div className="flex justify-center gap-2">
            {skills.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSkill(index)}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  index === currentSkill 
                    ? 'bg-primary shadow-neon' 
                    : 'bg-muted hover:bg-primary/50'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SkillsCarousel;