/**
 * Pix "copia e cola" (BR Code estático, padrão EMV do Banco Central).
 * Não precisa de servidor: o QR já leva a chave, o valor e o nome.
 */

export const PIX = {
  /** Chave Pix do David (celular, no formato +55 DDD número). */
  key: '+5519995378302',
  name: 'DAVID FERNANDES',
  city: 'SAO PAULO',
};

const field = (id: string, value: string) => `${id}${String(value.length).padStart(2, '0')}${value}`;

/** CRC16-CCITT (polinômio 0x1021, começa em 0xFFFF), como o Pix exige. */
const crc16 = (text: string) => {
  let crc = 0xffff;
  for (let i = 0; i < text.length; i++) {
    crc ^= text.charCodeAt(i) << 8;
    for (let bit = 0; bit < 8; bit++)
      crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
};

/** Tira acento e limita o tamanho (o padrão só aceita ASCII nesses campos). */
const plain = (text: string, max: number) =>
  text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^A-Za-z0-9 ]/g, '')
    .slice(0, max);

export const pixPayload = (amount: number, txid = 'SITIO', message?: string) => {
  const account =
    field('00', 'br.gov.bcb.pix') + field('01', PIX.key) + (message ? field('02', plain(message, 40)) : '');
  const body =
    field('00', '01') +
    field('26', account) +
    field('52', '0000') +
    field('53', '986') +
    field('54', amount.toFixed(2)) +
    field('58', 'BR') +
    field('59', plain(PIX.name, 25)) +
    field('60', plain(PIX.city, 15)) +
    field('62', field('05', plain(txid, 25).replace(/ /g, '') || '***')) +
    '6304';
  return body + crc16(body);
};
