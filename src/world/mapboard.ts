import * as THREE from "three";
import { box, group, keep, lambert, type Kit } from "./props";
import { canvasTexture, makeCanvas, TEXT_FONT } from "./textures";
import { drawMapBase, drawPlaceLabel, PLACES } from "./mapdraw";

/** Pedaço do mundo que cabe na placa (o sítio inteiro e o aeroporto). */
const VIEW = { x0: -150, x1: 160, z0: -212, z1: 128 };

/**
 * Placa grande com o mapa do sítio visto de cima e um alfinete
 * "VOCÊ ESTÁ AQUI" onde a placa está.
 */
export const mapBoard = (kit: Kit, x: number, z: number, angle: number) => {
  const W = kit.env.mobile ? 768 : 1024;
  const header = W * 0.13;
  const scale = W / (VIEW.x1 - VIEW.x0);
  const mapH = (VIEW.z1 - VIEW.z0) * scale;
  const H = Math.round(header + mapH + W * 0.02);
  const { canvas, ctx } = makeCanvas(W, H);
  ctx.fillStyle = "#2a1a0e";
  ctx.fillRect(0, 0, W, H);
  ctx.save();
  ctx.translate(0, header);
  ctx.beginPath();
  ctx.rect(W * 0.02, 0, W * 0.96, mapH);
  ctx.clip();
  const toMap = (px: number, pz: number) =>
    [(px - VIEW.x0) * scale, (pz - VIEW.z0) * scale] as const;
  drawMapBase(ctx, toMap, scale, W, mapH);
  const size = W * 0.03;
  PLACES.forEach((place) => {
    const [px, py] = toMap(place.x, place.z);
    drawPlaceLabel(ctx, px, py, `${place.emoji} ${place.short}`, {
      size,
      highlight: place.kind === "portfolio",
    });
  });
  // você está aqui: alfinete vermelho
  const [hx, hy] = toMap(x, z);
  ctx.fillStyle = "#ff3b3b";
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = W * 0.004;
  ctx.beginPath();
  ctx.arc(hx, hy - size * 1.4, size * 0.9, Math.PI, 0);
  ctx.lineTo(hx, hy);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  drawPlaceLabel(ctx, hx, hy + size * 1.4, "VOCÊ ESTÁ AQUI", {
    size: size * 1.05,
    accent: "#ff3b3b",
  });
  ctx.restore();
  // título
  ctx.fillStyle = "#fff7e6";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `800 ${W * 0.05}px ${TEXT_FONT}`;
  ctx.fillText("MAPA DO SÍTIO", W / 2, header * 0.4);
  ctx.font = `600 ${W * 0.024}px ${TEXT_FONT}`;
  ctx.fillStyle = "#f4d9b0";
  ctx.fillText(
    "Portfólio do David · roxo = portfólio · aperte M pro mapa",
    W / 2,
    header * 0.8,
  );

  const g = group(kit, x, z);
  g.rotation.y = angle;
  const width = 5.4;
  const height = (width * H) / W;
  const bottom = 0.9;
  for (const side of [-1, 1])
    box(
      g,
      [0.22, bottom + height + 0.2, 0.22],
      [side * (width / 2 + 0.05), (bottom + height + 0.2) / 2, -0.05],
      lambert("#5a3a20"),
    );
  box(
    g,
    [width + 0.3, height + 0.3, 0.14],
    [0, bottom + height / 2, -0.1],
    lambert("#4a2e18"),
  );
  box(
    g,
    [width + 0.6, 0.22, 0.5],
    [0, bottom + height + 0.28, -0.05],
    lambert("#7a4a2a"),
  );
  const board = keep(
    new THREE.Mesh(
      new THREE.PlaneGeometry(width, height),
      new THREE.MeshBasicMaterial({ map: canvasTexture(canvas) }),
    ),
  );
  board.position.set(0, bottom + height / 2, -0.02);
  g.add(board);
  for (const k of [-2, 0, 2])
    kit.obstacles.push({
      x: x + Math.cos(angle) * k,
      z: z - Math.sin(angle) * k,
      r: 0.7,
    });
  return g;
};
