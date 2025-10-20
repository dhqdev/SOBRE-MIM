import davidProfile from '/lovable-uploads/c9fdf4ce-13b8-42e0-b0bd-2a380f0342d6.png';

const AboutSection = () => {
  return (
    <section id="sobre" className="py-20 relative">
      <div className="container mx-auto px-6">
        <div className="max-w-6xl mx-auto">
          {/* Profile Image at Top - Circular */}
          <div className="flex justify-center mb-12 scroll-reveal">
            <div className="relative">
              <div className="w-48 h-48 rounded-full overflow-hidden shadow-2xl border-4 border-primary/30">
                <img
                  src={davidProfile}
                  alt="David Fernandes"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -inset-2 bg-gradient-to-r from-primary/30 to-accent/30 rounded-full blur-xl opacity-50 -z-10"></div>
            </div>
          </div>

          {/* Title */}
          <div className="text-center mb-12 scroll-reveal">
            <h2 className="text-4xl md:text-5xl font-bold mb-2">
              Desenvolvedor <span className="text-primary">Full-Stack</span>
            </h2>
            <div className="w-20 h-1 bg-gradient-to-r from-primary to-accent mx-auto mt-4"></div>
          </div>

          {/* Main Content */}
          <div className="max-w-4xl mx-auto mb-16 scroll-reveal">
            <div className="space-y-6 text-center">
              <p className="text-lg text-muted-foreground leading-relaxed">
                Sou desenvolvedor full-stack com <span className="text-primary font-semibold">2+ anos de experiência</span>, 
                especializado em <span className="text-primary font-semibold">Vue.js, React, JS e Python</span>. 
                Atualmente na <span className="text-primary font-semibold">GRV Software</span>, desenvolvo dentro do frappe Framework com diversas integrações.
              </p>

              <p className="text-lg text-muted-foreground leading-relaxed">
                Minha expertise inclui conhecimento em ERP Protheus advindo da TOTVS, desenvolvimento de software usando várias linguagens mas a 
                principal sendo Python, integração de APIs, automação usando Docker e n8n, 
                criação de dashboards analíticos integrados com banco de dados.
              </p>

              <blockquote className="border-l-4 border-primary pl-6 py-4 italic text-primary bg-primary/5 rounded-r-lg inline-block">
                "The people who are crazy enough to think they can change the world are the ones who do." 
                <span className="block text-sm mt-2 text-muted-foreground">- Steve Jobs</span>
              </blockquote>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
