import { Renderer, Program, Mesh, Color, Triangle } from 'ogl';
import { useEffect, useRef } from 'react';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';

import './Iridescence.css';

const vertexShader = `
attribute vec2 uv;
attribute vec2 position;

varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = vec4(position, 0, 1);
}
`;

const fragmentShader = `
precision highp float;

uniform float uTime;
uniform vec3 uColor;
uniform vec3 uResolution;
uniform vec2 uMouse;
uniform float uAmplitude;
uniform float uSpeed;

varying vec2 vUv;

void main() {
  float mr = min(uResolution.x, uResolution.y);
  vec2 uv = (vUv.xy * 2.0 - 1.0) * uResolution.xy / mr;

  uv += (uMouse - vec2(0.5)) * uAmplitude;

  float d = -uTime * 0.5 * uSpeed;
  float a = 0.0;
  for (float i = 0.0; i < 8.0; ++i) {
    a += cos(i - d - a * uv.x);
    d += sin(uv.y * i + a);
  }
  d += uTime * 0.5 * uSpeed;
  vec3 col = vec3(cos(uv * vec2(d, a)) * 0.6 + 0.4, cos(a + d) * 0.5 + 0.5);
  col = cos(col * cos(vec3(d, a, 2.5)) * 0.5 + 0.5) * uColor;
  gl_FragColor = vec4(col, 1.0);
}
`;

interface IridescenceProps {
  color?: [number, number, number];
  speed?: number;
  amplitude?: number;
  mouseReact?: boolean;
}

export default function Iridescence({ 
  color = [1, 1, 1], 
  speed = 1.0, 
  amplitude = 0.1, 
  mouseReact = true 
}: IridescenceProps) {
  const ctnDom = useRef<HTMLDivElement>(null);
  const mousePos = useRef({ x: 0.5, y: 0.5 });
  const prefersReducedMotion = usePrefersReducedMotion();

  // `color` chega como literal do componente pai, então um array novo a cada
  // render. Depender do conteúdo evita recriar o contexto WebGL à toa.
  const colorKey = color.join(',');

  useEffect(() => {
    if (!ctnDom.current) return;
    // Quem pediu menos animação não recebe o shader — é o item mais pesado da
    // página e roda em loop infinito.
    if (prefersReducedMotion) return;

    const ctn = ctnDom.current;
    const [r, g, b] = colorKey.split(',').map(Number);

    // Detectar se é mobile para ajustar qualidade
    const isMobile = window.innerWidth < 768;
    const pixelRatio = isMobile ? 0.5 : 1;

    // Sem WebGL (GPU bloqueada, navegador antigo, modo de privacidade) o `new
    // Renderer` lança e derrubaria a árvore React inteira — a página ficava em
    // branco. Aqui a falha só significa "sem fundo animado": o gradiente
    // estático por cima já garante o visual.
    let renderer: Renderer;
    try {
      renderer = new Renderer({ alpha: true, dpr: pixelRatio });
    } catch (error) {
      console.warn('WebGL indisponível, seguindo sem o fundo animado:', error);
      return;
    }

    const gl = renderer.gl;
    gl.clearColor(0, 0, 0, 0);

    const geometry = new Triangle(gl);
    const program = new Program(gl, {
      vertex: vertexShader,
      fragment: fragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uColor: { value: new Color(r, g, b) },
        uResolution: {
          value: new Color(gl.canvas.width, gl.canvas.height, gl.canvas.width / gl.canvas.height)
        },
        uMouse: { value: new Float32Array([mousePos.current.x, mousePos.current.y]) },
        uAmplitude: { value: amplitude },
        uSpeed: { value: speed }
      }
    });

    // Definido depois do program para não precisar de declaração antecipada.
    function resize() {
      const scale = isMobile ? 0.75 : 1;
      renderer.setSize(ctn.offsetWidth * scale, ctn.offsetHeight * scale);
      program.uniforms.uResolution.value = new Color(
        gl.canvas.width,
        gl.canvas.height,
        gl.canvas.width / gl.canvas.height
      );
    }
    window.addEventListener('resize', resize, false);
    resize();

    const mesh = new Mesh(gl, { geometry, program });
    let animateId: number;

    function update(t: number) {
      animateId = requestAnimationFrame(update);
      program.uniforms.uTime.value = t * 0.001;
      renderer.render({ scene: mesh });
    }
    animateId = requestAnimationFrame(update);
    ctn.appendChild(gl.canvas);

    // Com a aba em segundo plano o navegador já reduz o rAF, mas parar de vez
    // evita gastar GPU e bateria enquanto ninguém está olhando.
    function handleVisibility() {
      cancelAnimationFrame(animateId);
      if (!document.hidden) {
        animateId = requestAnimationFrame(update);
      }
    }
    document.addEventListener('visibilitychange', handleVisibility);

    function handleMouseMove(e: MouseEvent) {
      const rect = ctn.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = 1.0 - (e.clientY - rect.top) / rect.height;
      mousePos.current = { x, y };
      program.uniforms.uMouse.value[0] = x;
      program.uniforms.uMouse.value[1] = y;
    }
    if (mouseReact) {
      ctn.addEventListener('mousemove', handleMouseMove);
    }

    return () => {
      cancelAnimationFrame(animateId);
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', handleVisibility);
      if (mouseReact) {
        ctn.removeEventListener('mousemove', handleMouseMove);
      }
      if (ctn.contains(gl.canvas)) {
        ctn.removeChild(gl.canvas);
      }
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    };
  }, [colorKey, speed, amplitude, mouseReact, prefersReducedMotion]);

  return <div ref={ctnDom} className="iridescence-container" aria-hidden="true" />;
}
