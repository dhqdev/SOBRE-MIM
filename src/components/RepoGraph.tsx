import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowUpRight, Maximize2, Minus, Plus } from 'lucide-react';
import { LANGUAGE_COLORS, GITHUB_URL, GITHUB_USER, timeAgo, type GitHubData } from '@/lib/github';

type Kind = 'user' | 'lang' | 'repo' | 'commit';

interface Node {
  id: string;
  kind: Kind;
  label: string;
  r: number;
  color: string;
  url?: string;
  detail?: string;
  meta?: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  fixed?: boolean;
}

interface Edge {
  a: number;
  b: number;
  length: number;
}

const REST: Record<string, number> = { 'user-lang': 95, 'lang-repo': 58, 'repo-commit': 26 };

/** Monta os nós e ligações: você no centro, linguagens em volta, repositórios e commits nas pontas. */
const buildGraph = (data: GitHubData) => {
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  const index = new Map<string, number>();
  const add = (node: Omit<Node, 'x' | 'y' | 'vx' | 'vy'>) => {
    const angle = Math.random() * Math.PI * 2;
    const distance = node.kind === 'user' ? 0 : 40 + Math.random() * 120;
    index.set(node.id, nodes.length);
    nodes.push({ ...node, x: Math.cos(angle) * distance, y: Math.sin(angle) * distance, vx: 0, vy: 0 });
    return nodes.length - 1;
  };
  const link = (a: number, b: number, type: string) => edges.push({ a, b, length: REST[type] });

  const user = add({ id: 'user', kind: 'user', label: GITHUB_USER, r: 15, color: '', url: GITHUB_URL });
  const repos = data.allRepos ?? data.repos;

  for (const repo of repos) {
    const language = repo.language ?? 'Outros';
    const langId = `lang:${language}`;
    if (!index.has(langId)) {
      const lang = add({
        id: langId,
        kind: 'lang',
        label: language,
        r: 8,
        color: LANGUAGE_COLORS[language] ?? '#8b8b95',
      });
      link(user, lang, 'user-lang');
    }
    const repoNode = add({
      id: `repo:${repo.name}`,
      kind: 'repo',
      label: repo.name,
      r: 4.5 + Math.min(5, repo.stars * 1.2),
      color: '',
      url: repo.url,
      detail: repo.description ?? 'Sem descrição.',
      meta: [language, repo.stars ? `★ ${repo.stars}` : '', `atualizado ${timeAgo(repo.pushedAt)}`]
        .filter(Boolean)
        .join(' · '),
    });
    link(index.get(langId)!, repoNode, 'lang-repo');
  }

  data.commits.forEach((commit) => {
    const repo = index.get(`repo:${commit.repo}`);
    if (repo === undefined) return;
    const node = add({
      id: `commit:${commit.sha}`,
      kind: 'commit',
      label: commit.sha,
      r: 2.6,
      color: '',
      url: commit.url,
      detail: commit.message,
      meta: `${commit.repo} · ${timeAgo(commit.date)}`,
    });
    link(repo, node, 'repo-commit');
  });

  // Quantos repositórios cada linguagem tem, pra mostrar no detalhe.
  nodes.forEach((node, i) => {
    if (node.kind !== 'lang') return;
    const count = edges.filter((edge) => edge.a === i && nodes[edge.b].kind === 'repo').length;
    node.r = 7 + Math.min(6, count);
    node.meta = `${count} ${count === 1 ? 'repositório' : 'repositórios'}`;
  });

  const neighbors = nodes.map(() => new Set<number>());
  edges.forEach(({ a, b }) => {
    neighbors[a].add(b);
    neighbors[b].add(a);
  });

  return { nodes, edges, neighbors };
};

/**
 * Mapa do código no estilo do grafo do Obsidian: bolinhas ligadas que se
 * arrumam sozinhas (simulação de forças em canvas) e podem ser arrastadas.
 * No celular, arrastar o fundo continua rolando a página; só as bolinhas
 * prendem o dedo.
 */
const RepoGraph = ({ data }: { data: GitHubData }) => {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const graph = useMemo(() => buildGraph(data), [data]);
  const [active, setActive] = useState<Node | null>(null);
  const controls = useRef({ zoom: (_factor: number) => {}, reset: () => {} });

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !wrap || !ctx) return;

    const { nodes, edges, neighbors } = graph;
    const accent = () =>
      getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '258 90% 76%';
    let accentHsl = accent();
    const color = (alpha = 1) => `hsl(${accentHsl} / ${alpha})`;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let width = 0;
    let height = 0;
    let scale = 1;
    let zoom = 1;
    let pan = { x: 0, y: 0 };
    let alpha = 1;
    let frame = 0;
    let visible = false;
    let hover = -1;
    let selected = -1;
    let drag: { node: number; moved: boolean; startX: number; startY: number } | null = null;
    let panning: { x: number; y: number; panX: number; panY: number; moved: boolean } | null = null;

    const tick = () => {
      // Repulsão entre todos (n pequeno, então O(n²) tá ótimo).
      for (let i = 0; i < nodes.length; i += 1) {
        for (let j = i + 1; j < nodes.length; j += 1) {
          const a = nodes[i];
          const b = nodes[j];
          let dx = b.x - a.x;
          let dy = b.y - a.y;
          let d2 = dx * dx + dy * dy;
          if (d2 < 0.01) {
            dx = Math.random() - 0.5;
            dy = Math.random() - 0.5;
            d2 = 0.25;
          }
          const force = ((a.kind === 'commit' || b.kind === 'commit' ? 260 : 900) * alpha) / d2;
          const d = Math.sqrt(d2);
          const fx = (dx / d) * force;
          const fy = (dy / d) * force;
          a.vx -= fx;
          a.vy -= fy;
          b.vx += fx;
          b.vy += fy;
        }
      }
      // Molas nas ligações.
      for (const edge of edges) {
        const a = nodes[edge.a];
        const b = nodes[edge.b];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const d = Math.sqrt(dx * dx + dy * dy) || 1;
        const k = ((d - edge.length) / d) * 0.08 * alpha;
        a.vx += dx * k;
        a.vy += dy * k;
        b.vx -= dx * k;
        b.vy -= dy * k;
      }
      for (const node of nodes) {
        // Puxadinha pro centro, pra nada fugir da tela.
        node.vx -= node.x * 0.004 * alpha;
        node.vy -= node.y * 0.004 * alpha;
        if (node.fixed || node.kind === 'user') {
          node.vx = 0;
          node.vy = 0;
          if (node.kind === 'user' && !node.fixed) {
            node.x *= 0.9;
            node.y *= 0.9;
          }
          continue;
        }
        node.vx *= 0.82;
        node.vy *= 0.82;
        node.x += node.vx;
        node.y += node.vy;
      }
      alpha = Math.max(0, alpha * 0.985);
    };

    const toWorld = (clientX: number, clientY: number) => {
      const rect = canvas.getBoundingClientRect();
      const s = scale * zoom;
      return {
        x: (clientX - rect.left - width / 2 - pan.x) / s,
        y: (clientY - rect.top - height / 2 - pan.y) / s,
      };
    };

    const hit = (clientX: number, clientY: number) => {
      const p = toWorld(clientX, clientY);
      const slop = 10 / (scale * zoom);
      let found = -1;
      let bestDistance = Infinity;
      nodes.forEach((node, i) => {
        const d = Math.hypot(node.x - p.x, node.y - p.y);
        if (d < node.r + slop && d < bestDistance) {
          bestDistance = d;
          found = i;
        }
      });
      return found;
    };

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      ctx.save();
      ctx.translate(width / 2 + pan.x, height / 2 + pan.y);
      const s = scale * zoom;
      ctx.scale(s, s);

      const focus = hover >= 0 ? hover : selected;
      const lit = focus >= 0 ? new Set([focus, ...neighbors[focus]]) : null;

      for (const edge of edges) {
        const a = nodes[edge.a];
        const b = nodes[edge.b];
        const on = lit && (edge.a === focus || edge.b === focus);
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.strokeStyle = on ? color(0.7) : lit ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.1)';
        ctx.lineWidth = (on ? 1.4 : 1) / s;
        ctx.stroke();
      }

      nodes.forEach((node, i) => {
        const dim = lit && !lit.has(i);
        const fill =
          node.kind === 'user'
            ? color(1)
            : node.kind === 'lang'
              ? node.color
              : node.kind === 'repo'
                ? i === focus
                  ? color(1)
                  : '#d4d4dc'
                : color(0.75);
        ctx.globalAlpha = dim ? 0.18 : 1;
        if (node.kind === 'user' || i === focus) {
          ctx.shadowColor = color(0.9);
          ctx.shadowBlur = 18;
        }
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.r, 0, Math.PI * 2);
        ctx.fillStyle = fill;
        ctx.fill();
        ctx.shadowBlur = 0;
        if (i === selected) {
          ctx.beginPath();
          ctx.arc(node.x, node.y, node.r + 4 / s, 0, Math.PI * 2);
          ctx.strokeStyle = color(0.8);
          ctx.lineWidth = 1.5 / s;
          ctx.stroke();
        }

        const showLabel =
          node.kind === 'user' ||
          node.kind === 'lang' ||
          (lit ? lit.has(i) && node.kind !== 'commit' : node.kind === 'repo' && node.r >= 6) ||
          i === focus;
        if (showLabel) {
          const size = (node.kind === 'user' ? 13 : node.kind === 'lang' ? 11.5 : 11) / Math.max(0.8, s);
          ctx.font = `${node.kind === 'repo' || node.kind === 'commit' ? 400 : 600} ${size}px "Geist Variable", system-ui, sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'top';
          ctx.fillStyle =
            node.kind === 'user' ? '#f5f5f5' : node.kind === 'lang' ? '#e5e5ea' : 'rgba(229,229,234,0.8)';
          ctx.fillText(node.label, node.x, node.y + node.r + 4 / s);
        }
        ctx.globalAlpha = 1;
      });
      ctx.restore();
    };

    const loop = () => {
      frame = 0;
      if (!reduced) tick();
      draw();
      if (visible && (alpha > 0.005 || drag)) frame = requestAnimationFrame(loop);
    };
    const wake = (heat = 0) => {
      alpha = Math.max(alpha, heat);
      if (!frame) frame = requestAnimationFrame(loop);
    };

    const fit = () => {
      const rect = wrap.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      scale = Math.max(0.55, Math.min(1.45, Math.min(width, height * 1.25) / 420));
      wake();
    };

    if (reduced) for (let i = 0; i < 300; i += 1) tick();

    // Ponteiro: mouse arrasta bolinha ou o fundo; dedo só prende se pegar uma bolinha.
    const onPointerDown = (event: PointerEvent) => {
      const index = hit(event.clientX, event.clientY);
      if (index >= 0) {
        drag = { node: index, moved: false, startX: event.clientX, startY: event.clientY };
        nodes[index].fixed = true;
        canvas.setPointerCapture(event.pointerId);
        wake(0.3);
      } else if (event.pointerType === 'mouse') {
        panning = { x: event.clientX, y: event.clientY, panX: pan.x, panY: pan.y, moved: false };
        canvas.setPointerCapture(event.pointerId);
      } else {
        // Toque no vazio: deixa a página rolar e só limpa a seleção.
        selected = -1;
        setActive(null);
        wake();
      }
    };

    const onPointerMove = (event: PointerEvent) => {
      if (drag) {
        if (Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY) > 4) drag.moved = true;
        const p = toWorld(event.clientX, event.clientY);
        const node = nodes[drag.node];
        node.x = p.x;
        node.y = p.y;
        wake(0.3);
        return;
      }
      if (panning) {
        const dx = event.clientX - panning.x;
        const dy = event.clientY - panning.y;
        if (Math.hypot(dx, dy) > 3) panning.moved = true;
        pan = { x: panning.panX + dx, y: panning.panY + dy };
        wake();
        return;
      }
      if (event.pointerType !== 'mouse') return;
      const index = hit(event.clientX, event.clientY);
      if (index !== hover) {
        hover = index;
        canvas.style.cursor = index >= 0 ? 'grab' : 'default';
        setActive(index >= 0 ? nodes[index] : selected >= 0 ? nodes[selected] : null);
        wake();
      }
    };

    const onPointerUp = () => {
      if (drag) {
        const node = nodes[drag.node];
        node.fixed = false;
        if (!drag.moved) {
          selected = selected === drag.node ? -1 : drag.node;
          setActive(selected >= 0 ? nodes[selected] : null);
        }
        drag = null;
        wake(0.2);
      } else if (panning) {
        if (!panning.moved) {
          selected = -1;
          setActive(hover >= 0 ? nodes[hover] : null);
        }
        panning = null;
        wake();
      }
    };

    const onPointerLeave = () => {
      if (hover < 0) return;
      hover = -1;
      setActive(selected >= 0 ? nodes[selected] : null);
      wake();
    };

    // No toque, impede o scroll só quando o dedo pega uma bolinha.
    const onTouchStart = (event: TouchEvent) => {
      const touch = event.touches[0];
      if (touch && hit(touch.clientX, touch.clientY) >= 0) event.preventDefault();
    };

    // Zoom com Ctrl/⌘ + roda (sem Ctrl a roda rola a página normalmente).
    const onWheel = (event: WheelEvent) => {
      if (!event.ctrlKey && !event.metaKey) return;
      event.preventDefault();
      zoom = Math.max(0.5, Math.min(2.5, zoom * (event.deltaY < 0 ? 1.1 : 0.9)));
      wake();
    };

    controls.current = {
      zoom: (factor) => {
        zoom = Math.max(0.5, Math.min(2.5, zoom * factor));
        wake();
      },
      reset: () => {
        zoom = 1;
        pan = { x: 0, y: 0 };
        wake(0.6);
      },
    };

    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerup', onPointerUp);
    canvas.addEventListener('pointercancel', onPointerUp);
    canvas.addEventListener('pointerleave', onPointerLeave);
    canvas.addEventListener('touchstart', onTouchStart, { passive: false });
    canvas.addEventListener('wheel', onWheel, { passive: false });

    const resizeObserver = new ResizeObserver(fit);
    resizeObserver.observe(wrap);
    const viewObserver = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) {
        accentHsl = accent();
        wake();
      }
    });
    viewObserver.observe(wrap);

    return () => {
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      viewObserver.disconnect();
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerup', onPointerUp);
      canvas.removeEventListener('pointercancel', onPointerUp);
      canvas.removeEventListener('pointerleave', onPointerLeave);
      canvas.removeEventListener('touchstart', onTouchStart);
      canvas.removeEventListener('wheel', onWheel);
    };
  }, [graph]);

  const repoCount = graph.nodes.filter((node) => node.kind === 'repo').length;
  const langCount = graph.nodes.filter((node) => node.kind === 'lang').length;

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-1">
        <h3 className="text-sm font-medium text-foreground">
          Mapa do código{' '}
          <span className="text-muted-foreground">
            · {repoCount} repositórios em {langCount} linguagens
          </span>
        </h3>
        <p className="text-xs text-muted-foreground">
          <span className="hidden sm:inline">arraste as bolinhas · passe o mouse · Ctrl + roda dá zoom</span>
          <span className="sm:hidden">arraste as bolinhas · toque para ver</span>
        </p>
      </div>

      <div
        ref={wrapRef}
        className="relative h-[380px] overflow-hidden rounded-2xl border border-border bg-[radial-gradient(ellipse_at_center,hsl(var(--accent)/0.06),transparent_70%)] sm:h-[440px] lg:h-[480px]"
      >
        <canvas
          ref={canvasRef}
          className="absolute inset-0 h-full w-full"
          role="img"
          aria-label={`Grafo com ${repoCount} repositórios do GitHub ligados às suas linguagens`}
        />

        <div className="absolute right-3 top-3 flex flex-col gap-1">
          {[
            { label: 'Aproximar', icon: Plus, run: () => controls.current.zoom(1.2) },
            { label: 'Afastar', icon: Minus, run: () => controls.current.zoom(1 / 1.2) },
            { label: 'Centralizar', icon: Maximize2, run: () => controls.current.reset() },
          ].map((button) => (
            <button
              key={button.label}
              type="button"
              onClick={button.run}
              aria-label={button.label}
              className="grid h-8 w-8 place-items-center rounded-lg border border-white/10 bg-background/70 text-muted-foreground backdrop-blur-md transition-colors hover:text-foreground"
            >
              <button.icon className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          ))}
        </div>

        {/* Legenda */}
        <ul className="pointer-events-none absolute left-3 top-3 hidden list-none space-y-1 p-0 font-mono text-[10px] text-muted-foreground sm:block">
          <li className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-accent" /> você
          </li>
          <li className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-[#3178c6]" /> linguagem
          </li>
          <li className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#d4d4dc]" /> repositório
          </li>
          <li className="flex items-center gap-2">
            <span className="ml-0.5 h-1.5 w-1.5 rounded-full bg-accent/75" /> commit recente
          </li>
        </ul>

        {/* Detalhe da bolinha em foco */}
        {active && active.kind !== 'user' && (
          <div className="absolute inset-x-3 bottom-3 rounded-xl border border-white/10 bg-background/85 p-3.5 shadow-xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-1 duration-200 sm:left-auto sm:w-80">
            <p className="flex items-center gap-2 text-sm font-medium text-foreground">
              {active.kind === 'lang' && (
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: active.color }} />
              )}
              <span className={`truncate ${active.kind === 'commit' ? 'font-mono text-accent' : ''}`}>
                {active.label}
              </span>
            </p>
            {active.detail && (
              <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{active.detail}</p>
            )}
            {active.meta && (
              <p className="mt-1.5 font-mono text-[11px] text-muted-foreground/80">{active.meta}</p>
            )}
            {active.url && (
              <a
                href={active.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-accent"
              >
                {active.kind === 'commit' ? 'Ver commit' : 'Abrir no GitHub'}
                <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default RepoGraph;
