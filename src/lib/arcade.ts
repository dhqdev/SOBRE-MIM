/**
 * Clientes das funções /api/flappy (ranking do jogo) e /api/coffee
 * (café-o-metro). As duas usam o mesmo Redis do mural; sem ele, respondem 503
 * e o site esconde o que depende delas.
 */

export interface FlappyScore {
  name: string;
  score: number;
}

/** Quantos canos é preciso passar para entrar no ranking (igual à API). */
export const FLAPPY_MIN_SCORE = 10;
export const FLAPPY_NAME_MAX = 16;

const readJson = async <T>(response: Response) => (await response.json().catch(() => ({}))) as T;

export const fetchRanking = async (): Promise<FlappyScore[]> => {
  const response = await fetch('/api/flappy', { headers: { Accept: 'application/json' } });
  if (!response.ok) throw new Error(`ranking respondeu ${response.status}`);
  return (await readJson<{ scores?: FlappyScore[] }>(response)).scores ?? [];
};

export const sendScore = async (name: string, score: number) => {
  const response = await fetch('/api/flappy', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ name, score }),
  });
  const body = await readJson<{ scores?: FlappyScore[]; rank?: number | null; error?: string }>(response);
  if (!response.ok || !body.scores) throw new Error(body.error ?? 'não deu para salvar agora');
  return { scores: body.scores, rank: body.rank ?? null };
};

export const fetchCoffee = async (): Promise<number> => {
  const response = await fetch('/api/coffee', { headers: { Accept: 'application/json' } });
  if (!response.ok) throw new Error(`café respondeu ${response.status}`);
  return (await readJson<{ total?: number }>(response)).total ?? 0;
};

/** Manda um lote de cliques; devolve o total atualizado (ou null se não deu). */
export const sendCoffee = async (cups: number): Promise<number | null> => {
  const response = await fetch('/api/coffee', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ cups }),
  });
  const body = await readJson<{ total?: number }>(response);
  return typeof body.total === 'number' ? body.total : null;
};
