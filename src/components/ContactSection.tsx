import { useState } from 'react';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

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
        setSubmitSuccess(true);
        setFormData({ name: '', email: '', phone: '' });
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    if (name === 'phone') {
      const numbersOnly = value.replace(/\D/g, '');
      const limitedNumbers = numbersOnly.slice(0, 13);
      setFormData({ ...formData, [name]: limitedNumbers });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  return (
    <section id="contato" className="py-1 relative">
      <div className="container mx-auto px-6">
        <div className="max-w-2xl mx-auto">
          <div className="scroll-reveal">
            <div className="p-8 md:p-10 rounded-2xl bg-gradient-to-br from-primary/10 via-card to-accent/10 border-2 border-primary/30 shadow-2xl">
              <div className="text-center mb-8">
                <h2 className="text-3xl md:text-4xl font-bold mb-3">
                   <span className="text-primary">Entre em Contato</span>
                </h2>
                <p className="text-lg text-muted-foreground">
                  Preencha o formulário e receba meu contato via WhatsApp
                </p>
              </div>
              
              {submitSuccess && (
                <div className="mb-6 p-4 bg-green-500/10 border-2 border-green-500/30 rounded-lg animate-pulse">
                  <p className="text-green-500 text-center font-semibold">
                    ✅ Cadastro enviado! Até breve!
                  </p>
                </div>
              )}
              
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label htmlFor="name" className="block text-sm font-semibold mb-2">
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
                    className="cursor-target h-12 text-base"
                  />
                </div>
                
                <div>
                  <label htmlFor="email" className="block text-sm font-semibold mb-2">
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
                    className="cursor-target h-12 text-base"
                  />
                </div>
                
                <div>
                  <label htmlFor="phone" className="block text-sm font-semibold mb-2">
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
                    maxLength={13}
                    className="cursor-target h-12 text-base font-mono"
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    Formato: 5519995378302 (código do país + DDD + número)
                  </p>
                </div>

                <Button 
                  type="submit"
                  disabled={isSubmitting}
                  className="cursor-target w-full h-14 bg-primary hover:bg-primary/90 text-base font-semibold shadow-lg hover:shadow-primary/50 transition-all duration-300"
                >
                  <Send className="w-5 h-5 mr-2" />
                  {isSubmitting ? 'Enviando...' : 'Enviar Contato'}
                </Button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;
