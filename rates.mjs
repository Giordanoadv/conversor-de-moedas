export const CURRENCIES = [
  { code: 'BRL', name: 'Real brasileiro', flag: '🇧🇷', symbol: 'R$' },
  { code: 'USD', name: 'Dólar americano', flag: '🇺🇸', symbol: 'US$' },
  { code: 'EUR', name: 'Euro', flag: '🇪🇺', symbol: '€' },
  { code: 'GBP', name: 'Libra esterlina', flag: '🇬🇧', symbol: '£' },
  { code: 'CAD', name: 'Dólar canadense', flag: '🇨🇦', symbol: 'CA$' },
  { code: 'AUD', name: 'Dólar australiano', flag: '🇦🇺', symbol: 'AU$' },
  { code: 'JPY', name: 'Iene japonês', flag: '🇯🇵', symbol: '¥' },
  { code: 'CHF', name: 'Franco suíço', flag: '🇨🇭', symbol: 'CHF' },
  { code: 'ARS', name: 'Peso argentino', flag: '🇦🇷', symbol: 'AR$' },
  { code: 'BTC', name: 'Bitcoin', flag: '₿', symbol: '₿' },
];

export const API_URL = 'https://economia.awesomeapi.com.br/json/last/' +
  CURRENCIES.filter(c => c.code !== 'BRL').map(c => `${c.code}-BRL`).join(',');
export const REFRESH_MS = 60_000;
export const STALE_MS = 15 * 60_000;
export const MAX_AMOUNT = 1_000_000_000_000;
export const currency = code => CURRENCIES.find(c => c.code === code);

// Brazilian grouping and decimals; an ungrouped decimal point is also accepted.
export function parseAmount(input) {
  let value = String(input).trim();
  if (!value) throw new Error('Digite o valor que você quer converter.');
  if (value.includes(',')) {
    if (!/^(?:\d+|\d{1,3}(?:\.\d{3})+),\d{1,8}$/.test(value)) {
      throw new Error('Use um valor como 1.000,50, com até 8 casas decimais.');
    }
    value = value.replaceAll('.', '').replace(',', '.');
  } else if (/^\d{1,3}(?:\.\d{3})+$/.test(value)) {
    value = value.replaceAll('.', '');
  } else if (!/^\d+(?:\.\d{1,8})?$/.test(value)) {
    throw new Error('Digite um número positivo, como 1.000,50.');
  }
  const number = Number(value);
  if (!Number.isFinite(number) || number > MAX_AMOUNT) {
    throw new Error('O valor máximo é 1 trilhão por conversão.');
  }
  return number;
}

export function normalizeQuotes(payload, now = Date.now()) {
  if (!payload || typeof payload !== 'object') throw new Error('Resposta inválida da fonte.');
  const quotes = {};
  for (const c of CURRENCIES.filter(c => c.code !== 'BRL')) {
    const raw = payload[`${c.code}BRL`];
    if (!raw || raw.code !== c.code || raw.codein !== 'BRL') continue;
    const bid = Number(raw.bid);
    const ask = Number(raw.ask);
    const timestamp = Number(raw.timestamp) * 1000;
    if (!(bid > 0) || !(ask >= bid) || !Number.isFinite(bid + ask) ||
        !Number.isFinite(timestamp) || timestamp <= 0 || timestamp > now + 300_000) continue;
    const change = Number(raw.pctChange);
    quotes[c.code] = {
      rate: (bid + ask) / 2,
      timestamp,
      change: raw.pctChange != null && raw.pctChange !== '' && Number.isFinite(change) ? change : null,
    };
  }
  if (!Object.keys(quotes).length) throw new Error('A fonte não retornou cotações válidas.');
  return quotes;
}

export function convert(amount, from, to, quotes) {
  if (!currency(from) || !currency(to)) throw new Error('Moeda não suportada.');
  if (!Number.isFinite(amount) || amount < 0 || amount > MAX_AMOUNT) throw new Error('Valor inválido.');
  if (from === to) return { amount, rate: 1, timestamp: null };
  const source = from === 'BRL' ? { rate: 1, timestamp: Infinity } : quotes[from];
  const target = to === 'BRL' ? { rate: 1, timestamp: Infinity } : quotes[to];
  if (!source || !target) throw new Error('Cotação indisponível para este par. Tente atualizar.');
  const rate = source.rate / target.rate;
  return { amount: amount * rate, rate, timestamp: Math.min(source.timestamp, target.timestamp) };
}

export function formatMoney(value, code, rate = false) {
  const digits = code === 'BTC' ? 8 : rate ? (Math.abs(value) < 0.01 ? 8 : 4) : code === 'JPY' ? 0 : 2;
  if (code === 'BTC') return `₿ ${new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 8, maximumFractionDigits: 8,
  }).format(value)}`;
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency', currency: code,
    minimumFractionDigits: digits, maximumFractionDigits: digits,
  }).format(value);
}

export async function fetchQuotes({ fetcher = fetch, now = () => Date.now(), timeoutMs = 12_000 } = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetcher(API_URL, { signal: controller.signal, cache: 'no-cache' });
    if (!response.ok) throw new Error(response.status === 429 ? 'Limite temporário da fonte. Aguarde um minuto.' : 'Não foi possível consultar as cotações.');
    const payload = await response.json();
    return { payload, quotes: normalizeQuotes(payload, now()), fetchedAt: now() };
  } finally {
    clearTimeout(timeout);
  }
}
