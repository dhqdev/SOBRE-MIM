import { useState } from 'react';
import styled from 'styled-components';

interface ContactSectionProps {
  isInHero?: boolean;
}

const ContactSection = ({ isInHero = false }: ContactSectionProps) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
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
        setFormData({ name: '', email: '', phone: '', message: '' });
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
    
    if (name === 'phone') {
      // Remove tudo que não é número
      let numbersOnly = value.replace(/\D/g, '');
      
      // Se o usuário digitou 55 no início, remove para evitar duplicação
      if (numbersOnly.startsWith('55')) {
        numbersOnly = numbersOnly.slice(2);
      }
      
      // Limita a 11 dígitos (DDD + número)
      const limitedNumbers = numbersOnly.slice(0, 11);
      
      // Adiciona o +55 automaticamente
      const formattedPhone = limitedNumbers ? `55${limitedNumbers}` : '';
      
      setFormData({ ...formData, [name]: formattedPhone });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  // Se estiver no hero, renderiza apenas o formulário sem wrapper
  if (isInHero) {
    return (
      <div>
        {submitSuccess && (
          <div className="mb-6 p-4 bg-green-500/10 border-2 border-green-500/30 rounded-lg animate-pulse">
            <p className="text-green-500 text-center font-semibold">
              ✅ Cadastro enviado! Até breve!
            </p>
          </div>
        )}

        <StyledWrapper>
          <form className="form" onSubmit={handleSubmit}>
            <div className="form-header">
              <h3 className="form-title">Entre em Contato</h3>
              <p className="form-subtitle">Preencha o formulário e receba meu contato via WhatsApp</p>
            </div>

            <div className="form-grid">
              <div className="input-group">
                <label className="label-text">Nome *</label>
                <input 
                  className="input" 
                  type="text" 
                  placeholder="Seu nome completo" 
                  required 
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                />
              </div>
              
              <div className="input-group">
                <label className="label-text">Email *</label>
                <input 
                  className="input" 
                  type="email" 
                  placeholder="seu@email.com" 
                  required 
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>
            </div>
            
            <div className="input-group">
              <label className="label-text">WhatsApp *</label>
              <input 
                className="input" 
                type="tel" 
                placeholder="(DDD) 99999-9999" 
                required 
                name="phone"
                minLength={12}
                maxLength={13}
                value={formData.phone}
                onChange={handleChange}
              />
            </div>

            <div className="input-group">
              <label className="label-text">Sobre o projeto</label>
              <textarea 
                className="input textarea" 
                placeholder="Conte-me sobre seu projeto..."
                name="message"
                rows={4}
                value={formData.message}
                onChange={handleChange}
              />
            </div>
            
            <button 
              className="submit"
              type="submit"
              disabled={isSubmitting}
            >
              <svg className="send-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
              </svg>
              {isSubmitting ? 'Enviando...' : 'Enviar Mensagem'}
            </button>
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
            {submitSuccess && (
              <div className="mb-6 p-4 bg-green-500/10 border-2 border-green-500/30 rounded-lg animate-pulse">
                <p className="text-green-500 text-center font-semibold">
                  ✅ Cadastro enviado! Até breve!
                </p>
              </div>
            )}

            <StyledWrapper>
              <form className="form" onSubmit={handleSubmit}>
                <div className="form-header">
                  <h3 className="form-title">Entre em Contato</h3>
                  <p className="form-subtitle">Preencha o formulário e receba meu contato via WhatsApp</p>
                </div>

                <div className="form-grid">
                  <div className="input-group">
                    <label className="label-text">Nome *</label>
                    <input 
                      className="input" 
                      type="text" 
                      placeholder="Seu nome completo" 
                      required 
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                    />
                  </div>
                  
                  <div className="input-group">
                    <label className="label-text">Email *</label>
                    <input 
                      className="input" 
                      type="email" 
                      placeholder="seu@email.com" 
                      required 
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                    />
                  </div>
                </div>
                
                <div className="input-group">
                  <label className="label-text">WhatsApp *</label>
                  <input 
                    className="input" 
                    type="tel" 
                    placeholder="(DDD) 99999-9999" 
                    required 
                    name="phone"
                    minLength={12}
                    maxLength={13}
                    value={formData.phone}
                    onChange={handleChange}
                  />
                </div>

                <div className="input-group">
                  <label className="label-text">Sobre o projeto</label>
                  <textarea 
                    className="input textarea" 
                    placeholder="Conte-me sobre seu projeto..."
                    name="message"
                    rows={4}
                    value={formData.message}
                    onChange={handleChange}
                  />
                </div>
                
                <button 
                  className="submit"
                  type="submit"
                  disabled={isSubmitting}
                >
                  <svg className="send-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
                  </svg>
                  {isSubmitting ? 'Enviando...' : 'Enviar Mensagem'}
                </button>
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

  .form {
    display: flex;
    flex-direction: column;
    gap: 20px;
    max-width: 650px;
    width: 100%;
    padding: 40px;
    border-radius: 16px;
    background: linear-gradient(135deg, rgba(26, 26, 46, 0.7) 0%, rgba(22, 33, 62, 0.7) 100%);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(168, 144, 255, 0.2);
    box-shadow: 
      0 8px 32px rgba(0, 0, 0, 0.5),
      0 0 0 1px rgba(168, 144, 255, 0.1) inset,
      0 0 60px rgba(168, 144, 255, 0.1);
    position: relative;
    overflow: hidden;
  }

  .form::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(90deg, 
      transparent, 
      rgba(168, 144, 255, 0.5) 50%, 
      transparent);
  }

  .form-header {
    text-align: center;
    margin-bottom: 8px;
  }

  .form-title {
    font-size: 28px;
    font-weight: 700;
    background: linear-gradient(135deg, #ffffff 0%, #a890ff 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    margin-bottom: 8px;
    letter-spacing: -0.5px;
  }

  .form-subtitle {
    font-size: 14px;
    color: rgba(255, 255, 255, 0.5);
    font-weight: 400;
  }

  .form-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
  }

  .input-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .label-text {
    font-size: 13px;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.8);
    letter-spacing: 0.5px;
    text-transform: uppercase;
    font-size: 11px;
  }

  .input {
    width: 100%;
    padding: 14px 16px;
    background: rgba(15, 15, 30, 0.6);
    border: 1px solid rgba(168, 144, 255, 0.15);
    border-radius: 10px;
    color: rgba(255, 255, 255, 0.9);
    font-size: 15px;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    outline: none;
    font-family: inherit;
  }

  .input::placeholder {
    color: rgba(255, 255, 255, 0.25);
  }

  .input:hover {
    border-color: rgba(168, 144, 255, 0.3);
    background: rgba(15, 15, 30, 0.8);
  }

  .input:focus {
    border-color: rgba(168, 144, 255, 0.6);
    background: rgba(15, 15, 30, 0.9);
    box-shadow: 
      0 0 0 4px rgba(168, 144, 255, 0.1),
      0 0 20px rgba(168, 144, 255, 0.2);
    transform: translateY(-1px);
  }

  .textarea {
    resize: vertical;
    min-height: 100px;
    font-family: inherit;
  }

  .submit {
    margin-top: 8px;
    padding: 16px 32px;
    background: linear-gradient(135deg, #a890ff 0%, #7b68ee 100%);
    border: none;
    border-radius: 10px;
    color: white;
    font-size: 16px;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    position: relative;
    overflow: hidden;
    letter-spacing: 0.5px;
    text-transform: uppercase;
    font-size: 14px;
  }

  .submit::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, 
      transparent, 
      rgba(255, 255, 255, 0.2), 
      transparent);
    transition: left 0.5s;
  }

  .submit:hover::before {
    left: 100%;
  }

  .submit:hover {
    transform: translateY(-3px);
    box-shadow: 
      0 10px 30px rgba(168, 144, 255, 0.4),
      0 0 40px rgba(168, 144, 255, 0.2);
    background: linear-gradient(135deg, #b89fff 0%, #8b75e8 100%);
  }

  .submit:active {
    transform: translateY(-1px);
  }

  .submit:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }

  .send-icon {
    width: 18px;
    height: 18px;
    transition: transform 0.3s;
  }

  .submit:hover .send-icon {
    transform: translateX(3px) translateY(-3px);
  }

  @media (max-width: 768px) {
    .form {
      max-width: 100%;
      padding: 28px 20px;
    }

    .form-grid {
      grid-template-columns: 1fr;
    }

    .form-title {
      font-size: 24px;
    }
  }
`;

export default ContactSection;
