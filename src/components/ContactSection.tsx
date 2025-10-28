import { useState } from 'react';
import styled from 'styled-components';

interface ContactSectionProps {
  isInHero?: boolean;
}

const ContactSection = ({ isInHero = false }: ContactSectionProps) => {
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

  // Se estiver no hero, renderiza apenas o formulário sem wrapper
  if (isInHero) {
    return (
      <div>
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold mb-3">
            <span className="text-primary">Entre em Contato</span>
          </h2>
          <p className="text-sm md:text-base text-muted-foreground">
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

        <StyledWrapper>
          <form className="form" onSubmit={handleSubmit}>
            <ul className="wrapper">
              <li style={{ '--i': 4 } as React.CSSProperties}>
                <input 
                  className="input" 
                  type="text" 
                  placeholder="Nome completo" 
                  required 
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                />
              </li>
              <li style={{ '--i': 3 } as React.CSSProperties}>
                <input 
                  className="input" 
                  placeholder="Insira seu WhatsApp com DDD" 
                  required 
                  name="phone"
                  type="tel"
                  pattern="[0-9]{13}"
                  maxLength={13}
                  value={formData.phone}
                  onChange={handleChange}
                />
              </li>
              <li style={{ '--i': 2 } as React.CSSProperties}>
                <input 
                  className="input" 
                  type="email" 
                  placeholder="seu@email.com" 
                  required 
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                />
              </li>
              <button 
                style={{ '--i': 1 } as React.CSSProperties} 
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Enviando...' : 'Enviar Contato'}
              </button>
            </ul>
          </form>
        </StyledWrapper>
      </div>
    );
  }

  // Renderização padrão para mobile/seção separada
  return (
    <section id="contato" className="py-20 relative lg:hidden">
      <div className="container mx-auto px-6">
        <div className="max-w-2xl mx-auto">
          <div className="scroll-reveal">
            <div className="text-center mb-12">
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

            <StyledWrapper>
              <form className="form" onSubmit={handleSubmit}>
                <ul className="wrapper">
                  <li style={{ '--i': 4 } as React.CSSProperties}>
                    <input 
                      className="input" 
                      type="text" 
                      placeholder="Nome completo" 
                      required 
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                    />
                  </li>
                  <li style={{ '--i': 3 } as React.CSSProperties}>
                    <input 
                      className="input" 
                      placeholder="Insira seu WhatsApp com DDD" 
                      required 
                      name="phone"
                      type="tel"
                      pattern="[0-9]{13}"
                      maxLength={13}
                      value={formData.phone}
                      onChange={handleChange}
                    />
                  </li>
                  <li style={{ '--i': 2 } as React.CSSProperties}>
                    <input 
                      className="input" 
                      type="email" 
                      placeholder="seu@email.com" 
                      required 
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                    />
                  </li>
                  <button 
                    style={{ '--i': 1 } as React.CSSProperties} 
                    type="submit"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Enviando...' : 'Enviar Contato'}
                  </button>
                </ul>
              </form>
            </StyledWrapper>
          </div>
        </div>
      </div>
    </section>
  );
};

const StyledWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;

  .form {
    padding: 0;
  }

  .input, button {
    width: 100%;
    height: 50px;
    position: relative;
    padding: 15px;
    border: 0.1px solid #575cb5;
    font-size: 16px;
    background: transparent;
  }

  button {
    background: #6d74e3;
    border: none;
    cursor: pointer;
    font-weight: 600;
    transition: all 0.3s;
  }

  button:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }

  .wrapper {
    position: relative;
    transform: skewY(-14deg);
    padding: 0;
    margin: 0;
  }

  .wrapper li, button {
    position: relative;
    list-style: none;
    width: 300px;
    z-index: var(--i);
    transition: 0.3s;
    color: white;
  }

  .wrapper li::before, button::before {
    position: absolute;
    content: '';
    background: #6d74e3;
    top: 0;
    left: -50px;
    width: 50px;
    height: 50px;
    transform-origin: right;
    transform: skewY(45deg);
    transition: 0.3s;
  }

  .wrapper li::after, button::after {
    position: absolute;
    content: '';
    background: #6d74e3;
    width: 300px;
    height: 50px;
    top: -50px;
    left: 0;
    transform-origin: bottom;
    transform: skewX(45deg);
    transition: 0.3s;
  }

  .wrapper li:nth-child(1)::after, .wrapper li:nth-child(1)::before {
    background-color: #d8daf7;
  }

  .wrapper li:nth-child(2)::after, .wrapper li:nth-child(2)::before {
    background-color: #c2c5f3;
  }

  .wrapper li:nth-child(3)::after, .wrapper li:nth-child(3)::before {
    background-color: #989deb;
  }

  li .input {
    outline: none;
    border: none;
    color: black;
    cursor: text;
  }

  li .input::placeholder {
    color: #333;
  }

  li:nth-child(1) .input {
    background: #d8daf7;
  }

  li:nth-child(2) .input {
    background: #c2c5f3;
  }

  li:nth-child(3) .input {
    background: #989deb;
  }

  li:nth-child(1) .input:focus {
    outline: none;
    border: 3.5px solid #d8daf7;
  }

  li:nth-child(2) .input:focus {
    outline: none;
    border: 3.5px solid #c2c5f3;
  }

  li:nth-child(3) .input:focus {
    outline: none;
    border: 3.5px solid #989deb;
  }

  .wrapper li:hover, button:hover {
    transform: translateX(-20px);
  }

  button:hover, button:hover::before, button:hover::after {
    background: #575cb5;
  }

  button:active {
    transform: translateX(0px);
  }

  @media (max-width: 768px) {
    .wrapper li, button {
      width: 250px;
    }

    .wrapper li::before, button::before {
      width: 40px;
      height: 50px;
      left: -40px;
    }

    .wrapper li::after, button::after {
      width: 250px;
    }
  }

  @media (max-width: 480px) {
    .wrapper li, button {
      width: 200px;
    }

    .wrapper li::before, button::before {
      width: 30px;
      height: 50px;
      left: -30px;
    }

    .wrapper li::after, button::after {
      width: 200px;
    }

    .input, button {
      font-size: 14px;
      padding: 12px;
    }
  }
`;

export default ContactSection;
