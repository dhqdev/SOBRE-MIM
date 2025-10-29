import styled from 'styled-components';
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
              Sobre <span className="text-primary">Mim</span>
            </h2>
            <div className="w-20 h-1 bg-gradient-to-r from-primary to-accent mx-auto mt-4"></div>
          </div>

          {/* Main Content - Styled Card */}
          <StyledWrapper>
            <div className="flex justify-center scroll-reveal">
              <div className="notification cursor-target">
                <div className="notiglow" />
                <div className="notiborderglow" />
                
                <div className="notititle">Desenvolvedor Full-Stack</div>
                
                <div className="notibody">
                  <p className="mb-4">
                    Sou desenvolvedor full-stack com <strong>2+ anos de experiência</strong>, 
                    especializado em <strong>Vue.js, React, JS e Python</strong>. 
                    Atualmente na <strong>GRV Software</strong>, desenvolvo dentro do frappe Framework com diversas integrações.
                  </p>

                  <p className="mb-4">
                    Minha expertise inclui conhecimento em <strong>ERP Protheus</strong> advindo da TOTVS, 
                    desenvolvimento de software usando várias linguagens mas a principal sendo <strong>Python</strong>, 
                    integração de APIs, automação usando <strong>Docker e n8n</strong>, 
                    criação de dashboards analíticos integrados com banco de dados.
                  </p>

                  <blockquote className="quote-section">
                    <p className="quote-text">
                      "The people who are crazy enough to think they can change the world are the ones who do."
                    </p>
                    <span className="quote-author">- Steve Jobs</span>
                  </blockquote>
                </div>
              </div>
            </div>
          </StyledWrapper>
        </div>
      </div>
    </section>
  );
};

const StyledWrapper = styled.div`
  .notification {
    display: flex;
    flex-direction: column;
    isolation: isolate;
    position: relative;
    width: 100%;
    max-width: 50rem;
    min-height: 28rem;
    background: #29292c;
    border-radius: 1rem;
    overflow: hidden;
    font-family: 'Gill Sans', 'Gill Sans MT', Calibri, 'Trebuchet MS', sans-serif;
    font-size: 16px;
    --gradient: linear-gradient(to bottom, #2eadff, #3d83ff, #7e61ff);
    --color: #32a6ff;
    transition: transform 300ms ease;
  }

  .notification:hover {
    transform: translateY(-5px);
  }

  .notification:before {
    position: absolute;
    content: "";
    inset: 0.0625rem;
    border-radius: 0.9375rem;
    background: #18181b;
    z-index: 2
  }

  .notification:after {
    position: absolute;
    content: "";
    width: 0.25rem;
    inset: 0.65rem auto 0.65rem 0.5rem;
    border-radius: 0.125rem;
    background: var(--gradient);
    transition: transform 300ms ease;
    z-index: 4;
  }

  .notification:hover:after {
    transform: translateX(0.15rem)
  }

  .notititle {
    color: var(--color);
    padding: 1.5rem 1.25rem 1rem 1.5rem;
    font-weight: 700;
    font-size: 1.8rem;
    transition: transform 300ms ease;
    z-index: 5;
  }

  .notification:hover .notititle {
    transform: translateX(0.15rem)
  }

  .notibody {
    color: #d4d4d8;
    padding: 0 1.5rem 1.5rem 1.5rem;
    line-height: 1.7;
    transition: transform 300ms ease;
    z-index: 5;
  }

  .notibody p {
    margin-bottom: 1rem;
  }

  .notibody strong {
    color: var(--color);
    font-weight: 600;
  }

  .notification:hover .notibody {
    transform: translateX(0.25rem)
  }

  .quote-section {
    margin-top: 1.5rem;
    padding: 1.2rem;
    border-left: 4px solid var(--color);
    background: rgba(50, 166, 255, 0.1);
    border-radius: 0.5rem;
  }

  .quote-text {
    color: #e4e4e7;
    font-style: italic;
    font-size: 1rem;
    line-height: 1.6;
    margin-bottom: 0.5rem;
  }

  .quote-author {
    color: var(--color);
    font-weight: 600;
    font-size: 0.9rem;
  }

  .notiglow,
  .notiborderglow {
    position: absolute;
    width: 20rem;
    height: 20rem;
    transform: translate(-50%, -50%);
    background: radial-gradient(circle closest-side at center, white, transparent);
    opacity: 0;
    transition: opacity 300ms ease;
  }

  .notiglow {
    z-index: 3;
  }

  .notiborderglow {
    z-index: 1;
  }

  .notification:hover .notiglow {
    opacity: 0.1
  }

  .notification:hover .notiborderglow {
    opacity: 0.1
  }

  @media (max-width: 768px) {
    .notification {
      max-width: 100%;
      min-height: auto;
    }

    .notititle {
      font-size: 1.5rem;
      padding: 1.2rem 1rem 0.8rem 1.2rem;
    }

    .notibody {
      font-size: 0.95rem;
      padding: 0 1.2rem 1.2rem 1.2rem;
    }
  }
`;

export default AboutSection;
