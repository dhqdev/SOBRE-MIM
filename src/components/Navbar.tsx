import { useEffect, useState } from 'react';
import { Menu, X } from 'lucide-react';
import { WHATSAPP_URL } from '@/lib/contact';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';

const NAV_LINKS = [
  { href: '#projetos', label: 'Projetos' },
  { href: '#sobre', label: 'Sobre' },
  { href: '#tecnologias', label: 'Stack' },
];

/** A partir daqui a barra ganha fundo — antes disso ela flutua sobre o hero. */
const SCROLL_THRESHOLD = 24;

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

  const surface =
    isScrolled || isMobileOpen
      ? 'bg-background/70 border-white/10 backdrop-blur-xl shadow-[0_8px_30px_rgba(0,0,0,0.35)]'
      : 'bg-transparent border-transparent';

  return (
    <header className="fixed top-0 inset-x-0 z-[60] px-4 pt-4">
      <div className={`mx-auto max-w-5xl rounded-2xl border transition-all duration-500 ${surface}`}>
        <nav
          aria-label="Navegação principal"
          className="h-14 pl-6 pr-2 flex items-center justify-between gap-4"
        >
          <a
            href="#home"
            onClick={(event) => handleNavClick(event, '#home')}
            className="text-sm font-semibold tracking-tight text-foreground"
          >
            david<span className="text-accent">.</span>
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
                    className={`px-3 py-1.5 rounded-lg text-sm transition-colors duration-300 ${
                      isActive ? 'text-foreground bg-white/[0.06]' : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {link.label}
                  </a>
                </li>
              );
            })}
            <li>
              <button
                type="button"
                onClick={onOpenExperiences}
                aria-haspopup="dialog"
                aria-controls="painel-experiencias"
                className="px-3 py-1.5 rounded-lg text-sm text-muted-foreground hover:text-foreground transition-colors duration-300"
              >
                Experiências
              </button>
            </li>
          </ul>

          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden md:inline-flex items-center h-9 px-4 rounded-xl bg-foreground text-background text-sm font-medium transition-opacity hover:opacity-85"
          >
            Contato
          </a>

          {/* Mobile */}
          <button
            type="button"
            onClick={() => setIsMobileOpen((open) => !open)}
            aria-label={isMobileOpen ? 'Fechar menu' : 'Abrir menu'}
            aria-expanded={isMobileOpen}
            aria-controls="menu-mobile"
            className="md:hidden p-2.5 rounded-xl text-foreground hover:bg-white/[0.06] transition-colors"
          >
            {isMobileOpen ? <X className="w-5 h-5" aria-hidden="true" /> : <Menu className="w-5 h-5" aria-hidden="true" />}
          </button>
        </nav>

        <div
          id="menu-mobile"
          {...(!isMobileOpen && { inert: '' })}
          className={`md:hidden overflow-hidden transition-[max-height,opacity] duration-300 ${
            isMobileOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          <ul className="px-2 pb-3 space-y-0.5 list-none">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  onClick={(event) => handleNavClick(event, link.href)}
                  className="block px-3 py-2.5 rounded-xl text-base text-muted-foreground hover:text-foreground hover:bg-white/[0.04] transition-colors"
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
                className="w-full text-left px-3 py-2.5 rounded-xl text-base text-muted-foreground hover:text-foreground hover:bg-white/[0.04] transition-colors"
              >
                Experiências
              </button>
            </li>
            <li className="pt-2 px-1">
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setIsMobileOpen(false)}
                className="flex items-center justify-center h-11 rounded-xl bg-foreground text-background font-medium"
              >
                Falar comigo
              </a>
            </li>
          </ul>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
