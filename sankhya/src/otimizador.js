// ===== Aba Otimizador (motor do app Betini Slitter + sugestoes) =====
// O motor (calculateOptimization e auxiliares) e injetado pelo build a partir de src/utils/optimizationEngine.js.
// Aqui fica so a ponte com os dados do Sankhya (S, LARG, plSv) e a visualizacao.
let ot={over:{},res:null,mothers:{}};
const OT_COLORS=['#2f6fb0','#c0642b','#3b8b3b','#8a4fa0','#b08a1e','#1f8a8a','#b04a68','#5a6b2a','#6b5bb0','#a0522d'];
const otColor=(()=>{const m={};let n=0;return k=>m[k]||(m[k]=OT_COLORS[n++%OT_COLORS.length])})();

function otBase(){
 const cur=$('ot_base').value,src=$('base');
 $('ot_base').innerHTML=src.innerHTML;
 $('ot_base').value=[...$('ot_base').options].some(o=>o.value===cur)&&cur?cur:src.value;
}
function otMothers(){
 ot.mothers={};const bv=$('ot_base').value||'res';
 for(const it of S.items){
  if(!it.m.length)continue;
  const mc=it.m.slice().sort((a,b)=>+a.c-+b.c)[0].c;
  const o=ot.mothers[mc]=ot.mothers[mc]||{c:mc,m:S.mothers[mc],items:[],nf:0};
  o.items.push(it);if(plSv(it.c,bv).falta>0)o.nf++;
 }
 const cur=$('ot_m').value;
 const arr=Object.values(ot.mothers).sort((a,b)=>(b.nf>0)-(a.nf>0)||+a.c-+b.c);
 $('ot_m').innerHTML=arr.map(o=>{const e=plSv(o.c,'res').est;return '<option value="'+esc(o.c)+'">'+esc(o.c)+' - '+esc(o.m?o.m.n:'')+' | saldo '+fmt(e)+' kg'+(o.nf?' | '+o.nf+' em falta':'')+'</option>'}).join('');
 if(cur&&ot.mothers[cur])$('ot_m').value=cur;
}
function otPickMother(reset){
 const o=ot.mothers[$('ot_m').value];if(!o)return;
 if(reset){
  $('ot_W').value=LARG[o.c]||$('ot_W').value||1200;
  const kgc=parseFloat($('ot_kgc').value)||10000;
  $('ot_nc').value=Math.max(0,Math.ceil(plSv(o.c,'res').est/kgc));
  ot.res=null;
 }
 otRenderIn();
 $('ot_hint').textContent=LARG[o.c]?'':'Largura da mãe não cadastrada: confira o valor informado';
}
function otRenderIn(){
 const o=ot.mothers[$('ot_m').value];if(!o){$('ot_in').innerHTML='<div class="msg">Sem bobina-mãe ligada ao processo.</div>';return}
 const bv=$('ot_base').value||'res';
 const rows=o.items.map(it=>({it,sv:plSv(it.c,bv)})).sort((a,b)=>b.sv.falta-a.sv.falta||+a.it.c-+b.it.c);
 let b='';
 for(const {it,sv} of rows){
  const k=o.c+'|'+bv+'|'+it.c,ov=ot.over[k]||(ot.over[k]={});
  const w=ov.w!=null?ov.w:(LARG[it.c]||''),nd=ov.need!=null?ov.need:Math.round(sv.falta*100)/100,inc=ov.inc!=null?ov.inc:sv.falta>0;
  b+='<tr data-k="'+esc(k)+'"><td><input type="checkbox" class="ot-inc"'+(inc?' checked':'')+'></td><td>'+esc(it.c)+'</td><td title="'+esc(it.n)+'">'+esc(it.n)+'</td><td><input type="number" class="ot-w'+(w?'':' miss')+'" min="0" step="0.5" value="'+w+'" placeholder="mm"></td><td class="n">'+fmt(sv.est)+'</td><td class="n">'+fmt(sv.need)+'</td><td><input type="number" class="ot-n" min="0" step="10" value="'+nd+'"></td></tr>';
 }
 const h=(t,c)=>'<th'+(c?' class="n"':'')+' style="cursor:default">'+t+'</th>';
 $('ot_in').innerHTML='<table><thead><tr>'+h('Usar')+h('Código')+h('Bobininha')+h('Largura (mm)')+h('Saldo (kg)',1)+h('Necessidade da base (kg)',1)+h('Produzir (kg)')+'</tr></thead><tbody>'+b+'</tbody></table>';
}
function otRead(){
 const o=ot.mothers[$('ot_m').value];if(!o)return null;
 const items=[];
 document.querySelectorAll('#ot_in tbody tr').forEach(tr=>{
  const k=tr.dataset.k,c=k.split('|')[2],it=o.items.find(x=>x.c===c);
  const inc=tr.querySelector('.ot-inc').checked,w=parseFloat(tr.querySelector('.ot-w').value),nd=parseFloat(tr.querySelector('.ot-n').value);
  const ov=ot.over[k]=ot.over[k]||{};ov.inc=inc;ov.w=isNaN(w)?'':w;ov.need=isNaN(nd)?0:nd;
  if(inc&&nd>0)items.push({id:c,n:it.n,w:isNaN(w)?0:w,need:nd});
 });
 return {o,items};
}
function otGo(){
 const r=otRead();if(!r)return;
 const W=parseFloat($('ot_W').value),ref=parseFloat($('ot_ref').value)||0,kgc=parseFloat($('ot_kgc').value)||0;
 const nc0=parseInt($('ot_nc').value,10);
 const msg=t=>{$('ot_sum').innerHTML='<span class="r">'+t+'</span>';$('ot_out').innerHTML='';ot.res=null};
 if(!(W>0))return msg('Informe a largura da bobina-mãe (mm).');
 if(!(kgc>0))return msg('Informe o peso médio da bobina-mãe (kg).');
 if(W-ref<=0)return msg('O refilo é maior que a largura da mãe.');
 if(!r.items.length)return msg('Nenhuma bobininha marcada com necessidade maior que zero.');
 const U=W-ref,warn=[],demands=[],names={};
 for(const i of r.items){
  names[i.id]=i.n;
  if(!(i.w>0)){warn.push(i.n+' ('+i.id+') fora do otimizador: sem largura');continue}
  if(i.w>U){warn.push(i.n+' ('+i.id+') fora do otimizador: largura maior que a largura útil ('+fmt(U)+' mm)');continue}
  demands.push({id:i.id,code:i.id,desc:i.n,width:i.w,targetWeight:i.need});
 }
 if(!demands.length)return msg('Nenhuma bobininha com largura válida para otimizar.');
 // sugestoes: todas as bobininhas da mae com largura conhecida (as da necessidade e as demais do cadastro)
 const products=[];
 for(const it of r.o.items){const w=(ot.over[r.o.c+'|'+($('ot_base').value||'res')+'|'+it.c]||{}).w;const ww=(w!=null&&w!==''?+w:LARG[it.c]);if(ww>0&&ww<=U)products.push({code:it.c,desc:it.n,width:ww,history:0})}
 // pool de bobinas-mae: quantidade informada, ou o maximo necessario quando "sem limite"
 let n=nc0>0?nc0:0;
 if(!(n>0)){for(const d of demands)n+=Math.ceil(d.targetWeight/Math.max(1e-9,d.width/W*kgc))}
 const stockCoils=Array.from({length:n},(_,i)=>({id:'m'+(i+1),weight:kgc}));
 let out;
 try{out=calculateOptimization({motherWidth:W,trim:ref,stockCoils,demands,availableProducts:products})}
 catch(e){return msg('Erro no cálculo: '+esc(e.message))}
 const e=$('emp');
 ot.res={out,names,W,ref,U,kgc,warn,limited:nc0>0,nc:n,mother:r.o,when:new Date().toLocaleString('pt-BR',{dateStyle:'short',timeStyle:'short'}),base:$('ot_base').options[$('ot_base').selectedIndex].text,emp:e.options[e.selectedIndex]?e.options[e.selectedIndex].text:''};
 otShow();
}
function otGroup(cuts){ // cortes iguais agrupados: [{code,desc,width,n}]
 const g={};
 for(const c of cuts){const k=c.code+'|'+c.width;(g[k]=g[k]||{code:c.code,desc:c.desc,width:c.width,n:0,filler:!!c.isFiller}).n++}
 return Object.values(g).sort((a,b)=>b.width-a.width);
}
function otShow(){
 const P=ot.res;if(!P)return;
 const R=P.out.results,SG=P.out.suggestions,S0=R.stats,eff=+S0.efficiency;
 const da=Object.values(R.demandAnalysis);
 const defKg=da.reduce((s,d)=>s+Math.max(0,d.reqWeight-d.producedWeight),0);
 const excKg=da.reduce((s,d)=>s+Math.max(0,d.producedWeight-d.reqWeight),0);
 const effCls=eff>=97?'ok':(eff<90?'bad':'');
 $('ot_sum').innerHTML='<span style="color:#555">Mãe: <b>'+esc(P.mother.c)+' - '+esc(P.mother.m?P.mother.m.n:'')+'</b> ('+fmt(P.W)+' mm, refilo '+fmt(P.ref)+' mm) · '+fmt(P.nc)+' bobina(s) de '+fmt(P.kgc)+' kg'+(P.limited?'':' (sem limite)')+'</span>';
 let k='<div class="ot-k">';
 k+='<div class="'+effCls+'"><small>Eficiência</small><b>'+fmt(eff)+'%</b></div>';
 k+='<div><small>Bobinas-mãe usadas</small><b>'+fmt(S0.totalCoils)+'</b></div>';
 k+='<div><small>Consumo de mãe</small><b>'+fmt(S0.totalInputWeight)+' kg</b></div>';
 k+='<div><small>Sucata</small><b>'+fmt(+S0.totalScrapWeight)+' kg</b></div>';
 k+='<div><small>Padrões de corte</small><b>'+R.patterns.length+'</b></div>';
 k+='<div class="'+(defKg>0.5?'bad':'ok')+'"><small>'+(defKg>0.5?'Não atendido':'Atende toda a necessidade')+'</small><b>'+(defKg>0.5?fmt(defKg)+' kg':'OK')+'</b></div>';
 if(excKg>0.5)k+='<div><small>Excedente de produção</small><b>'+fmt(excKg)+' kg</b></div>';
 k+='</div>';
 let w='';for(const x of P.warn)w+='<div class="pl-warn">'+esc(x)+'</div>';
 if(defKg>0.5&&P.limited)w+='<div class="pl-warn">Bobinas insuficientes para atender tudo: aumente "Bobinas disponíveis" ou use 0 (sem limite).</div>';
 // padroes
 const codes={};
 let pt='<div class="pl-h">Padrões de corte (cada linha = um jeito de cortar a bobina-mãe)</div>';
 R.patterns.forEach((p,i)=>{
  const gr=otGroup(p.cuts),sobra=P.U-p.usedWidth;
  const inW=p.assignedCoils.reduce((s,c)=>s+c.weight,0);
  const pe=p.usedWidth/P.W*100;
  const seg=gr.map(g=>{codes[g.code]=g;const pct=g.width*g.n/P.W*100;return '<i style="width:'+pct+'%;background:'+otColor(g.code)+'" title="'+esc(g.desc)+' ('+esc(g.code)+')">'+(pct>6?g.n+' × '+fmt(g.width):'')+'</i>'}).join('');
  const sb=sobra>0.001?'<i class="sb" style="width:'+sobra/P.W*100+'%" title="Sobra">'+(sobra/P.W*100>6?fmt(sobra)+' mm':'')+'</i>':'';
  const rf=P.ref>0?'<i class="rf" style="width:'+P.ref/P.W*100+'%" title="Refilo">'+(P.ref/P.W*100>6?'refilo':'')+'</i>':'';
  pt+='<div class="ot-pat"><div class="hd"><b>Padrão '+(i+1)+'</b><span>× '+p.count+' bobina(s) · '+fmt(inW)+' kg de mãe</span><span>usa '+fmt(p.usedWidth)+' de '+fmt(P.U)+' mm úteis · sobra '+fmt(sobra)+' mm</span><span>aproveitamento '+fmt(pe)+'% · sucata '+fmt(p.scrapWeight)+' kg</span></div>'
   +'<div class="ot-bar">'+seg+sb+rf+'</div>'
   +'<div style="font-size:12px;color:#444;margin-top:2px">'+gr.map(g=>g.n+' × '+fmt(g.width)+' mm <span style="color:#777">'+esc(g.desc)+'</span>').join(' &nbsp;+&nbsp; ')+'</div></div>';
 });
 pt+='<div class="ot-leg">'+Object.values(codes).map(g=>'<span><em style="background:'+otColor(g.code)+'"></em>'+esc(g.code)+' · '+fmt(g.width)+' mm</span>').join('')+'<span><em style="background:#fdecea"></em>sobra</span><span><em style="background:#ececec"></em>refilo</span></div>';
 // atendimento
 let t2='';
 const dk=Object.keys(R.demandAnalysis).sort((a,b)=>+a-+b);
 for(const id of dk){
  const d=R.demandAnalysis[id],diff=d.producedWeight-d.reqWeight;
  const st=diff<-0.5?'<span style="color:#b3261e;font-weight:600">FALTA '+fmt(-diff)+' kg</span>':(diff>0.5?'<span style="color:#9a5b00;font-weight:600">+'+fmt(diff)+' kg excedente</span>':'<span class="pl-ok">OK</span>');
  t2+='<tr><td>'+esc(id)+'</td><td>'+esc(d.desc)+'</td><td class="n">'+fmt(d.width)+'</td><td class="n">'+fmt(d.reqWeight)+'</td><td class="n"><b>'+fmt(d.producedWeight)+'</b></td><td class="n">'+fmt(d.producedQty)+'</td><td>'+st+'</td></tr>';
 }
 const h=(t,c)=>'<th'+(c?' class="n"':'')+' style="cursor:default">'+t+'</th>';
 const at='<div class="pl-h">Atendimento da necessidade</div><table><thead><tr>'+h('Código')+h('Bobininha')+h('Largura (mm)',1)+h('Necessário (kg)',1)+h('Produzido (kg)',1)+h('Tiras',1)+h('Situação')+'</tr></thead><tbody>'+t2+'</tbody></table>';
 // sugestoes
 let sg='';
 if(SG.length){
  sg='<div class="pl-h">Sugestões para aproveitar as sobras</div><div class="pl-warn" style="color:#555">Padrões com sobra de largura que ainda comportam bobininhas do cadastro desta mãe. Cada opção mostra o que encaixar na sobra e a eficiência geral resultante.</div>';
  for(const s of SG){
   const rows=s.suggestions.map((x,j)=>{
    const g=otGroup(x.items);
    const up=x.projectedEfficiency-eff;
    return '<tr class="'+(j===0?'best':'')+'"><td>'+g.map(a=>a.n+' × '+fmt(a.width)+' mm <span style="color:#777">'+esc(a.desc)+'</span>').join(' + ')+'</td><td class="n">'+fmt(x.totalWidth)+'</td><td class="n">'+fmt(x.remainingWaste)+'</td><td class="n">'+fmt(x.totalWeightToAdd)+'</td><td class="n"><b>'+fmt(x.projectedEfficiency)+'%</b> <span class="ot-up">'+(up>0.005?'+'+fmt(up)+' pp':'')+'</span></td></tr>';
   }).join('');
   sg+='<div class="ot-sg"><div class="t">Padrão '+(R.patterns.findIndex(p=>p.index===s.patternIndex)+1)+' · '+s.patternCount+' bobina(s) · sobra de '+fmt(s.waste)+' mm</div><table><thead><tr>'+h('Encaixar na sobra')+h('Largura (mm)',1)+h('Sobra restante (mm)',1)+h('Produção extra (kg)',1)+h('Eficiência geral',1)+'</tr></thead><tbody>'+rows+'</tbody></table></div>';
  }
 }else if(eff>=97)sg='<div class="pl-h">Sugestões</div><div class="pl-warn" style="color:#1b6e1b">Plano já bem aproveitado: não há sobra relevante para sugerir.</div>';
 else sg='<div class="pl-h">Sugestões</div><div class="pl-warn">Nenhuma bobininha do cadastro desta mãe cabe nas sobras dos padrões.</div>';
 $('ot_out').innerHTML=w+k+pt+at+sg;
}
function otXlsx(){
 const P=ot.res;if(!P)return;
 const R=P.out.results,heads=['Padrão','Bobinas','Mãe do padrão (kg)','Sobra (mm)','Código','Bobininha','Largura (mm)','Tiras por bobina','Produção (kg)'];
 const data=[];
 R.patterns.forEach((p,i)=>{
  const inW=p.assignedCoils.reduce((s,c)=>s+c.weight,0);
  for(const g of otGroup(p.cuts)){
   const kg=p.assignedCoils.reduce((s,c)=>s+g.n*g.width/P.W*c.weight,0);
   data.push({k:'',v:[i+1,p.count,inW,P.U-p.usedWidth,+g.code||g.code,g.desc,g.width,g.n,kg]});
  }
 });
 xlsxBuild('Otimizador | Mãe '+P.mother.c+' - '+(P.mother.m?P.mother.m.n:'')+' | '+P.W+' mm, refilo '+P.ref+' mm | Eficiência '+fmt(+R.stats.efficiency)+'%, sucata '+fmt(+R.stats.totalScrapWeight)+' kg | Base: '+P.base+' | '+P.when,heads,new Set([1,2,3,6,7,8]),[8,9,17,11,10,46,13,16,14],data,'otimizador');
}
function otPrint(){
 if(!ot.res){otGo();if(!ot.res)return}
 const Q=ot.res;
 $('ph').innerHTML='<span class="t">Otimizador de corte longitudinal</span> &nbsp; '+esc(Q.emp)+' &nbsp;|&nbsp; Base: '+esc(Q.base)+' &nbsp;|&nbsp; '+esc(Q.when)+'<br>'+$('ot_sum').innerHTML;
 setTimeout(()=>window.print(),50);
}
function otInit(){otBase();otMothers();otPickMother(true)}
