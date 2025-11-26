import React, { useState, useEffect, useMemo } from "react";
import {
  Plus,
  Trash2,
  Calculator,
  Settings,
  Database,
  TrendingUp,
  Printer,
  AlertCircle,
  Scissors,
  Box,
  Scale,
  Layers,
  Ruler,
  AlertTriangle,
} from "lucide-react";

// --- DADOS PADRÃO (base completa) ---
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

  const getStripWeight = (width, mWidth, mWeight) => {
    if (!mWidth || !mWeight) return 0;
    const safeWidth = Number(mWidth) || 0;
    const safeWeight = Number(mWeight) || 0;
    if (safeWidth === 0 || safeWeight === 0) return 0;
    return (width / safeWidth) * safeWeight;
  };

  const addStockCoil = () => {
    setStockCoils([...stockCoils, { id: Date.now(), weight: 10000 }]);
  };

  const updateStockCoil = (id, val) => {
    const w = parseFloat(val);
    setStockCoils(
      stockCoils.map((c) =>
        c.id === id ? { ...c, weight: isNaN(w) ? 0 : w } : c
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
                    cAcc +
                    getStripWeight(item.width, motherWidth, coil.weight)
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
                  cAcc +
                  getStripWeight(item.width, motherWidth, coil.weight)
                );
              }, 0),
            }));

            return {
              items: itemsWithWeights,
              totalWidth: combData.totalWidth,
              remainingWaste: waste - combData.totalWidth,
              projectedEfficiency,
              totalWeightToAdd: comboWeightToAdd,
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

    const totalDemandWeight = demands.reduce(
      (acc, d) => acc + d.targetWeight,
      0
    );
    const totalAvailableWeight = stockCoils.reduce(
      (acc, c) => acc + c.weight,
      0
    );

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
        const safeStripWeight =
          estimatedStripWeight > 0 ? estimatedStripWeight : 1;
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
            return {
              start,
              end: currentPos,
              width: item.width,
              desc: item.desc,
            };
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
        const patternUsefulWeight = p.assignedCoils.reduce((acc, c) => {
          return acc + getStripWeight(p.usedWidth, safeMotherWidth, c.weight);
        }, 0);

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

  // --- Relatório ---
  const generateReport = () => {
    if (!results) return;

    const reportWindow = window.open("", "_blank");
    if (!reportWindow) {
      alert("Permita pop-ups para gerar o relatório.");
      return;
    }

    const styles = `
      <style>
        body { font-family: system-ui, Arial; padding: 40px; color: #111827; }
        h1 { font-size: 22px; border-bottom: 2px solid #111827; padding-bottom: 8px; margin-bottom: 18px; }
        .header-info { display: flex; flex-wrap: wrap; gap: 12px; margin-bottom: 24px; background:#f8fafc; padding:12px; border-radius:8px; }
        .header-item { font-size: 13px; }
        .header-item strong { display:block; font-size:10px; color:#6b7280; text-transform:uppercase; }
        .card { border:1px solid #e5e7eb; border-radius:8px; margin-bottom:18px; overflow:hidden; }
        .card-header { background:#f1f5f9; padding:10px 12px; display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #e5e7eb;}
        .pattern-title { font-weight:700; font-size:15px; }
        table { width:100%; border-collapse:collapse; font-size:12px;}
        th, td { padding:8px; border-bottom:1px solid #e5e7eb; }
        .scrap-row { color:#b91c1c; font-weight:700; background:#fef2f2;}
        .total-summary { margin-top:28px; border-top:2px solid #111827; padding-top:14px; display:flex; gap:16px; }
        .summary-box { text-align:center; min-width:120px; }
        .summary-val { font-size:20px; font-weight:800; }
        .summary-label { font-size:11px; color:#6b7280; text-transform:uppercase; }
        .print-btn { position:fixed; bottom:18px; right:18px; background:#2563eb; color:#fff; padding:10px 18px; border-radius:999px; font-weight:700; text-decoration:none; }
        @media print { .print-btn { display:none; } body{padding:0;} }
      </style>
    `;

    const header = `
      <div class="header-info">
        <div class="header-item"><strong>Data</strong> ${new Date().toLocaleString()}</div>
        <div class="header-item"><strong>Largura</strong> ${motherWidth}mm</div>
        <div class="header-item"><strong>Material</strong> ${coilType} ${coilThickness}mm</div>
        <div class="header-item"><strong>Refilo</strong> ${trim}mm</div>
        <div class="header-item"><strong>Estoque Usado</strong> ${results.stats.totalInputWeight.toLocaleString()} kg</div>
      </div>
    `;

    let cards = "";
    results.patterns.forEach((pattern, idx) => {
      const visualMotherWidth = Number(motherWidth);
      const patternEfficiency = (
        (pattern.usedWidth / visualMotherWidth) *
        100
      ).toFixed(1);

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
            <td>SUCATA / SOBRA (~ ${pattern.scrapWeight.toFixed(1)} kg)</td>
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
              <span class="pattern-title">Padrão ${String.fromCharCode(
                65 + idx
              )}</span>
              <span> - ${pattern.count} bobina(s) [${usedWeights}]</span>
            </div>
            <div><strong>Efic: ${patternEfficiency}%</strong></div>
          </div>
          <div style="padding:12px;">
            <table>
              <thead>
                <tr>
                  <th>#</th><th>Início</th><th>Largura</th><th>Fim</th><th>Produto</th>
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
          <div class="summary-label">Eficiência</div>
          <div class="summary-val">${results.stats.efficiency}%</div>
        </div>
        <div class="summary-box">
          <div class="summary-label" style="color:#b91c1c;">Sucata</div>
          <div class="summary-val" style="color:#b91c1c;">${results.stats.totalScrapWeight} kg</div>
        </div>
      </div>
    `;

    reportWindow.document.write(`
      <html>
        <head>
          <title>OP Slitter Metalosa</title>
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
    `);
    reportWindow.document.close();
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-3 md:p-5 font-sans">
      <div className="max-w-7xl mx-auto space-y-5">

        {/* HEADER */}
        <header className="sticky top-0 z-20 rounded-2xl bg-zinc-950/80 backdrop-blur border border-zinc-800 px-4 py-4 md:px-6 md:py-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-3 shadow-sm">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-3">
              <Scissors className="w-7 h-7 text-blue-500" />
              Slitter Metalosa
            </h1>
            <p className="text-zinc-400 mt-1 text-sm">
              Otimizador de cortes com sugestão de combo
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setShowDb(!showDb)}
              className="inline-flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm font-medium hover:bg-zinc-800 transition"
            >
              <Database className="w-4 h-4" />
              {showDb ? "Ocultar Padrões" : "Ver Padrões"}
            </button>

            {results && (
              <button
                onClick={generateReport}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-500 transition shadow-sm"
              >
                <Printer className="w-4 h-4" />
                Imprimir / PDF
              </button>
            )}
          </div>
        </header>

        {/* ALERTA DE PESO */}
        {weightAlert && (
          <div className="bg-yellow-950/30 border border-yellow-700/50 p-4 rounded-xl shadow-sm animate-fade-in flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-yellow-400 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-bold text-yellow-200 text-lg">
                Demanda excede estoque
              </h3>
              <p className="text-yellow-100 font-medium">{weightAlert.msg}</p>
              <p className="text-yellow-200/80 text-sm mt-1">{weightAlert.subMsg}</p>
            </div>
          </div>
        )}

        {/* DB */}
        {showDb && (
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-4 animate-fade-in">
            <h3 className="font-bold text-zinc-200 mb-3 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              Tabela de Produtos ({activeDb.length})
            </h3>
            <div className="overflow-x-auto max-h-60 overflow-y-auto border border-zinc-800 rounded-xl">
              <table className="w-full text-sm text-left">
                <thead className="bg-zinc-950 text-zinc-400 sticky top-0">
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
                    <tr key={i} className="border-t border-zinc-800 hover:bg-zinc-950/60">
                      <td className="p-2 font-mono text-xs">{row.code}</td>
                      <td className="p-2">{row.desc}</td>
                      <td className="p-2 font-bold text-blue-400">{row.type}</td>
                      <td className="p-2 font-bold">{row.thickness.toFixed(2)}</td>
                      <td className="p-2">{row.width}</td>
                      <td className="p-2 text-right font-mono text-emerald-300">{row.history}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

          {/* ESQUERDA */}
          <div className="lg:col-span-4 space-y-5">

            {/* CONFIG */}
            <div className="rounded-2xl bg-zinc-900/60 border border-zinc-800 overflow-hidden">
              <div className="bg-zinc-950 px-4 py-3 border-b border-zinc-800 flex items-center gap-2">
                <Settings className="w-4 h-4 text-zinc-400" />
                <h2 className="font-semibold text-zinc-200">
                  Configuração da Máquina
                </h2>
              </div>

              <div className="p-4 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-zinc-400 uppercase mb-1">
                      Largura (mm)
                    </label>
                    <input
                      type="number"
                      value={motherWidth}
                      onChange={(e) =>
                        setMotherWidth(
                          e.target.value === "" ? "" : parseFloat(e.target.value)
                        )
                      }
                      className="w-full p-2 border border-zinc-700 rounded-lg bg-zinc-950 text-zinc-50 focus:ring-2 focus:ring-blue-500 outline-none font-mono text-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-400 uppercase mb-1">
                      Refilo (mm)
                    </label>
                    <input
                      type="number"
                      value={trim}
                      onChange={(e) =>
                        setTrim(e.target.value === "" ? "" : parseFloat(e.target.value))
                      }
                      className="w-full p-2 border border-zinc-700 rounded-lg bg-zinc-950 text-zinc-50 focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>

                {/* ESTOQUE */}
                <div className="bg-zinc-950/60 p-3 rounded-xl border border-zinc-800">
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-xs font-bold text-zinc-400 uppercase">
                      Estoque de Bobinas (kg)
                    </label>
                    <button
                      onClick={addStockCoil}
                      className="text-blue-400 hover:text-blue-300 text-xs font-bold flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" /> Add Bobina
                    </button>
                  </div>

                  <div className="max-h-[120px] overflow-y-auto space-y-2">
                    {stockCoils.map((coil, idx) => (
                      <div key={coil.id} className="flex items-center gap-2">
                        <span className="text-xs text-zinc-500 font-mono w-4">
                          {idx + 1}.
                        </span>

                        <div className="relative flex-1">
                          <input
                            type="number"
                            value={coil.weight}
                            onChange={(e) => updateStockCoil(coil.id, e.target.value)}
                            className="w-full p-2 border border-zinc-700 rounded-lg bg-zinc-950 text-zinc-50 text-sm pr-8"
                          />
                          <span className="absolute right-2 top-2 text-xs text-zinc-500">
                            kg
                          </span>
                        </div>

                        <button
                          onClick={() => removeStockCoil(coil.id)}
                          className="text-red-400 hover:text-red-300 p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="mt-2 text-right text-xs text-zinc-400 font-bold">
                    Total Disponível: {totalStockWeight.toLocaleString()} kg
                  </div>
                </div>

                {/* FILTROS */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-zinc-400 uppercase mb-1">
                      Tipo Material
                    </label>
                    <select
                      value={coilType}
                      onChange={(e) => setCoilType(e.target.value)}
                      className="w-full p-2 border border-zinc-700 rounded-lg bg-zinc-950 text-zinc-50 focus:ring-2 focus:ring-blue-500 outline-none font-bold"
                    >
                      {availableTypes.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-yellow-300 uppercase mb-1">
                      Espessura (mm)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={coilThickness}
                      onChange={(e) =>
                        setCoilThickness(
                          e.target.value === "" ? "" : parseFloat(e.target.value)
                        )
                      }
                      className="w-full p-2 border border-yellow-700/60 rounded-lg bg-yellow-950/30 text-yellow-50 focus:ring-2 focus:ring-yellow-500 outline-none font-bold"
                    />
                  </div>
                </div>

                <div className="bg-blue-950/40 p-2 rounded-lg text-xs text-blue-200 text-center border border-blue-900/50">
                  Largura Útil:{" "}
                  <strong>
                    {(Number(motherWidth) || 0) - (Number(trim) || 0)} mm
                  </strong>
                </div>
              </div>
            </div>

            {/* PEDIDOS */}
            <div className="rounded-2xl bg-zinc-900/60 border border-zinc-800 overflow-hidden">
              <div className="bg-zinc-950 px-4 py-3 border-b border-zinc-800 flex items-center gap-2">
                <Box className="w-4 h-4 text-zinc-400" />
                <h2 className="font-semibold text-zinc-200">Pedidos</h2>
              </div>

              <div className="p-4">
                <div className="flex flex-col gap-3 mb-4">
                  <div className="w-full">
                    <label className="text-xs text-zinc-400 mb-1 block">
                      Produto (Filtro: {coilType} |{" "}
                      {Number(coilThickness).toFixed(2)}mm)
                    </label>

                    <select
                      value={selectedProductCode}
                      onChange={(e) => setSelectedProductCode(e.target.value)}
                      className="w-full p-2 border border-zinc-700 rounded-lg text-sm bg-zinc-950 text-zinc-50 focus:ring-2 focus:ring-blue-500 outline-none"
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
                      <label className="text-xs text-zinc-400 mb-1 block">
                        Peso Kg
                      </label>
                      <input
                        type="number"
                        placeholder="kg"
                        value={newWeight}
                        onChange={(e) => setNewWeight(e.target.value)}
                        className="w-full p-2 border border-zinc-700 rounded-lg text-sm bg-zinc-950 text-zinc-50"
                      />
                    </div>

                    <button
                      onClick={addDemand}
                      disabled={!selectedProductCode || !newWeight}
                      className="bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-700 disabled:text-zinc-400 text-white p-2 h-[40px] rounded-lg w-12 flex items-center justify-center"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="max-h-[300px] overflow-y-auto space-y-2">
                  {demands.length === 0 && (
                    <p className="text-center text-zinc-500 text-sm py-4">
                      Nenhum pedido adicionado.
                    </p>
                  )}

                  {demands.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between bg-zinc-950/60 p-2 rounded-lg border border-zinc-800"
                    >
                      <div className="flex flex-col max-w-[80%]">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-zinc-100">
                            {item.width}mm
                          </span>
                          <span className="text-[10px] bg-blue-950/50 text-blue-200 px-1 rounded border border-blue-900/60 truncate">
                            {item.desc}
                          </span>
                        </div>

                        <span className="text-zinc-400 text-xs">
                          Meta: {item.targetWeight.toFixed(0)} kg
                        </span>
                      </div>

                      <button
                        onClick={() => removeDemand(item.id)}
                        className="text-red-400 hover:text-red-300 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 bg-zinc-950 border-t border-zinc-800">
                <button
                  onClick={calculateOptimization}
                  disabled={demands.length === 0 || isCalculating}
                  className={`w-full py-3 rounded-xl font-bold text-lg shadow-md flex items-center justify-center gap-2 transition-all ${
                    isCalculating
                      ? "bg-zinc-800 text-zinc-400"
                      : "bg-emerald-600 hover:bg-emerald-500 text-white"
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

          {/* DIREITA */}
          <div className="lg:col-span-8 space-y-5">

            {/* SUGESTÕES */}
            {suggestions.length > 0 && (
              <div className="bg-orange-950/30 border border-orange-800/60 rounded-2xl p-5 shadow-sm animate-fade-in">
                <div className="flex items-start gap-4">
                  <div className="bg-orange-900/50 p-3 rounded-full">
                    <Layers className="w-6 h-6 text-orange-300" />
                  </div>

                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-orange-200">
                      Sugestões de Combinação (Meta &gt; 97%)
                    </h3>
                    <p className="text-orange-200/70 text-sm mb-3">
                      Combos pra preencher as sobras e subir eficiência.
                    </p>

                    <div className="space-y-6">
                      {suggestions.map((sug, idx) => (
                        <div
                          key={idx}
                          className="bg-zinc-950/50 p-4 rounded-xl border border-orange-800/40 shadow-sm"
                        >
                          <div className="flex justify-between items-center mb-3 border-b border-zinc-800 pb-2">
                            <p className="text-xs font-bold text-zinc-400 uppercase">
                              Padrão{" "}
                              {String.fromCharCode(65 + sug.patternIndex)} - Sobra:
                              <span className="text-red-400">
                                {" "}
                                {sug.waste}mm
                              </span>
                            </p>
                            <span className="text-xs bg-zinc-900 px-2 py-1 rounded text-zinc-300 border border-zinc-800">
                              Preenche {sug.patternCount} bobinas
                            </span>
                          </div>

                          <div className="grid grid-cols-1 gap-3">
                            {sug.suggestions.map((combo, cIdx) => (
                              <div
                                key={cIdx}
                                className="flex flex-col bg-zinc-950/70 p-3 rounded-xl border border-zinc-800 hover:border-blue-700/60 transition-colors"
                              >
                                <div className="flex justify-between items-center mb-2">
                                  <div className="flex items-center gap-2">
                                    <div className="flex -space-x-2">
                                      {combo.items.map((it, i) => (
                                        <div
                                          key={i}
                                          className="w-8 h-8 rounded-full bg-blue-950 border-2 border-zinc-950 flex items-center justify-center text-[10px] font-bold text-blue-200 z-10"
                                          title={it.desc}
                                        >
                                          {it.width}
                                        </div>
                                      ))}
                                    </div>

                                    <span className="text-sm font-bold text-zinc-100 ml-2">
                                      = {combo.totalWidth}mm
                                    </span>

                                    <span className="text-xs text-emerald-200 bg-emerald-950/40 px-2 py-0.5 rounded font-medium border border-emerald-900/50">
                                      Resto: {combo.remainingWaste}mm
                                    </span>
                                  </div>

                                  <span
                                    className={`text-xs px-2 py-1 rounded font-bold border ${
                                      combo.projectedEfficiency >= 97
                                        ? "bg-emerald-950/40 text-emerald-200 border-emerald-900/50"
                                        : "bg-yellow-950/40 text-yellow-200 border-yellow-900/50"
                                    }`}
                                  >
                                    Eficiência:{" "}
                                    {combo.projectedEfficiency.toFixed(2)}%
                                  </span>
                                </div>

                                <div className="text-xs text-zinc-400 mb-2 space-y-1 pl-2 border-l-2 border-blue-900/50">
                                  {combo.items.map((it, i) => (
                                    <div key={i} className="flex justify-between">
                                      <span>
                                        1x {it.desc} ({it.width}mm)
                                      </span>
                                      <span className="text-zinc-500">
                                        +{Math.round(it.weightToAdd)}kg
                                      </span>
                                    </div>
                                  ))}
                                </div>

                                <button
                                  onClick={() => addComboDemand(combo.items)}
                                  className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg shadow-sm flex items-center justify-center gap-2 transition-all active:scale-95"
                                >
                                  <Plus className="w-4 h-4" />
                                  Adicionar Combo (+{Math.round(combo.totalWeightToAdd)} kg)
                                </button>
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

            {/* SEM SUGESTÃO */}
            {results && results.stats.efficiency < 97 && suggestions.length === 0 && (
              <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6 text-center animate-fade-in">
                <AlertCircle className="w-8 h-8 text-zinc-400 mx-auto mb-2" />
                <p className="text-zinc-200 font-medium">
                  Nenhuma sugestão automática encontrada.
                </p>
                <p className="text-xs text-zinc-400 mt-1">
                  Não encontramos produtos com espessura{" "}
                  {coilThickness.toFixed(2)}mm e tipo {coilType}.
                </p>
              </div>
            )}

            {/* RESULTADOS */}
            {results && (
              <div className="animate-fade-in space-y-5">
                {/* KPIs */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="bg-zinc-900/60 p-4 rounded-2xl border border-zinc-800">
                    <p className="text-xs text-zinc-400 uppercase font-bold">
                      Eficiência Global
                    </p>
                    <p
                      className={`text-3xl font-bold ${
                        results.stats.efficiency >= 97 ? "text-emerald-400" : "text-orange-300"
                      }`}
                    >
                      {results.stats.efficiency}%
                    </p>
                  </div>

                  <div className="bg-zinc-900/60 p-4 rounded-2xl border border-zinc-800">
                    <p className="text-xs text-zinc-400 uppercase font-bold">
                      Total Bobinas
                    </p>
                    <p className="text-3xl font-bold text-zinc-50">
                      {results.stats.totalCoils}
                    </p>
                  </div>

                  <div className="bg-zinc-900/60 p-4 rounded-2xl border border-zinc-800">
                    <p className="text-xs text-zinc-400 uppercase font-bold">
                      Sucata Total
                    </p>
                    <p className="text-3xl font-bold text-red-400">
                      {results.stats.totalScrapWeight}
                      <span className="text-sm text-zinc-500">kg</span>
                    </p>
                  </div>

                  <div className="bg-zinc-900/60 p-4 rounded-2xl border border-zinc-800 overflow-y-auto max-h-[110px]">
                    <p className="text-xs text-zinc-400 uppercase font-bold mb-1">
                      Status Pedidos
                    </p>
                    {Object.entries(results.demandAnalysis).map(
                      ([width, data]) => (
                        <div
                          key={width}
                          className="flex justify-between text-xs border-b border-zinc-800 py-1"
                        >
                          <span className="text-zinc-300">{width}mm:</span>
                          <span
                            className={
                              data.producedWeight >= data.reqWeight
                                ? "text-emerald-300"
                                : "text-red-300"
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

                {/* PADRÕES */}
                <div className="space-y-4">
                  {results.patterns.map((pattern, idx) => {
                    const visualMotherWidth = Number(motherWidth);
                    const patternEfficiency = (
                      (pattern.usedWidth / visualMotherWidth) * 100
                    ).toFixed(1);

                    const uniqueCuts = [...new Set(pattern.cuts)];

                    return (
                      <div
                        key={idx}
                        className="bg-zinc-900/60 rounded-2xl border border-zinc-800 overflow-hidden shadow-sm"
                      >
                        <div className="bg-zinc-950 px-5 py-4 border-b border-zinc-800 flex justify-between items-center">
                          <div className="flex items-center gap-3">
                            <div className="bg-blue-600 text-white font-bold w-10 h-10 rounded-xl flex items-center justify-center text-lg">
                              {idx + 1}
                            </div>
                            <div>
                              <h4 className="font-bold text-zinc-50">
                                Padrão {String.fromCharCode(65 + idx)}
                              </h4>
                              <div className="text-sm text-zinc-400">
                                Executar em:{" "}
                                <strong>{pattern.count} bobina(s)</strong>
                                <br />
                                <span className="text-xs bg-zinc-900 px-1 rounded border border-zinc-800">
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
                                  ? "bg-emerald-950/40 text-emerald-200 border border-emerald-900/60"
                                  : "bg-red-950/40 text-red-200 border border-red-900/60"
                              }`}
                            >
                              Efic: {patternEfficiency}%
                            </div>
                            <p className="text-xs text-zinc-500">
                              Perda: {pattern.scrapWeight.toFixed(0)}kg
                            </p>
                          </div>
                        </div>

                        <div className="p-5">
                          {/* Visual */}
                          <div className="h-16 w-full bg-zinc-800 rounded-xl overflow-hidden flex border-2 border-zinc-700 relative">
                            {pattern.cuts.map((cut, i) => {
                              const colorIndex =
                                uniqueCuts.indexOf(cut) % COLORS.length;
                              const widthPercent =
                                (cut.width / visualMotherWidth) * 100;

                              return (
                                <div
                                  key={i}
                                  className={`${COLORS[colorIndex]} h-full border-r border-white/30 flex flex-col items-center justify-center text-white transition-all hover:brightness-110 cursor-help`}
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
                                className="h-full bg-repeating-linear-stripes bg-red-950/30 flex items-center justify-center"
                                style={{
                                  width: `${
                                    ((visualMotherWidth - pattern.usedWidth) /
                                      visualMotherWidth) *
                                    100
                                  }%`,
                                }}
                              >
                                <span className="text-red-300 text-xs font-bold">
                                  LIVRE
                                </span>
                              </div>
                            )}
                          </div>

                          {/* SETUP */}
                          <div className="mt-4">
                            <h5 className="text-sm font-bold text-zinc-200 mb-2 flex items-center gap-2">
                              <Ruler className="w-4 h-4" />
                              Mapa de Setup
                            </h5>

                            <div className="overflow-x-auto border border-zinc-800 rounded-xl">
                              <table className="w-full text-xs text-left">
                                <thead className="bg-zinc-950 text-zinc-400">
                                  <tr>
                                    <th className="p-2 border-r border-zinc-800">#</th>
                                    <th className="p-2 border-r border-zinc-800">Início</th>
                                    <th className="p-2 border-r border-zinc-800">Corte</th>
                                    <th className="p-2 border-r border-zinc-800">Fim</th>
                                    <th className="p-2">Produto</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {pattern.setupCoordinates.map(
                                    (setup, sIdx) => (
                                      <tr key={sIdx} className="border-t border-zinc-800">
                                        <td className="p-2 border-r border-zinc-800 font-bold text-zinc-500">
                                          {sIdx + 1}
                                        </td>
                                        <td className="p-2 border-r border-zinc-800 font-mono text-blue-300 font-bold">
                                          {setup.start} mm
                                        </td>
                                        <td className="p-2 border-r border-zinc-800 font-bold text-base text-zinc-50">
                                          {setup.width} mm
                                        </td>
                                        <td className="p-2 border-r border-zinc-800 font-mono text-zinc-300">
                                          {setup.end} mm
                                        </td>
                                        <td className="p-2 text-zinc-300 truncate max-w-[160px]">
                                          {setup.desc}
                                        </td>
                                      </tr>
                                    )
                                  )}

                                  {visualMotherWidth - pattern.usedWidth > 0 && (
                                    <tr className="border-t border-red-900/50 bg-red-950/30">
                                      <td className="p-2 border-r border-zinc-800 text-red-300 font-bold">
                                        Ref
                                      </td>
                                      <td className="p-2 border-r border-zinc-800 font-mono text-zinc-400">
                                        {pattern.usedWidth} mm
                                      </td>
                                      <td className="p-2 border-r border-zinc-800 font-bold text-red-200">
                                        {(visualMotherWidth - pattern.usedWidth).toFixed(1)} mm
                                      </td>
                                      <td className="p-2 border-r border-zinc-800 font-mono text-zinc-400">
                                        {visualMotherWidth} mm
                                      </td>
                                      <td className="p-2 text-red-200 font-bold text-xs uppercase">
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
              <div className="h-full flex flex-col items-center justify-center text-zinc-500 bg-zinc-900/40 rounded-2xl border border-dashed border-zinc-800 p-12">
                <Scale className="w-16 h-16 mb-4 opacity-50" />
                <p>Insira demandas para calcular.</p>
              </div>
            )}
          </div>
        </div>

        <footer className="pt-3 border-t border-zinc-800 text-center text-xs text-zinc-500">
          © {new Date().getFullYear()} Slitter Metalosa — Sergio Betini
        </footer>
      </div>

      <style>{`
        .bg-repeating-linear-stripes {
          background-image: repeating-linear-gradient(45deg, transparent, transparent 5px, rgba(239, 68, 68, 0.18) 5px, rgba(239, 68, 68, 0.18) 10px);
        }
        @keyframes fade-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fade-in 0.4s ease-out forwards; }
      `}</style>
    </div>
  );
}
