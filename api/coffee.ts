/**
 * Café-o-metro do rodapé: quantos cafés os visitantes já "pagaram" pro David.
 *
 *   GET  /api/coffee -> { total }
 *   POST /api/coffee -> { total }   body: { cups } (cliques juntados no navegador, até 10)
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

const KEY = 'coffee:total';
const MAX_CUPS = 10;
/** Um lote de cliques a cada 2 s por IP. */
const COOLDOWN_S = 2;

export async function GET() {
  if (!hasRedis) return json({ error: 'contador não configurado' }, 503);
  try {
    const [total] = await redis([['GET', KEY]]);
    return json({ total: Number(total ?? 0) });
  } catch {
    return json({ error: 'não deu para ler o contador' }, 502);
  }
}

export async function POST(request: Request) {
  if (!hasRedis) return json({ error: 'contador não configurado' }, 503);
  const body = await readBody(request);
  const cups = Math.floor(Number(body?.cups));
  if (!Number.isFinite(cups) || cups < 1) return json({ error: 'quantos cafés?' }, 400);

  try {
    const [allowed] = await redis([
      ['SET', `coffee:cooldown:${clientIp(request)}`, 1, 'NX', 'EX', COOLDOWN_S],
    ]);
    if (allowed !== 'OK') {
      const [total] = await redis([['GET', KEY]]);
      return json({ total: Number(total ?? 0), error: 'calma, o café ainda está passando' }, 429);
    }
    const [total] = await redis([['INCRBY', KEY, Math.min(cups, MAX_CUPS)]]);
    return json({ total: Number(total) });
  } catch {
    return json({ error: 'não deu para salvar agora' }, 502);
  }
}
