import { useEffect, useState } from 'react';
import { Menu, Sparkles, X } from 'lucide-react';
import WhatsAppIcon from './WhatsAppIcon';
import { WHATSAPP_URL } from '@/lib/contact';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';

const NAV_LINKS = [
  { href: '#projetos', label: 'Projetos' },
  { href: '#sobre', label: 'Sobre' },
  { href: '#tecnologias', label: 'Habilidades' },
];

/** A partir daqui a barra ganha fundo — antes disso ela flutua sobre o hero. */
const SCROLL_THRESHOLD = 40;

interface NavbarProps {
  onOpenExperiences: () => void;
}

const Navbar = ({ onOpenExperiences }: NavbarProps) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<string>('');
  const prefersReducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > SCROLL_THRESHOLD);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Marca na barra a seção que está sendo lida. O rootMargin recorta a
  // viewport numa faixa central, então a seção só "acende" quando de fato
  // domina a tela — e não assim que uma borda dela aparece.
  useEffect(() => {
    const sections = NAV_LINKS.map(({ href }) => document.querySelector(href)).filter(
      (el): el is Element => el !== null
    );
    if (sections.length === 0 || !('IntersectionObserver' in window)) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting);
        if (visible.length > 0) setActiveSection(`#${visible[0].target.id}`);
      },
      { rootMargin: '-45% 0px -45% 0px' }
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  // Esc fecha o menu mobile.
  useEffect(() => {
    if (!isMobileOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsMobileOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isMobileOpen]);

  const handleNavClick = (event: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    event.preventDefault();
    setIsMobileOpen(false);
    document.querySelector(href)?.scrollIntoView({
      behavior: prefersReducedMotion ? 'auto' : 'smooth',
    });
  };

  return (
    <header
      className={`fixed top-0 inset-x-0 z-[60] transition-colors duration-300 ${
        isScrolled || isMobileOpen
          ? 'bg-background/80 backdrop-blur-xl border-b border-border/60'
          : 'bg-transparent border-b border-transparent'
      }`}
    >
      <nav
        aria-label="Navegação principal"
        className="container mx-auto px-4 md:px-6 h-16 flex items-center justify-between gap-4"
      >
        <a
          href="#home"
          onClick={(event) => handleNavClick(event, '#home')}
          className="cursor-target flex items-center gap-2 font-mono text-base font-bold shrink-0"
        >
          <span className="bg-gradient-to-br from-primary to-accent bg-clip-text text-transparent">
            &gt;_
          </span>
          <span className="text-foreground">david</span>
        </a>

        {/* Desktop */}
        <ul className="hidden md:flex items-center gap-1 list-none p-0">
          {NAV_LINKS.map((link) => {
            const isActive = activeSection === link.href;
            return (
              <li key={link.href}>
                <a
                  href={link.href}
                  onClick={(event) => handleNavClick(event, link.href)}
                  aria-current={isActive ? 'true' : undefined}
                  className={`cursor-target relative px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-300 ${
                    isActive
                      ? 'text-primary'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {link.label}
                  <span
                    className={`absolute inset-x-4 -bottom-0.5 h-px bg-gradient-to-r from-primary to-accent transition-opacity duration-300 ${
                      isActive ? 'opacity-100' : 'opacity-0'
                    }`}
                  />
                </a>
              </li>
            );
          })}
        </ul>

        <div className="hidden md:flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={onOpenExperiences}
            aria-haspopup="dialog"
            aria-controls="painel-experiencias"
            className="cursor-target inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-accent/40 bg-accent/10 text-accent text-sm font-medium transition-colors duration-300 hover:bg-accent/20 hover:border-accent/70"
          >
            <Sparkles className="w-4 h-4" aria-hidden="true" />
            Experiências
          </button>

          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="cursor-target inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-neon-green to-primary text-[#062f1c] text-sm font-semibold transition-transform duration-300 hover:-translate-y-0.5"
          >
            <WhatsAppIcon className="w-4 h-4" />
            Contato
          </a>
        </div>

        {/* Mobile */}
        <button
          type="button"
          onClick={() => setIsMobileOpen((open) => !open)}
          aria-label={isMobileOpen ? 'Fechar menu' : 'Abrir menu'}
          aria-expanded={isMobileOpen}
          aria-controls="menu-mobile"
          className="md:hidden p-2 -mr-2 rounded-lg text-foreground hover:bg-foreground/10 transition-colors"
        >
          {isMobileOpen ? (
            <X className="w-5 h-5" aria-hidden="true" />
          ) : (
            <Menu className="w-5 h-5" aria-hidden="true" />
          )}
        </button>
      </nav>

      <div
        id="menu-mobile"
        {...(!isMobileOpen && { inert: '' })}
        className={`md:hidden overflow-hidden border-t transition-[max-height,opacity] duration-300 ${
          isMobileOpen ? 'max-h-96 opacity-100 border-border/60' : 'max-h-0 opacity-0 border-transparent'
        }`}
      >
        <ul className="container mx-auto px-4 py-4 space-y-1 list-none">
          {NAV_LINKS.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                onClick={(event) => handleNavClick(event, link.href)}
                className="block px-4 py-3 rounded-lg text-base font-medium text-muted-foreground hover:text-foreground hover:bg-foreground/5 transition-colors"
              >
                {link.label}
              </a>
            </li>
          ))}

          <li>
            <button
              type="button"
              onClick={() => {
                setIsMobileOpen(false);
                onOpenExperiences();
              }}
              aria-haspopup="dialog"
              aria-controls="painel-experiencias"
              className="w-full flex items-center gap-2 px-4 py-3 rounded-lg text-base font-medium text-accent hover:bg-accent/10 transition-colors"
            >
              <Sparkles className="w-4 h-4" aria-hidden="true" />
              Experiências
            </button>
          </li>

          <li className="pt-2">
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setIsMobileOpen(false)}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-gradient-to-r from-neon-green to-primary text-[#062f1c] font-semibold"
            >
              <WhatsAppIcon className="w-4 h-4" />
              Falar comigo
            </a>
          </li>
        </ul>
      </div>
    </header>
  );
};

export default Navbar;
