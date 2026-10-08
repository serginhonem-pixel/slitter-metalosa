// Teste de fumaça: abre sankhya/dist/index.html com o Sankhya simulado e roda a aba Otimizador.
// Uso: node sankhya/test/smoke.mjs   (usa o Chrome instalado e playwright-core de promo/capture)
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
const here = path.dirname(fileURLToPath(import.meta.url));
const { chromium } = createRequire(path.join(here, '../../promo/capture/'))('playwright-core');
const page_url = pathToFileURL(path.join(here, '../dist/index.html')).href;

const meta = (cols, rows) => ({ status: '1', responseBody: { fieldsMetadata: cols.map((name) => ({ name })), rows } });
const MAE = 9001;
const PA = [[101, 'PERFIL A 100', 100, 9000], [102, 'PERFIL B 150', 150, 6000], [103, 'PERFIL C 220', 220, 5000], [104, 'PERFIL D 75', 75, 0]];
function answer(sql) {
  if (sql.includes('QTDMISTURA')) return meta(['CODPRODPA','DESC_PA','UN_PA','CODPRODMP','DESC_MP','UN_MP','QTD'], PA.map(([c, n]) => [c, n, 'KG', MAE, 'BOBINA MAE 1200', 'KG', 1]));
  if (sql.includes('TGFEST')) return meta(['CODPROD','CODEMP','EMPRESA','CODLOCAL','LOCAL','EST','RES'], [[MAE, 4, 'MATRIZ', 1, 'ALMOX', 60000, 0], ...PA.map(([c, , , res]) => [c, 4, 'MATRIZ', 1, 'ALMOX', 0, res])]);
  if (sql.includes('TPRIMPS')) return meta(['NUMPS','CODPROD','DEM'], []);
  if (sql.includes('TPRMPS')) return meta(['NUMPS','DESCRICAO','INI','FIM','ALT'], []);
  if (sql.includes('LARGURA')) return meta(['CODPROD','LARGURA'], [[MAE, 1200], ...PA.map(([c, , w]) => [c, w])]);
  return meta([], []);
}

const b = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const p = await (await b.newContext({ viewport: { width: 1500, height: 1000 } })).newPage();
const errs = [];
p.on('pageerror', (e) => errs.push('pageerror: ' + e.message));
p.on('console', (m) => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
await p.route('**/mge/service.sbr**', (r) => r.fulfill({ contentType: 'application/json', body: JSON.stringify(answer(JSON.parse(r.request().postData()).requestBody.sql)) }));
await p.goto(page_url);
await p.waitForTimeout(800);
await p.click('.tabs button[data-t="ot"]');
await p.waitForTimeout(300);
console.log('mae W =', await p.inputValue('#ot_W'), '| bobinas =', await p.inputValue('#ot_nc'));
await p.click('#ot_go');
await p.waitForTimeout(500);
console.log('SUM:', (await p.innerText('#ot_sum')).replace(/\s+/g, ' '));
console.log('KPIs:', (await p.innerText('.ot-k')).replace(/\s+/g, ' '));
console.log('padroes:', await p.locator('.ot-pat').count(), '| sugestoes:', await p.locator('.ot-sg').count());
console.log((await p.innerText('#ot_out')).split('\n').filter(Boolean).slice(0, 40).join('\n'));
await p.screenshot({ path: path.join(here, 'otimizador.png'), fullPage: true });
console.log('ERROS:', errs.length ? errs : 'nenhum');
await b.close();
