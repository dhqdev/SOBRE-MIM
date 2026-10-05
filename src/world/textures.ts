import * as THREE from 'three';

export const TEXT_FONT = '"Geist Variable", system-ui, sans-serif';
export const PIXEL_FONT = '"Press Start 2P", monospace';

/** Anisotropia máxima da placa de vídeo (fica definida quando o renderer nasce). */
export const textureQuality = { anisotropy: 4 };

/** Textura de canvas nítida: texto desenhado em alta resolução, com mipmaps. */
export const canvasTexture = (canvas: HTMLCanvasElement) => {
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = textureQuality.anisotropy;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  return texture;
};

export const makeCanvas = (width: number, height: number) => {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return { canvas, ctx: canvas.getContext('2d')! };
};

const roundRect = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
};

interface LabelOptions {
  color?: string;
  accent?: string;
  /** Altura da plaquinha em unidades do mundo. */
  height?: number;
}

/** Plaquinha flutuante com o nome da estação (texto bem nítido). */
export const makeLabel = (text: string, options: LabelOptions = {}) => {
  const { color = '#ffffff', accent = '#a78bfa', height = 0.8 } = options;
  const size = 44;
  const probe = makeCanvas(8, 8).ctx;
  probe.font = `650 ${size}px ${TEXT_FONT}`;
  const textWidth = Math.ceil(probe.measureText(text).width);
  const padX = 30;
  const dot = 16;
  const width = textWidth + padX * 2 + dot + 14;
  const tall = size + 34;
  const { canvas, ctx } = makeCanvas(width + 8, tall + 18);
  // sombra + balão
  ctx.fillStyle = 'rgba(0,0,0,0.28)';
  roundRect(ctx, 4, 8, width, tall, tall / 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(20, 14, 34, 0.86)';
  roundRect(ctx, 0, 0, width, tall, tall / 2);
  ctx.fill();
  ctx.lineWidth = 4;
  ctx.strokeStyle = accent;
  roundRect(ctx, 2, 2, width - 4, tall - 4, tall / 2 - 2);
  ctx.stroke();
  ctx.fillStyle = accent;
  ctx.beginPath();
  ctx.arc(padX + dot / 2, tall / 2, dot / 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.font = `650 ${size}px ${TEXT_FONT}`;
  ctx.fillStyle = color;
  ctx.textBaseline = 'middle';
  ctx.fillText(text, padX + dot + 14, tall / 2 + 2);
  // perninha do balão
  ctx.fillStyle = 'rgba(20, 14, 34, 0.86)';
  ctx.beginPath();
  ctx.moveTo(width / 2 - 12, tall - 1);
  ctx.lineTo(width / 2 + 12, tall - 1);
  ctx.lineTo(width / 2, tall + 14);
  ctx.closePath();
  ctx.fill();

  const material = new THREE.SpriteMaterial({
    map: canvasTexture(canvas),
    transparent: true,
    depthWrite: false,
    fog: false,
  });
  const sprite = new THREE.Sprite(material);
  const h = height * (canvas.height / tall);
  sprite.scale.set((h * canvas.width) / canvas.height, h, 1);
  sprite.center.set(0.5, 0.1);
  sprite.renderOrder = 10;
  return sprite;
};

const wrap = (ctx: CanvasRenderingContext2D, text: string, maxWidth: number) => {
  const words = text.split(' ');
  const lines: string[] = [];
  let line = '';
  words.forEach((word) => {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else line = test;
  });
  if (line) lines.push(line);
  return lines;
};

/** Madeira com veios, usada nas placas. */
const paintWood = (ctx: CanvasRenderingContext2D, w: number, h: number, base: string) => {
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, w, h);
  for (let y = 0; y < h; y += 26) {
    ctx.fillStyle = 'rgba(0,0,0,0.10)';
    ctx.fillRect(0, y, w, 3);
    ctx.fillStyle = 'rgba(255,255,255,0.05)';
    ctx.fillRect(0, y + 10, w, 2);
  }
  ctx.strokeStyle = 'rgba(0,0,0,0.35)';
  ctx.lineWidth = 10;
  ctx.strokeRect(5, 5, w - 10, h - 10);
};

/** Placa de madeira com texto grande (portão, setas, nome das barracas). */
export const makeSignTexture = (
  lines: string[],
  options: { width?: number; color?: string; bg?: string; size?: number } = {},
) => {
  const { width = 1024, color = '#fff7e6', bg = '#7a4a2a', size = 72 } = options;
  const lineH = size * 1.25;
  const { canvas, ctx } = makeCanvas(width, Math.round(lines.length * lineH + size * 0.9));
  paintWood(ctx, canvas.width, canvas.height, bg);
  ctx.font = `750 ${size}px ${TEXT_FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  lines.forEach((line, index) => {
    const y = size * 0.45 + lineH * index + lineH / 2;
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.fillText(line, width / 2 + 4, y + 4);
    ctx.fillStyle = color;
    ctx.fillText(line, width / 2, y);
  });
  return canvasTexture(canvas);
};

/** Placa de um marco da carreira: data, cargo e lugar, legíveis de perto. */
export const makeMilestoneTexture = (date: string, title: string, place: string, accent: string) => {
  const { canvas, ctx } = makeCanvas(768, 480);
  paintWood(ctx, 768, 480, '#8a5a34');
  ctx.fillStyle = accent;
  roundRect(ctx, 44, 40, 260, 70, 35);
  ctx.fill();
  ctx.font = `750 40px ${TEXT_FONT}`;
  ctx.fillStyle = '#1a1030';
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'center';
  ctx.fillText(date, 174, 77);
  ctx.textAlign = 'left';
  ctx.font = `750 54px ${TEXT_FONT}`;
  ctx.fillStyle = '#fff7e6';
  const lines = wrap(ctx, title, 680).slice(0, 3);
  lines.forEach((line, i) => ctx.fillText(line, 44, 170 + i * 64));
  ctx.font = `500 38px ${TEXT_FONT}`;
  ctx.fillStyle = '#f4d9b0';
  ctx.fillText(place, 44, 170 + lines.length * 64 + 28);
  return canvasTexture(canvas);
};

/** Imagem de projeto bem nítida (com anisotropia e mipmaps). */
export const imageTexture = (src: string) => {
  const texture = new THREE.TextureLoader().load(src);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = textureQuality.anisotropy;
  return texture;
};

/** Carrega um ícone (svg, webp…) num quadrado com fundo claro. */
export const iconTexture = (src: string, size = 256, background = '#f4f0ff') => {
  const { canvas, ctx } = makeCanvas(size, size);
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, size, size);
  const texture = canvasTexture(canvas);
  const image = new Image();
  image.onload = () => {
    const pad = size * 0.16;
    ctx.drawImage(image, pad, pad, size - pad * 2, size - pad * 2);
    texture.needsUpdate = true;
  };
  image.src = src;
  return texture;
};

/** Disco suave (sol, lua, brilho de lâmpada). */
export const glowTexture = (inner: string, outer = 'rgba(255,255,255,0)') => {
  const { canvas, ctx } = makeCanvas(256, 256);
  const gradient = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
  gradient.addColorStop(0, inner);
  gradient.addColorStop(0.35, inner);
  gradient.addColorStop(1, outer);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 256, 256);
  return canvasTexture(canvas);
};

/** Brilho macio de lâmpada: núcleo pequeno e forte, cauda longa que some sem borda. */
export const softGlowTexture = (r: number, g: number, b: number) => {
  const { canvas, ctx } = makeCanvas(256, 256);
  const gradient = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
  const stops: [number, number][] = [
    [0, 1],
    [0.06, 0.9],
    [0.14, 0.55],
    [0.26, 0.26],
    [0.42, 0.1],
    [0.65, 0.03],
    [1, 0],
  ];
  stops.forEach(([at, alpha]) => {
    // o miolo puxa pro branco, a borda fica na cor da lâmpada
    const white = Math.max(0, 1 - at * 6);
    const mix = (c: number) => Math.round(c + (255 - c) * white);
    gradient.addColorStop(at, `rgba(${mix(r)},${mix(g)},${mix(b)},${alpha})`);
  });
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 256, 256);
  return canvasTexture(canvas);
};

/** Balão de fala (morador conversando): nome em cima e o texto quebrando linha. */
export const makeBubble = (name: string, text: string, height = 1.3) => {
  const W = 620;
  const probe = makeCanvas(8, 8).ctx;
  probe.font = `500 34px ${TEXT_FONT}`;
  const lines = wrap(probe, text, W - 60);
  const tall = 74 + lines.length * 42 + 22;
  const { canvas, ctx } = makeCanvas(W + 8, tall + 30);
  ctx.fillStyle = 'rgba(0,0,0,0.22)';
  roundRect(ctx, 6, 8, W, tall, 28);
  ctx.fill();
  ctx.fillStyle = '#fffdf6';
  roundRect(ctx, 0, 0, W, tall, 28);
  ctx.fill();
  ctx.lineWidth = 5;
  ctx.strokeStyle = '#7c3aed';
  roundRect(ctx, 2.5, 2.5, W - 5, tall - 5, 26);
  ctx.stroke();
  ctx.fillStyle = '#6d28d9';
  ctx.font = `700 32px ${TEXT_FONT}`;
  ctx.textBaseline = 'top';
  ctx.fillText(name, 30, 22);
  ctx.fillStyle = '#1f1530';
  ctx.font = `500 34px ${TEXT_FONT}`;
  lines.forEach((line, i) => ctx.fillText(line, 30, 70 + i * 42));
  ctx.fillStyle = '#fffdf6';
  ctx.beginPath();
  ctx.moveTo(W / 2 - 18, tall - 3);
  ctx.lineTo(W / 2 + 18, tall - 3);
  ctx.lineTo(W / 2, tall + 24);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#7c3aed';
  ctx.beginPath();
  ctx.moveTo(W / 2 - 18, tall - 1);
  ctx.lineTo(W / 2, tall + 24);
  ctx.lineTo(W / 2 + 18, tall - 1);
  ctx.stroke();
  const material = new THREE.SpriteMaterial({
    map: canvasTexture(canvas),
    transparent: true,
    depthWrite: false,
    depthTest: false,
    fog: false,
  });
  const sprite = new THREE.Sprite(material);
  const w = height * (canvas.width / 260);
  sprite.scale.set(w, (w * canvas.height) / canvas.width, 1);
  sprite.center.set(0.5, 0);
  sprite.renderOrder = 12;
  return sprite;
};
