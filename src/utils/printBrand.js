import brandSymbolSvg from "../assets/betini/betini-simbolo.svg?raw";

export const printBrandHeader = (subtitle = "Slitter") =>
  `<header class="print-brand">${brandSymbolSvg}<div><small>BETINI STUDIO / ${subtitle}</small><strong>Betini Slitter</strong></div></header>`;

export const printBrandStyles = `<style>
.print-brand{display:flex;align-items:center;gap:14px;border-top:4px solid #ec3013;padding-top:16px;margin-bottom:24px}
.print-brand svg{width:56px;height:56px;flex-shrink:0}
.print-brand small{display:block;font:700 10px Arial,sans-serif;letter-spacing:2px;color:#ae1800}
.print-brand strong{display:block;font-size:26px;letter-spacing:-1px}
@media print{.print-brand,th,[style*="background"]{print-color-adjust:exact;-webkit-print-color-adjust:exact}thead{display:table-header-group}.card{break-inside:avoid}}
</style>`;
