/**
 * Ranking do Flappy Bird jogável do card de projetos.
 *
 *   GET  /api/flappy -> { scores: { name, score }[] }  (top 10)
 *   POST /api/flappy -> { scores, rank }              body: { name, score }
 *
 * Cada nome guarda só o melhor resultado (ZADD GT). Só entra quem passa de
 * MIN_SCORE canos.
 */
// Mesmas utilidades do api/pushes.ts. Ficam copiadas em cada função de
// propósito: import relativo entre funções da Vercel costuma quebrar no deploy.
const REDIS_URL = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;
const hasRedis = Boolean(REDIS_URL && REDIS_TOKEN);

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });

/** Roda vários comandos de uma vez pela API REST da Upstash. */
const redis = async (commands: (string | number)[][]) => {
  const response = await fetch(`${REDIS_URL}/pipeline`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${REDIS_TOKEN}`, 'content-type': 'application/json' },
    body: JSON.stringify(commands),
  });
  if (!response.ok) throw new Error(`Upstash respondeu ${response.status}`);
  const results = (await response.json()) as { result?: unknown; error?: string }[];
  return results.map((item) => {
    if (item.error) throw new Error(item.error);
    return item.result;
  });
};

const clientIp = (request: Request) =>
  (request.headers.get('x-forwarded-for') ?? 'anon').split(',')[0].trim();

const readBody = async (request: Request): Promise<Record<string, unknown> | null> => {
  try {
    return (await request.json()) as Record<string, unknown>;
  } catch {
    return null;
  }
};

/** Tira quebras de linha e caracteres de controle e junta espaços repetidos. */
const clean = (value: unknown, max: number) =>
  typeof value === 'string'
    ? value
        // eslint-disable-next-line no-control-regex -- tirar caracteres de controle é o objetivo
        .replace(/[\u0000-\u001f\u007f]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, max)
    : '';

const KEY = 'flappy:ranking';
const TOP = 10;
const NAME_MAX = 16;
const MIN_SCORE = 10;
/** Teto pra pontuação: acima disso é trapaça (ninguém joga 20 min no site). */
const MAX_SCORE = 500;
const COOLDOWN_S = 5;

const readTop = async () => {
  const [list] = await redis([['ZREVRANGE', KEY, 0, TOP - 1, 'WITHSCORES']]);
  const flat = Array.isArray(list) ? (list as string[]) : [];
  const scores: { name: string; score: number }[] = [];
  for (let i = 0; i < flat.length; i += 2) scores.push({ name: flat[i], score: Number(flat[i + 1]) });
  return scores;
};

export async function GET() {
  if (!hasRedis) return json({ error: 'ranking não configurado' }, 503);
  try {
    return json({ scores: await readTop() });
  } catch {
    return json({ error: 'não deu para ler o ranking' }, 502);
  }
}

export async function POST(request: Request) {
  if (!hasRedis) return json({ error: 'ranking não configurado' }, 503);
  const body = await readBody(request);
  const name = clean(body?.name, NAME_MAX);
  const score = Math.floor(Number(body?.score));
  if (!name) return json({ error: 'qual o seu nome?' }, 400);
  if (!Number.isFinite(score) || score < MIN_SCORE || score > MAX_SCORE) {
    return json({ error: `só entra no ranking quem passa de ${MIN_SCORE} canos` }, 400);
  }

  try {
    const [allowed] = await redis([
      ['SET', `flappy:cooldown:${clientIp(request)}`, 1, 'NX', 'EX', COOLDOWN_S],
    ]);
    if (allowed !== 'OK') return json({ error: 'calma! espere uns segundos' }, 429);
    const [, rank] = await redis([
      ['ZADD', KEY, 'GT', score, name],
      ['ZREVRANK', KEY, name],
    ]);
    // Mantém o ranking curto.
    await redis([['ZREMRANGEBYRANK', KEY, 0, -101]]);
    return json({ scores: await readTop(), rank: typeof rank === 'number' ? rank + 1 : null }, 201);
  } catch {
    return json({ error: 'não deu para salvar agora' }, 502);
  }
}
