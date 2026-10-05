import { ArrowUpRight, Github, Instagram, Linkedin, Mail } from 'lucide-react';
import WhatsAppIcon from './WhatsAppIcon';
import BlurText from './effects/BlurText';
import Magnet from './effects/Magnet';
import CoffeeMeter from './CoffeeMeter';
import Signature from './Signature';
import { INSTAGRAM_HANDLE, INSTAGRAM_URL, WHATSAPP_URL } from '@/lib/contact';

const socialLinks = [
  { icon: WhatsAppIcon, url: WHATSAPP_URL, label: 'WhatsApp' },
  { icon: Github, url: 'https://github.com/dhqdev', label: 'GitHub' },
  { icon: Linkedin, url: 'https://www.linkedin.com/in/david-fernandes-77a663229/', label: 'LinkedIn' },
  { icon: Instagram, url: INSTAGRAM_URL, label: 'Instagram' },
  { icon: Mail, url: 'mailto:david@tekvosoft.dev', label: 'Email' },
];

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer id="contato" className="relative z-10">
      {/* Chamada final */}
      <div className="mx-auto max-w-7xl px-6 lg:px-10 py-20 md:py-28">
        <p className="scroll-reveal flex items-center gap-3 font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
          <span className="text-accent">06</span>
          <span className="h-px w-8 bg-border" aria-hidden="true" />
          Contato
        </p>
        <h2 className="mt-5 text-4xl font-semibold leading-[1.05] tracking-[-0.04em] sm:text-6xl md:text-7xl">
          <BlurText text="Vamos construir" className="block text-foreground" />
          <span className="block text-muted-foreground/60">
            <BlurText text="algo" delay={200} />{' '}
            <BlurText text="juntos?" delay={290} wordClassName="text-gradient-violet pb-[0.08em]" />
          </span>
        </h2>
        <p className="scroll-reveal mt-6 max-w-md text-lg text-muted-foreground">
          Disponível para projetos freelance e oportunidades full-time.
        </p>
        <div className="scroll-reveal mt-10 flex flex-wrap items-center gap-3">
          <Magnet>
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-12 items-center gap-2.5 rounded-[11px] bg-foreground px-6 text-[15px] font-medium text-background transition-opacity hover:opacity-90"
            >
              <WhatsAppIcon className="h-4 w-4" />
              Falar comigo no WhatsApp
            </a>
          </Magnet>
          <a
            href={INSTAGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-12 items-center gap-2 rounded-xl border border-white/10 px-5 text-[15px] font-medium text-foreground transition-colors hover:bg-white/[0.04]"
          >
            <Instagram className="h-4 w-4 text-accent" aria-hidden="true" />@{INSTAGRAM_HANDLE}
          </a>
        </div>

        <div className="mt-16 grid grid-cols-1 items-center gap-10 md:grid-cols-2 md:gap-12">
          <div className="scroll-reveal">
            <CoffeeMeter />
          </div>
          <div className="md:justify-self-end">
            <Signature className="w-[min(100%,360px)] md:w-[400px]" />
            <p className="mt-2 font-mono text-xs text-muted-foreground">
              — feito à mão, com carinho e muito café
            </p>
          </div>
        </div>
      </div>

      <div className="border-t border-border">
        <div className="mx-auto flex max-w-7xl flex-col-reverse gap-6 px-6 lg:px-10 py-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            © {currentYear} David Fernandes. Feito com React, TypeScript e bastante café.
          </p>

          <ul className="flex flex-wrap gap-1 list-none p-0">
            {socialLinks.map((social) => (
              <li key={social.label}>
                <a
                  href={social.url}
                  target={social.url.startsWith('mailto:') ? undefined : '_blank'}
                  rel="noopener noreferrer"
                  className="group inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-white/[0.04] hover:text-foreground"
                >
                  <social.icon className="h-4 w-4" aria-hidden="true" />
                  {social.label}
                  <ArrowUpRight
                    className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100"
                    aria-hidden="true"
                  />
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
