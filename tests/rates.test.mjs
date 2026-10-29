import test from 'node:test';
import assert from 'node:assert/strict';
import { parseAmount, normalizeQuotes, convert, formatMoney, fetchQuotes } from '../rates.mjs';

const now = 1_800_000_000_000;
const fixture = {
  USDBRL: { code: 'USD', codein: 'BRL', bid: '5', ask: '5.2', timestamp: String(now / 1000), pctChange: '1.2' },
  EURBRL: { code: 'EUR', codein: 'BRL', bid: '6', ask: '6.2', timestamp: String(now / 1000 - 60), pctChange: '-0.5' },
  BTCBRL: { code: 'BTC', codein: 'BRL', bid: '500000', ask: '500000', timestamp: String(now / 1000), pctChange: '2' },
};
const quotes = normalizeQuotes(fixture, now);

test('Brazilian amounts, grouping, decimal point, zero and bitcoin precision', () => {
  for (const [input, expected] of [['1.000,50',1000.5],['1.000',1000],['1000,50',1000.5],['12.50',12.5],['0',0],['0,00000001',1e-8],[' 25,50 ',25.5],['1.000.000.000.000',1e12]]) assert.equal(parseAmount(input), expected);
});
test('Reject negative, empty, malformed, ambiguous and overflowing amounts', () => {
  for (const input of ['', ' ', '-5', 'NaN', 'Infinity', '1e8', '1,2,3', '1,000.50', '12.34,56', '1 000', '<script>', '0,123456789', '1000000000001']) assert.throws(() => parseAmount(input), undefined, input);
});
test('BRL to foreign, reverse and cross conversions agree mathematically', () => {
  assert.ok(Math.abs(convert(51,'BRL','USD',quotes).amount - 10) < 1e-10);
  assert.equal(convert(10,'USD','BRL',quotes).amount,51);
  assert.ok(Math.abs(convert(61,'EUR','USD',quotes).amount - 61 * 6.1 / 5.1) < 1e-10);
  assert.equal(convert(61,'EUR','USD',quotes).timestamp,now - 60000);
});
test('Same currency and zero; unavailable pair cannot fabricate a rate', () => {
  assert.deepEqual(convert(24,'USD','USD',{}),{amount:24,rate:1,timestamp:null});
  assert.equal(convert(0,'BRL','USD',quotes).amount,0);
  assert.throws(()=>convert(100,'BRL','GBP',quotes));
  assert.throws(()=>convert(100,'FAKE','BRL',quotes));
  assert.throws(()=>convert(-1,'BRL','USD',quotes));
});
test('Bitcoin retains eight decimals and yen uses zero decimals', () => {
  assert.equal(convert(0.005,'BRL','BTC',quotes).amount,0.00000001);
  assert.equal(formatMoney(0.00000001,'BTC'),'₿ 0,00000001');
  assert.match(formatMoney(123.456,'JPY'),/123$/);
  assert.match(formatMoney(0.001,'BRL',true),/0,00100000$/);
});
test('Invalid quotes, non-finite values, wrong pairs and future timestamps are rejected', () => {
  for (const patch of [{bid:'0'}, {ask:'-2'}, {ask:'Infinity'}, {bid:'garbage'}, {ask:'4'}, {timestamp:'0'}, {timestamp:String(now/1000+301)}, {codein:'USD'}]) {
    assert.throws(()=>normalizeQuotes({USDBRL:{...fixture.USDBRL,...patch}},now));
  }
  assert.throws(()=>normalizeQuotes(null,now));
  assert.throws(()=>normalizeQuotes({},now));
  const partial=normalizeQuotes({...fixture,GBPBRL:{code:'GBP'}},now);
  assert.deepEqual(Object.keys(partial),['USD','EUR','BTC']);
  assert.equal(normalizeQuotes({USDBRL:{...fixture.USDBRL,pctChange:''}},now).USD.change,null);
});
test('Old quotes retain original timestamps, so the UI can identify stale data', () => {
  const old=normalizeQuotes({USDBRL:{...fixture.USDBRL,timestamp:String(now/1000-86400)}},now);
  assert.equal(convert(100,'USD','BRL',old).timestamp,now-86400000);
});
test('HTTP failure, rate limits, bad JSON and network errors propagate', async () => {
  await assert.rejects(fetchQuotes({fetcher:async()=>({ok:false,status:429})}),/Limite/);
  await assert.rejects(fetchQuotes({fetcher:async()=>({ok:false,status:503})}));
  await assert.rejects(fetchQuotes({fetcher:async()=>({ok:true,json:async()=>{throw new Error('bad JSON');}})}));
  await assert.rejects(fetchQuotes({fetcher:async()=>{throw new Error('offline');}}));
});
test('Requests time out and successful data is validated', async () => {
  await assert.rejects(fetchQuotes({timeoutMs:5,fetcher:(_, {signal})=>new Promise((resolve,reject)=>signal.addEventListener('abort',()=>reject(new Error('aborted'))))}),/aborted/);
  const result=await fetchQuotes({now:()=>now,fetcher:async()=>({ok:true,json:async()=>fixture})});
  assert.equal(result.fetchedAt,now);
  assert.equal(result.quotes.USD.rate,5.1);
});
