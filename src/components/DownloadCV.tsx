import styled from 'styled-components';
import { useState } from 'react';

interface DownloadCVProps {
  isHidden?: boolean;
}

/** Duração da animação de "instalando" até o estado final. */
const ANIMATION_MS = 4200;

const DownloadCV = ({ isHidden = false }: DownloadCVProps) => {
  const [isAnimating, setIsAnimating] = useState(false);

  const handleDownload = () => {
    if (isAnimating) return;

    // O download começa na hora. Antes a animação segurava o arquivo por 4s no
    // desktop: quem clicava ficava olhando para uma barrinha sem saber se o
    // currículo tinha baixado ou se o botão estava quebrado.
    const link = document.createElement('a');
    link.href = '/CV-David.pdf';
    link.download = 'CV-David-Fernandes.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // A animação segue como confirmação visual do que já aconteceu.
    setIsAnimating(true);
    window.setTimeout(() => setIsAnimating(false), ANIMATION_MS);
  };

  return (
    <StyledWrapper style={{ display: isHidden ? 'none' : 'block' }}>
      <div className="container">
        <label className="label cursor-target">
          <input
            type="checkbox"
            className="input"
            onClick={handleDownload}
            checked={isAnimating}
            readOnly
            // Os rótulos ficam escondidos no mobile, então o nome acessível
            // do controle precisa vir daqui.
            aria-label="Baixar currículo em PDF"
          />
          <span className="circle">
            <svg className="icon" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 19V5m0 14-4-4m4 4 4-4" />
            </svg>
            <div className="square" />
          </span>
          <p className="title">Currículo</p>
          <p className="title">Baixado!</p>
        </label>
      </div>
    </StyledWrapper>
  );
}

const StyledWrapper = styled.div`
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  z-index: 50;
  
  @media (max-width: 768px) {
    bottom: 1.5rem;
    right: 1.5rem;
  }

  .container {
    padding: 0;
    margin: 0;
    box-sizing: border-box;
    /* Herda a Inter do site em vez de forçar Arial. */
    font-family: inherit;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .label {
    background-color: transparent;
    border: 2px solid hsl(var(--primary) / 0.6);
    display: flex;
    align-items: center;
    border-radius: 50px;
    width: 160px;
    cursor: pointer;
    transition: all 0.4s ease;
    padding: 5px;
    position: relative;
  }

  .label::before {
    content: "";
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    background-color: hsl(var(--primary-foreground));
    width: 8px;
    height: 8px;
    transition: all 0.4s ease;
    border-radius: 100%;
    margin: auto;
    opacity: 0;
    visibility: hidden;
  }

  .label .input {
    display: none;
  }

  .label .title {
    font-size: 17px;
    color: hsl(var(--foreground));
    transition: all 0.4s ease;
    position: absolute;
    right: 18px;
    bottom: 14px;
    text-align: center;
  }

  .label .title:last-child {
    opacity: 0;
    visibility: hidden;
  }

  .label .circle {
    height: 45px;
    width: 45px;
    border-radius: 50%;
    background: linear-gradient(135deg, hsl(var(--primary)), hsl(var(--neon-green)));
    display: flex;
    justify-content: center;
    align-items: center;
    transition: all 0.4s ease;
    position: relative;
    box-shadow: 0 0 0 0 hsl(var(--primary));
    overflow: hidden;
  }

  .label .circle .icon {
    color: hsl(var(--primary-foreground));
    width: 30px;
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    transition: all 0.4s ease;
  }

  .label .circle .square {
    aspect-ratio: 1;
    width: 15px;
    border-radius: 2px;
    background-color: hsl(var(--primary-foreground));
    opacity: 0;
    visibility: hidden;
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    transition: all 0.4s ease;
  }

  .label .circle::before {
    content: "";
    position: absolute;
    left: 0;
    top: 0;
    background-color: hsl(var(--accent));
    width: 100%;
    height: 0;
    transition: all 0.4s ease;
  }

  .label:has(.input:checked) {
    width: 57px;
    animation: installed 0.4s ease 3.5s forwards;
  }

  .label:has(.input:checked)::before {
    animation: rotate 3s ease-in-out 0.4s forwards;
  }

  .label .input:checked + .circle {
    animation:
      pulse 1s forwards,
      circleDelete 0.2s ease 3.5s forwards;
    rotate: 180deg;
  }

  .label .input:checked + .circle::before {
    animation: installing 3s ease-in-out forwards;
  }

  .label .input:checked + .circle .icon {
    opacity: 0;
    visibility: hidden;
  }

  .label .input:checked ~ .circle .square {
    opacity: 1;
    visibility: visible;
  }

  .label .input:checked ~ .title {
    opacity: 0;
    visibility: hidden;
  }

  .label .input:checked ~ .title:last-child {
    animation: showInstalledMessage 0.4s ease 3.5s forwards;
  }

  @keyframes pulse {
    0% {
      scale: 0.95;
      box-shadow: 0 0 0 0 hsl(var(--primary) / 0.7);
    }
    70% {
      scale: 1;
      box-shadow: 0 0 0 16px hsl(var(--primary) / 0);
    }
    100% {
      scale: 0.95;
      box-shadow: 0 0 0 0 hsl(var(--primary) / 0);
    }
  }

  @keyframes installing {
    from {
      height: 0;
    }
    to {
      height: 100%;
    }
  }

  @keyframes rotate {
    0% {
      transform: rotate(-90deg) translate(27px) rotate(0);
      opacity: 1;
      visibility: visible;
    }
    99% {
      transform: rotate(270deg) translate(27px) rotate(270deg);
      opacity: 1;
      visibility: visible;
    }
    100% {
      opacity: 0;
      visibility: hidden;
    }
  }

  @keyframes installed {
    100% {
      width: 160px;
      border-color: hsl(var(--neon-green));
    }
  }

  @keyframes circleDelete {
    100% {
      opacity: 0;
      visibility: hidden;
    }
  }

  @keyframes showInstalledMessage {
    100% {
      opacity: 1;
      visibility: visible;
      right: 50px;
    }
  }

  /* No mobile o botão fica só com o círculo. Com os 160px do rótulo ele
     cobria os links de LinkedIn e GitHub no fim do hero. */
  @media (max-width: 768px) {
    .label {
      width: 57px;
    }

    .label .title {
      opacity: 0;
      visibility: hidden;
    }

    .label:has(.input:checked) {
      animation: none;
    }
  }
`;

export default DownloadCV;
