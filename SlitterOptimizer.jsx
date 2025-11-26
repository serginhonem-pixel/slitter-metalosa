
import React, { useState, useEffect, useMemo } from "react";
import {
  Plus,
  Trash2,
  Calculator,
  Settings,
  AlertCircle,
  Scissors,
  Box,
  Scale,
  Database,
  TrendingUp,
  Layers,
  Printer,
  Ruler,
  AlertTriangle,
} from "lucide-react";

// --- DADOS PADRÃO ---
const DEFAULT_CSV_DATA = `
00650A,"PERFIL US 45X17X1,80",3236,75,65,"1,80",BQ
00650B,"PERFIL US 45X17X2,00",3671,6,65,"2,00",BQ
00650K,"PERFIL US 45X17X1,95 GALV",792,55,65,"1,95",BZ
00651A,"PERFIL US 50X25X1,80",6705,3,91,"1,80",BQ
00651B,"PERFIL US 50X25X2,00",7921,1,90,"2,00",BQ
00651C,"PERFIL US 50X25X2,25",1169,2,89,"2,25",BQ
00651D,"PERFIL US 50X25X2,65",2130,45,88,"2,65",BQ
00651E,"PERFIL US 50X25X3,00",304,55,88,"3,00",BQ
00651I,"PERFIL US 50X25X4,75",0,00,82,"4,75",BQ
00651K,"PERFIL US 50X25X1,95 GALV",739,5,91,"1,95",BZ
00651L,"PERFIL US 50X25X2,30 GALV",28,4,89,"2,30",BZ
00652A,"PERFIL US 68X30X1,80",2652,00,118,"1,80",BQ
00652B,"PERFIL US 68X30X2,00",27053,4,118,"2,00",BQ
00652C,"PERFIL US 68X30X2,25",2200,4,117,"2,25",BQ
00652D,"PERFIL US 68X30X2,65",5090,9,116,"2,65",BQ
00652E,"PERFIL US 68X30X3,00",6270,5,116,"3,00",BQ
00652I,"PERFIL US 68X30X4,75",0,0,110,"4,75",BQ
00652K,"PERFIL US 68X30X1,95 GALV",8486,4,118,"1,95",BZ
00653A,"PERFIL US 75X40X1,80",10264,8,145,"1,80",BQ
00653B,"PERFIL US 75X40X2,00",28041,6,145,"2,00",BQ
00653C,"PERFIL US 75X40X2,25",3005,6,144,"2,25",BQ
00653D,"PERFIL US 75X40X2,65",1512,0,142,"2,65",BQ
00653E,"PERFIL US 75X40X3,00",2222,0,140,"3,00",BQ
00653I,"PERFIL US 75X40X4,75",3860,8,133,"4,75",BQ
00653K,"PERFIL US 75X40X1,95 GALV",21802,5,145,"1,95",BZ
00653L,"PERFIL US 75X40X2,30 GALV",1228,15,144,"2,30",BZ
00654A,"PERFIL US 92X30X1,80",1335,25,142,"1,80",BQ
00654B,"PERFIL US 92X30X2,00",15680,8,142,"2,00",BQ
00654C,"PERFIL US 92X30X2,25",596,0,141,"2,25",BQ
00654D,"PERFIL US 92X30X2,65",4397,3,140,"2,65",BQ
00654E,"PERFIL US 92X30X3,00",1595,6,140,"3,00",BQ
00654I,"PERFIL US 92X30X4,75",0,0,134,"4,75",BQ
00654K,"PERFIL US 92X30X1,95 GALV",4016,6,142,"1,95",BZ
00655A,"PERFIL US 100X40X1,80",0,0,170,"1,80",BQ
00655B,"PERFIL US 100X40X2,00",0,0,170,"2,00",BQ
00655C,"PERFIL US 100X40X2,25",0,0,169,"2,25",BQ
00655D,"PERFIL US 100X40X2,65",0,0,168,"2,65",BQ
00656A,"PERFIL US 127X40X1,80",650,2,194,"1,80",BQ
00656B,"PERFIL US 127X40X2,00",423,75,194,"2,00",BQ
00656C,"PERFIL US 127X40X2,25",1358,5,193,"2,25",BQ
00656D,"PERFIL US 127X40X2,65",432,25,192,"2,65",BQ
00656E,"PERFIL US 127X40X3,00",3903,7,192,"3,00",BQ
00657A,"PERFIL US 127X50X1,80",0,0,215,"1,80",BQ
00657B,"PERFIL US 127X50X2,00",0,0,215,"2,00",BQ
00657C,"PERFIL US 127X50X2,25",623,7,214,"2,25",BQ
00657D,"PERFIL US 127X50X2,65",189,0,214,"2,65",BQ
00657E,"PERFIL US 127X50X3,00",2158,4,214,"3,00",BQ
00657I,"PERFIL US 127X50X4,75",1627,5,208,"4,75",BQ
00657K,"PERFIL US 127X50X1,95 GALV",1587,7,215,"1,95",BZ
00658A,"PERFIL US 150X50X1,80",0,0,240,"1,80",BQ
00658B,"PERFIL US 150X50X2,00",2394,0,240,"2,00",BQ
00658C,"PERFIL US 150X50X2,25",51,0,238,"2,25",BQ
00658D,"PERFIL US 150X50X2,65",387,4,236,"2,65",BQ
00658E,"PERFIL US 150X50X3,00",2016,0,236,"3,00",BQ
00658I,"PERFIL US 150X50X4,75",1964,6,233,"4,75",BQ
00658K,"PERFIL US 150X50X1,95 GALV",1379,5,240,"1,95",BZ
00660A,"PERFIL US 200X50X1,80",0,0,290,"1,80",BQ
00660B,"PERFIL US 200X50X2,00",1622,5,290,"2,00",BQ
00660C,"PERFIL US 200X50X2,25",61,6,288,"2,25",BQ
00660D,"PERFIL US 200X50X2,65",0,0,286,"2,65",BQ
00660E,"PERFIL US 200X50X3,00",569,8,286,"3,00",BQ
00660I,"PERFIL US 200X50X4,75",0,0,280,"4,75",BQ
00660K,"PERFIL US 200X50X1,95 GALV",0,0,290,"1,95",BZ
00666B,"PERFIL US 200X50X2,00",0,0,290,"2,00",BQ
00671A,"PERFIL UE 100X40X17X1,80",2640,0,170,"1,80",BQ
00671B,"PERFIL UE 100X40X17X2,00",9513,9,170,"2,00",BQ
00671C,"PERFIL UE 100X40X17X2,25",1096,2,168,"2,25",BQ
00671D,"PERFIL UE 100X40X17X2,65",829,5,167,"2,65",BQ
00671E,"PERFIL UE 100X40X17X3,00",0,0,167,"3,00",BQ
00671I,"PERFIL UE 100X40X17X4,75",0,0,160,"4,75",BQ
00671K,"PERFIL UE 100X40X17X1,95 GALV",12959,6,170,"1,95",BZ
00672A,"PERFIL UE 100X50X17X1,80",0,0,210,"1,80",BQ
00672B,"PERFIL UE 100X50X17X2,00",35982,0,210,"2,00",BQ
00672C,"PERFIL UE 100X50X17X2,25",0,0,208,"2,25",BQ
00672D,"PERFIL UE 100X50X17X2,65",0,0,207,"2,65",BQ
00672E,"PERFIL UE 100X50X17X3,00",0,0,207,"3,00",BQ
00672I,"PERFIL UE 100X50X17X4,75",0,0,200,"4,75",BQ
00672K,"PERFIL UE 100X50X17X1,95 GALV",0,0,210,"1,95",BZ
00682B,"PERFIL U PORTA 25X32X2,00",400,4,80,"2,00",BQ
01501,"PERFIL U SIMPLES 100X50X2,65",4,0,187,"2,65",BQ
01506,"PERFIL U SIMPLES 100X40X2,25",3,0,168,"2,25",BQ
01507,"PERFIL U SIMPLES 100X40X2,00",1,0,170,"2,00",BQ
01514,"PERFIL U SIMPLES 75X40X2,25",5,0,140,"2,25",BQ
01517,"PERFIL U SIMPLES 50X25X2,65",4,0,88,"2,65",BQ
`.trim();

const parseCSV = (csvText) => {
  const lines = csvText
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const parsed = [];

  const normalizeNumber = (str) =>
    parseFloat(String(str).replace(/"/g, "").replace(",", "."));

  const clean = (str) => String(str).replace(/"/g, "").trim();

  const isNumericLike = (str) => {
    const n = normalizeNumber(str);
    return !Number.isNaN(n) && Number.isFinite(n);
  };

  lines.forEach((line) => {
    const matches = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
    if (!matches || matches.length < 6) return;

    // tokens crus
    const [c0, c1, c2, c3, c4, c5] = matches;

    const desc = clean(c1);

    let code, type, thickness, width, history;

    // Detecta formato antigo ou novo pela 3ª coluna
    // Formato ANTIGO:
    //   code, desc, history, width, thickness, type
    //
    // Formato NOVO:
    //   code, desc, type, thickness, width, history
    if (isNumericLike(c2) && isNumericLike(c3)) {
      // === FORMATO ANTIGO ===
      code = clean(c0);
      history = normalizeNumber(c2);
      width = normalizeNumber(c3);
      thickness = normalizeNumber(c4);
      type = clean(c5);
    } else {
      // === FORMATO NOVO ===
      code = clean(c0);
      type = clean(c2);
      thickness = normalizeNumber(c3);
      width = normalizeNumber(c4);
      history = normalizeNumber(c5);
    }

    if (Number.isNaN(width) || Number.isNaN(thickness)) return;

    parsed.push({
      code,
      desc,
      type,
      thickness,
      width,
      history,
    });
  });

  return parsed;
};


const COLORS = [
  "bg-blue-500",
  "bg-green-500",
  "bg-yellow-500",
  "bg-purple-500",
  "bg-pink-500",
  "bg-indigo-500",
  "bg-red-500",
  "bg-teal-500",
  "bg-orange-500",
];

export default function SlitterOptimizer() {
  // --- Estados ---
  const [motherWidth, setMotherWidth] = useState(1200);
  const [stockCoils, setStockCoils] = useState([{ id: 1, weight: 10000 }]);
  const [trim, setTrim] = useState(20);
  const [coilThickness, setCoilThickness] = useState(2.0);
  const [coilType, setCoilType] = useState("BQ");

  const [demands, setDemands] = useState([]);
  const [selectedProductCode, setSelectedProductCode] = useState("");
  const [newWeight, setNewWeight] = useState("");

  const [results, setResults] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [isCalculating, setIsCalculating] = useState(false);
  const [showDb, setShowDb] = useState(false);
  const [weightAlert, setWeightAlert] = useState(null);

  const activeDb = useMemo(() => parseCSV(DEFAULT_CSV_DATA), []);

  // --- Filtro de Produtos ---
  const availableProducts = useMemo(() => {
    const safeThickness = Number(coilThickness) || 0;
    const safeType = coilType || "";
    return activeDb.filter((item) => {
      const typeMatch = item.type.toUpperCase() === safeType.toUpperCase();
      const thicknessMatch = Math.abs(item.thickness - safeThickness) < 0.05;
      return typeMatch && thicknessMatch;
    });
  }, [coilThickness, coilType, activeDb]);

  const availableTypes = useMemo(() => {
    const types = new Set(activeDb.map((i) => i.type));
    return Array.from(types).sort();
  }, [activeDb]);

  useEffect(() => {
    if (selectedProductCode) {
      const stillValid = availableProducts.some(
        (p) => p.code === selectedProductCode
      );
      if (!stillValid) setSelectedProductCode("");
    }
  }, [availableProducts, selectedProductCode]);

  // --- Helpers ---
  const getStripWeight = (width, mWidth, mWeight) => {
    const safeWidth = Number(mWidth) || 0;
    const safeWeight = Number(mWeight) || 0;
    if (!safeWidth || !safeWeight) return 0;
    return (width / safeWidth) * safeWeight;
  };

  // --- Gestão de Bobinas ---
  const addStockCoil = () => {
    setStockCoils([...stockCoils, { id: Date.now(), weight: 10000 }]);
  };

  const updateStockCoil = (id, val) => {
    const parsedWeight = parseFloat(val);
    setStockCoils(
      stockCoils.map((c) =>
        c.id === id ? { ...c, weight: isNaN(parsedWeight) ? 0 : parsedWeight } : c
      )
    );
  };

  const removeStockCoil = (id) => {
    if (stockCoils.length > 1) {
      setStockCoils(stockCoils.filter((c) => c.id !== id));
    }
  };

  const totalStockWeight = useMemo(
    () => stockCoils.reduce((acc, c) => acc + c.weight, 0),
    [stockCoils]
  );

  // --- Relatório HTML ---
  const generateReport = () => {
    if (!results) return;

    const reportWindow = window.open("", "_blank");
    if (!reportWindow) {
      alert("Por favor, permita pop-ups para gerar o relatório.");
      return;
    }

    const styles = `
      <style>
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 40px; color: #333; }
        h1 { font-size: 24px; border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
        .header-info { display: flex; justify-content: space-between; margin-bottom: 30px; background: #f9f9f9; padding: 15px; border-radius: 8px; }
        .header-item { font-size: 14px; }
        .header-item strong { display: block; font-size: 11px; color: #666; text-transform: uppercase; }
        .card { border: 1px solid #ddd; border-radius: 8px; margin-bottom: 25px; overflow: hidden; page-break-inside: avoid; }
        .card-header { background: #eee; padding: 10px 15px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #ddd; }
        .pattern-title { font-weight: bold; font-size: 16px; }
        .pattern-meta { font-size: 14px; color: #555; }
        .efficiency-badge { background: #fff; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; border: 1px solid #ccc; }
        .table-container { padding: 15px; }
        table { width: 100%; border-collapse: collapse; font-size: 12px; }
        th { text-align: left; border-bottom: 2px solid #ddd; padding: 8px; color: #555; }
        td { border-bottom: 1px solid #eee; padding: 8px; }
        .scrap-row { color: #d32f2f; font-weight: bold; background-color: #fff5f5; }
        .total-summary { margin-top: 40px; border-top: 2px solid #333; padding-top: 20px; display: flex; justify-content: space-between; }
        .summary-box { text-align: center; }
        .summary-val { font-size: 20px; font-weight: bold; }
        .summary-label { font-size: 12px; color: #666; text-transform: uppercase; }
        .print-btn { position: fixed; bottom: 20px; right: 20px; background: #2563eb; color: white; padding: 12px 24px; border-radius: 50px; text-decoration: none; font-weight: bold; box-shadow: 0 4px 6px rgba(0,0,0,0.1); cursor: pointer; }
        @media print { .print-btn { display: none; } body { padding: 0; } }
        .footer-sig { margin-top: 50px; text-align: center; font-size: 12px; color: #888; border-top: 1px solid #eee; padding-top: 20px; }
      </style>
    `;

    const header = `
      <div class="header-info">
        <div class="header-item"><strong>Data</strong> ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}</div>
        <div class="header-item"><strong>Largura</strong> ${motherWidth}mm</div>
        <div class="header-item"><strong>Material</strong> ${coilType} ${coilThickness}mm</div>
        <div class="header-item"><strong>Refilo</strong> ${trim}mm</div>
        <div class="header-item"><strong>Total Estoque Usado</strong> ${results.stats.totalInputWeight.toLocaleString()} kg</div>
      </div>
    `;

    let cards = "";
    results.patterns.forEach((pattern, idx) => {
      const visualMotherWidth = Number(motherWidth);
      const patternEfficiency = (
        (pattern.usedWidth / visualMotherWidth) *
        100
      ).toFixed(1);
      const scrapKg = pattern.scrapWeight.toFixed(1);

      let rows = "";
      pattern.setupCoordinates.forEach((setup, sIdx) => {
        rows += `
          <tr>
            <td>${sIdx + 1}</td>
            <td>${setup.start} mm</td>
            <td><strong>${setup.width} mm</strong></td>
            <td>${setup.end} mm</td>
            <td>${setup.desc}</td>
          </tr>
        `;
      });

      if (visualMotherWidth - pattern.usedWidth > 0) {
        rows += `
          <tr class="scrap-row">
            <td>REF</td>
            <td>${pattern.usedWidth} mm</td>
            <td>${(visualMotherWidth - pattern.usedWidth).toFixed(1)} mm</td>
            <td>${visualMotherWidth} mm</td>
            <td>SUCATA / SOBRA (~ ${scrapKg} kg total)</td>
          </tr>
        `;
      }

      const usedWeights = pattern.assignedCoils
        .map((c) => c.weight + "kg")
        .join(", ");

      cards += `
        <div class="card">
          <div class="card-header">
            <div>
              <span class="pattern-title">Padrão ${String.fromCharCode(65 + idx)}</span>
              <span class="pattern-meta"> - Executar em ${pattern.count} bobina(s): <strong>[${usedWeights}]</strong></span>
            </div>
            <div class="efficiency-badge">Efic: ${patternEfficiency}%</div>
          </div>
          <div class="table-container">
            <table>
              <thead>
                <tr>
                  <th style="width: 5%">#</th>
                  <th style="width: 15%">Início</th>
                  <th style="width: 15%">Largura</th>
                  <th style="width: 15%">Fim</th>
                  <th>Produto</th>
                </tr>
              </thead>
              <tbody>${rows}</tbody>
            </table>
          </div>
        </div>
      `;
    });

    const summary = `
      <div class="total-summary">
        <div class="summary-box">
          <div class="summary-label">Total Bobinas</div>
          <div class="summary-val">${results.stats.totalCoils}</div>
        </div>
        <div class="summary-box">
          <div class="summary-label">Eficiência Global</div>
          <div class="summary-val">${results.stats.efficiency}%</div>
        </div>
        <div class="summary-box">
          <div class="summary-label" style="color: #d32f2f;">Sucata Total Estimada</div>
          <div class="summary-val" style="color: #d32f2f;">${results.stats.totalScrapWeight} kg</div>
        </div>
      </div>
      <div class="footer-sig">
        &copy; ${new Date().getFullYear()} Slitter Metalosa - Desenvolvido por <strong>Sergio Betini</strong>
      </div>
    `;

    const content = `
      <html>
        <head>
          <title>Ordem de Produção - Slitter Metalosa</title>
          ${styles}
        </head>
        <body>
          <h1>Slitter Metalosa - Ordem de Produção</h1>
          ${header}
          ${cards}
          ${summary}
          <a href="#" onclick="window.print(); return false;" class="print-btn">🖨️ Imprimir / Salvar PDF</a>
        </body>
      </html>
    `;

    reportWindow.document.write(content);
    reportWindow.document.close();
  };

  const addDemand = () => {
    const product = activeDb.find((p) => p.code === selectedProductCode);
    const weightVal = parseFloat(newWeight);

    if (!product || !weightVal) return;

    const safeMotherWidth = Number(motherWidth) || 0;
    const safeTrim = Number(trim) || 0;

    if (product.width > safeMotherWidth - safeTrim) {
      alert("Erro: Largura do produto é maior que a largura útil da bobina.");
      return;
    }

    const newItem = {
      id: Date.now(),
      code: product.code,
      desc: product.desc,
      width: product.width,
      targetWeight: weightVal,
    };

    setDemands([...demands, newItem]);
    setSelectedProductCode("");
    setNewWeight("");
    setResults(null);
    setSuggestions([]);
    setWeightAlert(null);
  };

  const addComboDemand = (items) => {
    const newItems = items.map((item, idx) => ({
      id: Date.now() + idx,
      code: item.code,
      desc: item.desc,
      width: item.width,
      targetWeight: item.weightToAdd,
    }));

    setDemands((prev) => [...prev, ...newItems]);
    setSuggestions([]);
    setResults(null);
    setWeightAlert(null);
  };

  const removeDemand = (id) => {
    setDemands(demands.filter((d) => d.id !== id));
    setResults(null);
    setSuggestions([]);
    setWeightAlert(null);
  };

  // --- Algoritmo de Combinação ---
  const findBestCombinations = (targetWidth, products) => {
    let candidates = [];
    const sortedProducts = [...products].sort((a, b) => b.width - a.width);

    const search = (currentCombo, currentWidth, startIndex) => {
      if (currentCombo.length > 0) {
        candidates.push({
          combo: [...currentCombo],
          totalWidth: currentWidth,
          waste: targetWidth - currentWidth,
        });
      }
      if (currentCombo.length >= 3) return;

      for (let i = startIndex; i < sortedProducts.length; i++) {
        const p = sortedProducts[i];
        if (currentWidth + p.width <= targetWidth) {
          currentCombo.push(p);
          search(currentCombo, currentWidth + p.width, i);
          currentCombo.pop();
          if (candidates.length > 500) return;
        }
      }
    };

    search([], 0, 0);

    candidates.sort((a, b) => {
      if (Math.abs(a.waste - b.waste) > 0.1) return a.waste - b.waste;
      const histA = a.combo.reduce((acc, i) => acc + i.history, 0);
      const histB = b.combo.reduce((acc, i) => acc + i.history, 0);
      return histB - histA;
    });

    const uniqueResults = [];
    const seenSignatures = new Set();

    for (const res of candidates) {
      const signature = res.combo
        .map((c) => c.code)
        .sort()
        .join("+");
      if (!seenSignatures.has(signature)) {
        seenSignatures.add(signature);
        uniqueResults.push(res);
      }
      if (uniqueResults.length >= 5) break;
    }

    return uniqueResults;
  };

  const generateSuggestions = (
    patterns,
    usableWidth,
    currentTotalUsefulWeight,
    currentTotalInputWeight
  ) => {
    const potentialSuggestions = [];

    patterns.forEach((pattern) => {
      const waste = usableWidth - pattern.usedWidth;

      const validProductsForSuggestions = availableProducts;
      if (!validProductsForSuggestions.length) return;

      const minProductWidth = Math.min(
        ...validProductsForSuggestions.map((p) => p.width)
      );

      if (waste >= minProductWidth) {
        const combinations = findBestCombinations(
          waste,
          validProductsForSuggestions
        );

        if (combinations.length > 0) {
          const smartSuggestions = combinations.map((combData) => {
            const comboWeightToAdd = combData.combo.reduce((acc, item) => {
              return (
                acc +
                pattern.assignedCoils.reduce((cAcc, coil) => {
                  return (
                    cAcc + getStripWeight(item.width, motherWidth, coil.weight)
                  );
                }, 0)
              );
            }, 0);

            const projectedEfficiency =
              ((currentTotalUsefulWeight + comboWeightToAdd) /
                currentTotalInputWeight) *
              100;

            const itemsWithWeights = combData.combo.map((item) => ({
              ...item,
              weightToAdd: pattern.assignedCoils.reduce((cAcc, coil) => {
                return (
                  cAcc + getStripWeight(item.width, motherWidth, coil.weight)
                );
              }, 0),
            }));

            return {
              items: itemsWithWeights,
              totalWidth: combData.totalWidth,
              remainingWaste: waste - combData.totalWidth,
              projectedEfficiency,
              totalWeightToAdd: comboWeightToAdd,
            };
          });

          potentialSuggestions.push({
            patternIndex: pattern.index,
            waste,
            patternCount: pattern.count,
            suggestions: smartSuggestions,
          });
        }
      }
    });

    return potentialSuggestions;
  };

  const calculateOptimization = () => {
    if (!motherWidth || stockCoils.length === 0) {
      alert("Por favor, configure ao menos uma bobina mãe.");
      return;
    }

    setIsCalculating(true);
    setSuggestions([]);
    setWeightAlert(null);

    const totalDemandWeight = demands.reduce((acc, d) => acc + d.targetWeight, 0);
    const totalAvailableWeight = stockCoils.reduce((acc, c) => acc + c.weight, 0);

    if (totalDemandWeight > totalAvailableWeight) {
      const diff = totalDemandWeight - totalAvailableWeight;
      setWeightAlert({
        msg: `A demanda (${totalDemandWeight.toLocaleString()} kg) é maior que o estoque de bobinas (${totalAvailableWeight.toLocaleString()} kg).`,
        subMsg: `Faltam aproximadamente ${diff.toLocaleString()} kg. Adicione mais bobinas clicando em "+".`,
      });
    }

    setTimeout(() => {
      const safeMotherWidth = Number(motherWidth);
      const safeTrim = Number(trim) || 0;
      const usableWidth = safeMotherWidth - safeTrim;

      let allItems = [];
      const demandAnalysis = {};

      const avgCoilWeight = totalAvailableWeight / stockCoils.length;

      demands.forEach((d) => {
        const estimatedStripWeight = getStripWeight(
          d.width,
          safeMotherWidth,
          avgCoilWeight
        );
        const safeStripWeight = estimatedStripWeight > 0 ? estimatedStripWeight : 1;
        const qtyNeeded = Math.ceil(d.targetWeight / safeStripWeight);

        demandAnalysis[d.width] = {
          reqWeight: d.targetWeight,
          producedQty: 0,
          producedWeight: 0,
          desc: d.desc,
        };

        for (let i = 0; i < qtyNeeded; i++) {
          allItems.push({ width: d.width, desc: d.desc, code: d.code });
        }
      });

      allItems.sort((a, b) => b.width - a.width);

      let availableCoils = [...stockCoils].map((c) => ({
        ...c,
        items: [],
        currentWidth: 0,
      }));
      let virtualCoils = [];

      allItems.forEach((item) => {
        let bestCoilIndex = -1;
        let minSpaceLeft = usableWidth + 1;

        for (let i = 0; i < availableCoils.length; i++) {
          const spaceLeft = usableWidth - availableCoils[i].currentWidth;
          if (spaceLeft >= item.width) {
            const potentialSpaceLeft = spaceLeft - item.width;
            if (potentialSpaceLeft < minSpaceLeft) {
              minSpaceLeft = potentialSpaceLeft;
              bestCoilIndex = i;
            }
          }
        }

        if (bestCoilIndex !== -1) {
          availableCoils[bestCoilIndex].items.push(item);
          availableCoils[bestCoilIndex].currentWidth += item.width;
        } else {
          let bestVirtualIndex = -1;
          let minVirtualSpace = usableWidth + 1;

          for (let j = 0; j < virtualCoils.length; j++) {
            const vSpaceLeft = usableWidth - virtualCoils[j].currentWidth;
            if (vSpaceLeft >= item.width) {
              if (vSpaceLeft - item.width < minVirtualSpace) {
                minVirtualSpace = vSpaceLeft - item.width;
                bestVirtualIndex = j;
              }
            }
          }

          if (bestVirtualIndex !== -1) {
            virtualCoils[bestVirtualIndex].items.push(item);
            virtualCoils[bestVirtualIndex].currentWidth += item.width;
          } else {
            virtualCoils.push({
              id: `v-${Date.now()}-${Math.random()}`,
              weight: 10000,
              items: [item],
              currentWidth: item.width,
              isVirtual: true,
            });
          }
        }
      });

      const allUsedCoils = [
        ...availableCoils.filter((c) => c.items.length > 0),
        ...virtualCoils,
      ];

      const patternsMap = {};
      allUsedCoils.forEach((coil, index) => {
        const sortedItems = [...coil.items].sort((a, b) => b.width - a.width);
        const key = JSON.stringify(sortedItems.map((i) => i.width));

        sortedItems.forEach((item) => {
          const realStripWeight = getStripWeight(
            item.width,
            safeMotherWidth,
            coil.weight
          );
          if (demandAnalysis[item.width]) {
            demandAnalysis[item.width].producedQty++;
            demandAnalysis[item.width].producedWeight += realStripWeight;
          }
        });

        if (patternsMap[key]) {
          patternsMap[key].count++;
          patternsMap[key].assignedCoils.push(coil);
        } else {
          const usedWidth = sortedItems.reduce((a, b) => a + b.width, 0);
          let currentPos = 0;
          const setupCoordinates = sortedItems.map((item) => {
            const start = currentPos;
            currentPos += item.width;
            return { start, end: currentPos, width: item.width, desc: item.desc };
          });

          patternsMap[key] = {
            cuts: sortedItems,
            setupCoordinates,
            count: 1,
            assignedCoils: [coil],
            usedWidth,
            index,
          };
        }
      });

      const patternsArray = Object.values(patternsMap).sort(
        (a, b) => b.count - a.count
      );

      let totalInputWeight = 0;
      let totalScrapWeight = 0;

      patternsArray.forEach((p) => {
        const patternInputWeight = p.assignedCoils.reduce(
          (acc, c) => acc + c.weight,
          0
        );
        const patternUsefulWeight = p.assignedCoils.reduce(
          (acc, c) =>
            acc + getStripWeight(p.usedWidth, safeMotherWidth, c.weight),
          0
        );
        p.scrapWeight = patternInputWeight - patternUsefulWeight;
        totalInputWeight += patternInputWeight;
        totalScrapWeight += p.scrapWeight;
      });

      const efficiency =
        totalInputWeight > 0
          ? ((totalInputWeight - totalScrapWeight) / totalInputWeight) * 100
          : 0;

      let foundSuggestions = [];
      if (
        efficiency < 97 ||
        patternsArray.some((p) => usableWidth - p.usedWidth > 50)
      ) {
        const totalUseful = totalInputWeight - totalScrapWeight;
        foundSuggestions = generateSuggestions(
          patternsArray,
          usableWidth,
          totalUseful,
          totalInputWeight
        );
      }

      setResults({
        patterns: patternsArray,
        demandAnalysis,
        stats: {
          totalCoils: allUsedCoils.length,
          totalInputWeight,
          efficiency: efficiency.toFixed(2),
          totalScrapWeight: totalScrapWeight.toFixed(1),
        },
      });

      setSuggestions(foundSuggestions);
      setIsCalculating(false);
    }, 600);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 font-sans text-slate-800 print-container">
      <div className="max-w-7xl mx-auto">
        {/* HEADER - Hide on Print */}
        <header className="mb-6 bg-white p-6 rounded-xl shadow-sm border-b border-slate-200 flex flex-col md:flex-row justify-between items-center no-print">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
              <Scissors className="w-8 h-8 text-blue-600" />
              Slitter Metalosa
            </h1>
          </div>
          <div className="flex gap-2 mt-4 md:mt-0">
            <button
              onClick={() => setShowDb(!showDb)}
              className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 px-4 py-2 rounded-lg text-slate-700 text-sm font-medium transition-colors"
            >
              <Database className="w-4 h-4" />
              {showDb ? "Ocultar Padrões" : "Ver Padrões"}
            </button>
            {results && (
              <button
                onClick={generateReport}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
              >
                <Printer className="w-4 h-4" />
                Gerar Relatório
              </button>
            )}
          </div>
        </header>

        {/* ALERTA DE PESO EXCEDENTE */}
        {weightAlert && (
          <div className="mb-6 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-lg shadow-sm animate-fade-in flex items-start gap-3 no-print">
            <AlertTriangle className="w-6 h-6 text-yellow-500 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-bold text-yellow-800 text-lg">
                Atenção: Demanda Excede Estoque de Bobinas
              </h3>
              <p className="text-yellow-700 font-medium">{weightAlert.msg}</p>
              <p className="text-yellow-600 text-sm mt-1">
                {weightAlert.subMsg}
              </p>
            </div>
          </div>
        )}

        {/* DB TABLE */}
        {showDb && (
          <div className="mb-6 bg-white rounded-xl shadow-sm border border-slate-200 p-4 animate-fade-in no-print">
            <h3 className="font-bold text-slate-700 mb-3 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-600" />
              Tabela de Produtos Ativa ({activeDb.length} itens)
            </h3>
            <div className="overflow-x-auto max-h-60 overflow-y-auto border border-slate-200 rounded-lg">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-600 sticky top-0">
                  <tr>
                    <th className="p-2">Código</th>
                    <th className="p-2">Descrição</th>
                    <th className="p-2">Tipo</th>
                    <th className="p-2">Espessura</th>
                    <th className="p-2">Largura</th>
                    <th className="p-2 text-right">Histórico</th>
                  </tr>
                </thead>
                <tbody>
                  {activeDb.map((row, i) => (
                    <tr
                      key={i}
                      className="border-t border-slate-100 hover:bg-slate-50"
                    >
                      <td className="p-2 font-mono text-xs">{row.code}</td>
                      <td className="p-2">{row.desc}</td>
                      <td className="p-2 font-bold text-blue-600">{row.type}</td>
                      <td className="p-2 font-bold">
                        {row.thickness.toFixed(2)}
                      </td>
                      <td className="p-2">{row.width}</td>
                      <td className="p-2 text-right font-mono text-green-700">
                        {row.history}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 print-layout">
          {/* CONFIGURAÇÕES E INPUTS - Hide on Print */}
          <div className="lg:col-span-4 space-y-6 no-print">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="bg-slate-100 px-4 py-3 border-b border-slate-200 flex items-center gap-2">
                <Settings className="w-4 h-4 text-slate-500" />
                <h2 className="font-semibold text-slate-700">
                  Configuração da Máquina
                </h2>
              </div>
              <div className="p-4 space-y-4">
                {/* LARGURA E TIPO */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                      Largura (mm)
                    </label>
                    <input
                      type="number"
                      value={motherWidth}
                      onChange={(e) =>
                        setMotherWidth(
                          e.target.value === ""
                            ? ""
                            : parseFloat(e.target.value)
                        )
                      }
                      className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none font-mono text-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                      Refilo (mm)
                    </label>
                    <input
                      type="number"
                      value={trim}
                      onChange={(e) =>
                        setTrim(
                          e.target.value === "" ? "" : parseFloat(e.target.value)
                        )
                      }
                      className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>

                {/* GESTÃO DE ESTOQUE DE BOBINAS */}
                <div className="bg-slate-50 p-3 rounded border border-slate-200">
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-xs font-bold text-slate-500 uppercase">
                      Estoque de Bobinas (Pesos)
                    </label>
                    <button
                      onClick={addStockCoil}
                      className="text-blue-600 hover:text-blue-800 text-xs font-bold flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" /> Add Bobina
                    </button>
                  </div>
                  <div className="max-h-[120px] overflow-y-auto space-y-2">
                    {stockCoils.map((coil, idx) => (
                      <div key={coil.id} className="flex items-center gap-2">
                        <span className="text-xs text-slate-400 font-mono w-4">
                          {idx + 1}.
                        </span>
                        <div className="relative flex-1">
                          <input
                            type="number"
                            value={coil.weight}
                            onChange={(e) =>
                              updateStockCoil(coil.id, e.target.value)
                            }
                            className="w-full p-1 border border-slate-300 rounded text-sm pr-8"
                          />
                          <span className="absolute right-2 top-1.5 text-xs text-slate-400">
                            kg
                          </span>
                        </div>
                        <button
                          onClick={() => removeStockCoil(coil.id)}
                          className="text-red-400 hover:text-red-600 p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="mt-2 text-right text-xs text-slate-500 font-bold">
                    Total Disponível: {totalStockWeight.toLocaleString()} kg
                  </div>
                </div>

                {/* FILTROS */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                      Tipo Material
                    </label>
                    <select
                      value={coilType}
                      onChange={(e) => setCoilType(e.target.value)}
                      className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-700"
                    >
                      {availableTypes.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-yellow-700 uppercase mb-1">
                      Espessura (mm)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={coilThickness}
                      onChange={(e) =>
                        setCoilThickness(
                          e.target.value === ""
                            ? ""
                            : parseFloat(e.target.value)
                        )
                      }
                      className="w-full p-2 border border-yellow-300 rounded focus:ring-2 focus:ring-yellow-500 outline-none font-bold text-slate-800 bg-yellow-50"
                    />
                  </div>
                </div>

                <div className="bg-blue-50 p-2 rounded text-xs text-blue-700 text-center">
                  Largura Útil de Corte:{" "}
                  <strong>
                    {(Number(motherWidth) || 0) - (Number(trim) || 0)} mm
                  </strong>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="bg-slate-100 px-4 py-3 border-b border-slate-200 flex items-center gap-2">
                <Box className="w-4 h-4 text-slate-500" />
                <h2 className="font-semibold text-slate-700">Pedidos</h2>
              </div>
              <div className="p-4">
                <div className="flex flex-col gap-3 mb-4">
                  <div className="w-full">
                    <label className="text-xs text-slate-500 mb-1 block">
                      Produto (Filtro: {coilType} |{" "}
                      {Number(coilThickness).toFixed(2)}mm)
                    </label>
                    <select
                      value={selectedProductCode}
                      onChange={(e) => setSelectedProductCode(e.target.value)}
                      className="w-full p-2 border border-slate-300 rounded text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                      <option value="">Selecione um produto...</option>
                      {availableProducts.length === 0 ? (
                        <option disabled>
                          Nenhum produto para {coilType} {coilThickness}mm
                        </option>
                      ) : (
                        availableProducts.map((p) => (
                          <option key={p.code} value={p.code}>
                            {p.width}mm - {p.desc}
                          </option>
                        ))
                      )}
                    </select>
                  </div>
                  <div className="flex gap-2 items-end">
                    <div className="flex-1">
                      <label className="text-xs text-slate-500 mb-1 block">
                        Peso Kg
                      </label>
                      <input
                        type="number"
                        placeholder="kg"
                        value={newWeight}
                        onChange={(e) => setNewWeight(e.target.value)}
                        className="w-full p-2 border border-slate-300 rounded text-sm"
                      />
                    </div>
                    <button
                      onClick={addDemand}
                      disabled={!selectedProductCode || !newWeight}
                      className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:text-slate-500 text-white p-2 h-[38px] rounded w-12 flex items-center justify-center"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="max-h-[300px] overflow-y-auto space-y-2">
                  {demands.length === 0 && (
                    <p className="text-center text-slate-400 text-sm py-4">
                      Nenhum pedido adicionado.
                    </p>
                  )}
                  {demands.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between bg-slate-50 p-2 rounded border border-slate-100"
                    >
                      <div className="flex flex-col max-w-[80%]">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-700">
                            {item.width}mm
                          </span>
                          <span className="text-[10px] bg-blue-50 text-blue-600 px-1 rounded border border-blue-100 truncate">
                            {item.desc}
                          </span>
                        </div>
                        <span className="text-slate-500 text-xs">
                          Meta: {item.targetWeight.toFixed(0)} kg
                        </span>
                      </div>
                      <button
                        onClick={() => removeDemand(item.id)}
                        className="text-red-400 hover:text-red-600 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              <div className="p-4 bg-slate-50 border-t border-slate-100">
                <button
                  onClick={calculateOptimization}
                  disabled={demands.length === 0 || isCalculating}
                  className={`w-full py-3 rounded-lg font-bold text-lg shadow-md flex items-center justify-center gap-2 transition-all ${
                    isCalculating
                      ? "bg-slate-300 text-slate-500"
                      : "bg-green-600 hover:bg-green-700 text-white"
                  }`}
                >
                  {isCalculating ? (
                    "Calculando..."
                  ) : (
                    <>
                      <Calculator className="w-5 h-5" /> Gerar Plano
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* RESULTADOS */}
          <div className="lg:col-span-8 space-y-6">
            {/* SUGGESTIONS */}
            <div>
              {suggestions.length > 0 && (
                <div className="bg-orange-50 border border-orange-200 rounded-xl p-6 shadow-sm animate-fade-in">
                  <div className="flex items-start gap-4">
                    <div className="bg-orange-100 p-3 rounded-full">
                      <Layers className="w-6 h-6 text-orange-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-orange-800">
                        Sugestões de Combinação (Meta: {">"}97%)
                      </h3>
                      <p className="text-orange-700 text-sm mb-3">
                        O sistema analisou combinações de produtos para preencher as sobras com máxima eficiência.
                      </p>

                      <div className="space-y-6">
                        {suggestions.map((sug, idx) => (
                          <div
                            key={idx}
                            className="bg-white p-4 rounded-lg border border-orange-200 shadow-sm"
                          >
                            <div className="flex justify-between items-center mb-3 border-b border-slate-100 pb-2">
                              <p className="text-xs font-bold text-slate-500 uppercase">
                                Padrão{" "}
                                {String.fromCharCode(65 + sug.patternIndex)} -
                                Sobra:{" "}
                                <span className="text-red-500">
                                  {sug.waste}mm
                                </span>
                              </p>
                              <span className="text-xs bg-slate-100 px-2 py-1 rounded text-slate-600">
                                Preenche {sug.patternCount} bobinas
                              </span>
                            </div>

                            <div className="grid grid-cols-1 gap-3">
                              {sug.suggestions.map((combo, cIdx) => (
                                <div
                                  key={cIdx}
                                  className="flex flex-col bg-slate-50 p-3 rounded border border-slate-100 hover:border-blue-300 transition-colors"
                                >
                                  <div className="flex justify-between items-center mb-2">
                                    <div className="flex items-center gap-2">
                                      <div className="flex -space-x-2">
                                        {combo.items.map((it, i) => (
                                          <div
                                            key={i}
                                            className="w-8 h-8 rounded-full bg-blue-100 border-2 border-white flex items-center justify-center text-[10px] font-bold text-blue-700 z-10"
                                            title={it.desc}
                                          >
                                            {it.width}
                                          </div>
                                        ))}
                                      </div>
                                      <span className="text-sm font-bold text-slate-700 ml-2">
                                        = {combo.totalWidth}mm
                                      </span>
                                      <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded font-medium">
                                        Resto: {combo.remainingWaste}mm
                                      </span>
                                    </div>
                                    <span
                                      className={`text-xs px-2 py-1 rounded font-bold border ${
                                        combo.projectedEfficiency >= 97
                                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                          : "bg-yellow-50 text-yellow-700 border-yellow-200"
                                      }`}
                                    >
                                      Eficiência:{" "}
                                      {combo.projectedEfficiency.toFixed(2)}%
                                    </span>
                                  </div>

                                  <div className="text-xs text-slate-500 mb-2 space-y-1 pl-2 border-l-2 border-blue-100">
                                    {combo.items.map((it, i) => (
                                      <div
                                        key={i}
                                        className="flex justify-between"
                                      >
                                        <span>
                                          1x {it.desc} ({it.width}mm)
                                        </span>
                                        <span className="text-slate-400">
                                          +{Math.round(it.weightToAdd)}kg
                                        </span>
                                      </div>
                                    ))}
                                  </div>

                                  <div className="mt-1">
                                    <button
                                      onClick={() => addComboDemand(combo.items)}
                                      className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded shadow-sm flex items-center justify-center gap-2 transition-all active:scale-95"
                                    >
                                      <Plus className="w-4 h-4" />
                                      Adicionar Combo (+
                                      {Math.round(combo.totalWeightToAdd)} kg)
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Caso não ache sugestões e eficiência esteja baixa */}
            <div>
              {results &&
                results.stats.efficiency < 97 &&
                suggestions.length === 0 && (
                  <div className="bg-slate-100 border border-slate-300 rounded-xl p-6 text-center animate-fade-in">
                    <AlertCircle className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                    <p className="text-slate-600 font-medium">
                      Nenhuma sugestão automática encontrada.
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Não encontramos produtos com espessura{" "}
                      {coilThickness.toFixed(2)}mm e tipo {coilType} que caibam
                      nas sobras.
                    </p>
                  </div>
                )}
            </div>

            {results && (
              <div className="animate-fade-in space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 group relative">
                    <p className="text-xs text-slate-500 uppercase font-bold flex items-center gap-1">
                      Eficiência Global
                    </p>
                    <p
                      className={`text-3xl font-bold ${
                        results.stats.efficiency >= 97
                          ? "text-green-600"
                          : "text-orange-500"
                      }`}
                    >
                      {results.stats.efficiency}%
                    </p>
                  </div>
                  <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                    <p className="text-xs text-slate-500 uppercase font-bold">
                      Total Bobinas
                    </p>
                    <p className="text-3xl font-bold text-slate-800">
                      {results.stats.totalCoils}
                    </p>
                  </div>
                  <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                    <p className="text-xs text-slate-500 uppercase font-bold">
                      Sucata Total
                    </p>
                    <p className="text-3xl font-bold text-red-600">
                      {results.stats.totalScrapWeight}
                      <span className="text-sm text-slate-400">kg</span>
                    </p>
                  </div>

                  <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 overflow-y-auto max-h-[100px]">
                    <p className="text-xs text-slate-500 uppercase font-bold mb-1">
                      Status Pedidos
                    </p>
                    {Object.entries(results.demandAnalysis).map(
                      ([width, data]) => (
                        <div
                          key={width}
                          className="flex justify-between text-xs border-b border-slate-100 py-1"
                        >
                          <span>{width}mm:</span>
                          <span
                            className={
                              data.producedWeight >= data.reqWeight
                                ? "text-green-600"
                                : "text-red-500"
                            }
                          >
                            {Math.round(data.producedWeight)}/
                            {data.reqWeight.toFixed(0)}kg
                          </span>
                        </div>
                      )
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  {results.patterns.map((pattern, idx) => {
                    const visualMotherWidth = Number(motherWidth);
                    const patternEfficiency = (
                      (pattern.usedWidth / visualMotherWidth) *
                      100
                    ).toFixed(1);
                    const uniqueCuts = [...new Set(pattern.cuts)];

                    return (
                      <div
                        key={idx}
                        className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden"
                      >
                        <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
                          <div className="flex items-center gap-4">
                            <div className="bg-blue-600 text-white font-bold w-10 h-10 rounded-lg flex items-center justify-center text-lg">
                              {idx + 1}
                            </div>
                            <div>
                              <h4 className="font-bold text-slate-800">
                                Padrão {String.fromCharCode(65 + idx)}
                              </h4>
                              <div className="text-sm text-slate-500">
                                Executar em:{" "}
                                <strong>{pattern.count} bobina(s)</strong>
                                <br />
                                <span className="text-xs bg-slate-100 px-1 rounded">
                                  Pesos:{" "}
                                  {pattern.assignedCoils
                                    .map((c) => c.weight + "kg")
                                    .join(", ")}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right flex flex-col items-end">
                            <div
                              className={`text-sm font-bold px-2 py-0.5 rounded mb-1 ${
                                Number(patternEfficiency) > 90
                                  ? "bg-green-100 text-green-700"
                                  : "bg-red-100 text-red-700"
                              }`}
                            >
                              Efic: {patternEfficiency}%
                            </div>
                            <p className="text-xs text-slate-400">
                              Perda: {pattern.scrapWeight.toFixed(0)}kg
                            </p>
                          </div>
                        </div>

                        <div className="p-6">
                          {/* Visualização Gráfica */}
                          <div className="h-16 w-full bg-slate-200 rounded-lg overflow-hidden flex border-2 border-slate-300 relative">
                            {pattern.cuts.map((cut, i) => {
                              const colorIndex =
                                uniqueCuts.indexOf(cut) % COLORS.length;
                              const widthPercent =
                                (cut.width / visualMotherWidth) * 100;
                              return (
                                <div
                                  key={i}
                                  className={`${COLORS[colorIndex]} h-full border-r border-white/50 flex flex-col items-center justify-center text-white transition-all hover:brightness-110 cursor-help`}
                                  style={{ width: `${widthPercent}%` }}
                                  title={`${cut.width}mm`}
                                >
                                  {widthPercent > 8 && (
                                    <span className="font-bold text-sm">
                                      {cut.width}
                                    </span>
                                  )}
                                </div>
                              );
                            })}
                            {visualMotherWidth - pattern.usedWidth > 0 && (
                              <div
                                className="h-full bg-repeating-linear-stripes bg-red-100 flex items-center justify-center"
                                style={{
                                  width: `${
                                    ((visualMotherWidth - pattern.usedWidth) /
                                      visualMotherWidth) *
                                    100
                                  }%`,
                                }}
                              >
                                <span className="text-red-400 text-xs font-bold rotate-90 md:rotate-0">
                                  LIVRE
                                </span>
                              </div>
                            )}
                          </div>

                          {/* MAPA DE FACAS - SETUP */}
                          <div className="mt-4">
                            <h5 className="text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                              <Ruler className="w-4 h-4" />
                              Mapa de Setup (Posição das Facas)
                            </h5>
                            <div className="overflow-x-auto border border-slate-200 rounded-lg">
                              <table className="w-full text-xs text-left">
                                <thead className="bg-slate-50 text-slate-600">
                                  <tr>
                                    <th className="p-2 border-r">#</th>
                                    <th className="p-2 border-r">
                                      Posição Inicial
                                    </th>
                                    <th className="p-2 border-r">
                                      Largura (Corte)
                                    </th>
                                    <th className="p-2 border-r">
                                      Posição Final
                                    </th>
                                    <th className="p-2">Produto</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {pattern.setupCoordinates.map(
                                    (setup, sIdx) => (
                                      <tr
                                        key={sIdx}
                                        className="border-t border-slate-100"
                                      >
                                        <td className="p-2 border-r font-bold text-slate-500">
                                          {sIdx + 1}
                                        </td>
                                        <td className="p-2 border-r font-mono text-blue-600 font-bold">
                                          {setup.start} mm
                                        </td>
                                        <td className="p-2 border-r font-bold text-lg">
                                          {setup.width} mm
                                        </td>
                                        <td className="p-2 border-r font-mono text-slate-600">
                                          {setup.end} mm
                                        </td>
                                        <td className="p-2 text-slate-500 truncate max-w-[150px]">
                                          {setup.desc}
                                        </td>
                                      </tr>
                                    )
                                  )}
                                  {visualMotherWidth - pattern.usedWidth > 0 && (
                                    <tr className="border-t border-red-100 bg-red-50">
                                      <td className="p-2 border-r text-red-400 font-bold">
                                        Ref
                                      </td>
                                      <td className="p-2 border-r font-mono text-slate-400">
                                        {pattern.usedWidth} mm
                                      </td>
                                      <td className="p-2 border-r font-bold text-red-500">
                                        {(visualMotherWidth - pattern.usedWidth).toFixed(1)} mm
                                      </td>
                                      <td className="p-2 border-r font-mono text-slate-400">
                                        {visualMotherWidth} mm
                                      </td>
                                      <td className="p-2 text-red-500 font-bold text-xs uppercase">
                                        Sucata / Sobra
                                      </td>
                                    </tr>
                                  )}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {!results && !isCalculating && (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 bg-white rounded-xl border border-dashed border-slate-300 p-12">
                <Scale className="w-16 h-16 mb-4 opacity-50" />
                <p>Insira as demandas para calcular.</p>
              </div>
            )}
          </div>

          <footer className="lg:col-span-12 mt-12 pt-6 border-t border-slate-200 text-center text-sm text-slate-400">
            &copy; {new Date().getFullYear()} Slitter Metalosa - Desenvolvido por{" "}
            <strong>Sergio Betini</strong>
          </footer>
        </div>
      </div>

      <style>{`
        .bg-repeating-linear-stripes {
          background-image: repeating-linear-gradient(45deg, transparent, transparent 5px, rgba(239, 68, 68, 0.1) 5px, rgba(239, 68, 68, 0.1) 10px);
        }
        @keyframes fade-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fade-in 0.5s ease-out forwards; }
        @media print {
          .no-print { display: none !important; }
          .print-container { background: #fff !important; padding: 0 !important; }
        }
      `}</style>
    </div>
  );
}
