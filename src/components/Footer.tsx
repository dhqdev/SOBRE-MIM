import { Github, Linkedin, Mail } from 'lucide-react';
import WhatsAppIcon from './WhatsAppIcon';
import { WHATSAPP_URL } from '@/lib/contact';

const socialLinks = [
  { icon: WhatsAppIcon, url: WHATSAPP_URL, label: 'WhatsApp' },
  { icon: Github, url: 'https://github.com/dhqdev', label: 'GitHub' },
  { icon: Linkedin, url: 'https://www.linkedin.com/in/david-fernandes-77a663229/', label: 'LinkedIn' },
  { icon: Mail, url: 'mailto:david@tekvosoft.dev', label: 'Email' },
];

const navLinks = [
  { href: '#projetos', label: 'Projetos' },
  { href: '#sobre', label: 'Sobre' },
  { href: '#tecnologias', label: 'Habilidades' },
];

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="py-12 border-t border-border relative z-10">
      <div className="container mx-auto px-6">
        <div className="max-w-6xl mx-auto space-y-8 text-center">
          <nav aria-label="Navegação do rodapé">
            <ul className="flex flex-wrap justify-center gap-x-8 gap-y-3 list-none p-0">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="text-muted-foreground hover:text-primary transition-colors duration-300"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="flex justify-center gap-4">
            {socialLinks.map((social) => (
              <a
                key={social.label}
                href={social.url}
                target={social.url.startsWith('mailto:') ? undefined : '_blank'}
                rel="noopener noreferrer"
                className="group p-3 rounded-lg bg-card border border-border hover:border-primary transition-colors duration-300"
                aria-label={social.label}
              >
                <social.icon
                  className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors"
                  aria-hidden="true"
                />
              </a>
            ))}
          </div>

          <div className="pt-8 border-t border-border space-y-2">
            <p className="text-sm text-muted-foreground">
              © {currentYear} David Fernandes. Feito com React, TypeScript e bastante café.
            </p>
            <p className="text-xs text-muted-foreground/60 font-mono">
              Disponível para projetos freelance e oportunidades full-time.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
