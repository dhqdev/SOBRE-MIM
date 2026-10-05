import { useEffect, useState } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { Command } from 'cmdk';
import {
  ArrowRight,
  ArrowUpRight,
  Briefcase,
  Copy,
  CornerDownLeft,
  Download,
  Gamepad2,
  Github,
  Hash,
  Instagram,
  Linkedin,
  MessageSquareText,
  Search,
  Terminal,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import WhatsAppIcon from './WhatsAppIcon';
import { projects } from '@/lib/projects';
import {
  EMAIL,
  LINKS,
  OPEN_PALETTE_EVENT,
  SECTIONS,
  copyText,
  downloadCv,
  openExternal,
  openGame,
  runInTerminal,
  scrollToSection,
} from '@/lib/site';

interface CommandPaletteProps {
  onOpenExperiences: () => void;
}

type Item = {
  id: string;
  label: string;
  hint?: string;
  keywords?: string[];
  icon: React.ComponentType<{ className?: string }>;
  external?: boolean;
  run: () => void;
};

/**
 * Paleta de comandos estilo VS Code: Ctrl/⌘+K (ou "/") abre de qualquer lugar
 * da página. No celular ela abre pelo botão da navbar e não sobe o teclado
 * sozinha, para a lista inteira caber na tela.
 */
const CommandPalette = ({ onOpenExperiences }: CommandPaletteProps) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === 'k' && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setOpen((value) => !value);
        return;
      }
      // "/" abre a paleta, menos quando a pessoa está digitando em algum campo.
      const target = event.target as HTMLElement | null;
      const typing = target?.closest('input, textarea, [contenteditable="true"]');
      if (event.key === '/' && !typing && !event.metaKey && !event.ctrlKey) {
        event.preventDefault();
        setOpen(true);
      }
    };
    const onOpen = () => setOpen(true);
    document.addEventListener('keydown', onKeyDown);
    window.addEventListener(OPEN_PALETTE_EVENT, onOpen);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      window.removeEventListener(OPEN_PALETTE_EVENT, onOpen);
    };
  }, []);

  useEffect(() => {
    if (!open) setQuery('');
  }, [open]);

  // Fecha primeiro e só depois age: assim o scroll não briga com o foco
  // voltando para o botão que abriu a paleta.
  const select = (item: Item) => {
    setOpen(false);
    window.setTimeout(item.run, 60);
  };

  const groups: { heading: string; items: Item[] }[] = [
    {
      heading: 'Ir para',
      items: SECTIONS.map((section) => ({
        id: `secao-${section.id}`,
        label: section.label,
        keywords: [...section.aliases],
        icon: Hash,
        run: () => scrollToSection(section.id),
      })),
    },
    {
      heading: 'Ações',
      items: [
        {
          id: 'whatsapp',
          label: 'Falar comigo no WhatsApp',
          keywords: ['contato', 'mensagem', 'contratar', 'zap'],
          icon: WhatsAppIcon,
          external: true,
          run: () => openExternal(LINKS.whatsapp),
        },
        {
          id: 'email',
          label: 'Copiar meu e-mail',
          hint: EMAIL,
          keywords: ['email', 'contato'],
          icon: Copy,
          run: () =>
            copyText(EMAIL).then((ok) =>
              ok ? toast.success('E-mail copiado', { description: EMAIL }) : toast(EMAIL),
            ),
        },
        {
          id: 'cv',
          label: 'Baixar currículo',
          hint: 'PDF',
          keywords: ['cv', 'curriculo', 'resume'],
          icon: Download,
          run: downloadCv,
        },
        {
          id: 'mural',
          label: 'Deixar um recado no mural',
          keywords: ['git push', 'recado', 'mensagem'],
          icon: MessageSquareText,
          run: () => runInTerminal('git push'),
        },
        {
          id: 'flappy',
          label: 'Jogar Flappy Bird',
          hint: 'tem ranking',
          keywords: ['jogo', 'game', 'flappy', 'ranking'],
          icon: Gamepad2,
          run: openGame,
        },
        {
          id: 'terminal',
          label: 'Brincar no terminal',
          hint: 'help',
          keywords: ['terminal', 'comandos', 'shell'],
          icon: Terminal,
          run: () => runInTerminal('help'),
        },
        {
          id: 'experiencias',
          label: 'Ver experiências',
          keywords: ['nubank', 'expomafe', 'eventos'],
          icon: Briefcase,
          run: onOpenExperiences,
        },
      ],
    },
    {
      heading: 'Projetos',
      items: projects.map((project) => {
        const [name, ...caption] = project.title.split(' - ');
        return {
          id: `projeto-${name}`,
          label: name,
          hint: caption.join(' - '),
          keywords: project.tags,
          icon: project.icon,
          external: true,
          run: () => openExternal(project.link),
        };
      }),
    },
    {
      heading: 'Redes',
      items: [
        {
          id: 'github',
          label: 'GitHub',
          hint: '@dhqdev',
          icon: Github,
          external: true,
          run: () => openExternal(LINKS.github),
        },
        {
          id: 'linkedin',
          label: 'LinkedIn',
          icon: Linkedin,
          external: true,
          run: () => openExternal(LINKS.linkedin),
        },
        {
          id: 'instagram',
          label: 'Instagram',
          hint: '@david_hqvf',
          icon: Instagram,
          external: true,
          run: () => openExternal(LINKS.instagram),
        },
      ],
    },
  ];

  return (
    <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-[90] bg-black/60 backdrop-blur-sm data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0" />
        <DialogPrimitive.Content
          aria-describedby={undefined}
          onOpenAutoFocus={(event) => {
            // Em tela de toque, não abre o teclado de cara: a lista já resolve.
            if (window.matchMedia('(pointer: coarse)').matches) {
              event.preventDefault();
              (event.currentTarget as HTMLElement | null)?.focus();
            }
          }}
          className="fixed inset-x-3 top-3 z-[100] mx-auto max-w-xl overflow-hidden rounded-2xl border border-white/10 bg-[#0d0d10]/95 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.8),0_0_0_1px_rgba(167,139,250,0.08)] outline-none backdrop-blur-xl data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:slide-in-from-top-2 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 sm:top-[14vh]"
        >
          <DialogPrimitive.Title className="sr-only">Paleta de comandos</DialogPrimitive.Title>
          <Command loop label="Paleta de comandos" className="flex flex-col">
            <div className="flex items-center gap-3 border-b border-white/[0.06] px-4">
              <Search className="h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
              <Command.Input
                value={query}
                onValueChange={setQuery}
                placeholder="Busque uma seção, projeto ou ação…"
                className="h-14 w-full bg-transparent text-base text-foreground outline-none placeholder:text-muted-foreground/60 sm:text-[15px]"
              />
              <kbd className="hidden shrink-0 rounded-md border border-white/10 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground sm:inline">
                esc
              </kbd>
              <DialogPrimitive.Close
                aria-label="Fechar"
                className="-mr-2 shrink-0 rounded-lg p-2 text-muted-foreground transition-colors hover:text-foreground sm:hidden"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </DialogPrimitive.Close>
            </div>

            <Command.List className="max-h-[min(62dvh,440px)] overflow-y-auto overscroll-contain p-2 [scrollbar-width:thin]">
              <Command.Empty className="px-3 py-10 text-center text-sm text-muted-foreground">
                Nada por aqui. Tente "projetos" ou "contato".
              </Command.Empty>

              {groups.map((group) => (
                <Command.Group
                  key={group.heading}
                  heading={group.heading}
                  className="[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:pb-1.5 [&_[cmdk-group-heading]]:pt-3 [&_[cmdk-group-heading]]:font-mono [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-[0.2em] [&_[cmdk-group-heading]]:text-muted-foreground/70"
                >
                  {group.items.map((item) => (
                    <Command.Item
                      key={item.id}
                      value={`${group.heading} ${item.label} ${item.hint ?? ''}`}
                      keywords={item.keywords}
                      onSelect={() => select(item)}
                      className="group flex min-h-12 cursor-pointer items-center gap-3 rounded-xl px-3 text-[15px] text-muted-foreground transition-colors data-[selected=true]:bg-white/[0.06] data-[selected=true]:text-foreground sm:min-h-11"
                    >
                      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg border border-white/[0.06] bg-white/[0.03] text-muted-foreground transition-colors group-data-[selected=true]:border-accent/30 group-data-[selected=true]:text-accent">
                        <item.icon className="h-3.5 w-3.5" />
                      </span>
                      <span className="truncate">{item.label}</span>
                      {item.hint && (
                        <span className="hidden truncate text-xs text-muted-foreground/60 sm:inline">
                          {item.hint}
                        </span>
                      )}
                      <span className="ml-auto shrink-0 text-muted-foreground/50 opacity-0 transition-opacity group-data-[selected=true]:opacity-100">
                        {item.external ? (
                          <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                        ) : (
                          <ArrowRight className="h-4 w-4" aria-hidden="true" />
                        )}
                      </span>
                    </Command.Item>
                  ))}
                </Command.Group>
              ))}
            </Command.List>

            <div className="hidden items-center gap-4 border-t border-white/[0.06] px-4 py-2.5 font-mono text-[11px] text-muted-foreground/70 sm:flex">
              <span>↑↓ navegar</span>
              <span className="inline-flex items-center gap-1">
                <CornerDownLeft className="h-3 w-3" aria-hidden="true" /> abrir
              </span>
              <span className="ml-auto">
                david<span className="text-accent">.</span>
              </span>
            </div>
          </Command>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
};

export default CommandPalette;
