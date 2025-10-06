
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitSuccess(false);

    try {
      // Enviar dados para o webhook do n8n
      const response = await fetch('https://auto.tekvosoft.com/webhook/417bb6bb-4741-4356-ae24-ec04cfd66e54', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          timestamp: new Date().toISOString(),
          source: 'portfolio'
        })
      });

      if (response.ok) {
        // Mostrar sucesso
        setSubmitSuccess(true);
        
        // Limpar formulário
        setFormData({ name: '', email: '', phone: '' });
        
        // Reset success message after 5 seconds
        setTimeout(() => setSubmitSuccess(false), 5000);
      } else {
        alert('Erro ao enviar cadastro. Tente novamente.');
      }
    } catch (error) {
      console.error('Erro ao enviar para webhook:', error);
      alert('Erro ao enviar cadastro. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Formatação especial para o campo de telefone
    if (name === 'phone') {
      // Remove tudo que não é número
      const numbersOnly = value.replace(/\D/g, '');
      
      // Limita a 13 dígitos (55 + 11 + 9 dígitos)
      const limitedNumbers = numbersOnly.slice(0, 13);
      
      setFormData({
        ...formData,
        [name]: limitedNumbers
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
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
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              <span className="neon-glow">Vamos Trabalhar</span>{' '}
              <span className="neon-glow-violet">Juntos?</span>
            </h2>
            <p className="text-xl md:text-2xl text-muted-foreground mb-4 max-w-3xl mx-auto leading-relaxed">
              Transformo ideias em soluções digitais elegantes e funcionais
            </p>
            <p className="text-lg text-muted-foreground/80 mb-6">
              Especialista em desenvolvimento Full Stack, criando desde apps devocionais até sistemas corporativos robustos
            </p>
            <div className="w-20 h-1 bg-gradient-to-r from-primary to-accent mx-auto"></div>
          </div>

          {/* Destacar Formulário no Topo */}
          <div className="mb-12 scroll-reveal">
            <div className="max-w-2xl mx-auto">
              <div className="portfolio-card bg-gradient-to-br from-primary/5 via-background to-accent/5 border-2 border-primary/30 shadow-2xl">
                <div className="text-center mb-6">
                  <h3 className="text-3xl font-bold mb-3 text-foreground">
                    📱 Cadastre-se e Receba Contato
                  </h3>
                  <p className="text-muted-foreground">
                    Preencha o formulário abaixo e entrarei em contato via WhatsApp em breve!
                  </p>
                </div>
                
                {submitSuccess && (
                  <div className="mb-4 p-4 bg-green-500/10 border border-green-500/30 rounded-lg animate-pulse">
                    <p className="text-green-500 text-center font-semibold">
                      ✅ Cadastro enviado com sucesso! Em breve entraremos em contato via WhatsApp.
                    </p>
                  </div>
                )}
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-muted-foreground mb-2">
                      Nome completo *
                    </label>
                    <Input
                      id="name"
                      name="name"
                      type="text"
                      required
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Seu nome completo"
                      className="w-full text-lg"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-muted-foreground mb-2">
                      Email *
                    </label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="seu@email.com"
                      className="w-full text-lg"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-muted-foreground mb-2">
                      Telefone (WhatsApp) *
                    </label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="5519995378302"
                      pattern="[0-9]{13}"
                      title="Digite apenas números no formato: 5519995378302 (13 dígitos)"
                      maxLength={13}
                      className="w-full text-lg font-mono"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Formato: 5519995378302 (código do país + DDD + número)
                    </p>
                  </div>

                  <Button 
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white text-lg py-6 disabled:opacity-50 shadow-lg hover:shadow-green-500/50 transition-all duration-300"
                  >
                    <Send className="w-5 h-5 mr-2" />
                    {isSubmitting ? '⏳ Enviando seu cadastro...' : '🚀 Enviar Cadastro'}
                  </Button>
                </form>
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-12">
            {/* Contact Info */}
            <div className="scroll-reveal">
              <div className="space-y-8">
                <div>
                  <h3 className="text-2xl font-semibold mb-4 text-foreground">
                    💼 Sobre Minha Trajetória
                  </h3>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    <strong className="text-primary">Desenvolvedor Full Stack</strong> com experiência em criar soluções que impactam positivamente a vida das pessoas.
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    De <strong className="text-accent">projetos cristãos que tocam corações</strong> a <strong className="text-primary">sistemas corporativos que otimizam negócios</strong>, 
                    meu trabalho une propósito e excelência técnica.
                  </p>
                </div>

                {/* Especialidades */}
                <div className="portfolio-card bg-gradient-to-br from-primary/10 to-accent/10">
                  <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                    <span className="text-2xl">🎯</span> Minhas Especialidades
                  </h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">▹</span>
                      <span>Desenvolvimento de <strong>aplicações web modernas</strong> com React, TypeScript e Node.js</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">▹</span>
                      <span>Integração com <strong>APIs WhatsApp</strong> e sistemas de comunicação</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">▹</span>
                      <span>Criação de <strong>sistemas SaaS</strong> escaláveis para gestão empresarial</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">▹</span>
                      <span>Desenvolvimento de <strong>apps devocionais</strong> com propósito espiritual</span>
                    </li>
                  </ul>
                </div>

                {/* Quick Info */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <MapPin className="w-5 h-5 text-primary" />
                    <span>📍 Campinas, São Paulo - Brasil</span>
                  </div>
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <Clock className="w-5 h-5 text-primary" />
                    <span>⏰ Disponível seg-sex, 8h-18h</span>
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
                      className="portfolio-card group hover:scale-105 transition-all duration-300 hover:shadow-lg"
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
                <div className="portfolio-card border-l-4 border-primary">
                  <div className="flex items-start gap-3 mb-3">
                    <span className="text-4xl">💬</span>
                    <blockquote className="text-sm italic text-muted-foreground flex-1">
                      "David foi essencial na criação do nosso app devocional. 
                      Uma mente criativa com um coração no Reino. Sua dedicação e habilidade técnica 
                      transformaram nossa visão em realidade!"
                    </blockquote>
                  </div>
                  <cite className="text-primary font-semibold text-sm block text-right">
                    — Pastor do Projeto "Planejamento com Deus"
                  </cite>
                </div>
              </div>
            </div>

            {/* Diferenciais */}
            <div className="scroll-reveal">
              <div className="portfolio-card h-full">
                <h3 className="text-2xl font-semibold mb-6 text-foreground">
                  ⭐ Por Que Trabalhar Comigo?
                </h3>
                
                <div className="space-y-6">
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-2xl">
                      🎨
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground mb-1">Design Elegante</h4>
                      <p className="text-sm text-muted-foreground">
                        Interfaces modernas que combinam beleza e usabilidade
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center text-2xl">
                      ⚡
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground mb-1">Performance Otimizada</h4>
                      <p className="text-sm text-muted-foreground">
                        Código limpo e eficiente para aplicações rápidas e escaláveis
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-2xl">
                      🤝
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground mb-1">Parceria Verdadeira</h4>
                      <p className="text-sm text-muted-foreground">
                        Trabalho lado a lado para entender e superar suas expectativas
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center text-2xl">
                      ❤️
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground mb-1">Propósito e Valores</h4>
                      <p className="text-sm text-muted-foreground">
                        Desenvolvimento com integridade, excelência e impacto positivo
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;
