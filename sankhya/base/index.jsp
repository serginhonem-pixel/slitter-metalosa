<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" isELIgnored="false" %>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<%@ taglib prefix="snk" uri="/WEB-INF/tld/sankhyaUtil.tld" %>
<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Saldos de Corte</title>
<style>
*{box-sizing:border-box}
body{margin:0;background:#fff;color:#222;font:13px/1.35 "Segoe UI",Roboto,Arial,sans-serif}
.bar{display:flex;flex-wrap:wrap;gap:6px 18px;align-items:center;padding:8px 10px;border-bottom:1px solid #cfcfcf;background:#f4f4f4}
.bar label{color:#555;margin-right:4px}
.bar select,.bar input[type=search],.bar input[type=number]{font:inherit;padding:3px 5px;border:1px solid #b8b8b8;background:#fff;border-radius:2px}
.bar input[type=number]{width:70px}.bar input[type=search]{width:170px}
.bar button{font:inherit;padding:3px 12px;border:1px solid #9a9a9a;background:#e9e9e9;border-radius:2px;cursor:pointer}
.bar button:hover{background:#dcdcdc}
.locs label{margin-right:8px;color:#222}
.sum{padding:6px 10px;color:#444;border-bottom:1px solid #e0e0e0;font-size:12px}
.sum b{color:#000}.sum .r{color:#b3261e;font-weight:600}.sum .o{color:#9a5b00;font-weight:600}
.wrap{overflow:auto;max-height:calc(100vh - 152px)}
table{border-collapse:collapse;width:100%}
th{position:sticky;top:0;background:#ececec;border:1px solid #cfcfcf;padding:4px 8px;text-align:left;font-weight:600;cursor:pointer;white-space:nowrap;user-select:none}
th.n,td.n{text-align:right;font-variant-numeric:tabular-nums}
th:hover{background:#e0e0e0}
td{border:1px solid #e3e3e3;padding:3px 8px;white-space:nowrap}
tr.g td{background:#e8e8e8;font-weight:600;border-color:#cfcfcf;cursor:pointer}
tr.g td.m{font-weight:400;color:#444}
tr.f td{background:#fdecea}
tr.f td.s,tr.f td.k{color:#b3261e;font-weight:700}
tr.z td{background:#f3f3f3}
tr.z td.s{color:#777;font-weight:600}
tr.w td{background:#fff8e6}
tr.w td.s{color:#9a5b00;font-weight:600}
tbody tr:not(.g):not(.f):not(.z):not(.w):hover td{background:#f3f7fb}
.bar2{display:flex;flex-wrap:wrap;gap:6px;align-items:center;padding:6px 10px;border-bottom:1px solid #cfcfcf;background:#fafafa}
.bar2 .lb{color:#555;margin-right:2px}
.bar2 button{font:inherit;padding:3px 11px;border:1px solid #b0b0b0;background:#fff;border-radius:2px;cursor:pointer}
.bar2 button:hover{background:#eee}
.bar2 button.on{background:#dfe6ef;border-color:#6b84a3;font-weight:600}
.bar2 .sp{width:14px}
.bar2 button.f{color:#b3261e}
td.d{max-width:420px;overflow:hidden;text-overflow:ellipsis}
mark{background:#ffe58f}
.msg{padding:30px;color:#666}
.st{color:#666;margin-left:auto;font-size:12px}
#ph{display:none}
@media print{
 @page{size:A4 landscape;margin:8mm}
 body{font-size:9.5px;-webkit-print-color-adjust:exact;print-color-adjust:exact}
 .bar,.bar2,.sum,.tabs{display:none!important}
 #ph{display:block;padding:0 0 6px;border-bottom:1px solid #999;margin-bottom:4px}
 #ph .t{font-size:13px;font-weight:700}
 .wrap{overflow:visible;max-height:none}
 th{position:static;cursor:default}
 thead{display:table-header-group}
 tr{break-inside:avoid}
 th,td{padding:2px 5px}
 td.d{max-width:none;white-space:normal}
 .noprint{display:none!important}
 .sum{white-space:normal}
}
.tabs{display:flex;gap:2px;padding:6px 10px 0;background:#e4e4e4;border-bottom:1px solid #b8b8b8}
.tabs button{font:inherit;padding:5px 16px;border:1px solid #b8b8b8;border-bottom:none;background:#f2f2f2;cursor:pointer;border-radius:3px 3px 0 0}
.tabs button.on{background:#fff;font-weight:600;position:relative;top:1px}
.tabs .sig{margin-left:auto;align-self:center;margin-right:62px;font-size:11px;font-style:italic;color:#666;white-space:nowrap;padding-bottom:4px}
@page{@bottom-left{content:"por Sergio Betini";font:italic 7pt Arial,sans-serif;color:#555}}


.bar button.pri{background:#3b8b3b;color:#fff;border-color:#2c6d2c;font-weight:600}
.bar button.pri:hover{background:#2f7a2f}
.pl-in{overflow:auto;max-height:42vh;border-bottom:1px solid #cfcfcf}
.pl-in input[type=number]{width:90px;font:inherit;padding:2px 4px;border:1px solid #b8b8b8;text-align:right}
.pl-in input.miss{border-color:#b3261e;background:#fdecea}
.pl-h{padding:8px 10px 2px;font-weight:600;color:#222}
.pl-warn{padding:4px 10px;color:#9a5b00;font-size:12px}
.pl-ok{color:#1b6e1b;font-weight:600}
</style>
</head>
<body>
<div class="tabs"><button data-t="sl" class="on">Corte Longitudinal</button><button data-t="tv">Corte Transversal</button><button data-t="pl">Plano de Corte</button><span class="sig">por Sergio Betini</span></div>
<div id="ph"></div>
<div id="v_sl">
<div class="bar">
 <span><label>Empresa</label><select id="emp"></select></span>
 <span><label>Locais</label><span class="locs" id="locs"></span></span>
 <span><label>Base da necessidade</label><select id="base" title="De onde vem a demanda usada para calcular a falta"><option value="res">Reservado (estoque)</option></select></span>
 <span><label>Buscar</label><input type="search" id="q" placeholder="código ou descrição"></span>
 <span><label>Baixa se disponível &lt;</label><input type="number" id="lim" value="500" min="0" step="50"> kg</span>
 <span><label>Situação</label><select id="fil"><option value="all">Todas</option><option value="need">Precisam de corte (falta, baixa, zerada)</option><option value="f">Só em falta</option><option value="w">Só baixas</option><option value="z">Só zeradas</option></select></span>
 <span><label><input type="checkbox" id="grp" checked> Agrupar por bobina-mãe</label></span>
 <button id="ref">Atualizar</button>
 <span class="st" id="st">Carregando...</span>
</div>
<div class="bar2" id="pre">
 <span class="lb">Atalhos:</span>
 <button data-p="prio" title="Só o que precisa de corte, mais urgente primeiro, agrupado por bobina-mãe">Prioridade de corte</button>
 <button data-p="falta" class="f" title="Reservado maior que o saldo, ordenado pela maior falta">Faltas p/ reserva</button>
 <button data-p="zero" title="Sem saldo e sem reserva">Zeradas</button>
 <button data-p="mae" title="Todas, agrupadas por bobina-mãe, ordem de código">Por bobina-mãe</button>
 <button data-p="lista" title="Lista única, menor disponível primeiro">Lista geral</button>
 <span class="sp"></span>
 <button id="exp">Expandir tudo</button><button id="col">Recolher tudo</button>
 <span class="sp"></span>
 <button id="xls" title="Baixa a visão atual em .xlsx">Exportar Excel</button><button id="pdf" title="Abre a impressão; escolha Salvar como PDF">Imprimir / PDF</button>
</div>
<div class="sum" id="sum"></div>
<div class="wrap" id="main"><div class="msg">Carregando dados do Sankhya...</div></div>
</div>
<div id="v_tv" style="display:none">
<div class="bar">
 <span><label>Empresa</label><select id="tv_emp"></select></span>
 <span><label>Locais</label><span class="locs" id="tv_locs"></span></span>
 <span><label>Buscar</label><input type="search" id="tv_q" placeholder="código ou descrição"></span>
 <span><label>Situação</label><select id="tv_fil"><option value="all">Todos</option><option value="sal">Com saldo</option><option value="sem">Sem saldo</option></select></span>
 <span><label><input type="checkbox" id="tv_grp" checked> Agrupar por bobina-mãe</label></span>
 <button id="tv_ref">Atualizar</button>
</div>
<div class="bar2">
 <button id="tv_exp">Expandir tudo</button><button id="tv_col">Recolher tudo</button>
 <span class="sp"></span>
 <button id="tv_xls" title="Baixa a visão atual em .xlsx">Exportar Excel</button><button id="tv_pdf" title="Abre a impressão; escolha Salvar como PDF">Imprimir / PDF</button>
</div>
<div class="sum" id="tv_sum"></div>
<div class="wrap" id="tv_main"><div class="msg">Carregando dados do Sankhya...</div></div>
</div>
<div id="v_pl" style="display:none">
<div class="bar">
 <span><label>Bobina-mãe</label><select id="pl_m" style="max-width:430px"></select></span>
 <span><label>Largura da mãe</label><input type="number" id="pl_W" min="1" step="1" placeholder="mm" title="Vem do cadastro (campo LARGURA) quando preenchido"> mm</span>
 <span><label>Refilo total</label><input type="number" id="pl_ref" value="20" min="0" step="1" title="Somatório das aparas laterais descontado da largura útil"> mm</span>
 <span><label>Mãe disponível</label><input type="number" id="pl_kg" min="0" step="100" style="width:100px"> kg</span>
 <span><label>Base da necessidade</label><select id="pl_base"></select></span>
 <button id="pl_go" class="pri">Gerar plano de corte</button>
</div>
<div class="bar2">
 <button id="pl_xls" title="Baixa o plano em .xlsx">Exportar Excel</button><button id="pl_pdf" title="Abre a impressão; escolha Salvar como PDF">Imprimir / PDF</button>
 <span class="sp"></span><span id="pl_hint" style="color:#555"></span>
</div>
<div class="pl-h noprint">1. Necessidade das bobininhas desta mãe (edite o que quiser)</div>
<div class="pl-in noprint" id="pl_in"><div class="msg">Carregando dados do Sankhya...</div></div>
<div class="pl-h">2. Plano de corte</div>
<div class="sum" id="pl_sum">Escolha a bobina-mãe e clique em "Gerar plano de corte".</div>
<div id="pl_out"></div>
</div>
<div id="raw" style="display:none">
<snk:query var="q_s">
SELECT V.CODPRODPA, PA.DESCRPROD DESC_PA, PA.CODVOL UN_PA, M.CODPRODMP, MP.DESCRPROD DESC_MP, MP.CODVOL UN_MP, M.QTDMISTURA QTD
FROM (SELECT L.CODPRODPA, P.IDPROC, ROW_NUMBER() OVER (PARTITION BY L.CODPRODPA, P.CODPRC ORDER BY P.VERSAO DESC, P.IDPROC DESC) RN FROM TPRLPA L JOIN TPRPRC P ON P.IDPROC = L.IDPROC WHERE P.CODPRC = 45) V
JOIN TGFPRO PA ON PA.CODPROD = V.CODPRODPA
LEFT JOIN TPRATV A ON A.IDPROC = V.IDPROC
LEFT JOIN TPRLMP M ON M.IDEFX = A.IDEFX AND M.CODPRODPA = V.CODPRODPA
LEFT JOIN TGFPRO MP ON MP.CODPROD = M.CODPRODMP
WHERE V.RN = 1
</snk:query>
<table id="t_s" data-n="${q_s.rowCount}"><thead><tr><th>CODPRODPA</th><th>DESC_PA</th><th>UN_PA</th><th>CODPRODMP</th><th>DESC_MP</th><th>UN_MP</th><th>QTD</th></tr></thead><tbody>
<c:forEach items="${q_s.rows}" var="r"><tr><td><c:out value="${r.CODPRODPA}"/></td><td><c:out value="${r.DESC_PA}"/></td><td><c:out value="${r.UN_PA}"/></td><td><c:out value="${r.CODPRODMP}"/></td><td><c:out value="${r.DESC_MP}"/></td><td><c:out value="${r.UN_MP}"/></td><td><c:out value="${r.QTD}"/></td></tr>
</c:forEach>
</tbody></table>
<snk:query var="q_e">
SELECT E.CODPROD, E.CODEMP, EM.RAZAOABREV EMPRESA, E.CODLOCAL, LO.DESCRLOCAL LOCAL, SUM(E.ESTOQUE) EST, SUM(E.RESERVADO) RES
FROM TGFEST E LEFT JOIN TSIEMP EM ON EM.CODEMP = E.CODEMP LEFT JOIN TGFLOC LO ON LO.CODLOCAL = E.CODLOCAL
WHERE E.CODPROD IN (SELECT L.CODPRODPA FROM TPRLPA L JOIN TPRPRC R ON R.IDPROC = L.IDPROC WHERE R.CODPRC = 45)
OR E.CODPROD IN (SELECT M.CODPRODMP FROM TPRLPA L JOIN TPRPRC R ON R.IDPROC = L.IDPROC JOIN TPRATV A ON A.IDPROC = R.IDPROC JOIN TPRLMP M ON M.IDEFX = A.IDEFX AND M.CODPRODPA = L.CODPRODPA WHERE R.CODPRC = 45)
GROUP BY E.CODPROD, E.CODEMP, EM.RAZAOABREV, E.CODLOCAL, LO.DESCRLOCAL
</snk:query>
<table id="t_e" data-n="${q_e.rowCount}"><thead><tr><th>CODPROD</th><th>CODEMP</th><th>EMPRESA</th><th>CODLOCAL</th><th>LOCAL</th><th>EST</th><th>RES</th></tr></thead><tbody>
<c:forEach items="${q_e.rows}" var="r"><tr><td><c:out value="${r.CODPROD}"/></td><td><c:out value="${r.CODEMP}"/></td><td><c:out value="${r.EMPRESA}"/></td><td><c:out value="${r.CODLOCAL}"/></td><td><c:out value="${r.LOCAL}"/></td><td><c:out value="${r.EST}"/></td><td><c:out value="${r.RES}"/></td></tr>
</c:forEach>
</tbody></table>
<snk:query var="q_p">
SELECT I.NUMPS, I.CODPROD, SUM(I.QTDDEMAJUSTADA) DEM FROM TPRIMPS I
WHERE I.CODPROD IN (SELECT L.CODPRODPA FROM TPRLPA L JOIN TPRPRC R ON R.IDPROC = L.IDPROC WHERE R.CODPRC = 45)
GROUP BY I.NUMPS, I.CODPROD
</snk:query>
<table id="t_p" data-n="${q_p.rowCount}"><thead><tr><th>NUMPS</th><th>CODPROD</th><th>DEM</th></tr></thead><tbody>
<c:forEach items="${q_p.rows}" var="r"><tr><td><c:out value="${r.NUMPS}"/></td><td><c:out value="${r.CODPROD}"/></td><td><c:out value="${r.DEM}"/></td></tr>
</c:forEach>
</tbody></table>
<snk:query var="q_m">
SELECT NUMPS, DESCRICAO, TO_CHAR(DTINICMPS,'DD/MM') INI, TO_CHAR(DTFINMPS,'DD/MM') FIM, TO_CHAR(DHALTER,'DD/MM') ALT FROM TPRMPS ORDER BY NUMPS DESC
</snk:query>
<table id="t_m" data-n="${q_m.rowCount}"><thead><tr><th>NUMPS</th><th>DESCRICAO</th><th>INI</th><th>FIM</th><th>ALT</th></tr></thead><tbody>
<c:forEach items="${q_m.rows}" var="r"><tr><td><c:out value="${r.NUMPS}"/></td><td><c:out value="${r.DESCRICAO}"/></td><td><c:out value="${r.INI}"/></td><td><c:out value="${r.FIM}"/></td><td><c:out value="${r.ALT}"/></td></tr>
</c:forEach>
</tbody></table>
<snk:query var="q_l">
SELECT P.CODPROD, P.LARGURA FROM TGFPRO P
WHERE P.CODPROD IN (SELECT L.CODPRODPA FROM TPRLPA L JOIN TPRPRC R ON R.IDPROC = L.IDPROC WHERE R.CODPRC = 45)
OR P.CODPROD IN (SELECT M.CODPRODMP FROM TPRLPA L JOIN TPRPRC R ON R.IDPROC = L.IDPROC JOIN TPRATV A ON A.IDPROC = R.IDPROC JOIN TPRLMP M ON M.IDEFX = A.IDEFX AND M.CODPRODPA = L.CODPRODPA WHERE R.CODPRC = 45)
</snk:query>
<table id="t_l" data-n="${q_l.rowCount}"><thead><tr><th>CODPROD</th><th>LARGURA</th></tr></thead><tbody>
<c:forEach items="${q_l.rows}" var="r"><tr><td><c:out value="${r.CODPROD}"/></td><td><c:out value="${r.LARGURA}"/></td></tr>
</c:forEach>
</tbody></table>
<snk:query var="q_t">
SELECT V.CODPRODPA, PA.DESCRPROD DESC_PA, PA.CODVOL UN_PA, M.CODPRODMP, MP.DESCRPROD DESC_MP, MP.CODVOL UN_MP, M.QTDMISTURA QTD
FROM (SELECT L.CODPRODPA, P.IDPROC, ROW_NUMBER() OVER (PARTITION BY L.CODPRODPA, P.CODPRC ORDER BY P.VERSAO DESC, P.IDPROC DESC) RN FROM TPRLPA L JOIN TPRPRC P ON P.IDPROC = L.IDPROC WHERE P.CODPRC = 47) V
JOIN TGFPRO PA ON PA.CODPROD = V.CODPRODPA
LEFT JOIN TPRATV A ON A.IDPROC = V.IDPROC
LEFT JOIN TPRLMP M ON M.IDEFX = A.IDEFX AND M.CODPRODPA = V.CODPRODPA
LEFT JOIN TGFPRO MP ON MP.CODPROD = M.CODPRODMP
WHERE V.RN = 1
</snk:query>
<table id="t_t" data-n="${q_t.rowCount}"><thead><tr><th>CODPRODPA</th><th>DESC_PA</th><th>UN_PA</th><th>CODPRODMP</th><th>DESC_MP</th><th>UN_MP</th><th>QTD</th></tr></thead><tbody>
<c:forEach items="${q_t.rows}" var="r"><tr><td><c:out value="${r.CODPRODPA}"/></td><td><c:out value="${r.DESC_PA}"/></td><td><c:out value="${r.UN_PA}"/></td><td><c:out value="${r.CODPRODMP}"/></td><td><c:out value="${r.DESC_MP}"/></td><td><c:out value="${r.UN_MP}"/></td><td><c:out value="${r.QTD}"/></td></tr>
</c:forEach>
</tbody></table>
<snk:query var="q_te">
SELECT E.CODPROD, E.CODEMP, EM.RAZAOABREV EMPRESA, E.CODLOCAL, LO.DESCRLOCAL LOCAL, SUM(E.ESTOQUE) EST, SUM(E.RESERVADO) RES
FROM TGFEST E LEFT JOIN TSIEMP EM ON EM.CODEMP = E.CODEMP LEFT JOIN TGFLOC LO ON LO.CODLOCAL = E.CODLOCAL
WHERE E.CODPROD IN (SELECT L.CODPRODPA FROM TPRLPA L JOIN TPRPRC R ON R.IDPROC = L.IDPROC WHERE R.CODPRC = 47)
OR E.CODPROD IN (SELECT M.CODPRODMP FROM TPRLPA L JOIN TPRPRC R ON R.IDPROC = L.IDPROC JOIN TPRATV A ON A.IDPROC = R.IDPROC JOIN TPRLMP M ON M.IDEFX = A.IDEFX AND M.CODPRODPA = L.CODPRODPA WHERE R.CODPRC = 47)
GROUP BY E.CODPROD, E.CODEMP, EM.RAZAOABREV, E.CODLOCAL, LO.DESCRLOCAL
</snk:query>
<table id="t_te" data-n="${q_te.rowCount}"><thead><tr><th>CODPROD</th><th>CODEMP</th><th>EMPRESA</th><th>CODLOCAL</th><th>LOCAL</th><th>EST</th><th>RES</th></tr></thead><tbody>
<c:forEach items="${q_te.rows}" var="r"><tr><td><c:out value="${r.CODPROD}"/></td><td><c:out value="${r.CODEMP}"/></td><td><c:out value="${r.EMPRESA}"/></td><td><c:out value="${r.CODLOCAL}"/></td><td><c:out value="${r.LOCAL}"/></td><td><c:out value="${r.EST}"/></td><td><c:out value="${r.RES}"/></td></tr>
</c:forEach>
</tbody></table>
</div>
<script>
const SQL_S=`SELECT V.CODPRODPA, PA.DESCRPROD DESC_PA, PA.CODVOL UN_PA, M.CODPRODMP, MP.DESCRPROD DESC_MP, MP.CODVOL UN_MP, M.QTDMISTURA QTD
FROM (SELECT L.CODPRODPA, P.IDPROC, ROW_NUMBER() OVER (PARTITION BY L.CODPRODPA, P.CODPRC ORDER BY P.VERSAO DESC, P.IDPROC DESC) RN FROM TPRLPA L JOIN TPRPRC P ON P.IDPROC = L.IDPROC WHERE P.CODPRC = 45) V
JOIN TGFPRO PA ON PA.CODPROD = V.CODPRODPA
LEFT JOIN TPRATV A ON A.IDPROC = V.IDPROC
LEFT JOIN TPRLMP M ON M.IDEFX = A.IDEFX AND M.CODPRODPA = V.CODPRODPA
LEFT JOIN TGFPRO MP ON MP.CODPROD = M.CODPRODMP
WHERE V.RN = 1`;
const SQL_E=`SELECT E.CODPROD, E.CODEMP, EM.RAZAOABREV EMPRESA, E.CODLOCAL, LO.DESCRLOCAL LOCAL, SUM(E.ESTOQUE) EST, SUM(E.RESERVADO) RES
FROM TGFEST E LEFT JOIN TSIEMP EM ON EM.CODEMP = E.CODEMP LEFT JOIN TGFLOC LO ON LO.CODLOCAL = E.CODLOCAL
WHERE E.CODPROD IN (SELECT L.CODPRODPA FROM TPRLPA L JOIN TPRPRC R ON R.IDPROC = L.IDPROC WHERE R.CODPRC = 45)
OR E.CODPROD IN (SELECT M.CODPRODMP FROM TPRLPA L JOIN TPRPRC R ON R.IDPROC = L.IDPROC JOIN TPRATV A ON A.IDPROC = R.IDPROC JOIN TPRLMP M ON M.IDEFX = A.IDEFX AND M.CODPRODPA = L.CODPRODPA WHERE R.CODPRC = 45)
GROUP BY E.CODPROD, E.CODEMP, EM.RAZAOABREV, E.CODLOCAL, LO.DESCRLOCAL`;
const SQL_P=`SELECT I.NUMPS, I.CODPROD, SUM(I.QTDDEMAJUSTADA) DEM FROM TPRIMPS I
WHERE I.CODPROD IN (SELECT L.CODPRODPA FROM TPRLPA L JOIN TPRPRC R ON R.IDPROC = L.IDPROC WHERE R.CODPRC = 45)
GROUP BY I.NUMPS, I.CODPROD`;
const SQL_M=`SELECT NUMPS, DESCRICAO, TO_CHAR(DTINICMPS,'DD/MM') INI, TO_CHAR(DTFINMPS,'DD/MM') FIM, TO_CHAR(DHALTER,'DD/MM') ALT FROM TPRMPS ORDER BY NUMPS DESC`;
const SQL_L=`SELECT P.CODPROD, P.LARGURA FROM TGFPRO P
WHERE P.CODPROD IN (SELECT L.CODPRODPA FROM TPRLPA L JOIN TPRPRC R ON R.IDPROC = L.IDPROC WHERE R.CODPRC = 45)
OR P.CODPROD IN (SELECT M.CODPRODMP FROM TPRLPA L JOIN TPRPRC R ON R.IDPROC = L.IDPROC JOIN TPRATV A ON A.IDPROC = R.IDPROC JOIN TPRLMP M ON M.IDEFX = A.IDEFX AND M.CODPRODPA = L.CODPRODPA WHERE R.CODPRC = 45)`;
async function sbr(sql){
 const r=await fetch('/mge/service.sbr?serviceName=DbExplorerSP.executeQuery&outputType=json',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({serviceName:'DbExplorerSP.executeQuery',requestBody:{sql:sql,outputType:'json'}})});
 const buf=await r.arrayBuffer();let txt;try{txt=new TextDecoder('utf-8',{fatal:true}).decode(buf)}catch(e){txt=new TextDecoder('windows-1252').decode(buf)}
 const j=JSON.parse(txt);
 if(String(j.status)!=='1')throw new Error((j.statusMessage||'erro do servico').toString().slice(0,200));
 const b=j.responseBody,cols=b.fieldsMetadata.map(f=>String(f.name).toUpperCase());
 return b.rows.map(a=>{const o={};cols.forEach((c,i)=>o[c]=a[i]);return o});
}
function rawRows(id){
 const t=document.getElementById(id);if(!t||!/^\d+$/.test(t.dataset.n||''))return null; // JSP nao processado
 const cols=[...t.tHead.rows[0].cells].map(c=>c.textContent.trim());
 return [...t.tBodies[0].rows].map(tr=>{const o={};[...tr.cells].forEach((c,i)=>o[cols[i]]=c.textContent);return o});
}
let VIA_JSP=false;
async function q(sql){
 const id=sql===SQL_S?'t_s':sql===SQL_E?'t_e':sql===SQL_P?'t_p':sql===SQL_M?'t_m':sql===SQL_L?'t_l':sql===SQL_T?'t_t':sql===SQL_TE?'t_te':null;
 const r=id?rawRows(id):null;
 if(r){VIA_JSP=true;return r}
 if(typeof JX!=='undefined'&&JX.consultar){try{return await JX.consultar(sql)}catch(e){console.warn('JX falhou',e)}}
 return sbr(sql);
}
const $=id=>document.getElementById(id);
const esc=s=>String(s==null?'':s).replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
const fmt=n=>(Math.round(n*100)/100).toLocaleString('pt-BR',{maximumFractionDigits:2});
let S=null,st={emp:null,locs:null,term:'',open:{},sort:'cod',dir:1,pre:'mae',keys:[]};
function build(rs,re){
 const items={},mothers={};
 for(const r of rs){
  const c=String(r.CODPRODPA);
  const it=items[c]=items[c]||{c,n:r.DESC_PA,u:r.UN_PA||'KG',m:[]};
  if(r.CODPRODMP!=null&&r.CODPRODMP!==''){const mc=String(r.CODPRODMP);mothers[mc]={c:mc,n:r.DESC_MP,u:r.UN_MP||'KG'};if(!it.m.some(x=>x.c===mc))it.m.push({c:mc,q:+r.QTD||0})}
 }
 const stock={};const emps={},locs={};
 for(const r of re){
  const c=String(r.CODPROD),e=String(r.CODEMP),l=String(r.CODLOCAL);
  emps[e]=r.EMPRESA||('Empresa '+e);locs[e+'|'+l]={e,l,n:r.LOCAL||('Local '+l)};
  (stock[c]=stock[c]||[]).push({e,l,est:+r.EST||0,res:+r.RES||0});
 }
 return {items:Object.values(items),mothers,stock,emps,locs,pmp:{},plans:[]};
}
function sel(c,forceRes){ // saldo do item no filtro atual + necessidade da base escolhida
 let est=0,res=0;
 for(const s of (S.stock[c]||[])){if(String(s.e)!==st.emp)continue;if(st.locs&&!st.locs.has(s.l))continue;est+=s.est;res+=s.res}
 const b=$('base').value,pm=b!=='res'&&!forceRes;
 const dem=pm?((S.pmp[b.slice(1)]||{})[c]||0):0,need=pm?dem:res;
 return {est,res,dem,need,disp:est-need};
}
function renderBase(){
 const cur=$('base').value||'';
 let o='<option value="res">Reservado (estoque)</option>';
 for(const p of S.plans)o+=`<option value="p\${p.n}">PMP \${p.n} · \${p.ini} a \${p.fim}\${p.d?' · '+esc(p.d):''}</option>`;
 $('base').innerHTML=o;
 const want=st.baseInit?cur:(S.plans.length?'p'+S.plans[0].n:'res');st.baseInit=true;
 $('base').value=[...$('base').options].some(x=>x.value===want)?want:'res';
}
function renderTools(){
 const es=Object.keys(S.emps).sort((a,b)=>a-b);
 if(st.emp==null)st.emp=es.includes('4')?'4':es[0];
 $('emp').innerHTML=es.map(e=>`<option value="\${e}"\${e===st.emp?' selected':''}>\${e} - \${esc(S.emps[e])}</option>`).join('');
 renderLocs(true);
}
function renderLocs(reset){
 const ls=Object.values(S.locs).filter(x=>x.e===st.emp).sort((a,b)=>a.l-b.l);
 if(reset||!st.locs)st.locs=new Set(ls.map(x=>x.l));
 $('locs').innerHTML=ls.map(x=>`<label><input type="checkbox" data-l="\${x.l}"\${st.locs.has(x.l)?' checked':''}> \${esc(x.n)}</label>`).join('');
}
const PRE={mae:{grp:1,fil:'all',sort:'cod',dir:1},prio:{grp:1,fil:'need',sort:'prio',dir:1},falta:{grp:0,fil:'f',sort:'falta',dir:-1},zero:{grp:0,fil:'z',sort:'cod',dir:1},lista:{grp:0,fil:'all',sort:'disp',dir:1}};
const TXT={f:'FALTA',w:'BAIXA',z:'ZERADA','':''};
function render(){
 document.querySelectorAll('#pre button[data-p]').forEach(b=>b.classList.toggle('on',b.dataset.p===st.pre));
 const lim=Math.max(0,parseFloat($('lim').value)||0),t=st.term.toLowerCase(),f=$('fil').value,grp=$('grp').checked;
 const rows=[];
 for(const it of S.items){
  const mc=it.m.length?it.m.slice().sort((a,b)=>+a.c-+b.c)[0]:null;
  const m=mc?S.mothers[mc.c]:null,sv=sel(it.c);
  const stt=(sv.need>0&&sv.disp<=0)?'f':(sv.est<=0?'z':(sv.disp<lim?'w':''));
  const falta=stt==='f'?Math.max(0,-sv.disp):0;
  const tier={f:0,w:1,z:2,'':3}[stt];
  const pk=tier*1e9+(stt==='f'?1e8-Math.min(falta,1e8):stt==='z'?+it.c:sv.disp);
  if(t&&!(it.c.includes(t)||it.n.toLowerCase().includes(t)||(m&&(m.c.includes(t)||m.n.toLowerCase().includes(t)))))continue;
  if(f==='need'&&!stt)continue;if(['f','w','z'].includes(f)&&stt!==f)continue;
  rows.push({it,m,sv,stt,falta,pk,extra:it.m.length>1?it.m.length-1:0});
 }
 const cnt=k=>rows.filter(r=>r.stt===k).length,nf=cnt('f'),nz=cnt('z'),nw=cnt('w');
 const ft=rows.reduce((s,r)=>s+r.falta,0);
 const mset=new Set(rows.map(r=>r.m?r.m.c:'_'));
 $('sum').innerHTML=`<span style="color:#555">Base: <b>\${esc($('base').options[$('base').selectedIndex].text)}</b></span> · <b>\${mset.size}</b> bobina(s)-mãe · <b>\${rows.length}</b> bobininha(s) · <span class="r">\${nf} em falta\${nf?' ('+fmt(ft)+' kg a repor)':''}</span> · <span class="o">\${nw} baixa(s) (&lt; \${fmt(lim)} kg)</span> · <span style="color:#777;font-weight:600">\${nz} zerada(s)</span>`;
 if(!rows.length){$('main').innerHTML='<div class="msg">Nada para mostrar com esses filtros.</div>';return}
 const key={cod:r=>+r.it.c,desc:r=>r.it.n,est:r=>r.sv.est,res:r=>r.sv.res,dem:r=>r.sv.dem,disp:r=>r.sv.disp,falta:r=>r.falta,prio:r=>r.pk,mae:r=>r.m?+r.m.c:1e12}[st.sort];
 const cmp=(a,b)=>{const x=key(a),y=key(b);return (x<y?-1:x>y?1:0)*st.dir||(+a.it.c-+b.it.c)};
 const hl=s=>{s=esc(s);if(!t)return s;return s.replace(new RegExp('('+t.replace(/[.*+?^$\u007b\u007d()|[\]\\]/g,m=>'\\'+m)+')','ig'),'<mark>$1</mark>')};
 const th=(k,l,c)=>`<th class="\${c||''}" data-s="\${k}">\${l}\${st.sort===k?(st.dir>0?' \u25B2':' \u25BC'):''}</th>`;
 const pm=$('base').value!=='res',nc=pm?8:7;
 const nums0=r=>`<td class="n">\${fmt(r.sv.est)}</td><td class="n">\${fmt(r.sv.res)}</td>\${pm?`<td class="n">\${fmt(r.sv.dem)}</td>`:''}<td class="n"><b>\${fmt(r.sv.disp)}</b></td>`;
 const line=r=>`<tr class="\${r.stt}"><td>\${hl(r.it.c)}</td><td class="d" title="\${esc(r.it.n)}">\${hl(r.it.n)}\${r.extra?` <span style="color:#777">(+\${r.extra} mãe)</span>`:''}</td>\${nums0(r)}<td class="n k">\${r.falta?fmt(r.falta):''}</td><td class="s">\${TXT[r.stt]}</td></tr>`;
 const nums=`\${th('est','Saldo (kg)','n')}\${th('res','Reservado','n')}\${pm?th('dem','Demanda PMP','n'):''}\${th('disp',pm?'Saldo - PMP':'Disponível','n')}\${th('falta','Falta (kg)','n')}\${th('prio','Situação')}`;
 let body='';
 if(grp){
  const gs={};rows.forEach(r=>{const k=r.m?r.m.c:'_';(gs[k]=gs[k]||{m:r.m,rows:[]}).rows.push(r)});
  const arr=Object.values(gs).map(g=>{g.rows.sort(cmp);g.mo=g.m?sel(g.m.c,true):null;return g});
  arr.sort((a,b)=>{if(st.sort==='cod'||st.sort==='mae')return ((a.m?+a.m.c:1e12)-(b.m?+b.m.c:1e12))*st.dir;const x=key(a.rows[0]),y=key(b.rows[0]);return (x<y?-1:x>y?1:0)*st.dir});
  st.keys=arr.map(g=>g.m?g.m.c:'_');st.exp=arr.flatMap(g=>g.rows);st.pm=pm;
  for(const g of arr){
   const k=g.m?g.m.c:'_',open=st.open[k]!==false;
   const gf=g.rows.filter(r=>r.stt==='f'),gt=gf.reduce((s,r)=>s+r.falta,0),gw=g.rows.filter(r=>r.stt==='w').length,gz=g.rows.filter(r=>r.stt==='z').length;
   let flags='';
   if(gf.length)flags+=` &nbsp;|&nbsp; <span style="color:#b3261e">\${gf.length} em falta (\${fmt(gt)} kg)</span>`;
   if(gw)flags+=` &nbsp;|&nbsp; <span style="color:#9a5b00">\${gw} baixa(s)</span>`;
   if(gz)flags+=` &nbsp;|&nbsp; <span style="color:#777">\${gz} zerada(s)</span>`;
   if(g.mo&&gt>g.mo.disp)flags+=` &nbsp;|&nbsp; <span style="color:#b3261e">mãe insuficiente</span>`;
   body+=`<tr class="g" data-k="\${k}"><td colspan="\${nc}">\${open?'\u25BE':'\u25B8'} \${g.m?hl(g.m.c)+' - '+hl(g.m.n)+`<span style="font-weight:400;color:#444"> &nbsp;|&nbsp; saldo da mãe: \${fmt(g.mo.est)} \${esc(g.m.u)} &nbsp;|&nbsp; disponível: \${fmt(g.mo.disp)}</span>`:'Sem bobina-mãe cadastrada no processo'}<span style="font-weight:400;color:#444"> &nbsp;|&nbsp; \${g.rows.length} bobininha(s)</span><span style="font-weight:400">\${flags}</span></td></tr>`;
   if(open)body+=g.rows.map(line).join('');
  }
  $('main').innerHTML=`<table><thead><tr>\${th('cod','Código')}\${th('desc','Bobininha')}\${nums}</tr></thead><tbody>\${body}</tbody></table>`;
 }else{
  rows.sort(cmp);st.exp=rows;st.pm=pm;
  body=rows.map(r=>`<tr class="\${r.stt}"><td>\${hl(r.it.c)}</td><td class="d" title="\${esc(r.it.n)}">\${hl(r.it.n)}</td><td>\${r.m?hl(r.m.c)+' - '+hl(r.m.n):'sem mãe'}</td>\${nums0(r)}<td class="n k">\${r.falta?fmt(r.falta):''}</td><td class="s">\${TXT[r.stt]}</td></tr>`).join('');
  $('main').innerHTML=`<table><thead><tr>\${th('cod','Código')}\${th('desc','Bobininha')}\${th('mae','Bobina-mãe')}\${nums}</tr></thead><tbody>\${body}</tbody></table>`;
 }
}
function meta(){
 const e=$('emp'),b=$('base');
 return {emp:e.options[e.selectedIndex]?e.options[e.selectedIndex].text:'',base:b.options[b.selectedIndex]?b.options[b.selectedIndex].text:'',fil:$('fil').options[$('fil').selectedIndex].text,lim:$('lim').value,when:new Date().toLocaleString('pt-BR',{dateStyle:'short',timeStyle:'short'}),busca:st.term};
}
function stamp(){const d=new Date(),p=n=>String(n).padStart(2,'0');return d.getFullYear()+p(d.getMonth()+1)+p(d.getDate())+'_'+p(d.getHours())+p(d.getMinutes())}
function printPdf(){
 if(!st.exp)return;
 const m=meta(),saved=st.open;
 $('ph').innerHTML=`<span class="t">Corte Longitudinal: saldo das bobininhas</span> &nbsp; \${esc(m.emp)} &nbsp;|&nbsp; Base: \${esc(m.base)} &nbsp;|&nbsp; Filtro: \${esc(m.fil)}\${m.busca?' | Busca: '+esc(m.busca):''} &nbsp;|&nbsp; Baixa &lt; \${esc(m.lim)} kg &nbsp;|&nbsp; \${esc(m.when)}<br>\${$('sum').innerHTML}`;
 st.open={};render();
 const back=()=>{st.open=saved;render();window.removeEventListener('afterprint',back)};
 window.addEventListener('afterprint',back);
 setTimeout(()=>window.print(),50);
}
const CRC=(()=>{const t=[];for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=c&1?0xEDB88320^(c>>>1):c>>>1;t[n]=c>>>0}return t})();
function crc32(b){let c=0xFFFFFFFF;for(let i=0;i<b.length;i++)c=CRC[(c^b[i])&255]^(c>>>8);return (c^0xFFFFFFFF)>>>0}
function zipStore(files){
 const enc=new TextEncoder(),parts=[],cd=[];let off=0;
 for(const [name,txt] of files){
  const nb=enc.encode(name),db=enc.encode(txt),crc=crc32(db);
  const lh=new DataView(new ArrayBuffer(30));
  lh.setUint32(0,0x04034b50,true);lh.setUint16(4,20,true);lh.setUint16(6,0x0800,true);lh.setUint16(8,0,true);lh.setUint16(10,0,true);lh.setUint16(12,0x21,true);
  lh.setUint32(14,crc,true);lh.setUint32(18,db.length,true);lh.setUint32(22,db.length,true);lh.setUint16(26,nb.length,true);lh.setUint16(28,0,true);
  parts.push(new Uint8Array(lh.buffer),nb,db);
  const ch=new DataView(new ArrayBuffer(46));
  ch.setUint32(0,0x02014b50,true);ch.setUint16(4,20,true);ch.setUint16(6,20,true);ch.setUint16(8,0x0800,true);ch.setUint16(10,0,true);ch.setUint16(12,0,true);ch.setUint16(14,0x21,true);
  ch.setUint32(16,crc,true);ch.setUint32(20,db.length,true);ch.setUint32(24,db.length,true);ch.setUint16(28,nb.length,true);ch.setUint32(42,off,true);
  cd.push(new Uint8Array(ch.buffer),nb);
  off+=30+nb.length+db.length;
 }
 let cds=0;cd.forEach(x=>cds+=x.length);
 const end=new DataView(new ArrayBuffer(22));
 end.setUint32(0,0x06054b50,true);end.setUint16(8,files.length,true);end.setUint16(10,files.length,true);end.setUint32(12,cds,true);end.setUint32(16,off,true);
 return new Blob([...parts,...cd,new Uint8Array(end.buffer)],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
}
function xlsxBuild(title,heads,numCols,widths,data,fname){
 const X=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
 const L=i=>String.fromCharCode(65+i);
 const fillOf={f:1,w:2,z:3,'':0}; // indice em fills de dados
 const cell=(r,c,v,s)=>typeof v==='number'?`<c r="\${L(c)}\${r}" s="\${s}"><v>\${Math.round(v*100)/100}</v></c>`:(v===''||v==null?`<c r="\${L(c)}\${r}" s="\${s}"/>`:`<c r="\${L(c)}\${r}" t="inlineStr" s="\${s}"><is><t xml:space="preserve">\${X(v)}</t></is></c>`);
 let rowsX=`<row r="1">\${cell(1,0,title,2)}</row>`;
 rowsX+=`<row r="3">\${heads.map((t,i)=>cell(3,i,t,1)).join('')}</row>`;
 let r=4;
 for(const x of data){
  const fi=fillOf[x.k||''],tx=3+2*fi,nm=4+2*fi;
  rowsX+=`<row r="\${r}">\${x.v.map((v,i)=>cell(r,i,v,numCols.has(i)?nm:tx)).join('')}</row>`;r++;
 }
 const last=r-1,nc=heads.length;
 const sheet=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetViews><sheetView workbookViewId="0"><pane ySplit="3" topLeftCell="A4" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><cols>\${widths.map((w,i)=>`<col min="\${i+1}" max="\${i+1}" width="\${w}" customWidth="1"/>`).join('')}</cols><sheetData>\${rowsX}</sheetData><autoFilter ref="A3:\${L(nc-1)}\${last}"/></worksheet>`;
 const fills=['<fill><patternFill patternType="none"/></fill>','<fill><patternFill patternType="gray125"/></fill>','<fill><patternFill patternType="solid"><fgColor rgb="FFECECEC"/></patternFill></fill>','<fill><patternFill patternType="solid"><fgColor rgb="FFFDECEA"/></patternFill></fill>','<fill><patternFill patternType="solid"><fgColor rgb="FFFFF8E6"/></patternFill></fill>','<fill><patternFill patternType="solid"><fgColor rgb="FFF3F3F3"/></patternFill></fill>'];
 // dados: ok=0, falta=fill3, baixa=fill4, zerada=fill5
 const fid=[0,3,4,5];
 let xfs='<xf numFmtId="0" fontId="0" fillId="0" borderId="0"/><xf numFmtId="0" fontId="1" fillId="2" borderId="1" applyFont="1" applyFill="1" applyBorder="1"/><xf numFmtId="0" fontId="1" fillId="0" borderId="0" applyFont="1"/>';
 for(const f of fid)xfs+=`<xf numFmtId="0" fontId="0" fillId="\${f}" borderId="0" applyFill="1"/><xf numFmtId="4" fontId="0" fillId="\${f}" borderId="0" applyNumberFormat="1" applyFill="1"/>`;
 const styles=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="2"><font><sz val="10"/><name val="Arial"/></font><font><b/><sz val="10"/><name val="Arial"/></font></fonts><fills count="\${fills.length}">\${fills.join('')}</fills><borders count="2"><border><left/><right/><top/><bottom/><diagonal/></border><border><left/><right/><top/><bottom style="thin"><color rgb="FF999999"/></bottom><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="\${3+2*fid.length}">\${xfs}</cellXfs></styleSheet>`;
 const files=[
  ['[Content_Types].xml','<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>'],
  ['_rels/.rels','<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>'],
  ['xl/workbook.xml','<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Slitter" sheetId="1" r:id="rId1"/></sheets></workbook>'],
  ['xl/_rels/workbook.xml.rels','<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>'],
  ['xl/styles.xml',styles],['xl/worksheets/sheet1.xml',sheet]];
 const blob=zipStore(files),a=document.createElement('a');
 a.href=URL.createObjectURL(blob);a.download=fname+'_'+stamp()+'.xlsx';document.body.appendChild(a);a.click();
 setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},1500);
}
function exportXlsx(){
 if(!st.exp)return;
 const m=meta(),pm=st.pm;
 const heads=['Cód. mãe','Bobina-mãe','Código','Bobininha','Saldo (kg)','Reservado'].concat(pm?['Demanda PMP']:[]).concat([pm?'Saldo - PMP':'Disponível','Falta (kg)','Situação']);
 const numCols=new Set([4,5].concat(pm?[6,7,8]:[6,7]));
 const widths=[10,38,10,42,13,13].concat(pm?[13]:[]).concat([14,12,11]);
 const data=st.exp.map(x=>({k:x.stt,v:[x.m?+x.m.c:'',x.m?x.m.n:'',+x.it.c,x.it.n,x.sv.est,x.sv.res].concat(pm?[x.sv.dem]:[]).concat([x.sv.disp,x.falta||0,TXT[x.stt]])}));
 xlsxBuild('Corte Longitudinal: saldo das bobininhas | '+m.emp+' | Base: '+m.base+' | Filtro: '+m.fil+(m.busca?' | Busca: '+m.busca:'')+' | Baixa < '+m.lim+' kg | '+m.when,heads,numCols,widths,data,'corte_longitudinal_saldo');
}

/* ===== Corte transversal: consulta de saldos ===== */
const SQL_T=SQL_S.replace('P.CODPRC = 45','P.CODPRC = 47');
const SQL_TE=SQL_E.split('R.CODPRC = 45').join('R.CODPRC = 47');
let TS=null,ts={emp:null,locs:null,term:'',open:{},sort:'cod',dir:1,keys:[],exp:[]};
function tvSel(c){let est=0,res=0;for(const s of (TS.stock[c]||[])){if(String(s.e)!==ts.emp)continue;if(ts.locs&&!ts.locs.has(s.l))continue;est+=s.est;res+=s.res}return {est,res,disp:est-res}}
function tvTools(){
 const es=Object.keys(TS.emps).sort((a,b)=>a-b);
 if(ts.emp==null)ts.emp=es.includes('4')?'4':es[0];
 $('tv_emp').innerHTML=es.map(e=>`<option value="\${e}"\${e===ts.emp?' selected':''}>\${e} - \${esc(TS.emps[e])}</option>`).join('');
 tvLocs(true);
}
function tvLocs(reset){
 const ls=Object.values(TS.locs).filter(x=>x.e===ts.emp).sort((a,b)=>a.l-b.l);
 if(reset||!ts.locs)ts.locs=new Set(ls.map(x=>x.l));
 $('tv_locs').innerHTML=ls.map(x=>`<label><input type="checkbox" data-l="\${x.l}"\${ts.locs.has(x.l)?' checked':''}> \${esc(x.n)}</label>`).join('');
}
const TXV={f:'NEGATIVO',z:'ZERADO','':''};
function tvRender(){
 if(!TS)return;
 const t=ts.term.toLowerCase(),f=$('tv_fil').value,grp=$('tv_grp').checked,rows=[];
 for(const it of TS.items){
  const mc=it.m.length?it.m.slice().sort((a,b)=>+a.c-+b.c)[0]:null;
  const m=mc?TS.mothers[mc.c]:null,sv=tvSel(it.c);
  const stt=sv.est<0?'f':(sv.est<=0?'z':'');
  if(t&&!(it.c.includes(t)||it.n.toLowerCase().includes(t)||(m&&(m.c.includes(t)||m.n.toLowerCase().includes(t)))))continue;
  if(f==='sal'&&sv.est<=0)continue;if(f==='sem'&&sv.est>0)continue;
  rows.push({it,m,sv,stt,extra:it.m.length>1?it.m.length-1:0});
 }
 const mset=new Set(rows.map(r=>r.m?r.m.c:'_')),ns=rows.filter(r=>r.sv.est>0).length;
 $('tv_sum').innerHTML=`<span style="color:#555">Processo: <b>Corte Transversal</b></span> · <b>\${mset.size}</b> bobina(s)-mãe · <b>\${rows.length}</b> item(ns) · <b>\${ns}</b> com saldo · <span style="color:#777;font-weight:600">\${rows.length-ns} sem saldo</span>`;
 if(!rows.length){$('tv_main').innerHTML='<div class="msg">Nada para mostrar com esses filtros.</div>';ts.exp=[];return}
 const key={cod:r=>+r.it.c,desc:r=>r.it.n,est:r=>r.sv.est,res:r=>r.sv.res,disp:r=>r.sv.disp,mae:r=>r.m?+r.m.c:1e12}[ts.sort];
 const cmp=(a,b)=>{const x=key(a),y=key(b);return (x<y?-1:x>y?1:0)*ts.dir||(+a.it.c-+b.it.c)};
 const hl=s=>{s=esc(s);if(!t)return s;return s.replace(new RegExp('('+t.replace(/[.*+?^$\u007b\u007d()|[\]\\]/g,m=>'\\'+m)+')','ig'),'<mark>$1</mark>')};
 const th=(k,l,c)=>`<th class="\${c||''}" data-s="\${k}">\${l}\${ts.sort===k?(ts.dir>0?' \u25B2':' \u25BC'):''}</th>`;
 const line=r=>`<tr class="\${r.stt}"><td>\${hl(r.it.c)}</td><td class="d" title="\${esc(r.it.n)}">\${hl(r.it.n)}\${r.extra?` <span style="color:#777">(+\${r.extra} mãe)</span>`:''}</td><td>\${esc(r.it.u)}</td><td class="n">\${fmt(r.sv.est)}</td><td class="n">\${fmt(r.sv.res)}</td><td class="n"><b>\${fmt(r.sv.disp)}</b></td><td class="s">\${TXV[r.stt]}</td></tr>`;
 const nums=`\${th('est','Saldo','n')}\${th('res','Reservado','n')}\${th('disp','Disponível','n')}<th style="cursor:default">Situação</th>`;
 if(grp){
  const gs={};rows.forEach(r=>{const k=r.m?r.m.c:'_';(gs[k]=gs[k]||{m:r.m,rows:[]}).rows.push(r)});
  const arr=Object.values(gs).map(g=>{g.rows.sort(cmp);g.mo=g.m?tvSel(g.m.c):null;return g});
  arr.sort((a,b)=>{if(ts.sort==='cod'||ts.sort==='mae')return ((a.m?+a.m.c:1e12)-(b.m?+b.m.c:1e12))*ts.dir;const x=key(a.rows[0]),y=key(b.rows[0]);return (x<y?-1:x>y?1:0)*ts.dir});
  ts.keys=arr.map(g=>g.m?g.m.c:'_');ts.exp=arr.flatMap(g=>g.rows);
  let body='';
  for(const g of arr){
   const k=g.m?g.m.c:'_',open=ts.open[k]!==false,gz=g.rows.filter(r=>r.sv.est<=0).length;
   body+=`<tr class="g" data-k="\${k}"><td colspan="7">\${open?'\u25BE':'\u25B8'} \${g.m?hl(g.m.c)+' - '+hl(g.m.n)+`<span style="font-weight:400;color:#444"> &nbsp;|&nbsp; saldo da mãe: \${fmt(g.mo.est)} \${esc(g.m.u)} &nbsp;|&nbsp; disponível: \${fmt(g.mo.disp)}</span>`:'Sem bobina-mãe cadastrada no processo'}<span style="font-weight:400;color:#444"> &nbsp;|&nbsp; \${g.rows.length} item(ns)\${gz?` &nbsp;|&nbsp; <span style="color:#777">\${gz} sem saldo</span>`:''}</span></td></tr>`;
   if(open)body+=g.rows.map(line).join('');
  }
  $('tv_main').innerHTML=`<table><thead><tr>\${th('cod','Código')}\${th('desc','Item')}<th style="cursor:default">Un</th>\${nums}</tr></thead><tbody>\${body}</tbody></table>`;
 }else{
  rows.sort(cmp);ts.exp=rows;
  const body=rows.map(r=>`<tr class="\${r.stt}"><td>\${hl(r.it.c)}</td><td class="d" title="\${esc(r.it.n)}">\${hl(r.it.n)}</td><td>\${r.m?hl(r.m.c)+' - '+hl(r.m.n):'sem mãe'}</td><td>\${esc(r.it.u)}</td><td class="n">\${fmt(r.sv.est)}</td><td class="n">\${fmt(r.sv.res)}</td><td class="n"><b>\${fmt(r.sv.disp)}</b></td><td class="s">\${TXV[r.stt]}</td></tr>`).join('');
  $('tv_main').innerHTML=`<table><thead><tr>\${th('cod','Código')}\${th('desc','Item')}\${th('mae','Bobina-mãe')}<th style="cursor:default">Un</th>\${nums}</tr></thead><tbody>\${body}</tbody></table>`;
 }
}
function tvMeta(){const e=$('tv_emp'),f=$('tv_fil');return {emp:e.options[e.selectedIndex]?e.options[e.selectedIndex].text:'',fil:f.options[f.selectedIndex].text,busca:ts.term,when:new Date().toLocaleString('pt-BR',{dateStyle:'short',timeStyle:'short'})}}
function tvXlsx(){
 if(!ts.exp||!ts.exp.length)return;
 const m=tvMeta();
 const heads=['Cód. mãe','Bobina-mãe','Código','Item','Un','Saldo','Reservado','Disponível','Situação'];
 const data=ts.exp.map(x=>({k:x.stt,v:[x.m?+x.m.c:'',x.m?x.m.n:'',+x.it.c,x.it.n,x.it.u,x.sv.est,x.sv.res,x.sv.disp,TXV[x.stt]]}));
 xlsxBuild('Corte Transversal: saldo de blanks | '+m.emp+' | Filtro: '+m.fil+(m.busca?' | Busca: '+m.busca:'')+' | '+m.when,heads,new Set([5,6,7]),[10,38,10,46,6,13,13,13,11],data,'corte_transversal_saldo');
}
function tvPrint(){
 if(!ts.exp)return;
 const m=tvMeta(),saved=ts.open;
 $('ph').innerHTML=`<span class="t">Corte Transversal: saldo de blanks</span> &nbsp; \${esc(m.emp)} &nbsp;|&nbsp; Filtro: \${esc(m.fil)}\${m.busca?' | Busca: '+esc(m.busca):''} &nbsp;|&nbsp; \${esc(m.when)}<br>\${$('tv_sum').innerHTML}`;
 ts.open={};tvRender();
 const back=()=>{ts.open=saved;tvRender();window.removeEventListener('afterprint',back)};
 window.addEventListener('afterprint',back);
 setTimeout(()=>window.print(),50);
}
// Motor de plano de corte longitudinal: menor consumo de bobina-mae (= menor sucata)
// Problema: cortar bobina-mae de largura W em tiras de larguras w_i para atender necessidades d_i (kg).
// Massa de uma tira e proporcional a sua largura; entao um padrao n_i que usa sum(n_i*w_i)<=U rende
// n_i*w_i/W kg do item i para cada kg de bobina-mae processado. LP de cobertura resolvido por geracao de colunas.
function planoCorte(o){
  const W=+o.W, ref=Math.max(0,+o.refilo||0), U=W-ref, SC=10;
  const warn=[];
  const items=[];
  for(const it of o.items){
    const d=+it.need||0; if(!(d>0)) continue;
    const w=+it.w;
    if(!(w>0)){warn.push({id:it.id,msg:'sem largura'});continue}
    if(w>U){warn.push({id:it.id,msg:'largura maior que a largura util ('+U+' mm)'});continue}
    items.push({id:it.id,w,wi:Math.round(w*SC),d});
  }
  const m=items.length, Ui=Math.floor(U*SC+1e-9);
  if(!m) return {patterns:[],items:[],warn,totalKg:0,wasteKg:0,W,ref,U};
  // colunas iniciais: padrao homogeneo de cada item
  const cols=[];const keyOf=n=>n.join(',');const seen=new Set();
  const addCol=n=>{const k=keyOf(n);if(seen.has(k))return false;seen.add(k);cols.push(n);return true};
  for(let i=0;i<m;i++){const n=new Array(m).fill(0);n[i]=Math.floor(Ui/items[i].wi);addCol(n)}
  const share=(n,i)=>n[i]*items[i].w/W; // kg do item i por kg de mae
  let y=null,x=null;
  for(let iter=0;iter<500;iter++){
    // dual: max d.y s.t. sum_i share(n,i) y_i <= 1 para cada coluna
    const K=cols.length, nv=m+K;
    // tableau: K linhas, nv colunas + rhs ; objetivo
    const T=[];for(let p=0;p<K;p++){const r=new Float64Array(nv+1);for(let i=0;i<m;i++)r[i]=share(cols[p],i);r[m+p]=1;r[nv]=1;T.push(r)}
    const obj=new Float64Array(nv+1);for(let i=0;i<m;i++)obj[i]=-items[i].d; // minimiza -d.y
    const basis=[];for(let p=0;p<K;p++)basis.push(m+p);
    for(let it=0;it<20000;it++){
      let e=-1,best=-1e-11;for(let j=0;j<nv;j++)if(obj[j]<best){best=obj[j];e=j}
      if(e<0)break;
      let l=-1,br=Infinity;for(let p=0;p<K;p++)if(T[p][e]>1e-12){const r=T[p][nv]/T[p][e];if(r<br-1e-12){br=r;l=p}}
      if(l<0)throw new Error('LP ilimitado');
      const pv=T[l][e];for(let j=0;j<=nv;j++)T[l][j]/=pv;
      for(let p=0;p<K;p++)if(p!==l){const f=T[p][e];if(f){for(let j=0;j<=nv;j++)T[p][j]-=f*T[l][j]}}
      const f=obj[e];for(let j=0;j<=nv;j++)obj[j]-=f*T[l][j];
      basis[l]=e;
    }
    y=new Float64Array(m);for(let p=0;p<K;p++)if(basis[p]<m)y[basis[p]]=T[p][nv];
    x=new Float64Array(K);for(let p=0;p<K;p++)x[p]=obj[m+p]; // duais do dual = x primal
    // pricing: knapsack inteiro ilimitado, valor v_i=(w_i/W)*y_i
    const v=items.map((it,i)=>it.w/W*y[i]);
    const best=new Float64Array(Ui+1),pick=new Int32Array(Ui+1).fill(-1);
    for(let c=1;c<=Ui;c++){best[c]=best[c-1];pick[c]=-2; // -2: herda c-1
      for(let i=0;i<m;i++){const wi=items[i].wi;if(wi<=c){const val=best[c-wi]+v[i];if(val>best[c]+1e-12){best[c]=val;pick[c]=i}}}}
    if(best[Ui]<=1+1e-9)break;
    const n=new Array(m).fill(0);let c=Ui;
    while(c>0){if(pick[c]===-2){c--;continue}if(pick[c]<0)break;n[pick[c]]++;c-=items[pick[c]].wi}
    if(!addCol(n))break;
  }
  const patterns=[];let totalKg=0;
  for(let p=0;p<cols.length;p++){
    const kg=x[p];if(!(kg>1e-6))continue;
    const n=cols[p];let used=0;const strips=[];
    for(let i=0;i<m;i++)if(n[i]){used+=n[i]*items[i].w;strips.push({id:items[i].id,w:items[i].w,n:n[i],kg:kg*share(n,i)})}
    patterns.push({strips,used,sobra:W-used,motherKg:kg});totalKg+=kg;
  }
  patterns.sort((a,b)=>b.motherKg-a.motherKg);
  const res=items.map(it=>{let kg=0;for(const p of patterns)for(const s of p.strips)if(s.id===it.id)kg+=s.kg;return {id:it.id,w:it.w,need:it.d,kg,extra:kg-it.d}});
  let usefulKg=0;for(const p of patterns)usefulKg+=p.motherKg*p.used/W;
  return {patterns,items:res,warn,totalKg,wasteKg:totalKg-usefulKg,wastePct:totalKg?(totalKg-usefulKg)/totalKg*100:0,W,ref,U};
}

// ===== Aba Plano de Corte =====
let LARG={},PLM={},pl={over:{},res:null};
async function plLoad(){
 try{const r=await q(SQL_L);LARG={};for(const x of r){const v=parseFloat(String(x.LARGURA==null?'':x.LARGURA).replace(',','.'));if(v>0)LARG[String(x.CODPROD)]=v}}
 catch(e){console.warn('largura indisponivel',e)}
}
function plSv(c,bv){
 let est=0,res=0;
 for(const s of (S.stock[c]||[])){if(String(s.e)!==st.emp)continue;if(st.locs&&!st.locs.has(s.l))continue;est+=s.est;res+=s.res}
 const pm=bv!=='res',need=pm?((S.pmp[bv.slice(1)]||{})[c]||0):res;
 return {est,res,need,falta:need>0?Math.max(0,need-est):0};
}
function plBase(){
 const cur=$('pl_base').value,src=$('base');
 $('pl_base').innerHTML=src.innerHTML;
 $('pl_base').value=[...$('pl_base').options].some(o=>o.value===cur)&&cur?cur:src.value;
}
function plMothers(){
 PLM={};const bv=$('pl_base').value||'res';
 for(const it of S.items){
  if(!it.m.length)continue;
  const mc=it.m.slice().sort((a,b)=>+a.c-+b.c)[0].c;
  const o=PLM[mc]=PLM[mc]||{c:mc,m:S.mothers[mc],items:[],nf:0};
  o.items.push(it);if(plSv(it.c,bv).falta>0)o.nf++;
 }
 const cur=$('pl_m').value;
 const arr=Object.values(PLM).sort((a,b)=>(b.nf>0)-(a.nf>0)||+a.c-+b.c);
 $('pl_m').innerHTML=arr.map(o=>{const e=plSv(o.c,'res').est;return `<option value="\${o.c}">\${esc(o.c)} - \${esc(o.m?o.m.n:'')} | saldo \${fmt(e)} kg\${o.nf?' | '+o.nf+' em falta':''}</option>`}).join('');
 if(cur&&PLM[cur])$('pl_m').value=cur;
}
function plPickMother(reset){
 const o=PLM[$('pl_m').value];if(!o)return;
 if(reset){
  $('pl_W').value=LARG[o.c]||$('pl_W').value||1200;
  $('pl_kg').value=Math.max(0,Math.round(plSv(o.c,'res').est*100)/100);
  pl.res=null;
 }
 plRenderIn();
 $('pl_hint').textContent=LARG[o.c]?'':'Largura da mãe não cadastrada: confira o valor informado';
}
function plRenderIn(){
 const o=PLM[$('pl_m').value];if(!o){$('pl_in').innerHTML='<div class="msg">Sem bobina-mãe ligada ao processo.</div>';return}
 const bv=$('pl_base').value||'res';
 const rows=o.items.map(it=>({it,sv:plSv(it.c,bv)})).sort((a,b)=>b.sv.falta-a.sv.falta||+a.it.c-+b.it.c);
 let b='';
 for(const {it,sv} of rows){
  const k=o.c+'|'+bv+'|'+it.c,ov=pl.over[k]||(pl.over[k]={});
  const w=ov.w!=null?ov.w:(LARG[it.c]||''),nd=ov.need!=null?ov.need:Math.round(sv.falta*100)/100,inc=ov.inc!=null?ov.inc:sv.falta>0;
  b+=`<tr data-k="\${esc(k)}"><td><input type="checkbox" class="pl-inc"\${inc?' checked':''}></td><td>\${esc(it.c)}</td><td title="\${esc(it.n)}">\${esc(it.n)}</td><td><input type="number" class="pl-w\${w?'':' miss'}" min="0" step="0.5" value="\${w}" placeholder="mm"></td><td class="n">\${fmt(sv.est)}</td><td class="n">\${fmt(sv.need)}</td><td><input type="number" class="pl-n" min="0" step="10" value="\${nd}"></td></tr>`;
 }
 $('pl_in').innerHTML=`<table><thead><tr><th style="cursor:default">Usar</th><th style="cursor:default">Código</th><th style="cursor:default">Bobininha</th><th style="cursor:default">Largura (mm)</th><th class="n" style="cursor:default">Saldo (kg)</th><th class="n" style="cursor:default">Necessidade da base (kg)</th><th style="cursor:default">Produzir (kg)</th></tr></thead><tbody>\${b}</tbody></table>`;
}
function plRead(){
 const o=PLM[$('pl_m').value];if(!o)return null;
 const items=[];
 document.querySelectorAll('#pl_in tbody tr').forEach(tr=>{
  const k=tr.dataset.k,c=k.split('|')[2],it=o.items.find(x=>x.c===c);
  const inc=tr.querySelector('.pl-inc').checked,w=parseFloat(tr.querySelector('.pl-w').value),nd=parseFloat(tr.querySelector('.pl-n').value);
  const ov=pl.over[k]=pl.over[k]||{};ov.inc=inc;ov.w=isNaN(w)?'':w;ov.need=isNaN(nd)?0:nd;
  if(inc&&nd>0)items.push({id:c,n:it.n,w:isNaN(w)?0:w,need:nd});
 });
 return {o,items};
}
function plGo(){
 const r=plRead();if(!r)return;
 const W=parseFloat($('pl_W').value),ref=parseFloat($('pl_ref').value)||0,avail=parseFloat($('pl_kg').value)||0;
 if(!(W>0)){$('pl_sum').innerHTML='<span class="r">Informe a largura da bobina-mãe (mm).</span>';$('pl_out').innerHTML='';return}
 if(!r.items.length){$('pl_sum').innerHTML='<span class="r">Nenhuma bobininha marcada com necessidade maior que zero.</span>';$('pl_out').innerHTML='';pl.res=null;return}
 const names={};r.items.forEach(i=>names[i.id]=i.n);
 let res;try{res=planoCorte({W,refilo:ref,items:r.items})}catch(e){$('pl_sum').innerHTML='<span class="r">Erro no cálculo: '+esc(e.message)+'</span>';return}
 pl.res={res,names,W,ref,avail,mother:r.o,when:new Date().toLocaleString('pt-BR',{dateStyle:'short',timeStyle:'short'}),base:$('pl_base').options[$('pl_base').selectedIndex].text,emp:$('emp').options[$('emp').selectedIndex]?$('emp').options[$('emp').selectedIndex].text:''};
 plShow();
}
function plShow(){
 const P=pl.res;if(!P)return;const res=P.res;
 const falta=res.totalKg-P.avail,exc=res.items.reduce((s,i)=>s+Math.max(0,i.extra),0);
 let s=`<span style="color:#555">Mãe: <b>\${esc(P.mother.c)} - \${esc(P.mother.m?P.mother.m.n:'')}</b> (\${fmt(P.W)} mm, refilo \${fmt(P.ref)} mm)</span> · consumo: <b>\${fmt(res.totalKg)} kg</b> · desperdício: <b>\${fmt(res.wasteKg)} kg (\${fmt(res.wastePct)}%)</b> · <b>\${res.patterns.length}</b> padrão(ões) de corte · excedente de produção: <b>\${fmt(exc)} kg</b>`;
 s+=falta>0.005?` · <span class="r">mãe insuficiente: faltam \${fmt(falta)} kg (disponível \${fmt(P.avail)} kg)</span>`:` · <span class="pl-ok">cabe na mãe disponível (sobram \${fmt(-falta)} kg)</span>`;
 $('pl_sum').innerHTML=s;
 let w='';for(const x of res.warn)w+=`<div class="pl-warn">\${esc(P.names[x.id]||x.id)} (\${esc(x.id)}) fora do plano: \${esc(x.msg)}</div>`;
 let t1='';res.patterns.forEach((p,i)=>{
  const cuts=p.strips.map(x=>`<span title="\${esc(P.names[x.id]||'')} (\${esc(x.id)})">\${x.n} × \${fmt(x.w)}</span>`).join(' + ');
  t1+=`<tr><td>\${i+1}</td><td>\${cuts}</td><td class="n">\${fmt(p.used)}</td><td class="n">\${fmt(p.sobra)}</td><td class="n"><b>\${fmt(p.motherKg)}</b></td></tr>`;
 });
 let t2='';for(const it of res.items.slice().sort((a,b)=>+a.id-+b.id)){
  const np=res.patterns.filter(p=>p.strips.some(x=>x.id===it.id)).map(p=>res.patterns.indexOf(p)+1).join(', ');
  t2+=`<tr><td>\${esc(it.id)}</td><td>\${esc(P.names[it.id]||'')}</td><td class="n">\${fmt(it.w)}</td><td class="n">\${fmt(it.need)}</td><td class="n"><b>\${fmt(it.kg)}</b></td><td class="n">\${it.extra>0.005?fmt(it.extra):'-'}</td><td>\${np}</td></tr>`;
 }
 $('pl_out').innerHTML=w+`<div class="pl-h">Padrões de corte (cada passada na bobina-mãe)</div><table><thead><tr><th style="cursor:default">Padrão</th><th style="cursor:default">Cortes (tiras × largura em mm)</th><th class="n" style="cursor:default">Usado (mm)</th><th class="n" style="cursor:default">Sobra (mm)</th><th class="n" style="cursor:default">Mãe a cortar (kg)</th></tr></thead><tbody>\${t1}</tbody></table><div class="pl-h">Resultado por bobininha</div><table><thead><tr><th style="cursor:default">Código</th><th style="cursor:default">Bobininha</th><th class="n" style="cursor:default">Largura (mm)</th><th class="n" style="cursor:default">Necessidade (kg)</th><th class="n" style="cursor:default">Produzido (kg)</th><th class="n" style="cursor:default">Excedente (kg)</th><th style="cursor:default">Padrões</th></tr></thead><tbody>\${t2}</tbody></table>`;
}
function plXlsx(){
 const P=pl.res;if(!P)return;
 const heads=['Padrão','Mãe do padrão (kg)','Sobra (mm)','Código','Bobininha','Largura (mm)','Tiras','Produção (kg)'];
 const data=[];P.res.patterns.forEach((p,i)=>p.strips.forEach(x=>data.push({k:'',v:[i+1,p.motherKg,p.sobra,+x.id,P.names[x.id]||'',x.w,x.n,x.kg]})));
 xlsxBuild('Plano de corte | Mãe '+P.mother.c+' - '+(P.mother.m?P.mother.m.n:'')+' | '+P.W+' mm, refilo '+P.ref+' mm | Consumo '+fmt(P.res.totalKg)+' kg, desperdício '+fmt(P.res.wastePct)+'% | Base: '+P.base+' | '+P.when,heads,new Set([1,2,5,6,7]),[8,16,11,10,46,13,8,14],data,'plano_de_corte');
}
function plPrint(){
 const P=pl.res;if(!P){plGo();if(!pl.res)return}
 const Q=pl.res;
 $('ph').innerHTML=`<span class="t">Plano de corte longitudinal</span> &nbsp; \${esc(Q.emp)} &nbsp;|&nbsp; Base: \${esc(Q.base)} &nbsp;|&nbsp; \${esc(Q.when)}<br>\${$('pl_sum').innerHTML}`;
 setTimeout(()=>window.print(),50);
}
function plInit(){
 plLoad().then(()=>{plBase();plMothers();plPickMother(true)}).catch(e=>console.warn('plano',e));
}
function setTab(t){
 $('v_sl').style.display=t==='sl'?'':'none';$('v_tv').style.display=t==='tv'?'':'none';$('v_pl').style.display=t==='pl'?'':'none';
 document.querySelectorAll('.tabs button').forEach(b=>b.classList.toggle('on',b.dataset.t===t));
 try{sessionStorage.setItem('slit_tab',t)}catch(e){}
}
async function load(){
 $('st').textContent='Carregando do Sankhya...';
 try{
  const [rs,re]=await Promise.all([q(SQL_S),q(SQL_E)]);
  S=build(rs,re);
  try{
   const [pp,pl]=await Promise.all([q(SQL_P),q(SQL_M)]);
   S.plans=pl.map(r=>({n:String(r.NUMPS),d:r.DESCRICAO||'',ini:r.INI,fim:r.FIM}));
   for(const r of pp){(S.pmp[String(r.NUMPS)]=S.pmp[String(r.NUMPS)]||{})[String(r.CODPROD)]=+r.DEM||0}
  }catch(e){console.warn('PMP indisponivel',e)}
  renderBase();
  $('st').textContent='Ao vivo · atualizado às '+new Date().toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'});
  renderTools();render();plInit();
  try{const [rt,rte]=await Promise.all([q(SQL_T),q(SQL_TE)]);TS=build(rt,rte);tvTools();tvRender()}catch(e){console.warn('transversal',e);$('tv_main').innerHTML='<div class="msg">Não foi possível ler os dados do corte transversal: '+esc(e&&e.message||e)+'</div>'}
 }catch(e){console.error(e);$('st').textContent='Falha ao consultar o Sankhya';$('main').innerHTML='<div class="msg">Não foi possível ler os dados: '+esc(e&&e.message||e)+'</div>'}
}
$('ref').onclick=()=>{if(VIA_JSP){location.reload()}else load()};
$('tv_ref').onclick=$('ref').onclick;
document.querySelector('.tabs').onclick=e=>{const b=e.target.closest('button[data-t]');if(b)setTab(b.dataset.t)};
$('tv_emp').onchange=e=>{ts.emp=e.target.value;tvLocs(true);tvRender()};
$('tv_locs').onchange=e=>{const l=e.target.dataset.l;if(e.target.checked)ts.locs.add(l);else ts.locs.delete(l);tvRender()};
$('tv_q').oninput=e=>{ts.term=e.target.value.trim();tvRender()};
$('tv_fil').onchange=tvRender;$('tv_grp').onchange=tvRender;
$('tv_exp').onclick=()=>{ts.open={};tvRender()};
$('tv_col').onclick=()=>{ts.keys.forEach(k=>ts.open[k]=false);tvRender()};
$('tv_xls').onclick=tvXlsx;$('tv_pdf').onclick=tvPrint;
$('tv_main').onclick=e=>{const h=e.target.closest('th[data-s]');if(h){const k=h.dataset.s;if(ts.sort===k)ts.dir*=-1;else{ts.sort=k;ts.dir=1}tvRender();return}const g=e.target.closest('tr.g');if(g){const k=g.dataset.k;ts.open[k]=ts.open[k]===false;tvRender()}};
try{setTab((['tv','pl'].includes(sessionStorage.getItem('slit_tab'))?sessionStorage.getItem('slit_tab'):'sl'))}catch(e){}
$('emp').onchange=e=>{st.emp=e.target.value;renderLocs(true);render()};
$('locs').onchange=e=>{const l=e.target.dataset.l;if(e.target.checked)st.locs.add(l);else st.locs.delete(l);render()};
$('q').oninput=e=>{st.term=e.target.value.trim();render()};
$('base').onchange=render;$('lim').oninput=render;$('fil').onchange=()=>{st.pre=null;render()};$('grp').onchange=()=>{st.pre=null;render()};
$('pre').onclick=e=>{const b=e.target.closest('button[data-p]');if(!b)return;const p=PRE[b.dataset.p];st.pre=b.dataset.p;st.sort=p.sort;st.dir=p.dir;st.open={};$('fil').value=p.fil;$('grp').checked=!!p.grp;render()};
$('xls').onclick=exportXlsx;$('pdf').onclick=printPdf;
$('exp').onclick=()=>{st.open={};render()};
$('col').onclick=()=>{st.keys.forEach(k=>st.open[k]=false);render()};
$('main').onclick=e=>{const h=e.target.closest('th[data-s]');if(h){const k=h.dataset.s;st.pre=null;if(st.sort===k)st.dir*=-1;else{st.sort=k;st.dir=k==='falta'?-1:1}render();return}const g=e.target.closest('tr.g');if(g){const k=g.dataset.k;st.open[k]=st.open[k]===false;render()}};
$('pl_m').onchange=()=>plPickMother(true);
$('pl_base').onchange=()=>{plMothers();plPickMother(false)};
$('pl_go').onclick=plGo;$('pl_xls').onclick=plXlsx;$('pl_pdf').onclick=plPrint;
$('pl_in').onchange=e=>{if(e.target.matches('.pl-inc,.pl-w,.pl-n'))plRead()};
load();
</script>
</body>
</html>
