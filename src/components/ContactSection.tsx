
import { useState } from 'react';
import { MessageCircle, Mail, Github, Linkedin, Send, MapPin, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

const ContactSection = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Construir mensagem para WhatsApp
    const whatsappMessage = `Olá! Aqui estão meus dados de contato:
    
Nome: ${formData.name}
Email: ${formData.email}
Telefone: ${formData.phone}`;
    
    const whatsappUrl = `https://wa.me/5519995378302?text=${encodeURIComponent(whatsappMessage)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const socialLinks = [
    {
      name: 'LinkedIn',
      icon: Linkedin,
      url: 'https://linkedin.com/in/david-fernandes-dev',
      color: 'primary',
      description: 'Rede profissional'
    },
    {
      name: 'GitHub',
      icon: Github,
      url: 'https://github.com/dhqdev',
      color: 'neon-violet',
      description: 'Projetos e códigos'
    }
  ];

  return (
    <section id="contato" className="py-20 relative">
      <div className="container mx-auto px-6">
        <div className="max-w-6xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-16 scroll-reveal">
            <h2 className="text-4xl font-bold mb-4">
              <span className="neon-glow">Vamos</span>{' '}
              <span className="neon-glow-violet">Conversar</span>
            </h2>
            <p className="text-xl text-muted-foreground mb-6">
              Tem um projeto em mente? Vamos transformar ideias em realidade
            </p>
            <div className="w-20 h-1 bg-gradient-to-r from-primary to-accent mx-auto"></div>
          </div>

          <div className="grid lg:grid-cols-2 gap-12">
            {/* Contact Info */}
            <div className="scroll-reveal">
              <div className="space-y-8">
                <div>
                  <h3 className="text-2xl font-semibold mb-4 text-foreground">
                    Entre em contato
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Seja para um projeto cristão, sistema corporativo ou consultoria em desenvolvimento, 
                    estou sempre disponível para conversar sobre como podemos colaborar juntos.
                  </p>
                </div>

                {/* Quick Info */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <MapPin className="w-5 h-5 text-primary" />
                    <span>Campinas, São Paulo - Brasil</span>
                  </div>
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <Clock className="w-5 h-5 text-primary" />
                    <span>Disponível seg-sex, 8h-18h</span>
                  </div>
                </div>

                {/* Social Links */}
                <div className="grid grid-cols-2 gap-4">
                  {socialLinks.map((social, index) => (
                    <a
                      key={index}
                      href={social.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="portfolio-card group hover:scale-105 transition-all duration-300"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg bg-${social.color}/10 border border-${social.color}/30 group-hover:bg-${social.color}/20 transition-all duration-300`}>
                          <social.icon className={`w-5 h-5 text-${social.color}`} />
                        </div>
                        <div>
                          <div className="font-semibold text-foreground text-sm">
                            {social.name}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {social.description}
                          </div>
                        </div>
                      </div>
                    </a>
                  ))}
                </div>

                {/* Testimonial */}
                <div className="portfolio-card">
                  <blockquote className="text-sm italic text-muted-foreground mb-3">
                    "David foi essencial na criação do nosso app devocional. 
                    Uma mente criativa com um coração no Reino."
                  </blockquote>
                  <cite className="text-primary font-semibold text-sm">
                    Pastor do Projeto "Planejamento com Deus"
                  </cite>
                </div>
              </div>
            </div>

            {/* Contact Form Placeholder */}
            <div className="scroll-reveal">
              <div className="portfolio-card">
                <h3 className="text-2xl font-semibold mb-6 text-foreground">
                  Cadastre-se
                </h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-muted-foreground mb-2">
                      Nome completo
                    </label>
                    <Input
                      id="name"
                      name="name"
                      type="text"
                      required
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Seu nome"
                      className="w-full"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-muted-foreground mb-2">
                      Email
                    </label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="seu@email.com"
                      className="w-full"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-muted-foreground mb-2">
                      Telefone
                    </label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="5519995378302"
                      defaultValue="5519995378302"
                      className="w-full"
                    />
                  </div>

                  <Button 
                    type="submit"
                    className="w-full bg-green-500 hover:bg-green-600 text-white"
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Enviar via WhatsApp
                  </Button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;
