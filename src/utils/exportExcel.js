import * as XLSX from "xlsx";

export const exportPlanToExcel = (results, machineConfig, companyName = "SmartSlit") => {
  const wb = XLSX.utils.book_new();
  const { motherWidth, trim, coilThickness, coilType } = machineConfig;

  // Sheet 1: Resumo
  const summaryData = [
    ["SmartSlit — Ordem de Producao"],
    ["Empresa:", companyName],
    ["Data:", new Date().toLocaleString("pt-BR")],
    ["Material:", `${coilType} ${coilThickness}mm`],
    ["Largura Mae:", `${motherWidth}mm`],
    ["Refilo:", `${trim}mm`],
    [],
    ["Eficiencia Global", "Total Bobinas", "Sucata (kg)", "Estoque Usado (kg)"],
    [
      `${results.stats.efficiency}%`,
      results.stats.totalCoils,
      results.stats.totalScrapWeight,
      results.stats.totalInputWeight,
    ],
    [],
    ["Produto (mm)", "Meta (kg)", "Produzido (kg)", "Status"],
    ...Object.entries(results.demandAnalysis).map(([width, data]) => [
      `${width}mm — ${data.desc}`,
      Number(data.reqWeight).toFixed(0),
      Math.round(data.producedWeight),
      data.producedWeight >= data.reqWeight ? "OK" : "DEFICIT",
    ]),
  ];

  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
  summarySheet["!cols"] = [{ wch: 30 }, { wch: 20 }, { wch: 18 }, { wch: 18 }];
  XLSX.utils.book_append_sheet(wb, summarySheet, "Resumo");

  // One sheet per pattern
  results.patterns.forEach((pattern, idx) => {
    const label = String.fromCharCode(65 + idx);
    const inputWeight = pattern.assignedCoils.reduce((acc, c) => acc + c.weight, 0);
    const effPct = ((pattern.usedWidth / Number(motherWidth)) * 100).toFixed(1);

    const patternData = [
      [`Padrao ${label} — ${pattern.count} bobina(s) — Efic: ${effPct}%`],
      [`Entrada: ${inputWeight.toLocaleString("pt-BR")} kg | Sucata: ${pattern.scrapWeight.toFixed(1)} kg`],
      [],
      ["#", "Inicio (mm)", "Corte (mm)", "Fim (mm)", "Produto"],
      ...pattern.setupCoordinates.map((s, i) => [i + 1, s.start, s.width, s.end, s.desc]),
      ["REF", pattern.usedWidth, (Number(motherWidth) - pattern.usedWidth).toFixed(1), motherWidth, "SUCATA / SOBRA"],
    ];

    const patternSheet = XLSX.utils.aoa_to_sheet(patternData);
    patternSheet["!cols"] = [{ wch: 4 }, { wch: 14 }, { wch: 12 }, { wch: 10 }, { wch: 40 }];
    XLSX.utils.book_append_sheet(wb, patternSheet, `Padrao ${label}`);
  });

  const fileName = `SmartSlit-Plano-${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(wb, fileName);
};
