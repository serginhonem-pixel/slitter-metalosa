// Gera sankhya/dist/index.jsp e index.html: componente base + aba "Otimizador" (motor do app).
// Uso: node sankhya/build.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const rd = (p) => fs.readFileSync(path.join(dir, p), 'utf8');

// Motor do app: vira script comum (sem export) e sem template literals com ${ ...}
// (o JSP interpreta ${...} como EL no servidor).
const engineSrc = rd('../src/utils/optimizationEngine.js');
const cut = engineSrc.indexOf('export const calculateSheetOptimization');
let engine = (cut > 0 ? engineSrc.slice(0, cut) : engineSrc).replace(/^export /gm, '');
engine = engine.replace(/`([^`]*)`/g, (m, body) => {
  if (!body.includes('${')) return m;
  const parts = body.split(/\$\{([^}]*)\}/);
  return parts.map((s, i) => (i % 2 ? `(${s})` : JSON.stringify(s))).filter((s) => s !== '""').join(' + ') || '""';
});

const ui = rd('src/otimizador.js');
const css = rd('src/otimizador.css');
const view = rd('src/otimizador.html');

for (const [name, code] of [['engine', engine], ['ui', ui], ['view', view], ['css', css]]) {
  if (/\$\{|#\{|<%/.test(code)) throw new Error(`"${name}" contém \${ , #{ ou <% (quebra no JSP)`);
}

function patch(src) {
  const rep = (from, to) => {
    if (!src.includes(from)) throw new Error('âncora não encontrada: ' + from.slice(0, 60));
    src = src.replace(from, () => to);
  };
  rep('</style>', css + '</style>');
  rep('<button data-t="pl">Plano de Corte</button>', '<button data-t="pl">Plano de Corte</button><button data-t="ot">Otimizador</button>');
  rep('<script>', view + '<script>');
  // motor + ui antes do "load();" final
  const last = src.lastIndexOf('\nload();');
  if (last < 0) throw new Error('âncora load() não encontrada');
  src = src.slice(0, last) + '\n// ===== motor do app =====\n' + engine + '\n' + ui + src.slice(last);
  rep("$('v_pl').style.display=t==='pl'?'':'none';", "$('v_pl').style.display=t==='pl'?'':'none';$('v_ot').style.display=t==='ot'?'':'none';");
  rep("['tv','pl'].includes(sessionStorage.getItem('slit_tab'))", "['tv','pl','ot'].includes(sessionStorage.getItem('slit_tab'))");
  rep("plLoad().then(()=>{plBase();plMothers();plPickMother(true)})", "plLoad().then(()=>{plBase();plMothers();plPickMother(true);otInit()})");
  rep("$('pl_go').onclick=plGo;", "$('ot_m').onchange=()=>otPickMother(true);$('ot_base').onchange=()=>{otMothers();otPickMother(false)};$('ot_go').onclick=otGo;$('ot_xls').onclick=otXlsx;$('ot_pdf').onclick=otPrint;$('ot_in').onchange=e=>{if(e.target.matches('.ot-inc,.ot-w,.ot-n'))otRead()};$('pl_go').onclick=plGo;");
  return src;
}

fs.mkdirSync(path.join(dir, 'dist'), { recursive: true });
for (const f of ['index.jsp', 'index.html']) {
  fs.writeFileSync(path.join(dir, 'dist', f), patch(rd('base/' + f)));
  console.log('ok', 'sankhya/dist/' + f);
}
