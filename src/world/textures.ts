import * as THREE from 'three';

export const PIXEL_FONT = '"Press Start 2P", monospace';

/** Textura de canvas com cara de pixel-art (sem suavização). */
export const canvasTexture = (canvas: HTMLCanvasElement) => {
  const texture = new THREE.CanvasTexture(canvas);
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  texture.generateMipmaps = false;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
};

export const makeCanvas = (width: number, height: number) => {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;
  return { canvas, ctx };
};

interface LabelOptions {
  color?: string;
  background?: string;
  border?: string;
  /** Altura do texto em unidades do mundo. */
  height?: number;
}

/** Plaquinha flutuante com o texto em fonte pixelada. */
export const makeLabel = (text: string, options: LabelOptions = {}) => {
  const {
    color = '#ffffff',
    background = 'rgba(28, 16, 48, 0.88)',
    border = '#a78bfa',
    height = 0.9,
  } = options;
  const size = 16;
  const padX = 10;
  const padY = 8;
  const probe = makeCanvas(8, 8).ctx;
  probe.font = `${size}px ${PIXEL_FONT}`;
  const width = Math.ceil(probe.measureText(text).width) + padX * 2;
  const tall = size + padY * 2;
  const { canvas, ctx } = makeCanvas(width + 4, tall + 6);
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.fillRect(4, 6, width, tall);
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, width, tall);
  ctx.fillStyle = border;
  ctx.fillRect(0, 0, width, 2);
  ctx.fillRect(0, tall - 2, width, 2);
  ctx.fillRect(0, 0, 2, tall);
  ctx.fillRect(width - 2, 0, 2, tall);
  ctx.font = `${size}px ${PIXEL_FONT}`;
  ctx.fillStyle = color;
  ctx.textBaseline = 'middle';
  ctx.fillText(text, padX, tall / 2 + 1);

  const material = new THREE.SpriteMaterial({
    map: canvasTexture(canvas),
    transparent: true,
    depthWrite: false,
    fog: false,
  });
  const sprite = new THREE.Sprite(material);
  const ratio = canvas.width / canvas.height;
  const h = height * (canvas.height / tall) * 1.6;
  sprite.scale.set(h * ratio, h, 1);
  sprite.renderOrder = 10;
  return sprite;
};

/** Placa de madeira com texto, pra portais e postes. */
export const makeSignTexture = (
  lines: string[],
  options: { width?: number; color?: string; bg?: string } = {},
) => {
  const { width = 256, color = '#fff7e6', bg = '#7a4a2a' } = options;
  const lineH = 22;
  const { canvas, ctx } = makeCanvas(width, lines.length * lineH + 20);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  // veios da madeira
  ctx.fillStyle = 'rgba(0,0,0,0.12)';
  for (let y = 4; y < canvas.height; y += 7) ctx.fillRect(0, y, canvas.width, 2);
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.fillRect(0, canvas.height - 4, canvas.width, 4);
  ctx.font = `14px ${PIXEL_FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  lines.forEach((line, index) => {
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.fillText(line, width / 2 + 2, 12 + lineH * index + lineH / 2 + 2);
    ctx.fillStyle = color;
    ctx.fillText(line, width / 2, 12 + lineH * index + lineH / 2);
  });
  return canvasTexture(canvas);
};

/** Carrega uma imagem (svg, webp…) e devolve uma textura quadrada nítida. */
export const iconTexture = (src: string, size = 64, background = '#f4f0ff') => {
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

/** Céu do pôr do sol: gradiente roxo → rosa → laranja no horizonte. */
export const skyMaterial = () =>
  new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    fog: false,
    uniforms: {
      top: { value: new THREE.Color('#1b1038') },
      middle: { value: new THREE.Color('#6b2f8f') },
      horizon: { value: new THREE.Color('#ff8f6b') },
    },
    vertexShader: /* glsl */ `
      varying vec3 vPos;
      void main() {
        vPos = normalize(position);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 top;
      uniform vec3 middle;
      uniform vec3 horizon;
      varying vec3 vPos;
      void main() {
        float h = vPos.y;
        vec3 color = h > 0.18 ? mix(middle, top, smoothstep(0.18, 0.7, h)) : mix(horizon, middle, smoothstep(-0.02, 0.18, h));
        // faixas de cor, bem anos 90
        color = floor(color * 24.0) / 24.0;
        gl_FragColor = vec4(color, 1.0);
      }
    `,
  });

/** Sol retrô com listras que descem. */
export const sunMaterial = (time: { value: number }) =>
  new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    fog: false,
    uniforms: { uTime: time },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uTime;
      varying vec2 vUv;
      void main() {
        vec2 p = vUv - 0.5;
        float d = length(p);
        if (d > 0.5) discard;
        vec3 color = mix(vec3(1.0, 0.35, 0.55), vec3(1.0, 0.86, 0.35), vUv.y);
        // listras na metade de baixo, cada vez mais grossas
        if (vUv.y < 0.48) {
          float band = fract(vUv.y * 9.0 + uTime * 0.25);
          float gap = mix(0.45, 0.08, vUv.y / 0.48);
          if (band < gap) discard;
        }
        gl_FragColor = vec4(color, 1.0);
      }
    `,
  });
