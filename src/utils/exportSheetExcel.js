import * as XLSX from "xlsx";

export const exportSheetPlanToExcel = (sheetResults, config, companyName = "Betini Slitter") => {
  const wb = XLSX.utils.book_new();
  const { sheetWidth, sheetHeight } = config;

  const summaryData = [
    ["Betini Slitter — Ordem de Producao (Chapa)"],
    ["Empresa:", companyName],
    ["Data:", new Date().toLocaleString("pt-BR")],
    ["Chapa:", `${sheetWidth}x${sheetHeight}mm`],
    [],
    ["Eficiencia", "Sucata (%)", "Chapas Usadas", "Pecas Posicionadas"],
    [`${sheetResults.stats.efficiency}%`, `${sheetResults.stats.waste}%`, sheetResults.stats.totalSheets, sheetResults.stats.totalPieces],
  ];

  if (sheetResults.oversize.length > 0) {
    summaryData.push([]);
    summaryData.push([`${sheetResults.oversize.length} peca(s) nao coube(ram) na chapa configurada:`]);
    sheetResults.oversize.forEach((p) => summaryData.push([`${p.label}`]));
  }

  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
  summarySheet["!cols"] = [{ wch: 30 }, { wch: 20 }, { wch: 18 }, { wch: 20 }];
  XLSX.utils.book_append_sheet(wb, summarySheet, "Resumo");

  sheetResults.sheets.forEach((sheet, idx) => {
    const label = String.fromCharCode(65 + idx);
    const usedArea = sheet.placements.reduce((acc, p) => acc + p.width * p.height, 0);
    const sheetArea = sheetWidth * sheetHeight;
    const effPct = ((usedArea / sheetArea) * 100).toFixed(1);

    const sheetData = [
      [`Chapa ${label} — ${sheet.placements.length} peca(s) — Efic: ${effPct}%`],
      [],
      ["#", "X (mm)", "Y (mm)", "Largura (mm)", "Altura (mm)", "Rotacionada", "Peca"],
      ...sheet.placements.map((p, i) => [
        i + 1,
        p.x,
        p.y,
        p.width,
        p.height,
        p.rotated ? "Sim" : "Nao",
        p.label,
      ]),
    ];

    const ws = XLSX.utils.aoa_to_sheet(sheetData);
    ws["!cols"] = [{ wch: 4 }, { wch: 10 }, { wch: 10 }, { wch: 14 }, { wch: 12 }, { wch: 12 }, { wch: 30 }];
    XLSX.utils.book_append_sheet(wb, ws, `Chapa ${label}`);
  });

  const fileName = `Betini-Slitter-Chapa-${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(wb, fileName);
};
