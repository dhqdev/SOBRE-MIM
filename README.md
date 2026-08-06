# Portfólio — David Fernandes

Site pessoal onde apresento meus projetos, minha stack e um canal direto de contato.

🔗 **https://sobre-mim-nine-gold.vercel.app**

## Stack

| Camada     | Ferramentas                                       |
| ---------- | ------------------------------------------------- |
| Build      | Vite 5 + TypeScript                               |
| UI         | React 18, Tailwind CSS, shadcn/ui                 |
| Estilo     | styled-components (componentes com CSS próprio)   |
| Animação   | GSAP (cursor), OGL/WebGL (fundo iridescente)      |
| Deploy     | Vercel                                            |

## Rodando localmente

```bash
npm install
npm run dev      # http://localhost:8080
```

Outros comandos:

```bash
npm run build    # build de produção em dist/
npm run preview  # serve o build local
npm run lint     # ESLint
```

## Estrutura

```
src/
├── components/          # seções da página e componentes visuais
│   ├── TerminalHero     # topo: apresentação, stats, CTAs e card de terminal
│   ├── ProjectsSection  # cards de projeto (grid no mobile, stack no desktop)
│   ├── AboutSection     # história e especialidades
│   ├── TechStackSection # grade de tecnologias
│   ├── HamburgerMenu    # painel lateral de experiências
│   ├── Iridescence      # fundo WebGL
│   ├── TargetCursor     # cursor customizado (desktop, sem touch)
│   └── ui/              # primitivos do shadcn/ui
├── hooks/
│   ├── useScrollReveal          # revela seções ao entrar na viewport
│   └── usePrefersReducedMotion  # respeita "reduzir movimento" do SO
└── pages/               # Index e NotFound
```

## Onde editar o conteúdo

| O que                     | Arquivo                                |
| ------------------------- | -------------------------------------- |
| Projetos                  | `src/components/ProjectsSection.tsx`   |
| Tecnologias               | `src/components/TechStackSection.tsx`  |
| Texto "Sobre" / skills    | `src/components/AboutSection.tsx`      |
| Frases do efeito de digitação e stats | `src/components/TerminalHero.tsx` |
| Experiências (painel)     | `src/components/HamburgerMenu.tsx`     |
| Links sociais             | `src/components/Footer.tsx`            |
| Número do WhatsApp        | `src/lib/contact.ts`                   |
| Currículo em PDF          | `public/CV-David.pdf`                  |
| Meta tags / SEO           | `index.html`                           |

O contato acontece por link direto do WhatsApp. Número e mensagem padrão ficam
em `src/lib/contact.ts` — mudar ali atualiza o botão do hero e o rodapé de uma vez.

## Acessibilidade e performance

- `prefers-reduced-motion` desliga o fundo WebGL, o cursor customizado e o
  efeito de digitação.
- Imagens em WebP e vídeo carregado só quando entra na viewport.
- Fontes com `preconnect` e carga não bloqueante.
- Foco visível em toda a navegação por teclado; painel lateral fecha com `Esc`.

## Otimizando novos assets

Imagens e vídeos entram em `public/lovable-uploads/`. Antes de commitar:

```bash
# imagem → WebP (máx. 1280px de largura)
ffmpeg -i entrada.png -vf "scale='min(1280,iw)':-2" -c:v libwebp -quality 82 saida.webp

# vídeo → 720p 30fps, otimizado para streaming
ffmpeg -i entrada.mp4 -vf "scale=1280:-2,fps=30" -c:v libx264 -crf 30 \
  -pix_fmt yuv420p -movflags +faststart -an saida.mp4
```
