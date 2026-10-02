/**
 * Mural do "git push" do terminal: quem visita deixa nome + mensagem.
 *
 * Função da Vercel que guarda as mensagens num Redis da Upstash (plano grátis),
 * conectado pelo painel da Vercel em Storage. A integração cria sozinha as
 * variáveis KV_REST_API_URL e KV_REST_API_TOKEN; sem elas o mural responde 503
 * e o site segue funcionando, só sem salvar.
 *
 *   GET  /api/pushes  -> { pushes: Push[] }  (os mais recentes primeiro)
 *   POST /api/pushes  -> { push: Push }      body: { name, message }
 */

interface Push {
  id: string;
  name: string;
  message: string;
  date: string;
}

const LIST_KEY = 'guestbook:pushes';
const KEEP = 200;
const SHOWN = 50;
const NAME_MAX = 24;
const MESSAGE_MAX = 120;
/** Uma mensagem a cada 20 s por IP já segura quem tentar encher o mural. */
const COOLDOWN_S = 20;

const REDIS_URL = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;

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

/** Tira quebras de linha e caracteres de controle e junta espaços repetidos. */
const clean = (value: unknown, max: number) =>
  typeof value === 'string'
    ? value
        .replace(/[\u0000-\u001f\u007f]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, max)
    : '';

const parse = (raw: unknown): Push | null => {
  try {
    return typeof raw === 'string' ? (JSON.parse(raw) as Push) : null;
  } catch {
    return null;
  }
};

export async function GET() {
  if (!REDIS_URL || !REDIS_TOKEN) return json({ error: 'mural não configurado' }, 503);
  try {
    const [list] = await redis([['LRANGE', LIST_KEY, 0, SHOWN - 1]]);
    const pushes = (Array.isArray(list) ? list : []).map(parse).filter(Boolean);
    return json({ pushes });
  } catch {
    return json({ error: 'não deu para ler o mural' }, 502);
  }
}

export async function POST(request: Request) {
  if (!REDIS_URL || !REDIS_TOKEN) return json({ error: 'mural não configurado' }, 503);

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return json({ error: 'corpo inválido' }, 400);
  }

  // Campo escondido no formulário: só robô preenche.
  if (clean(body.website, 100)) return json({ error: 'nada feito' }, 400);

  const name = clean(body.name, NAME_MAX);
  const message = clean(body.message, MESSAGE_MAX);
  if (!name || !message) return json({ error: 'preencha nome e mensagem' }, 400);

  const ip = (request.headers.get('x-forwarded-for') ?? 'anon').split(',')[0].trim();
  const push: Push = {
    id: crypto.randomUUID().replace(/-/g, '').slice(0, 7),
    name,
    message,
    date: new Date().toISOString(),
  };

  try {
    const [allowed] = await redis([['SET', `guestbook:cooldown:${ip}`, 1, 'NX', 'EX', COOLDOWN_S]]);
    if (allowed !== 'OK') return json({ error: 'calma! espere alguns segundos para outro push' }, 429);
    await redis([
      ['LPUSH', LIST_KEY, JSON.stringify(push)],
      ['LTRIM', LIST_KEY, 0, KEEP - 1],
    ]);
    return json({ push }, 201);
  } catch {
    return json({ error: 'não deu para salvar agora' }, 502);
  }
}
