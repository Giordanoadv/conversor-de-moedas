import { CURRENCIES, REFRESH_MS, STALE_MS, currency, parseAmount, convert, formatMoney, normalizeQuotes, fetchQuotes } from './rates.mjs';

const $ = id => document.getElementById(id);
const CACHE_KEY = 'giordano-cambio-v2';
const PREFERENCES_KEY = 'giordano-cambio-preferences-v2';
const state = { quotes: {}, fetchedAt: 0, lastAttempt: 0, loading: false, failed: false, cached: false, expanded: false, result: null, nextAttempt: 0 };
const dateTime = timestamp => new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'medium', timeZone: 'America/Sao_Paulo' }).format(timestamp);
const timeOnly = timestamp => new Intl.DateTimeFormat('pt-BR', { timeStyle: 'short', timeZone: 'America/Sao_Paulo' }).format(timestamp);

for (const c of CURRENCIES) {
  for (const id of ['from', 'to']) {
    const option = document.createElement('option');
    option.value = c.code;
    option.textContent = `${c.code} · ${c.name}`;
    $(id).append(option);
  }
}
$('from').value = 'BRL';
$('to').value = 'USD';
try {
  const prefs = JSON.parse(localStorage.getItem(PREFERENCES_KEY));
  if (currency(prefs?.from) && currency(prefs?.to)) {
    $('from').value = prefs.from;
    $('to').value = prefs.to;
  }
} catch { /* Private browsing or invalid preferences must not stop the app. */ }

function savePreferences() {
  try { localStorage.setItem(PREFERENCES_KEY, JSON.stringify({ from: $('from').value, to: $('to').value })); } catch { /* Optional storage. */ }
}

function showNotice(message) {
  $('data-notice').textContent = message;
  $('data-notice').hidden = !message;
}

function showConnection() {
  const age = Date.now() - state.fetchedAt;
  const unavailable = !Object.keys(state.quotes).length;
  const stale = state.cached || age > REFRESH_MS * 3;
  const warning = state.failed || stale || !navigator.onLine;
  $('connection-pill').className = `status-pill${warning ? unavailable ? ' error' : ' warning' : ''}`;
  $('connection-status').textContent = !navigator.onLine ? 'Sem conexão' : state.loading && unavailable ? 'Conectando às cotações' : state.failed ? unavailable ? 'Fonte indisponível' : 'Usando última consulta' : state.loading ? 'Consultando cotações' : stale ? 'Última consulta disponível' : 'Atualização automática ativa';
  $('last-check').textContent = state.fetchedAt ? `Última consulta: ${dateTime(state.fetchedAt)} · Brasília` : 'Consultas automáticas a cada minuto';
}

function updateResult({ validate = false } = {}) {
  state.result = null;
  $('copy').disabled = true;
  $('amount-error').textContent = '';
  $('amount').removeAttribute('aria-invalid');
  const from = $('from').value;
  const to = $('to').value;
  $('from-flag').textContent = currency(from).flag;
  $('to-flag').textContent = currency(to).flag;
  $('amount-symbol').textContent = currency(from).symbol;
  $('amount-code').textContent = from;
  let amount;
  try { amount = parseAmount($('amount').value); } catch (error) {
    if (validate || $('amount').value.trim()) {
      $('amount-error').textContent = error.message;
      $('amount').setAttribute('aria-invalid', 'true');
    }
    $('result-caption').textContent = 'Seu valor convertido';
    $('result-value').textContent = '—';
    $('result-value').className = '';
    $('unit-rate').textContent = 'Informe um valor válido para continuar.';
    $('quote-time').textContent = 'Aguardando um valor válido';
    showNotice('');
    return;
  }
  $('result-caption').textContent = `${formatMoney(amount, from)} equivalem a`;
  try {
    const result = convert(amount, from, to, state.quotes);
    state.result = result;
    $('result-value').className = '';
    $('result-value').textContent = formatMoney(result.amount, to);
    $('unit-rate').textContent = `1 ${from} = ${formatMoney(result.rate, to, true)} ${to}`;
    $('quote-time').textContent = result.timestamp ? `Cotação de ${dateTime(result.timestamp)} · Brasília` : 'Mesma moeda · não depende de cotação';
    $('copy').disabled = false;
    const age = result.timestamp ? Date.now() - result.timestamp : 0;
    const previous = result.timestamp && (state.failed || state.cached || !navigator.onLine || Date.now() - state.fetchedAt > REFRESH_MS * 3);
    if (previous) showNotice(state.loading && !state.failed ? 'Exibindo a última consulta enquanto buscamos novas cotações. Confira a data acima.' : 'Não foi possível confirmar uma nova cotação. Este resultado usa os últimos dados disponíveis; confira a data acima.');
    else if (age > STALE_MS) showNotice('A última cotação deste par tem mais de 15 minutos. O mercado pode estar fechado ou a fonte pode estar atrasada. Confira o horário acima.');
    else showNotice('');
  } catch (error) {
    $('result-value').className = 'waiting';
    $('result-value').textContent = state.loading ? 'Buscando cotação…' : 'Cotação indisponível';
    $('unit-rate').textContent = state.loading ? 'Só um instante. Estamos consultando a fonte.' : error.message;
    $('quote-time').textContent = 'Nenhum valor estimado é usado';
    showNotice(state.failed ? 'A consulta falhou. Verifique a conexão e use Atualizar para tentar novamente.' : '');
  }
}

function renderMarket() {
  $('market-list').replaceChildren();
  const codes = state.expanded ? ['USD','EUR','GBP','BTC','CAD','AUD','JPY','CHF','ARS'] : ['USD','EUR','GBP','BTC','CAD'];
  for (const code of codes) {
    const c = currency(code);
    const quote = state.quotes[code];
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'quote-row';
    button.setAttribute('aria-label', `Converter ${c.name} para real`);
    const left = document.createElement('span');
    left.className = 'quote-name';
    const flag = document.createElement('span');
    flag.className = `coin-flag${code === 'BTC' ? ' bitcoin' : ''}`;
    flag.textContent = c.flag;
    flag.setAttribute('aria-hidden', 'true');
    const label = document.createElement('span');
    const title = document.createElement('strong');
    title.textContent = c.name;
    const subtitle = document.createElement('small');
    subtitle.textContent = `${code} / BRL`;
    label.append(title, subtitle);
    left.append(flag, label);
    const right = document.createElement('span');
    right.className = 'quote-values';
    const price = document.createElement('strong');
    price.textContent = quote ? formatMoney(quote.rate, 'BRL', code !== 'BTC') : '—';
    const change = document.createElement('small');
    if (quote?.change != null) {
      change.textContent = `${quote.change > 0 ? '↗ +' : quote.change < 0 ? '↘ ' : ''}${quote.change.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;
      change.className = quote.change >= 0 ? 'up' : 'down';
    } else { change.textContent = quote ? 'Variação indisponível' : 'Aguardando fonte'; change.className = 'unavailable'; }
    right.append(price, change);
    if (quote) {
      button.title = `Cotação de ${dateTime(quote.timestamp)} · Brasília`;
      const time = document.createElement('time');
      time.dateTime = new Date(quote.timestamp).toISOString();
      time.textContent = `${new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', timeZone: 'America/Sao_Paulo' }).format(quote.timestamp)} · ${timeOnly(quote.timestamp)}`;
      right.append(time);
    }
    button.append(left, right);
    button.addEventListener('click', () => choosePair(code, 'BRL'));
    $('market-list').append(button);
  }
  $('more-currencies').textContent = state.expanded ? 'Mostrar menos ↑' : 'Ver todas as moedas ↓';
  $('more-currencies').setAttribute('aria-expanded', String(state.expanded));
}

async function refresh({ manual = false } = {}) {
  if (state.loading || (!manual && Date.now() < state.nextAttempt)) return;
  // A short manual cooldown prevents accidental request bursts; the provider may cache responses.
  if (manual && Date.now() - state.lastAttempt < 10_000) {
    $('refresh').querySelector('span').textContent = 'Aguarde alguns segundos';
    return;
  }
  state.loading = true;
  state.lastAttempt = Date.now();
  state.nextAttempt = Date.now() + REFRESH_MS;
  $('refresh').disabled = true;
  $('refresh').classList.add('loading');
  $('refresh').querySelector('span').textContent = 'Atualizando';
  showConnection();
  updateResult();
  try {
    const data = await fetchQuotes();
    state.quotes = data.quotes;
    state.fetchedAt = data.fetchedAt;
    state.cached = false;
    state.failed = false;
    try { localStorage.setItem(CACHE_KEY, JSON.stringify({ payload: data.payload, fetchedAt: data.fetchedAt })); } catch { /* Storage is optional. */ }
  } catch {
    state.failed = true;
  } finally {
    state.loading = false;
    $('refresh').disabled = false;
    $('refresh').classList.remove('loading');
    $('refresh').querySelector('span').textContent = 'Atualizar';
    showConnection();
    renderMarket();
    updateResult();
  }
}

function choosePair(from, to) {
  $('from').value = from;
  $('to').value = to;
  updateResult();
  savePreferences();
  if (window.matchMedia('(max-width: 760px)').matches) $('conversor').scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
}

try {
  const cached = JSON.parse(localStorage.getItem(CACHE_KEY));
  if (cached && Number.isFinite(cached.fetchedAt) && cached.fetchedAt <= Date.now() && Date.now() - cached.fetchedAt < 7 * 24 * 60 * 60_000) {
    state.quotes = normalizeQuotes(cached.payload);
    state.fetchedAt = cached.fetchedAt;
    state.cached = true;
  }
} catch { /* Ignore unavailable storage or an invalid cache. */ }

$('converter-form').addEventListener('submit', event => {
  event.preventDefault();
  updateResult({ validate: true });
  if ($('amount').hasAttribute('aria-invalid')) $('amount').focus();
  else if (!state.result || Date.now() - state.fetchedAt > REFRESH_MS) refresh();
});
$('amount').addEventListener('input', () => updateResult());
for (const id of ['from','to']) $(id).addEventListener('change', () => { updateResult(); savePreferences(); });
$('swap').addEventListener('click', () => choosePair($('to').value, $('from').value));
document.querySelectorAll('[data-from]').forEach(button => button.addEventListener('click', () => choosePair(button.dataset.from, button.dataset.to)));
$('more-currencies').addEventListener('click', () => { state.expanded = !state.expanded; renderMarket(); });
$('refresh').addEventListener('click', () => refresh({ manual: true }));
$('copy').addEventListener('click', async () => {
  if (!state.result) return;
  try {
    await navigator.clipboard.writeText(`${$('result-caption').textContent} ${$('result-value').textContent}. ${$('unit-rate').textContent}. ${$('quote-time').textContent}. Fonte: AwesomeAPI.`);
    $('copy-label').textContent = 'Copiado!';
  } catch { $('copy-label').textContent = 'Selecione o valor'; }
  setTimeout(() => { $('copy-label').textContent = 'Copiar'; }, 2500);
});
window.addEventListener('online', () => { state.nextAttempt = 0; refresh(); });
window.addEventListener('offline', () => { showConnection(); updateResult(); });
document.addEventListener('visibilitychange', () => { if (!document.hidden) { showConnection(); updateResult(); refresh(); } });
setInterval(() => {
  if (document.hidden) return;
  showConnection();
  refresh();
}, REFRESH_MS);

renderMarket();
updateResult();
refresh();
