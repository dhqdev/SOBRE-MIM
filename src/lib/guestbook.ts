/**
 * Mural do "git push": as mensagens que os visitantes deixam no terminal do
 * hero. Quem guarda é a função em /api/pushes; aqui fica só o cliente e um
 * aviso simples para o mural da seção GitHub atualizar na hora do push.
 */

export interface VisitorPush {
  id: string;
  name: string;
  message: string;
  date: string;
}

export const NAME_MAX = 24;
export const MESSAGE_MAX = 120;

const ENDPOINT = '/api/pushes';
const NEW_PUSH_EVENT = 'guestbook:push';

export const fetchPushes = async (): Promise<VisitorPush[]> => {
  const response = await fetch(ENDPOINT, { headers: { Accept: 'application/json' } });
  if (!response.ok) throw new Error(`mural respondeu ${response.status}`);
  const body = (await response.json()) as { pushes?: VisitorPush[] };
  return body.pushes ?? [];
};

/** Salva o push. Em caso de erro, devolve a mensagem que a API mandou. */
export const sendPush = async (input: { name: string; message: string; website?: string }) => {
  const response = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(input),
  });
  const body = (await response.json().catch(() => ({}))) as { push?: VisitorPush; error?: string };
  if (!response.ok || !body.push) throw new Error(body.error ?? 'não deu para salvar agora');
  window.dispatchEvent(new CustomEvent<VisitorPush>(NEW_PUSH_EVENT, { detail: body.push }));
  return body.push;
};

export const onNewPush = (listener: (push: VisitorPush) => void) => {
  const handler = (event: Event) => listener((event as CustomEvent<VisitorPush>).detail);
  window.addEventListener(NEW_PUSH_EVENT, handler);
  return () => window.removeEventListener(NEW_PUSH_EVENT, handler);
};
