/** Número no formato internacional que o wa.me exige (55 + DDD + número). */
export const WHATSAPP_NUMBER = '5519995378302';

const DEFAULT_MESSAGE =
  'Olá, David! Vi seu portfólio e gostaria de conversar sobre um projeto.';

/** Link do WhatsApp já com a mensagem preenchida na conversa. */
export const buildWhatsAppUrl = (message: string = DEFAULT_MESSAGE) =>
  `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;

export const WHATSAPP_URL = buildWhatsAppUrl();
