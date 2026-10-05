/**
 * O site muda com a hora de quem visita: de manhã o roxo fica mais claro e
 * aberto, à noite mais fundo, de madrugada quase só brilho. As cores ficam no
 * index.css, em [data-period]; aqui só se descobre o período e se marca o <html>.
 */

export type Period = 'madrugada' | 'manha' | 'tarde' | 'noite';

export const periodOf = (date = new Date()): Period => {
  const hour = date.getHours();
  if (hour < 5) return 'madrugada';
  if (hour < 12) return 'manha';
  if (hour < 18) return 'tarde';
  return 'noite';
};

export const GREETINGS: Record<Period, { text: string; emoji: string }> = {
  madrugada: { text: 'boa madrugada, coruja', emoji: '🦉' },
  manha: { text: 'bom dia', emoji: '☀️' },
  tarde: { text: 'boa tarde', emoji: '🌤️' },
  noite: { text: 'boa noite', emoji: '🌙' },
};

const apply = () => {
  document.documentElement.dataset.period = periodOf();
};

/** Marca o período já no carregamento e confere de novo a cada 5 minutos. */
export const startPeriodWatcher = () => {
  apply();
  window.setInterval(apply, 5 * 60 * 1000);
};
