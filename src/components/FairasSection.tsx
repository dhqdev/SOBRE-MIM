import { Users, Calendar, MapPin, Award } from 'lucide-react';

const FairasSection = () => {
  const feiras = [
    {
      nome: "EXPOMAFE",
      local: "Unimetrocamp",
      ano: "2024",
      descricao: "Participação na feira de tecnologia apresentando projetos inovadores",
      image: "/public/lovable-uploads/feira-1.png",
      destaque: "Apresentação de projetos tech"
    },
    {
      nome: "MOBIPE",
      local: "Unimetrocamp", 
      ano: "2024",
      descricao: "Demonstração de soluções tecnológicas para empresas",
      image: "/public/lovable-uploads/feira-2.png",
      destaque: "Networking empresarial"
    }
  ];

  const galeria = [
    "/public/lovable-uploads/feira-3.png",
    "/public/lovable-uploads/feira-4.png"
  ];

  return (
    <section className="py-20 px-6 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-20 left-10 w-32 h-32 border border-neon-violet rotate-45"></div>
        <div className="absolute bottom-20 right-10 w-24 h-24 border border-neon-green rotate-12"></div>
      </div>

      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16 scroll-reveal">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-primary via-neon-violet to-neon-green bg-clip-text text-transparent">
            Feiras & Eventos Tech
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Participação ativa em eventos de tecnologia, compartilhando conhecimento e construindo networking
          </p>
        </div>

        {/* Feiras Principais */}
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          {feiras.map((feira, index) => (
            <div key={index} className="group scroll-reveal">
              <div className="relative bg-card/50 backdrop-blur-sm rounded-xl border border-border/50 overflow-hidden hover:border-primary/50 transition-all duration-300">
                <div className="aspect-video relative overflow-hidden">
                  <img 
                    src={feira.image} 
                    alt={`${feira.nome} - ${feira.local}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent"></div>
                  <div className="absolute top-4 right-4">
                    <span className="bg-primary/20 backdrop-blur-sm text-primary px-3 py-1 rounded-full text-sm font-medium">
                      {feira.ano}
                    </span>
                  </div>
                </div>

                <div className="p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Award className="w-5 h-5 text-primary" />
                    <h3 className="text-2xl font-bold">{feira.nome}</h3>
                  </div>
                  
                  <div className="flex items-center gap-4 mb-4 text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      <span className="text-sm">{feira.local}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span className="text-sm">{feira.ano}</span>
                    </div>
                  </div>

                  <p className="text-muted-foreground mb-4">{feira.descricao}</p>
                  
                  <div className="bg-primary/10 rounded-lg p-3">
                    <p className="text-primary font-medium text-sm">{feira.destaque}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Galeria de Momentos */}
        <div className="scroll-reveal">
          <h3 className="text-2xl font-bold text-center mb-8 flex items-center justify-center gap-2">
            <Users className="w-6 h-6 text-primary" />
            Momentos dos Eventos
          </h3>
          
          <div className="grid md:grid-cols-2 gap-6">
            {galeria.map((image, index) => (
              <div key={index} className="group relative overflow-hidden rounded-xl">
                <img 
                  src={image} 
                  alt={`Momento ${index + 1} das feiras`}
                  className="w-full aspect-video object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </div>
            ))}
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center mt-16 scroll-reveal">
          <div className="bg-gradient-to-r from-primary/10 to-neon-violet/10 rounded-2xl p-8 border border-primary/20">
            <h3 className="text-2xl font-bold mb-4">Vamos conversar sobre tecnologia?</h3>
            <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
              Participar desses eventos me permitiu conhecer pessoas incríveis e compartilhar conhecimento. 
              Adoraria trocar ideias sobre seus projetos também!
            </p>
            <a 
              href="https://wa.me/5519995378302?text=Olá David! Vi seu portfólio e gostaria de conversar sobre tecnologia 🚀" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3 rounded-lg font-medium transition-colors"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
              </svg>
              Vamos conversar
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FairasSection;