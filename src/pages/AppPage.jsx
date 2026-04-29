import React, { useState, useEffect, useMemo } from "react";
import logo2 from "../logo2.png";
import {
  Plus, Trash2, Calculator, Settings, Database,
  TrendingUp, Printer, AlertCircle, Box, Scale,
  Layers, Ruler, AlertTriangle, Save, FileDown, History,
} from "lucide-react";

import { parseCSV, DEFAULT_CSV_DATA, COLORS } from "../utils/parseCSV";
import { calculateOptimization, calculateSheetOptimization } from "../utils/optimizationEngine";
import { exportPlanToExcel } from "../utils/exportExcel";

import { useAuth } from "../contexts/AuthContext";
import { useProducts } from "../hooks/useProducts";
import { usePlans } from "../hooks/usePlans";

import UserMenu from "../components/UserMenu";
import CatalogManager from "../components/CatalogManager";
import SavePlanModal from "../components/SavePlanModal";
import PlanHistory from "../components/PlanHistory";

const PRESET_STORAGE_KEY = "slitter-preset-v1";

export default function AppPage() {
  const { userProfile } = useAuth();
  const companyId = userProfile?.companyId;

  const { products: cloudProducts } = useProducts(companyId);
  const { plans, savePlan, deletePlan } = usePlans(companyId);

  // ---- CLOUD CATALOG RESOLUTION ----
  const activeDb = useMemo(() => {
    if (cloudProducts === null) return parseCSV(DEFAULT_CSV_DATA); // loading
    if (cloudProducts.length > 0) return cloudProducts;
    return parseCSV(DEFAULT_CSV_DATA);
  }, [cloudProducts]);

  // ---- MACHINE STATE ----
  const [cutMode, setCutMode] = useState("longitudinal");
  const [motherWidth, setMotherWidth] = useState(1200);
  const [stockCoils, setStockCoils] = useState([{ id: 1, weight: 10000 }]);
  const [trim, setTrim] = useState(20);
  const [coilThickness, setCoilThickness] = useState(2.0);
  const [coilType, setCoilType] = useState("BQ");

  const [demands, setDemands] = useState([]);
  const [selectedProductCode, setSelectedProductCode] = useState("");
  const [newWeight, setNewWeight] = useState("");
  const [demandInputMode, setDemandInputMode] = useState("catalog"); // "catalog" | "manual"
  const [demandWeightMode, setDemandWeightMode] = useState("kg"); // "kg" | "qty"
  const [fillerWidths, setFillerWidths] = useState([]); // larguras complementares
  const [selectedPatternOption, setSelectedPatternOption] = useState(null); // índice da opção selecionada
  const [newFillerWidth, setNewFillerWidth] = useState("");
  const [newFillerDesc, setNewFillerDesc] = useState("");
  const [manualWidth, setManualWidth] = useState("");
  const [manualDesc, setManualDesc] = useState("");
  const [manualWeight, setManualWeight] = useState("");
  const [manualQty, setManualQty] = useState("");
  const [catalogQty, setCatalogQty] = useState("");

  const [sheetWidth] = useState(1850);
  const [sheetHeight] = useState(2750);
  const [sheetDemands, setSheetDemands] = useState([]);
  const [sheetPieceWidth, setSheetPieceWidth] = useState("");
  const [sheetPieceHeight, setSheetPieceHeight] = useState("");
  const [sheetPieceQty, setSheetPieceQty] = useState(1);
  const [hasSeededSheet, setHasSeededSheet] = useState(false);
  const [sheetSuggestions, setSheetSuggestions] = useState([]);

  const [results, setResults] = useState(null);
  const [sheetResults, setSheetResults] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [isCalculating, setIsCalculating] = useState(false);
  const [showDb, setShowDb] = useState(false);
  const [weightAlert, setWeightAlert] = useState(null);
  const [sheetAlert, setSheetAlert] = useState("");
  const [presetStatus, setPresetStatus] = useState("");
  const [hasSavedPreset, setHasSavedPreset] = useState(false);

  // ---- CLOUD UI STATE ----
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [saveStatus, setSaveStatus] = useState("");

  // ---- MIGRATION BANNER ----
  const [showMigrationBanner, setShowMigrationBanner] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem(PRESET_STORAGE_KEY);
    setHasSavedPreset(Boolean(raw));
    if (raw && companyId) setShowMigrationBanner(true);
  }, [companyId]);

  useEffect(() => { resetOutputs(); }, [cutMode]);

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
    const normalizeType = (raw) => String(raw ?? "").replace(/"/g, "").trim().toUpperCase();
    const isNumericType = (t) => !Number.isNaN(Number(t));
    const types = new Set(
      activeDb.map((i) => normalizeType(i.type)).filter((t) => t && !isNumericType(t))
    );
    return Array.from(types).sort();
  }, [activeDb]);

  useEffect(() => {
    if (cutMode !== "transversal") return;
    if (sheetDemands.length > 0 || hasSeededSheet) return;
    const heights = [600, 900, 1200, 750];
    const baseProducts = availableProducts.slice(0, 4);
    if (!baseProducts.length) return;
    const seeded = baseProducts.map((p, idx) => ({
      id: Date.now() + idx, width: p.width,
      height: heights[idx % heights.length], qty: 2, code: p.code, isFiller: false,
    }));
    setSheetDemands(seeded);
    setSheetResults(null);
    setSheetAlert("");
    setHasSeededSheet(true);
  }, [cutMode, availableProducts, sheetDemands.length, hasSeededSheet]);

  useEffect(() => {
    if (selectedProductCode) {
      const stillValid = availableProducts.some((p) => p.code === selectedProductCode);
      if (!stillValid) setSelectedProductCode("");
    }
  }, [availableProducts, selectedProductCode]);

  // ---- HELPERS ----
  const totalStockWeight = useMemo(() => stockCoils.reduce((acc, c) => acc + c.weight, 0), [stockCoils]);
  const sheetArea = useMemo(() => sheetWidth * sheetHeight, [sheetWidth, sheetHeight]);

  const addStockCoil = () => setStockCoils([...stockCoils, { id: Date.now(), weight: 10000 }]);
  const updateStockCoil = (id, val) => {
    const w = parseFloat(val);
    setStockCoils(stockCoils.map((c) => c.id === id ? { ...c, weight: isNaN(w) ? 0 : w } : c));
  };
  const removeStockCoil = (id) => {
    if (stockCoils.length > 1) setStockCoils(stockCoils.filter((c) => c.id !== id));
  };

  const addDemand = () => {
    const product = activeDb.find((p) => p.code === selectedProductCode);
    if (!product) return;
    const safeMotherWidth = Number(motherWidth) || 0;
    const safeTrim = Number(trim) || 0;
    if (product.width > safeMotherWidth - safeTrim) {
      alert("Erro: Largura do produto é maior que a largura útil da bobina.");
      return;
    }
    if (demandWeightMode === "qty") {
      const qtyVal = parseInt(catalogQty, 10);
      if (!qtyVal || qtyVal <= 0) return;
      setDemands([...demands, {
        id: Date.now(), code: product.code, desc: product.desc,
        width: product.width, targetQty: qtyVal,
      }]);
      setCatalogQty("");
    } else {
      const weightVal = parseFloat(newWeight);
      if (!weightVal) return;
      setDemands([...demands, {
        id: Date.now(), code: product.code, desc: product.desc,
        width: product.width, targetWeight: weightVal,
      }]);
      setNewWeight("");
    }
    setSelectedProductCode("");
    setResults(null);
    setSuggestions([]);
    setWeightAlert(null);
  };

  const addManualDemand = () => {
    const widthVal = parseFloat(manualWidth);
    if (!widthVal) return;
    const safeMotherWidth = Number(motherWidth) || 0;
    const safeTrim = Number(trim) || 0;
    if (widthVal > safeMotherWidth - safeTrim) {
      alert("Erro: Largura informada é maior que a largura útil da bobina.");
      return;
    }
    const desc = manualDesc.trim() || `${widthVal}mm manual`;
    if (demandWeightMode === "qty") {
      const qtyVal = parseInt(manualQty, 10);
      if (!qtyVal || qtyVal <= 0) return;
      setDemands([...demands, {
        id: Date.now(), code: "MAN", desc, width: widthVal, targetQty: qtyVal,
      }]);
      setManualQty("");
    } else {
      const weightVal = parseFloat(manualWeight);
      if (!weightVal) return;
      setDemands([...demands, {
        id: Date.now(), code: "MAN", desc, width: widthVal, targetWeight: weightVal,
      }]);
      setManualWeight("");
    }
    setManualWidth("");
    setManualDesc("");
    setResults(null);
    setSuggestions([]);
    setWeightAlert(null);
  };

  const resetOutputs = () => {
    setResults(null);
    setSheetResults(null);
    setSuggestions([]);
    setSheetSuggestions([]);
    setWeightAlert(null);
    setSheetAlert("");
    setIsCalculating(false);
  };

  const addComboDemand = (items) => {
    setDemands((prev) => [
      ...prev,
      ...items.map((item, idx) => ({
        id: Date.now() + idx, code: item.code, desc: item.desc,
        width: item.width, targetWeight: item.weightToAdd,
      })),
    ]);
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

  const addSheetDemand = () => {
    const widthVal = parseFloat(sheetPieceWidth);
    const heightVal = parseFloat(sheetPieceHeight);
    const qtyVal = parseInt(sheetPieceQty, 10);
    if (!widthVal || !heightVal || !qtyVal) return;
    setSheetDemands((prev) => [...prev, { id: Date.now(), width: widthVal, height: heightVal, qty: qtyVal, isFiller: false }]);
    setSheetPieceWidth("");
    setSheetPieceHeight("");
    setSheetPieceQty(1);
    setSheetResults(null);
    setSheetAlert("");
  };

  const removeSheetDemand = (id) => {
    setSheetDemands(sheetDemands.filter((d) => d.id !== id));
    setSheetResults(null);
    setSheetAlert("");
  };

  const addSheetSuggestion = (suggestion) => {
    const items = Array.isArray(suggestion.items)
      ? suggestion.items
      : [{ width: suggestion.width, height: suggestion.height, qty: suggestion.qty, code: suggestion.code }];
    setSheetDemands((prev) => [
      ...prev,
      ...items.map((item) => ({ id: Date.now() + Math.random(), width: item.width, height: item.height, qty: item.qty, code: item.code, isFiller: true })),
    ]);
    setSheetResults(null);
    setSheetAlert("");
  };

  // ---- LOCAL PRESET (kept for backward compat) ----
  const savePreset = () => {
    try {
      localStorage.setItem(PRESET_STORAGE_KEY, JSON.stringify({ motherWidth, stockCoils, trim, coilThickness, coilType, demands }));
      setPresetStatus("Preset salvo localmente.");
      setHasSavedPreset(true);
    } catch { setPresetStatus("Não foi possível salvar o preset."); }
  };

  const loadPreset = () => {
    const raw = localStorage.getItem(PRESET_STORAGE_KEY);
    if (!raw) { setPresetStatus("Nenhum preset salvo ainda."); return; }
    try {
      const parsed = JSON.parse(raw);
      setMotherWidth(parsed.motherWidth ?? 1200);
      setStockCoils(parsed.stockCoils ?? [{ id: 1, weight: 10000 }]);
      setTrim(parsed.trim ?? 20);
      setCoilThickness(parsed.coilThickness ?? 2.0);
      setCoilType(parsed.coilType ?? "BQ");
      setDemands(parsed.demands ?? []);
      resetOutputs();
      setPresetStatus("Preset recuperado.");
    } catch { setPresetStatus("Erro ao carregar preset."); }
  };

  const loadDemoPlan = () => {
    const demoProducts = activeDb
      .filter((p) => p.type.toUpperCase() === "BQ" && Math.abs(p.thickness - 2.0) < 0.05)
      .slice(0, 3);
    setMotherWidth(1200);
    setTrim(20);
    setCoilThickness(2.0);
    setCoilType("BQ");
    setStockCoils([{ id: 1, weight: 9000 }, { id: 2, weight: 7200 }]);
    setDemands(demoProducts.map((p, idx) => ({ id: Date.now() + idx, code: p.code, desc: p.desc, width: p.width, targetWeight: 3500 + idx * 500 })));
    resetOutputs();
    setPresetStatus("Plano demo carregado.");
  };

  const clearAll = () => {
    setMotherWidth(1200);
    setStockCoils([{ id: 1, weight: 10000 }]);
    setTrim(20);
    setCoilThickness(2.0);
    setCoilType("BQ");
    setDemands([]);
    setFillerWidths([]);
    setSheetDemands([]);
    setHasSeededSheet(false);
    resetOutputs();
    setPresetStatus("Configurações resetadas.");
  };

  // ---- OPTIMIZATION ----
  const runCalculateOptimization = () => {
    if (!motherWidth || stockCoils.length === 0) {
      alert("Por favor, configure ao menos uma bobina mãe.");
      return;
    }
    setIsCalculating(true);
    setSuggestions([]);
    setWeightAlert(null);

    const isQtyMode = demands.some((d) => d.targetQty != null);
    if (!isQtyMode) {
      const totalDemandWeight = demands.reduce((acc, d) => acc + (d.targetWeight || 0), 0);
      const totalAvailableWeight = stockCoils.reduce((acc, c) => acc + c.weight, 0);
      if (totalDemandWeight > totalAvailableWeight) {
        const diff = totalDemandWeight - totalAvailableWeight;
        setWeightAlert({
          msg: `A demanda (${totalDemandWeight.toLocaleString()} kg) é maior que o estoque (${totalAvailableWeight.toLocaleString()} kg).`,
          subMsg: `Faltam aproximadamente ${diff.toLocaleString()} kg. Adicione mais bobinas clicando em "+".`,
        });
      }
    }

    setTimeout(() => {
      const { results: res, suggestions: sug } = calculateOptimization({
        motherWidth, trim, stockCoils, demands, availableProducts, fillerWidths,
      });
      setResults(res);
      setSuggestions(sug);
      setSelectedPatternOption(null);
      setIsCalculating(false);
    }, 600);
  };

  const runCalculateSheetOptimization = () => {
    if (!sheetDemands.length) return;
    setIsCalculating(true);
    setSheetResults(null);
    setSheetAlert("");
    setSheetSuggestions([]);

    setTimeout(() => {
      try {
        const { sheetResults: res, sheetSuggestions: sug } = calculateSheetOptimization({
          sheetWidth, sheetHeight, sheetDemands, availableProducts,
        });
        setSheetResults(res);
        setSheetSuggestions(sug);

        const alertParts = [];
        if (res.oversize?.length) alertParts.push(`${res.oversize.length} peça(s) não cabem na chapa.`);
        if (alertParts.length) setSheetAlert(alertParts.join(" "));
      } catch (err) {
        console.error(err);
        setSheetAlert("Não foi possível calcular o corte transversal.");
      } finally {
        setIsCalculating(false);
      }
    }, 300);
  };

  // ---- PRINT PATTERN OPTIONS ----
  const printPatternOptions = () => {
    if (!results?.patternOptions?.length) return;
    const win = window.open("", "_blank");
    if (!win) { alert("Permita pop-ups para imprimir."); return; }

    const PRINT_COLORS = ["#3b82f6","#22c55e","#eab308","#a855f7","#ec4899","#f97316","#14b8a6","#ef4444","#8b5cf6","#06b6d4"];

    const cards = results.patternOptions.map((opt, idx) => {
      const entries = Object.entries(opt.counts);
      const mw = Number(motherWidth);

      const bars = entries.map(([w, qty], i) => {
        const pct = (Number(w) * qty / mw * 100).toFixed(2);
        return `<div style="width:${pct}%;background:${PRINT_COLORS[i % PRINT_COLORS.length]};height:100%;display:flex;align-items:center;justify-content:center;border-right:2px solid #fff;box-sizing:border-box;">
          ${pct > 8 ? `<span style="color:#fff;font-size:10px;font-weight:700;">${qty}×${w}</span>` : ""}
        </div>`;
      }).join("");
      const wastePct = (opt.waste / mw * 100).toFixed(2);
      const wasteBar = opt.waste > 0 ? `<div style="width:${wastePct}%;background:#fee2e2;height:100%;display:flex;align-items:center;justify-content:center;">
        <span style="color:#b91c1c;font-size:9px;font-weight:700;">${opt.waste}mm</span>
      </div>` : "";

      const pills = entries.map(([w, qty], i) =>
        `<span style="display:inline-block;background:${PRINT_COLORS[i % PRINT_COLORS.length]};color:#fff;padding:3px 10px;border-radius:999px;font-size:12px;font-weight:700;margin:2px;">${qty}× ${w}mm</span>`
      ).join(" ");

      const effColor = Number(opt.efficiency) >= 97 ? "#16a34a" : Number(opt.efficiency) >= 90 ? "#d97706" : "#dc2626";

      return `<div style="border:1px solid #e5e7eb;border-radius:10px;margin-bottom:16px;overflow:hidden;page-break-inside:avoid;">
        <div style="background:#f8fafc;padding:10px 14px;display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #e5e7eb;">
          <strong style="font-size:14px;">Opção ${idx + 1}</strong>
          <div style="display:flex;gap:12px;align-items:center;">
            <span style="color:${effColor};font-weight:800;font-size:15px;">${opt.efficiency}%</span>
            <span style="color:#6b7280;font-size:12px;">Sobra: ${opt.waste}mm</span>
          </div>
        </div>
        <div style="padding:12px;">
          <div style="height:36px;width:100%;background:#e5e7eb;border-radius:6px;overflow:hidden;display:flex;margin-bottom:10px;">${bars}${wasteBar}</div>
          <div>${pills}</div>
          <table style="width:100%;margin-top:10px;font-size:11px;border-collapse:collapse;">
            <thead><tr style="background:#f1f5f9;"><th style="padding:5px 8px;text-align:left;border-bottom:1px solid #e5e7eb;">Largura</th><th style="padding:5px 8px;text-align:left;border-bottom:1px solid #e5e7eb;">Qtd</th><th style="padding:5px 8px;text-align:left;border-bottom:1px solid #e5e7eb;">Ocupação</th></tr></thead>
            <tbody>${entries.map(([w, qty]) => `<tr><td style="padding:5px 8px;border-bottom:1px solid #f3f4f6;">${w}mm</td><td style="padding:5px 8px;border-bottom:1px solid #f3f4f6;">${qty}</td><td style="padding:5px 8px;border-bottom:1px solid #f3f4f6;">${(Number(w) * qty / mw * 100).toFixed(1)}%</td></tr>`).join("")}
            <tr style="background:#fef2f2;"><td style="padding:5px 8px;font-weight:700;color:#b91c1c;">SUCATA</td><td style="padding:5px 8px;">—</td><td style="padding:5px 8px;font-weight:700;color:#b91c1c;">${opt.waste}mm (${(opt.waste/mw*100).toFixed(1)}%)</td></tr>
            </tbody>
          </table>
        </div>
      </div>`;
    }).join("");

    const fillerList = fillerWidths.length > 0
      ? `Larguras complementares: ${fillerWidths.map(f => f.width + "mm").join(", ")}`
      : "";

    win.document.write(`<html><head><title>SmartSlit | Variações de Corte</title>
    <style>
      body{font-family:system-ui,Arial;padding:32px;color:#111827;max-width:900px;margin:auto}
      h1{font-size:20px;border-bottom:2px solid #111827;padding-bottom:8px;margin-bottom:6px}
      .meta{font-size:12px;color:#6b7280;margin-bottom:20px}
      .print-btn{position:fixed;bottom:18px;right:18px;background:#2563eb;color:#fff;padding:10px 18px;border-radius:999px;font-weight:700;text-decoration:none;cursor:pointer;border:none;font-size:14px;}
      @media print{.print-btn{display:none}body{padding:12px}}
    </style>
    </head><body>
      <h1>SmartSlit — Variações de Padrão de Corte</h1>
      <div class="meta">
        Data: ${new Date().toLocaleString("pt-BR")} &nbsp;|&nbsp;
        Empresa: ${userProfile?.companyName || "—"} &nbsp;|&nbsp;
        Bobina mãe: ${motherWidth}mm &nbsp;|&nbsp;
        Material: ${coilType} ${coilThickness}mm &nbsp;|&nbsp;
        Refilo: ${trim}mm
        ${fillerList ? `&nbsp;|&nbsp; ${fillerList}` : ""}
      </div>
      ${cards}
      <button class="print-btn" onclick="window.print()">🖨️ Imprimir / Salvar PDF</button>
    </body></html>`);
    win.document.close();
  };

  // ---- PRINT SINGLE PATTERN OPTION ----
  const printSinglePatternOption = (opt, idx) => {
    const win = window.open("", "_blank");
    if (!win) { alert("Permita pop-ups para imprimir."); return; }

    const PRINT_COLORS = ["#3b82f6","#22c55e","#eab308","#a855f7","#ec4899","#f97316","#14b8a6","#ef4444","#8b5cf6","#06b6d4"];
    const allWidthDescMap = {};
    demands.forEach((d) => { allWidthDescMap[d.width] = d.desc || `${d.width}mm`; });
    fillerWidths.forEach((fw) => { allWidthDescMap[fw.width] = fw.desc || `${fw.width}mm`; });

    const entries = Object.entries(opt.counts);
    const mw = Number(motherWidth);

    // Gera coordenadas de setup
    let pos = 0;
    const coords = [];
    entries.forEach(([w, qty], colorIdx) => {
      for (let i = 0; i < qty; i++) {
        coords.push({ start: pos, width: Number(w), end: pos + Number(w), desc: allWidthDescMap[Number(w)] || `${w}mm`, colorIdx });
        pos += Number(w);
      }
    });

    const bars = entries.map(([w, qty], i) => {
      const pct = (Number(w) * qty / mw * 100).toFixed(2);
      return `<div style="width:${pct}%;background:${PRINT_COLORS[i%PRINT_COLORS.length]};height:100%;display:flex;align-items:center;justify-content:center;border-right:2px solid #fff;box-sizing:border-box;">
        ${pct > 8 ? `<span style="color:#fff;font-weight:700;font-size:11px;">${qty}×${w}</span>` : ""}
      </div>`;
    }).join("");
    const wastePct = (opt.waste / mw * 100).toFixed(2);
    const wasteBar = opt.waste > 0 ? `<div style="width:${wastePct}%;background:#fee2e2;height:100%;display:flex;align-items:center;justify-content:center;"><span style="color:#b91c1c;font-size:10px;font-weight:700;">${opt.waste}mm</span></div>` : "";

    const avgCWp = stockCoils.length > 0 ? stockCoils.reduce((a, c) => a + c.weight, 0) / stockCoils.length : 10000;
    const usableWp = Math.max(1, Number(motherWidth) - (Number(trim) || 0));
    const estWp = (w) => Math.round((Number(w) / usableWp) * avgCWp);
    const rows = coords.map((c, i) =>
      `<tr><td>${i+1}</td><td style="color:#2563eb;font-weight:600;">${c.start}mm</td><td style="font-weight:800;font-size:14px;">${c.width}mm</td><td>${c.end}mm</td><td>${c.desc}</td><td style="color:#16a34a;font-weight:600;">~${estWp(c.width).toLocaleString()} kg</td></tr>`
    ).join("");
    const scrapRow = opt.waste > 0
      ? `<tr style="background:#fef2f2;color:#b91c1c;font-weight:700;"><td>Ref</td><td>${pos}mm</td><td>${opt.waste}mm</td><td>${mw}mm</td><td>SUCATA / SOBRA</td><td>~${estWp(opt.waste).toLocaleString()} kg</td></tr>`
      : "";

    const effColor = Number(opt.efficiency) >= 97 ? "#16a34a" : Number(opt.efficiency) >= 90 ? "#d97706" : "#dc2626";
    win.document.write(`<html><head><title>SmartSlit | Opção ${idx+1}</title>
    <style>
      body{font-family:system-ui,Arial;padding:32px;color:#111827;max-width:800px;margin:auto}
      h1{font-size:20px;border-bottom:2px solid #111827;padding-bottom:8px;margin-bottom:6px}
      .meta{font-size:12px;color:#6b7280;margin-bottom:20px}
      table{width:100%;border-collapse:collapse;font-size:13px;margin-top:16px}
      th,td{padding:9px 10px;border-bottom:1px solid #e5e7eb;text-align:left}
      th{background:#f1f5f9;font-size:11px;text-transform:uppercase;color:#6b7280}
      .print-btn{position:fixed;bottom:18px;right:18px;background:#2563eb;color:#fff;padding:10px 18px;border-radius:999px;font-weight:700;cursor:pointer;border:none;font-size:14px;}
      @media print{.print-btn{display:none}body{padding:12px}}
    </style></head><body>
      <h1>SmartSlit — Padrão de Corte · Opção ${idx+1}</h1>
      <div class="meta">
        Data: ${new Date().toLocaleString("pt-BR")} &nbsp;|&nbsp;
        Empresa: ${userProfile?.companyName || "—"} &nbsp;|&nbsp;
        Bobina mãe: ${motherWidth}mm &nbsp;|&nbsp;
        Material: ${coilType} ${coilThickness}mm &nbsp;|&nbsp;
        Refilo: ${trim}mm
      </div>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
        <strong style="font-size:16px;">Eficiência: <span style="color:${effColor}">${opt.efficiency}%</span></strong>
        <span style="color:#6b7280;font-size:13px;">Sucata: ${opt.waste}mm</span>
      </div>
      <div style="height:44px;width:100%;background:#e5e7eb;border-radius:8px;overflow:hidden;display:flex;margin-bottom:20px;">${bars}${wasteBar}</div>
      <table>
        <thead><tr><th>#</th><th>Início</th><th>Corte</th><th>Fim</th><th>Produto</th><th>Peso est.</th></tr></thead>
        <tbody>${rows}${scrapRow}</tbody>
      </table>
      <button class="print-btn" onclick="window.print()">🖨️ Imprimir / Salvar PDF</button>
    </body></html>`);
    win.document.close();
  };

  // ---- PDF REPORT (unchanged) ----
  const generateReport = () => {
    if (!results) return;
    const reportWindow = window.open("", "_blank");
    if (!reportWindow) { alert("Permita pop-ups para gerar o relatório."); return; }

    const styles = `<style>
      body{font-family:system-ui,Arial;padding:40px;color:#111827}
      h1{font-size:22px;border-bottom:2px solid #111827;padding-bottom:8px;margin-bottom:18px}
      .header-info{display:flex;flex-wrap:wrap;gap:12px;margin-bottom:24px;background:#f8fafc;padding:12px;border-radius:8px}
      .header-item{font-size:13px}.header-item strong{display:block;font-size:10px;color:#6b7280;text-transform:uppercase}
      .card{border:1px solid #e5e7eb;border-radius:8px;margin-bottom:18px;overflow:hidden}
      .card-header{background:#f1f5f9;padding:10px 12px;display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #e5e7eb}
      .pattern-title{font-weight:700;font-size:15px}
      table{width:100%;border-collapse:collapse;font-size:12px}
      th,td{padding:8px;border-bottom:1px solid #e5e7eb}
      .scrap-row{color:#b91c1c;font-weight:700;background:#fef2f2}
      .total-summary{margin-top:28px;border-top:2px solid #111827;padding-top:14px;display:flex;gap:16px}
      .summary-box{text-align:center;min-width:120px}
      .summary-val{font-size:20px;font-weight:800}
      .summary-label{font-size:11px;color:#6b7280;text-transform:uppercase}
      .print-btn{position:fixed;bottom:18px;right:18px;background:#2563eb;color:#fff;padding:10px 18px;border-radius:999px;font-weight:700;text-decoration:none}
      @media print{.print-btn{display:none}body{padding:0}}
    </style>`;

    const header = `<div class="header-info">
      <div class="header-item"><strong>Data</strong>${new Date().toLocaleString()}</div>
      <div class="header-item"><strong>Empresa</strong>${userProfile?.companyName || ""}</div>
      <div class="header-item"><strong>Largura</strong>${motherWidth}mm</div>
      <div class="header-item"><strong>Material</strong>${coilType} ${coilThickness}mm</div>
      <div class="header-item"><strong>Refilo</strong>${trim}mm</div>
      <div class="header-item"><strong>Estoque Usado</strong>${results.stats.totalInputWeight.toLocaleString()} kg</div>
    </div>`;

    let cards = "";
    results.patterns.forEach((pattern, idx) => {
      const pEff = ((pattern.usedWidth / Number(motherWidth)) * 100).toFixed(1);
      let rows = pattern.setupCoordinates.map((s, i) =>
        `<tr><td>${i+1}</td><td>${s.start}mm</td><td><strong>${s.width}mm</strong></td><td>${s.end}mm</td><td>${s.desc}</td></tr>`
      ).join("");
      if (Number(motherWidth) - pattern.usedWidth > 0) {
        rows += `<tr class="scrap-row"><td>REF</td><td>${pattern.usedWidth}mm</td><td>${(Number(motherWidth)-pattern.usedWidth).toFixed(1)}mm</td><td>${motherWidth}mm</td><td>SUCATA (~${pattern.scrapWeight.toFixed(1)}kg)</td></tr>`;
      }
      cards += `<div class="card"><div class="card-header"><div><span class="pattern-title">Padrão ${String.fromCharCode(65+idx)}</span><span> - ${pattern.count} bobina(s) [${pattern.assignedCoils.map(c=>c.weight+"kg").join(", ")}]</span></div><div><strong>Efic: ${pEff}%</strong></div></div><div style="padding:12px"><table><thead><tr><th>#</th><th>Início</th><th>Largura</th><th>Fim</th><th>Produto</th></tr></thead><tbody>${rows}</tbody></table></div></div>`;
    });

    const summary = `<div class="total-summary"><div class="summary-box"><div class="summary-label">Total Bobinas</div><div class="summary-val">${results.stats.totalCoils}</div></div><div class="summary-box"><div class="summary-label">Eficiência</div><div class="summary-val">${results.stats.efficiency}%</div></div><div class="summary-box"><div class="summary-label" style="color:#b91c1c">Sucata</div><div class="summary-val" style="color:#b91c1c">${results.stats.totalScrapWeight}kg</div></div></div>`;

    reportWindow.document.write(`<html><head><title>SmartSlit | Ordem de Producao</title>${styles}</head><body><h1>SmartSlit - Ordem de Producao</h1>${header}${cards}${summary}<a href="#" onclick="window.print();return false;" class="print-btn">🖨️ Imprimir / Salvar PDF</a></body></html>`);
    reportWindow.document.close();
  };

  // ---- SAVE PLAN (cloud) ----
  const handleSavePlan = async (name) => {
    if (!results) return;
    const machineConfig = { motherWidth, trim, coilThickness, coilType, stockCoils };
    await savePlan(name, cutMode, machineConfig, demands, results);
    setSaveStatus("Plano salvo!");
    setTimeout(() => setSaveStatus(""), 3000);
  };

  const defaultPlanName = () => {
    const d = new Date().toLocaleDateString("pt-BR");
    return `Plano ${d} — ${coilType} ${Number(coilThickness).toFixed(2)}mm`;
  };

  // ---- LOAD PLAN FROM HISTORY ----
  const handleLoadPlan = (plan) => {
    if (!plan.machineConfig) return;
    const { motherWidth: mw, trim: t, coilThickness: ct, coilType: ctype, stockCoils: sc } = plan.machineConfig;
    setMotherWidth(mw ?? 1200);
    setTrim(t ?? 20);
    setCoilThickness(ct ?? 2.0);
    setCoilType(ctype ?? "BQ");
    setStockCoils(sc ?? [{ id: 1, weight: 10000 }]);
    setDemands(plan.demands ?? []);
    setResults(plan.results ?? null);
    setSuggestions([]);
    setWeightAlert(null);
    setCutMode(plan.mode ?? "longitudinal");
  };

  return (
    <div
      className="min-h-screen text-zinc-100 p-3 md:p-5 font-sans relative overflow-hidden"
      style={{
        fontFamily: "'Space Grotesk','Manrope','Segoe UI',sans-serif",
        backgroundImage:
          "radial-gradient(circle at top left,rgba(251,191,36,.16),transparent 55%),radial-gradient(circle at 20% 30%,rgba(16,185,129,.12),transparent 45%),radial-gradient(circle at 80% 10%,rgba(59,130,246,.12),transparent 50%),linear-gradient(180deg,#0a0a0a 0%,#0c0c0c 35%,#090909 100%)",
      }}
    >
      <div className="pointer-events-none absolute -top-32 right-0 w-[420px] h-[420px] bg-amber-500/20 blur-[120px] rounded-full" />
      <div className="pointer-events-none absolute -bottom-40 left-0 w-[520px] h-[520px] bg-emerald-500/10 blur-[140px] rounded-full" />

      <div className="max-w-7xl mx-auto space-y-5 relative">

        {/* HEADER */}
        <header className="sticky top-0 z-20 rounded-2xl bg-zinc-950/80 backdrop-blur border border-zinc-800 px-4 py-4 md:px-6 md:py-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-3 shadow-sm">
          <div className="flex items-center gap-3 md:gap-4">
            <div className="w-32 h-16 md:w-44 md:h-24 flex items-center justify-center overflow-hidden">
              <img src={logo2} alt="SmartSlit" className="w-full h-full object-contain" />
            </div>
            <div>
              <div className="text-[10px] md:text-[12px] uppercase tracking-[0.24em] text-emerald-300 font-semibold">SmartSlit</div>
              <h1 className="text-xl md:text-[28px] font-semibold tracking-tight flex items-center gap-2">
                Planejamento de Corte
                <span className="text-[10px] md:text-xs font-semibold px-2 py-1 rounded-full border border-emerald-400/40 text-emerald-200 bg-emerald-950/40">Industrial</span>
              </h1>
              <p className="text-zinc-400 mt-1 text-xs md:text-[13px] max-w-[520px]">
                Otimize bobinas, reduza sucata e gere ordens de producao prontas para o chao de fabrica.
              </p>
            </div>
          </div>

          <div className="flex w-full md:w-auto gap-2 flex-wrap">
            <button
              onClick={() => setShowDb(!showDb)}
              className="inline-flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm font-medium hover:bg-zinc-800 transition"
            >
              <Database className="w-4 h-4" />
              {showDb ? "Ocultar Catálogo" : "Ver Catálogo"}
              {cloudProducts && cloudProducts.length > 0 && (
                <span className="w-2 h-2 rounded-full bg-emerald-400 ml-1" title="Catálogo da nuvem ativo" />
              )}
            </button>

            <button
              onClick={() => setShowHistory(true)}
              className="inline-flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm font-medium hover:bg-zinc-800 transition"
            >
              <History className="w-4 h-4" />
              Histórico
              {plans.length > 0 && (
                <span className="text-xs bg-zinc-700 text-zinc-300 px-1.5 py-0.5 rounded-full">{plans.length}</span>
              )}
            </button>

            {cutMode === "longitudinal" && results && (
              <>
                <button
                  onClick={() => setShowSaveModal(true)}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 px-3 py-2 text-sm font-semibold text-white transition shadow-sm"
                >
                  <Save className="w-4 h-4" />
                  Salvar Plano
                </button>
                <button
                  onClick={() => exportPlanToExcel(results, { motherWidth, trim, coilThickness, coilType, stockCoils }, userProfile?.companyName)}
                  className="inline-flex items-center gap-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 px-3 py-2 text-sm font-semibold text-zinc-200 transition"
                >
                  <FileDown className="w-4 h-4" />
                  Excel
                </button>
                <button
                  onClick={generateReport}
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-500 transition shadow-sm"
                >
                  <Printer className="w-4 h-4" />
                  PDF
                </button>
              </>
            )}

            <UserMenu />
          </div>
        </header>

        {/* SAVE STATUS TOAST */}
        {saveStatus && (
          <div className="bg-emerald-950/30 border border-emerald-700/50 px-4 py-2 rounded-xl text-emerald-200 text-sm text-center animate-fade-in">
            {saveStatus}
          </div>
        )}

        {/* MIGRATION BANNER */}
        {showMigrationBanner && (
          <div className="bg-blue-950/30 border border-blue-700/50 p-4 rounded-xl flex items-start justify-between gap-3">
            <div>
              <p className="text-blue-200 text-sm font-medium">
                Encontramos um preset salvo localmente. Deseja importar suas configurações?
              </p>
            </div>
            <div className="flex gap-2 shrink-0">
              <button
                onClick={() => { loadPreset(); setShowMigrationBanner(false); }}
                className="text-xs bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-lg font-semibold"
              >
                Importar
              </button>
              <button
                onClick={() => { localStorage.removeItem(PRESET_STORAGE_KEY); setShowMigrationBanner(false); }}
                className="text-xs border border-zinc-700 text-zinc-400 hover:text-zinc-200 px-3 py-1.5 rounded-lg"
              >
                Ignorar
              </button>
            </div>
          </div>
        )}

        {/* WEIGHT ALERT */}
        {cutMode === "longitudinal" && weightAlert && (
          <div className="bg-yellow-950/30 border border-yellow-700/50 p-4 rounded-xl shadow-sm animate-fade-in flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-yellow-400 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-bold text-yellow-200 text-lg">Demanda excede estoque</h3>
              <p className="text-yellow-100 font-medium">{weightAlert.msg}</p>
              <p className="text-yellow-200/80 text-sm mt-1">{weightAlert.subMsg}</p>
            </div>
          </div>
        )}

        {/* CATALOG MANAGER */}
        {showDb && (
          <CatalogManager companyId={companyId} activeDb={activeDb} />
        )}

        {/* MODE TABS */}
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-2 flex flex-wrap gap-2">
          <button
            onClick={() => setCutMode("longitudinal")}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition border ${
              cutMode === "longitudinal"
                ? "bg-emerald-600 text-white border-emerald-500/60"
                : "bg-zinc-950 text-zinc-300 border-zinc-800 hover:bg-zinc-900"
            }`}
          >
            Corte Longitudinal
          </button>
          <button
            onClick={() => setCutMode("transversal")}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition border ${
              cutMode === "transversal"
                ? "bg-amber-500 text-zinc-900 border-amber-400/80"
                : "bg-zinc-950 text-zinc-300 border-zinc-800 hover:bg-zinc-900"
            }`}
          >
            Corte Transversal
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

          {/* LEFT PANEL */}
          <div className="lg:col-span-4 space-y-5">

            {/* MACHINE CONFIG */}
            <div className="rounded-2xl bg-zinc-900/60 border border-zinc-800 overflow-hidden">
              <div className="bg-zinc-950 px-4 py-3 border-b border-zinc-800 flex items-center gap-2">
                <Settings className="w-4 h-4 text-zinc-400" />
                <h2 className="font-semibold text-zinc-200">Configuração da Máquina</h2>
              </div>

              <div className="p-4 space-y-4">
                {cutMode === "longitudinal" ? (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-zinc-400 uppercase mb-1">Largura (mm)</label>
                        <input type="number" value={motherWidth} onChange={(e) => setMotherWidth(e.target.value === "" ? "" : parseFloat(e.target.value))} className="w-full p-2 border border-zinc-700 rounded-lg bg-zinc-950 text-zinc-50 focus:ring-2 focus:ring-blue-500 outline-none font-mono text-lg" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-zinc-400 uppercase mb-1">Refilo (mm)</label>
                        <input type="number" value={trim} onChange={(e) => setTrim(e.target.value === "" ? "" : parseFloat(e.target.value))} className="w-full p-2 border border-zinc-700 rounded-lg bg-zinc-950 text-zinc-50 focus:ring-2 focus:ring-blue-500 outline-none" />
                      </div>
                    </div>

                    <div className="bg-zinc-950/60 p-3 rounded-xl border border-zinc-800">
                      <div className="flex justify-between items-center mb-2">
                        <label className="block text-xs font-bold text-zinc-400 uppercase">Estoque de Bobinas (kg)</label>
                        <button onClick={addStockCoil} className="text-blue-400 hover:text-blue-300 text-xs font-bold flex items-center gap-1">
                          <Plus className="w-3 h-3" /> Add Bobina
                        </button>
                      </div>
                      <div className="max-h-[120px] overflow-y-auto space-y-2">
                        {stockCoils.map((coil, idx) => (
                          <div key={coil.id} className="flex items-center gap-2">
                            <span className="text-xs text-zinc-500 font-mono w-4">{idx + 1}.</span>
                            <div className="relative flex-1">
                              <input type="number" value={coil.weight} onChange={(e) => updateStockCoil(coil.id, e.target.value)} className="w-full p-2 border border-zinc-700 rounded-lg bg-zinc-950 text-zinc-50 text-sm pr-8" />
                              <span className="absolute right-2 top-2 text-xs text-zinc-500">kg</span>
                            </div>
                            <button onClick={() => removeStockCoil(coil.id)} className="text-red-400 hover:text-red-300 p-1"><Trash2 className="w-4 h-4" /></button>
                          </div>
                        ))}
                      </div>
                      <div className="mt-2 text-right text-xs text-zinc-400 font-bold">Total Disponivel: {totalStockWeight.toLocaleString()} kg</div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-zinc-400 uppercase mb-1">Tipo Material</label>
                        <input
                          list="material-types-list"
                          value={coilType}
                          onChange={(e) => setCoilType(e.target.value.toUpperCase())}
                          placeholder="ex: BQ, BZ..."
                          className="w-full p-2 border border-zinc-700 rounded-lg bg-zinc-950 text-zinc-50 focus:ring-2 focus:ring-blue-500 outline-none font-bold"
                        />
                        <datalist id="material-types-list">
                          {availableTypes.map((t) => <option key={t} value={t} />)}
                        </datalist>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-yellow-300 uppercase mb-1">Espessura (mm)</label>
                        <input type="number" step="0.01" value={coilThickness} onChange={(e) => setCoilThickness(e.target.value === "" ? "" : parseFloat(e.target.value))} className="w-full p-2 border border-yellow-700/60 rounded-lg bg-yellow-950/30 text-yellow-50 focus:ring-2 focus:ring-yellow-500 outline-none font-bold" />
                      </div>
                    </div>

                    <div className="bg-blue-950/40 p-2 rounded-lg text-xs text-blue-200 text-center border border-blue-900/50">
                      Largura util: <strong>{(Number(motherWidth) || 0) - (Number(trim) || 0)} mm</strong>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-zinc-400 uppercase mb-1">Largura da Chapa (mm)</label>
                        <input type="number" value={sheetWidth} readOnly className="w-full p-2 border border-zinc-800 rounded-lg bg-zinc-900 text-zinc-300" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-zinc-400 uppercase mb-1">Altura da Chapa (mm)</label>
                        <input type="number" value={sheetHeight} readOnly className="w-full p-2 border border-zinc-800 rounded-lg bg-zinc-900 text-zinc-300" />
                      </div>
                    </div>
                    <div className="bg-zinc-950/60 p-3 rounded-xl border border-zinc-800">
                      <p className="text-xs font-bold text-zinc-400 uppercase">Chapa padrao MDF</p>
                      <p className="text-sm text-zinc-300 mt-1">{sheetWidth} x {sheetHeight} mm</p>
                      <p className="text-xs text-zinc-500 mt-1">Organiza pecas retangulares na chapa.</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-zinc-400 uppercase mb-1">Tipo Material</label>
                        <input
                          list="material-types-list"
                          value={coilType}
                          onChange={(e) => setCoilType(e.target.value.toUpperCase())}
                          placeholder="ex: BQ, BZ..."
                          className="w-full p-2 border border-zinc-700 rounded-lg bg-zinc-950 text-zinc-50 focus:ring-2 focus:ring-blue-500 outline-none font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-yellow-300 uppercase mb-1">Espessura (mm)</label>
                        <input type="number" step="0.01" value={coilThickness} onChange={(e) => setCoilThickness(e.target.value === "" ? "" : parseFloat(e.target.value))} className="w-full p-2 border border-yellow-700/60 rounded-lg bg-yellow-950/30 text-yellow-50 focus:ring-2 focus:ring-yellow-500 outline-none font-bold" />
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* ORDERS */}
            <div className="rounded-2xl bg-zinc-900/60 border border-zinc-800 overflow-hidden">
              <div className="bg-zinc-950 px-4 py-3 border-b border-zinc-800 flex items-center gap-2">
                <Box className="w-4 h-4 text-zinc-400" />
                <h2 className="font-semibold text-zinc-200">{cutMode === "longitudinal" ? "Pedidos" : "Demandas de Chapa"}</h2>
              </div>

              <div className="p-4">
                {cutMode === "longitudinal" ? (
                  <>
                    {/* Toggle Catálogo / Manual */}
                    <div className="flex gap-1 mb-2 bg-zinc-950/60 p-1 rounded-xl border border-zinc-800">
                      <button
                        onClick={() => setDemandInputMode("catalog")}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition ${demandInputMode === "catalog" ? "bg-blue-600 text-white" : "text-zinc-400 hover:text-zinc-200"}`}
                      >
                        Catálogo
                      </button>
                      <button
                        onClick={() => setDemandInputMode("manual")}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition ${demandInputMode === "manual" ? "bg-violet-600 text-white" : "text-zinc-400 hover:text-zinc-200"}`}
                      >
                        Manual
                      </button>
                    </div>

                    {/* Toggle Por Kg / Por Qtd */}
                    <div className="flex gap-1 mb-4 bg-zinc-950/40 p-1 rounded-xl border border-zinc-800/60">
                      <button
                        onClick={() => setDemandWeightMode("kg")}
                        className={`flex-1 py-1 rounded-lg text-[11px] font-semibold transition ${demandWeightMode === "kg" ? "bg-zinc-700 text-zinc-100" : "text-zinc-500 hover:text-zinc-300"}`}
                      >
                        Por Kg
                      </button>
                      <button
                        onClick={() => setDemandWeightMode("qty")}
                        className={`flex-1 py-1 rounded-lg text-[11px] font-semibold transition ${demandWeightMode === "qty" ? "bg-amber-600 text-white" : "text-zinc-500 hover:text-zinc-300"}`}
                      >
                        Por Qtd (bobinas)
                      </button>
                    </div>

                    <div className="flex flex-col gap-3 mb-4">
                      {demandInputMode === "catalog" ? (
                        <>
                          <div className="w-full">
                            <label className="text-xs text-zinc-400 mb-1 block">
                              Produto (Filtro: {coilType} | {Number(coilThickness).toFixed(2)}mm)
                            </label>
                            <select value={selectedProductCode} onChange={(e) => setSelectedProductCode(e.target.value)} className="w-full p-2 border border-zinc-700 rounded-lg text-sm bg-zinc-950 text-zinc-50 focus:ring-2 focus:ring-blue-500 outline-none">
                              <option value="">Selecione um produto...</option>
                              {availableProducts.length === 0
                                ? <option disabled>Nenhum produto para {coilType} {coilThickness}mm</option>
                                : availableProducts.map((p) => <option key={p.code} value={p.code}>{p.width}mm - {p.desc}</option>)
                              }
                            </select>
                          </div>
                          <div className="flex gap-2 items-end">
                            <div className="flex-1">
                              {demandWeightMode === "kg" ? (
                                <>
                                  <label className="text-xs text-zinc-400 mb-1 block">Peso (kg)</label>
                                  <input type="number" placeholder="ex: 3000" value={newWeight} onChange={(e) => setNewWeight(e.target.value)} className="w-full p-2 border border-zinc-700 rounded-lg text-sm bg-zinc-950 text-zinc-50" />
                                </>
                              ) : (
                                <>
                                  <label className="text-xs text-amber-400 mb-1 block">Qtd. de bobinas filhas</label>
                                  <input type="number" min="1" placeholder="ex: 10" value={catalogQty} onChange={(e) => setCatalogQty(e.target.value)} className="w-full p-2 border border-amber-700/60 rounded-lg text-sm bg-amber-950/20 text-zinc-50 focus:ring-2 focus:ring-amber-500 outline-none" />
                                </>
                              )}
                            </div>
                            <button
                              onClick={addDemand}
                              disabled={!selectedProductCode || (demandWeightMode === "kg" ? !newWeight : !catalogQty)}
                              className="bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-700 disabled:text-zinc-400 text-white p-2 h-[40px] rounded-lg w-12 flex items-center justify-center"
                            >
                              <Plus className="w-5 h-5" />
                            </button>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="flex gap-2">
                            <div className="flex-1">
                              <label className="text-xs text-zinc-400 mb-1 block">Largura (mm)</label>
                              <input
                                type="number"
                                placeholder="ex: 250"
                                value={manualWidth}
                                onChange={(e) => setManualWidth(e.target.value)}
                                className="w-full p-2 border border-violet-700/60 rounded-lg text-sm bg-violet-950/20 text-zinc-50 focus:ring-2 focus:ring-violet-500 outline-none"
                              />
                            </div>
                            <div className="flex-1">
                              {demandWeightMode === "kg" ? (
                                <>
                                  <label className="text-xs text-zinc-400 mb-1 block">Peso (kg)</label>
                                  <input type="number" placeholder="ex: 3000" value={manualWeight} onChange={(e) => setManualWeight(e.target.value)} className="w-full p-2 border border-violet-700/60 rounded-lg text-sm bg-violet-950/20 text-zinc-50 focus:ring-2 focus:ring-violet-500 outline-none" />
                                </>
                              ) : (
                                <>
                                  <label className="text-xs text-amber-400 mb-1 block">Qtd. de bobinas</label>
                                  <input type="number" min="1" placeholder="ex: 10" value={manualQty} onChange={(e) => setManualQty(e.target.value)} className="w-full p-2 border border-amber-700/60 rounded-lg text-sm bg-amber-950/20 text-zinc-50 focus:ring-2 focus:ring-amber-500 outline-none" />
                                </>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2 items-end">
                            <div className="flex-1">
                              <label className="text-xs text-zinc-400 mb-1 block">Descrição (opcional)</label>
                              <input
                                type="text"
                                placeholder="ex: Tampa lateral"
                                value={manualDesc}
                                onChange={(e) => setManualDesc(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && addManualDemand()}
                                className="w-full p-2 border border-violet-700/60 rounded-lg text-sm bg-violet-950/20 text-zinc-50 focus:ring-2 focus:ring-violet-500 outline-none"
                              />
                            </div>
                            <button
                              onClick={addManualDemand}
                              disabled={!manualWidth || (demandWeightMode === "kg" ? !manualWeight : !manualQty)}
                              className="bg-violet-600 hover:bg-violet-500 disabled:bg-zinc-700 disabled:text-zinc-400 text-white p-2 h-[40px] rounded-lg w-12 flex items-center justify-center"
                            >
                              <Plus className="w-5 h-5" />
                            </button>
                          </div>
                        </>
                      )}
                    </div>

                    <div className="max-h-[300px] overflow-y-auto space-y-2">
                      {demands.length === 0 && <p className="text-center text-zinc-500 text-sm py-4">Nenhum pedido adicionado.</p>}
                      {demands.map((item) => {
                        const isManual = item.code === "MAN";
                        return (
                          <div key={item.id} className={`flex items-center justify-between p-2 rounded-lg border ${isManual ? "bg-violet-950/20 border-violet-800/50" : "bg-zinc-950/60 border-zinc-800"}`}>
                            <div className="flex flex-col max-w-[80%]">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-zinc-100">{item.width}mm</span>
                                <span className={`text-[10px] px-1 rounded border truncate ${isManual ? "bg-violet-950/50 text-violet-200 border-violet-900/60" : "bg-blue-950/50 text-blue-200 border-blue-900/60"}`}>
                                  {isManual ? "manual" : item.desc}
                                </span>
                                {!isManual && item.desc && <span className="text-[10px] text-zinc-500 truncate hidden sm:inline">{item.desc}</span>}
                              </div>
                              {isManual && item.desc && item.desc !== `${item.width}mm manual` && (
                                <span className="text-zinc-400 text-xs">{item.desc}</span>
                              )}
                              {item.targetQty != null
                                ? <span className="text-amber-400 text-xs font-semibold">Qtd: {item.targetQty} bobina{item.targetQty !== 1 ? "s" : ""}</span>
                                : <span className="text-zinc-400 text-xs">Meta: {item.targetWeight?.toFixed(0)} kg</span>
                              }
                            </div>
                            <button onClick={() => removeDemand(item.id)} className="text-red-400 hover:text-red-300 p-1"><Trash2 className="w-4 h-4" /></button>
                          </div>
                        );
                      })}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex flex-col gap-3 mb-4">
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="text-xs text-zinc-400 mb-1 block">Largura (mm)</label>
                          <input type="number" placeholder="ex: 500" value={sheetPieceWidth} onChange={(e) => setSheetPieceWidth(e.target.value)} className="w-full p-2 border border-zinc-700 rounded-lg text-sm bg-zinc-950 text-zinc-50" />
                        </div>
                        <div>
                          <label className="text-xs text-zinc-400 mb-1 block">Altura (mm)</label>
                          <input type="number" placeholder="ex: 600" value={sheetPieceHeight} onChange={(e) => setSheetPieceHeight(e.target.value)} className="w-full p-2 border border-zinc-700 rounded-lg text-sm bg-zinc-950 text-zinc-50" />
                        </div>
                        <div>
                          <label className="text-xs text-zinc-400 mb-1 block">Qtd</label>
                          <input type="number" min="1" value={sheetPieceQty} onChange={(e) => setSheetPieceQty(e.target.value)} className="w-full p-2 border border-zinc-700 rounded-lg text-sm bg-zinc-950 text-zinc-50" />
                        </div>
                      </div>
                      <button onClick={addSheetDemand} disabled={!sheetPieceWidth || !sheetPieceHeight || !sheetPieceQty} className="bg-amber-500 hover:bg-amber-400 disabled:bg-zinc-700 disabled:text-zinc-400 text-zinc-900 font-semibold py-2 rounded-lg">
                        Adicionar peca
                      </button>
                    </div>
                    <div className="max-h-[300px] overflow-y-auto space-y-2">
                      {sheetDemands.length === 0 && <p className="text-center text-zinc-500 text-sm py-4">Nenhuma peca adicionada.</p>}
                      {sheetDemands.map((item) => (
                        <div key={item.id} className="flex items-center justify-between bg-zinc-950/60 p-2 rounded-lg border border-zinc-800">
                          <div className="flex flex-col">
                            <span className="font-bold text-zinc-100">{item.width} x {item.height} mm</span>
                            <span className="text-zinc-400 text-xs">Qtd: {item.qty}</span>
                          </div>
                          <button onClick={() => removeSheetDemand(item.id)} className="text-red-400 hover:text-red-300 p-1"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>

              <div className="p-4 bg-zinc-950 border-t border-zinc-800">
                <button
                  onClick={cutMode === "longitudinal" ? runCalculateOptimization : runCalculateSheetOptimization}
                  disabled={cutMode === "longitudinal" ? (demands.length === 0 || isCalculating) : (sheetDemands.length === 0 || isCalculating)}
                  className={`w-full py-3 rounded-xl font-bold text-lg shadow-md flex items-center justify-center gap-2 transition-all ${
                    isCalculating ? "bg-zinc-800 text-zinc-400"
                    : cutMode === "longitudinal" ? "bg-emerald-600 hover:bg-emerald-500 text-white"
                    : "bg-amber-500 hover:bg-amber-400 text-zinc-900"
                  }`}
                >
                  {isCalculating ? "Calculando..." : <><Calculator className="w-5 h-5" /> Gerar Plano</>}
                </button>
              </div>
            </div>

            {/* LARGURAS COMPLEMENTARES */}
            {cutMode === "longitudinal" && (
              <div className="rounded-2xl bg-zinc-900/60 border border-zinc-800 overflow-hidden">
                <div className="bg-zinc-950 px-4 py-3 border-b border-zinc-800 flex items-center gap-2">
                  <Ruler className="w-4 h-4 text-amber-400" />
                  <h2 className="font-semibold text-zinc-200">Larguras para complementar</h2>
                  <span className="text-[10px] text-zinc-500 ml-1">opcional — preenchem as sobras</span>
                </div>
                <div className="p-4 space-y-3">
                  <div className="flex gap-2">
                    <div>
                      <label className="text-xs text-zinc-400 mb-1 block">Largura (mm)</label>
                      <input
                        type="number"
                        placeholder="ex: 170"
                        value={newFillerWidth}
                        onChange={(e) => setNewFillerWidth(e.target.value)}
                        className="w-24 p-2 border border-amber-700/50 rounded-lg text-sm bg-amber-950/20 text-zinc-50 focus:ring-2 focus:ring-amber-500 outline-none"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="text-xs text-zinc-400 mb-1 block">Descrição (opcional)</label>
                      <input
                        type="text"
                        placeholder="ex: Chapa A"
                        value={newFillerDesc}
                        onChange={(e) => setNewFillerDesc(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key !== "Enter") return;
                          const w = parseFloat(newFillerWidth);
                          if (!w) return;
                          setFillerWidths((prev) => [...prev, { id: Date.now(), width: w, desc: newFillerDesc.trim() || `${w}mm` }]);
                          setNewFillerWidth("");
                          setNewFillerDesc("");
                          setResults(null);
                        }}
                        className="w-full p-2 border border-zinc-700 rounded-lg text-sm bg-zinc-950 text-zinc-50 focus:ring-2 focus:ring-amber-500 outline-none"
                      />
                    </div>
                    <div className="flex items-end">
                      <button
                        onClick={() => {
                          const w = parseFloat(newFillerWidth);
                          if (!w) return;
                          setFillerWidths((prev) => [...prev, { id: Date.now(), width: w, desc: newFillerDesc.trim() || `${w}mm` }]);
                          setNewFillerWidth("");
                          setNewFillerDesc("");
                          setResults(null);
                        }}
                        disabled={!newFillerWidth}
                        className="bg-amber-600 hover:bg-amber-500 disabled:bg-zinc-700 disabled:text-zinc-400 text-white p-2 h-[40px] rounded-lg w-10 flex items-center justify-center"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  {fillerWidths.length === 0 ? (
                    <p className="text-center text-zinc-600 text-xs py-2">Nenhuma largura complementar. O sistema usará só os pedidos acima.</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {fillerWidths.map((fw) => (
                        <div key={fw.id} className="flex items-center gap-1 bg-amber-950/30 border border-amber-800/50 rounded-lg px-2 py-1">
                          <span className="text-amber-200 text-xs font-bold">{fw.width}mm</span>
                          {fw.desc !== `${fw.width}mm` && <span className="text-amber-200/60 text-[10px]">{fw.desc}</span>}
                          <button
                            onClick={() => { setFillerWidths((prev) => prev.filter((f) => f.id !== fw.id)); setResults(null); }}
                            className="text-red-400 hover:text-red-300 ml-1"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* LOCAL PRESET (secondary) */}
            <div className="rounded-2xl bg-zinc-900/40 border border-zinc-800/60 p-3 text-xs">
              <p className="text-zinc-500 mb-2 font-semibold uppercase tracking-wide">Preset local</p>
              <div className="flex gap-2 flex-wrap">
                <button onClick={loadDemoPlan} className="px-3 py-1.5 rounded-lg border border-zinc-700 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition">Demo</button>
                <button onClick={savePreset} className="px-3 py-1.5 rounded-lg border border-zinc-700 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition">Salvar local</button>
                {hasSavedPreset && <button onClick={loadPreset} className="px-3 py-1.5 rounded-lg border border-zinc-700 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition">Carregar local</button>}
                <button onClick={clearAll} className="px-3 py-1.5 rounded-lg border border-red-900/40 text-red-400/60 hover:text-red-400 hover:bg-zinc-800 transition">Limpar</button>
              </div>
              {presetStatus && <p className="mt-2 text-zinc-500">{presetStatus}</p>}
            </div>

          </div>

          {/* RIGHT PANEL */}
          <div className="lg:col-span-8 space-y-5">

            {/* SHEET SUGGESTIONS */}
            {cutMode === "transversal" && sheetSuggestions.length > 0 && (
              <div className="bg-amber-950/20 border border-amber-800/60 rounded-2xl p-5 shadow-sm animate-fade-in">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div>
                    <h3 className="text-lg font-bold text-amber-200">Sugestoes para completar sobras</h3>
                    <p className="text-xs text-amber-200/70">Itens do mesmo tipo/espessura para melhorar o aproveitamento.</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {sheetSuggestions.map((item, idx) => (
                    <div key={`sheet-sug-${idx}`} className="bg-zinc-950/60 border border-amber-900/40 rounded-xl p-3 flex items-center justify-between">
                      <div>
                        <div className="text-sm font-semibold text-zinc-100">Chapa {item.sheetLabel} • {item.items && item.items.length > 1 ? "Combo" : "Sugestao"}</div>
                        <div className="text-xs text-zinc-400">
                          {item.items?.map((it) => <span key={`${it.code}-${it.width}-${it.height}`} className="mr-2">{it.code} {it.width}x{it.height} ({it.qty}x)</span>)}
                        </div>
                        <div className="text-xs text-zinc-400">Preenche {Math.round((item.fillRatio || 0) * 100)}% da sobra</div>
                      </div>
                      <button onClick={() => addSheetSuggestion(item)} className="px-3 py-2 text-xs font-semibold rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-900">Adicionar</button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* LONGITUDINAL SUGGESTIONS */}
            {cutMode === "longitudinal" && suggestions.length > 0 && (
              <div className="bg-orange-950/30 border border-orange-800/60 rounded-2xl p-5 shadow-sm animate-fade-in">
                <div className="flex items-start gap-4">
                  <div className="bg-orange-900/50 p-3 rounded-full"><Layers className="w-6 h-6 text-orange-300" /></div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-orange-200">Sugestões de Combinação (Meta &gt; 97%)</h3>
                    <p className="text-orange-200/70 text-sm mb-3">Combos pra preencher as sobras e subir eficiência.</p>
                    <div className="space-y-6">
                      {suggestions.map((sug, idx) => (
                        <div key={idx} className="bg-zinc-950/50 p-4 rounded-xl border border-orange-800/40 shadow-sm">
                          <div className="flex justify-between items-center mb-3 border-b border-zinc-800 pb-2">
                            <p className="text-xs font-bold text-zinc-400 uppercase">
                              Padrão {String.fromCharCode(65 + sug.patternIndex)} - Sobra: <span className="text-red-400">{sug.waste}mm</span>
                            </p>
                            <span className="text-xs bg-zinc-900 px-2 py-1 rounded text-zinc-300 border border-zinc-800">Preenche {sug.patternCount} bobinas</span>
                          </div>
                          <div className="grid grid-cols-1 gap-3">
                            {sug.suggestions.map((combo, cIdx) => (
                              <div key={cIdx} className="flex flex-col bg-zinc-950/70 p-3 rounded-xl border border-zinc-800 hover:border-blue-700/60 transition-colors">
                                <div className="flex justify-between items-center mb-2">
                                  <div className="flex items-center gap-2">
                                    <div className="flex -space-x-2">
                                      {combo.items.map((it, i) => (
                                        <div key={i} className="w-8 h-8 rounded-full bg-blue-950 border-2 border-zinc-950 flex items-center justify-center text-[10px] font-bold text-blue-200 z-10" title={it.desc}>{it.width}</div>
                                      ))}
                                    </div>
                                    <span className="text-sm font-bold text-zinc-100 ml-2">= {combo.totalWidth}mm</span>
                                    <span className="text-xs text-emerald-200 bg-emerald-950/40 px-2 py-0.5 rounded font-medium border border-emerald-900/50">Resto: {combo.remainingWaste}mm</span>
                                  </div>
                                  <span className={`text-xs px-2 py-1 rounded font-bold border ${combo.projectedEfficiency >= 97 ? "bg-emerald-950/40 text-emerald-200 border-emerald-900/50" : "bg-yellow-950/40 text-yellow-200 border-yellow-900/50"}`}>
                                    Eficiência: {combo.projectedEfficiency.toFixed(2)}%
                                  </span>
                                </div>
                                <div className="text-xs text-zinc-400 mb-2 space-y-1 pl-2 border-l-2 border-blue-900/50">
                                  {combo.items.map((it, i) => (
                                    <div key={i} className="flex justify-between">
                                      <span>1x {it.desc} ({it.width}mm)</span>
                                      <span className="text-zinc-500">+{Math.round(it.weightToAdd)}kg</span>
                                    </div>
                                  ))}
                                </div>
                                <button onClick={() => addComboDemand(combo.items)} className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg shadow-sm flex items-center justify-center gap-2 transition-all active:scale-95">
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

            {/* NO SUGGESTIONS */}
            {cutMode === "longitudinal" && results && results.stats.efficiency < 97 && suggestions.length === 0 && (
              <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6 text-center animate-fade-in">
                <AlertCircle className="w-8 h-8 text-zinc-400 mx-auto mb-2" />
                <p className="text-zinc-200 font-medium">Nenhuma sugestão automática encontrada.</p>
                <p className="text-xs text-zinc-400 mt-1">Não encontramos produtos com espessura {coilThickness}mm e tipo {coilType}.</p>
              </div>
            )}

            {/* SHEET RESULTS */}
            {cutMode === "transversal" && sheetResults && (
              <div className="animate-fade-in space-y-5">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="bg-zinc-900/60 p-4 rounded-2xl border border-zinc-800">
                    <p className="text-xs text-zinc-400 uppercase font-bold">Aproveitamento</p>
                    <p className="text-3xl font-bold text-emerald-300">{sheetResults.stats.efficiency}%</p>
                  </div>
                  <div className="bg-zinc-900/60 p-4 rounded-2xl border border-zinc-800">
                    <p className="text-xs text-zinc-400 uppercase font-bold">Total Chapas</p>
                    <p className="text-3xl font-bold text-zinc-50">{sheetResults.stats.totalSheets}</p>
                  </div>
                  <div className="bg-zinc-900/60 p-4 rounded-2xl border border-zinc-800">
                    <p className="text-xs text-zinc-400 uppercase font-bold">Pecas</p>
                    <p className="text-3xl font-bold text-zinc-50">{sheetResults.stats.totalPieces}</p>
                  </div>
                  <div className="bg-zinc-900/60 p-4 rounded-2xl border border-zinc-800">
                    <p className="text-xs text-zinc-400 uppercase font-bold">Sobra</p>
                    <p className="text-3xl font-bold text-orange-300">{sheetResults.stats.waste}%</p>
                  </div>
                </div>
                {sheetAlert && <div className="bg-amber-950/30 border border-amber-800/60 rounded-xl px-4 py-3 text-amber-200 text-sm">{sheetAlert}</div>}
                <div className="space-y-4">
                  {sheetResults.sheets.map((sheet, idx) => (
                    <div key={sheet.id} className="bg-zinc-900/60 rounded-2xl border border-zinc-800 overflow-hidden shadow-sm">
                      <div className="bg-zinc-950 px-5 py-4 border-b border-zinc-800 flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <div className="bg-amber-500 text-zinc-900 font-bold w-10 h-10 rounded-xl flex items-center justify-center text-lg">{idx + 1}</div>
                          <div>
                            <h4 className="font-bold text-zinc-50">Chapa {String.fromCharCode(65 + idx)}</h4>
                            <div className="text-sm text-zinc-400">{sheetWidth} x {sheetHeight} mm</div>
                          </div>
                        </div>
                        <div className="text-right text-xs text-zinc-400">Uso: {sheetArea ? Math.round((sheet.usedArea / sheetArea) * 100) : 0}%</div>
                      </div>
                      <div className="p-5">
                        <div className="relative w-full border border-zinc-800 rounded-xl bg-zinc-950/40 overflow-hidden" style={{ aspectRatio: `${sheetWidth} / ${sheetHeight}` }}>
                          {sheet.placements.map((piece, i) => {
                            const left = (piece.x / sheetWidth) * 100;
                            const top = (piece.y / sheetHeight) * 100;
                            const w = (piece.width / sheetWidth) * 100;
                            const h = (piece.height / sheetHeight) * 100;
                            const showLabel = w > 12 && h > 12;
                            return (
                              <div key={`${sheet.id}-${i}`} className={`${COLORS[i % COLORS.length]} absolute border border-white/30 text-[10px] text-white flex items-center justify-center`}
                                style={{ left: `${left}%`, top: `${top}%`, width: `${w}%`, height: `${h}%` }} title={piece.label}>
                                {showLabel ? piece.label : ""}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* LONGITUDINAL RESULTS */}
            {cutMode === "longitudinal" && results && (
              <div className="animate-fade-in space-y-5">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="bg-zinc-900/60 p-4 rounded-2xl border border-zinc-800">
                    <p className="text-xs text-zinc-400 uppercase font-bold">Eficiência Global</p>
                    <p className={`text-3xl font-bold ${results.stats.efficiency >= 97 ? "text-emerald-400" : "text-orange-300"}`}>{results.stats.efficiency}%</p>
                  </div>
                  <div className="bg-zinc-900/60 p-4 rounded-2xl border border-zinc-800">
                    <p className="text-xs text-zinc-400 uppercase font-bold">Total Bobinas</p>
                    <p className="text-3xl font-bold text-zinc-50">{results.stats.totalCoils}</p>
                  </div>
                  <div className="bg-zinc-900/60 p-4 rounded-2xl border border-zinc-800">
                    <p className="text-xs text-zinc-400 uppercase font-bold">Sucata Total</p>
                    <p className="text-3xl font-bold text-red-400">{results.stats.totalScrapWeight}<span className="text-sm text-zinc-500">kg</span></p>
                  </div>
                  <div className="bg-zinc-900/60 p-4 rounded-2xl border border-zinc-800 overflow-y-auto max-h-[110px]">
                    <p className="text-xs text-zinc-400 uppercase font-bold mb-1">Status Pedidos</p>
                    {Object.entries(results.demandAnalysis).map(([width, data]) => (
                      <div key={width} className="flex justify-between text-xs border-b border-zinc-800 py-1">
                        <span className="text-zinc-300">{width}mm:</span>
                        {data.isQtyMode
                          ? <span className={data.producedQty >= data.reqQty ? "text-emerald-300" : "text-red-300"}>
                              {data.producedQty}/{data.reqQty} bob.
                            </span>
                          : <span className={data.producedWeight >= data.reqWeight ? "text-emerald-300" : "text-red-300"}>
                              {Math.round(data.producedWeight)}/{data.reqWeight.toFixed(0)}kg
                            </span>
                        }
                      </div>
                    ))}
                  </div>
                </div>

                {/* PATTERN OPTIONS / VARIAÇÕES */}
                {results.patternOptions && results.patternOptions.length > 0 && (
                  <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl overflow-hidden">
                    <div className="bg-zinc-950 px-4 py-3 border-b border-zinc-800 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Layers className="w-4 h-4 text-blue-400" />
                        <h3 className="font-semibold text-zinc-200">Variações de padrão disponíveis</h3>
                        <span className="text-[10px] text-zinc-500 ml-1 hidden sm:inline">diferentes combinações — mesma bobina mãe</span>
                      </div>
                      <button
                        onClick={printPatternOptions}
                        className="inline-flex items-center gap-1.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 text-xs font-semibold px-3 py-1.5 rounded-lg transition"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        Imprimir todas
                      </button>
                    </div>
                    <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                      {(() => {
                        const avgCoilWeight = stockCoils.length > 0
                          ? stockCoils.reduce((a, c) => a + c.weight, 0) / stockCoils.length
                          : 10000;
                        const usableW = Math.max(1, (Number(motherWidth) || 0) - (Number(trim) || 0));
                        const weightFor = (width, qty) => Math.round((Number(width) / usableW) * avgCoilWeight * qty);
                        return results.patternOptions.map((opt, idx) => {
                        const entries = Object.entries(opt.counts);
                        const isSelected = selectedPatternOption === idx;
                        return (
                          <div
                            key={idx}
                            onClick={() => setSelectedPatternOption(isSelected ? null : idx)}
                            className={`rounded-xl p-3 cursor-pointer transition border-2 ${isSelected ? "border-blue-500 bg-blue-950/30" : "border-zinc-800 bg-zinc-950/60 hover:border-zinc-600"}`}
                          >
                            <div className="flex justify-between items-center mb-2">
                              <span className={`text-xs font-bold uppercase ${isSelected ? "text-blue-300" : "text-zinc-500"}`}>
                                {isSelected ? "✓ " : ""}Opção {idx + 1}
                              </span>
                              <div className="flex items-center gap-2">
                                <span className={`text-xs font-bold px-2 py-0.5 rounded border ${Number(opt.efficiency) >= 97 ? "bg-emerald-950/40 text-emerald-300 border-emerald-900/50" : Number(opt.efficiency) >= 90 ? "bg-yellow-950/40 text-yellow-300 border-yellow-900/50" : "bg-red-950/40 text-red-300 border-red-900/50"}`}>
                                  {opt.efficiency}%
                                </span>
                                <span className="text-[10px] text-zinc-500">Sobra: {opt.waste}mm</span>
                              </div>
                            </div>
                            <div className="h-7 w-full bg-zinc-800 rounded-lg overflow-hidden flex border border-zinc-700 mb-2">
                              {entries.map(([w, qty], i) => {
                                const pct = (Number(w) * qty / Number(motherWidth)) * 100;
                                return (
                                  <div key={w} className={`${COLORS[i % COLORS.length]} h-full border-r border-white/20 flex items-center justify-center`} style={{ width: `${pct}%` }} title={`${qty}× ${w}mm`}>
                                    {pct > 10 && <span className="text-white text-[9px] font-bold">{qty}×{w}</span>}
                                  </div>
                                );
                              })}
                              {opt.waste > 0 && (
                                <div className="h-full bg-red-950/40 flex items-center justify-center" style={{ width: `${(opt.waste / Number(motherWidth)) * 100}%` }}>
                                  {(opt.waste / Number(motherWidth)) * 100 > 5 && <span className="text-red-400 text-[9px] font-bold">{opt.waste}mm</span>}
                                </div>
                              )}
                            </div>
                            <div className="flex flex-wrap gap-1.5 mt-1">
                              {entries.map(([w, qty], i) => (
                                <div key={w} className={`flex flex-col items-center px-2 py-1 rounded-lg font-semibold ${COLORS[i % COLORS.length]} text-white`} style={{minWidth: 60}}>
                                  <span className="text-[11px] font-bold leading-tight">{qty}× {w}mm</span>
                                  <span className="text-[10px] opacity-80 leading-tight">~{weightFor(w, qty).toLocaleString()}kg</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      });})()}
                    </div>

                    {/* DETALHE DA OPÇÃO SELECIONADA */}
                    {selectedPatternOption !== null && results.patternOptions[selectedPatternOption] && (() => {
                      const opt = results.patternOptions[selectedPatternOption];
                      const entries = Object.entries(opt.counts);
                      const allWidthDescMap = {};
                      demands.forEach((d) => { allWidthDescMap[d.width] = d.desc || `${d.width}mm`; });
                      fillerWidths.forEach((fw) => { allWidthDescMap[fw.width] = fw.desc || `${fw.width}mm`; });
                      let pos = 0;
                      const coords = [];
                      entries.forEach(([w, qty], colorIdx) => {
                        for (let i = 0; i < qty; i++) {
                          coords.push({ start: pos, width: Number(w), end: pos + Number(w), desc: allWidthDescMap[Number(w)] || `${w}mm`, colorIdx });
                          pos += Number(w);
                        }
                      });
                      const mw = Number(motherWidth);
                      const avgCW = stockCoils.length > 0 ? stockCoils.reduce((a, c) => a + c.weight, 0) / stockCoils.length : 10000;
                      const usableW2 = Math.max(1, mw - (Number(trim) || 0));
                      const estWeight = (w) => Math.round((Number(w) / usableW2) * avgCW);
                      return (
                        <div className="mx-4 mb-4 border-t border-zinc-700 pt-4">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-bold text-zinc-100 text-sm">
                              Mapa de Setup — Opção {selectedPatternOption + 1}
                              <span className={`ml-2 text-xs px-2 py-0.5 rounded border font-bold ${Number(opt.efficiency) >= 97 ? "bg-emerald-950/40 text-emerald-300 border-emerald-900/50" : "bg-yellow-950/40 text-yellow-300 border-yellow-900/50"}`}>
                                {opt.efficiency}%
                              </span>
                            </h4>
                            <button
                              onClick={() => printSinglePatternOption(opt, selectedPatternOption)}
                              className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition"
                            >
                              <Printer className="w-3.5 h-3.5" /> Imprimir esta opção
                            </button>
                          </div>
                          {/* barra grande */}
                          <div className="h-12 w-full bg-zinc-800 rounded-xl overflow-hidden flex border-2 border-zinc-700 mb-4">
                            {entries.map(([w, qty], i) => {
                              const pct = (Number(w) * qty / mw) * 100;
                              return (
                                <div key={w} className={`${COLORS[i % COLORS.length]} h-full border-r-2 border-white/30 flex items-center justify-center`} style={{ width: `${pct}%` }}>
                                  {pct > 8 && <span className="text-white font-bold text-sm">{w}</span>}
                                </div>
                              );
                            })}
                            {opt.waste > 0 && (
                              <div className="h-full bg-red-950/40 border-l border-red-900/40 flex items-center justify-center" style={{ width: `${(opt.waste / mw) * 100}%` }}>
                                <span className="text-red-300 text-xs font-bold">LIVRE</span>
                              </div>
                            )}
                          </div>
                          {/* tabela */}
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="border-b border-zinc-700">
                                  <th className="text-left py-2 px-3 text-xs text-zinc-400 font-bold uppercase">#</th>
                                  <th className="text-left py-2 px-3 text-xs text-zinc-400 font-bold uppercase">Início</th>
                                  <th className="text-left py-2 px-3 text-xs text-zinc-400 font-bold uppercase">Corte</th>
                                  <th className="text-left py-2 px-3 text-xs text-zinc-400 font-bold uppercase">Fim</th>
                                  <th className="text-left py-2 px-3 text-xs text-zinc-400 font-bold uppercase">Produto</th>
                                  <th className="text-left py-2 px-3 text-xs text-zinc-400 font-bold uppercase">Peso est.</th>
                                </tr>
                              </thead>
                              <tbody>
                                {coords.map((c, i) => (
                                  <tr key={i} className="border-b border-zinc-800/60">
                                    <td className="py-2 px-3 text-zinc-400">{i + 1}</td>
                                    <td className="py-2 px-3 text-blue-400 font-mono text-xs">{c.start}mm</td>
                                    <td className="py-2 px-3 font-bold text-zinc-100">{c.width}mm</td>
                                    <td className="py-2 px-3 text-zinc-400 font-mono text-xs">{c.end}mm</td>
                                    <td className="py-2 px-3 text-zinc-300">{c.desc}</td>
                                    <td className="py-2 px-3 text-emerald-400 font-semibold text-xs">~{estWeight(c.width).toLocaleString()} kg</td>
                                  </tr>
                                ))}
                                {opt.waste > 0 && (
                                  <tr className="bg-red-950/20">
                                    <td className="py-2 px-3 text-red-400 font-bold">Ref</td>
                                    <td className="py-2 px-3 text-red-400 font-mono text-xs">{pos}mm</td>
                                    <td className="py-2 px-3 font-bold text-red-400">{opt.waste}mm</td>
                                    <td className="py-2 px-3 text-red-400 font-mono text-xs">{mw}mm</td>
                                    <td className="py-2 px-3 text-red-400 font-bold">SUCATA / SOBRA</td>
                                    <td className="py-2 px-3 text-red-400 text-xs">~{estWeight(opt.waste).toLocaleString()} kg</td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}

                {/* FILLER RESULTS */}
                {results.fillerAnalysis && (
                  <div className="bg-amber-950/20 border border-amber-800/50 rounded-2xl p-4">
                    <p className="text-xs text-amber-300 uppercase font-bold mb-3 flex items-center gap-2">
                      <Ruler className="w-3.5 h-3.5" /> Larguras complementares — produção estimada
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {Object.entries(results.fillerAnalysis).map(([width, data]) => (
                        <div key={width} className="bg-zinc-950/60 border border-amber-900/30 rounded-xl p-3">
                          <p className="text-amber-200 font-bold text-lg">{width}mm</p>
                          <p className="text-zinc-300 text-sm">{data.desc}</p>
                          <div className="mt-2 space-y-0.5">
                            <p className="text-xs text-zinc-400">Qtd: <span className="text-amber-300 font-semibold">{data.producedQty} bobinas</span></p>
                            <p className="text-xs text-zinc-400">Peso: <span className="text-amber-300 font-semibold">~{Math.round(data.producedWeight)} kg</span></p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  {!results.patternOptions && results.patterns.map((pattern, idx) => {
                    const visualMotherWidth = Number(motherWidth);
                    const patternEfficiency = ((pattern.usedWidth / visualMotherWidth) * 100).toFixed(1);
                    const uniqueCuts = [...new Set(pattern.cuts)];
                    return (
                      <div key={idx} className="bg-zinc-900/60 rounded-2xl border border-zinc-800 overflow-hidden shadow-sm">
                        <div className="bg-zinc-950 px-5 py-4 border-b border-zinc-800 flex justify-between items-center">
                          <div className="flex items-center gap-3">
                            <div className="bg-blue-600 text-white font-bold w-10 h-10 rounded-xl flex items-center justify-center text-lg">{idx + 1}</div>
                            <div>
                              <h4 className="font-bold text-zinc-50">Padrão {String.fromCharCode(65 + idx)}</h4>
                              <div className="text-sm text-zinc-400">
                                Executar em: <strong>{pattern.count} bobina(s)</strong><br />
                                <span className="text-xs bg-zinc-900 px-1 rounded border border-zinc-800">Pesos: {pattern.assignedCoils.map((c) => c.weight + "kg").join(", ")}</span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right flex flex-col items-end">
                            <div className={`text-sm font-bold px-2 py-0.5 rounded mb-1 ${Number(patternEfficiency) > 90 ? "bg-emerald-950/40 text-emerald-200 border border-emerald-900/60" : "bg-red-950/40 text-red-200 border border-red-900/60"}`}>
                              Efic: {patternEfficiency}%
                            </div>
                            <p className="text-xs text-zinc-500">Perda: {pattern.scrapWeight.toFixed(0)}kg</p>
                          </div>
                        </div>

                        <div className="p-5">
                          <div className="h-16 w-full bg-zinc-800 rounded-xl overflow-hidden flex border-2 border-zinc-700 relative">
                            {pattern.cuts.map((cut, i) => {
                              const colorIndex = uniqueCuts.indexOf(cut) % COLORS.length;
                              const widthPercent = (cut.width / visualMotherWidth) * 100;
                              return (
                                <div key={i} className={`${COLORS[colorIndex]} h-full border-r border-white/30 flex flex-col items-center justify-center text-white transition-all hover:brightness-110 cursor-help`}
                                  style={{ width: `${widthPercent}%` }} title={`${cut.width}mm`}>
                                  {widthPercent > 8 && <span className="font-bold text-sm">{cut.width}</span>}
                                </div>
                              );
                            })}
                            {visualMotherWidth - pattern.usedWidth > 0 && (
                              <div className="h-full bg-repeating-linear-stripes bg-red-950/30 flex items-center justify-center"
                                style={{ width: `${((visualMotherWidth - pattern.usedWidth) / visualMotherWidth) * 100}%` }}>
                                <span className="text-red-300 text-xs font-bold">LIVRE</span>
                              </div>
                            )}
                          </div>

                          <div className="mt-4">
                            <h5 className="text-sm font-bold text-zinc-200 mb-2 flex items-center gap-2"><Ruler className="w-4 h-4" />Mapa de Setup</h5>
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
                                  {pattern.setupCoordinates.map((setup, sIdx) => (
                                    <tr key={sIdx} className="border-t border-zinc-800">
                                      <td className="p-2 border-r border-zinc-800 font-bold text-zinc-500">{sIdx + 1}</td>
                                      <td className="p-2 border-r border-zinc-800 font-mono text-blue-300 font-bold">{setup.start} mm</td>
                                      <td className="p-2 border-r border-zinc-800 font-bold text-base text-zinc-50">{setup.width} mm</td>
                                      <td className="p-2 border-r border-zinc-800 font-mono text-zinc-300">{setup.end} mm</td>
                                      <td className="p-2 text-zinc-300 truncate max-w-[160px]">{setup.desc}</td>
                                    </tr>
                                  ))}
                                  {visualMotherWidth - pattern.usedWidth > 0 && (
                                    <tr className="border-t border-red-900/50 bg-red-950/30">
                                      <td className="p-2 border-r border-zinc-800 text-red-300 font-bold">Ref</td>
                                      <td className="p-2 border-r border-zinc-800 font-mono text-zinc-400">{pattern.usedWidth} mm</td>
                                      <td className="p-2 border-r border-zinc-800 font-bold text-red-200">{(visualMotherWidth - pattern.usedWidth).toFixed(1)} mm</td>
                                      <td className="p-2 border-r border-zinc-800 font-mono text-zinc-400">{visualMotherWidth} mm</td>
                                      <td className="p-2 text-red-200 font-bold text-xs uppercase">Sucata / Sobra</td>
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

            {cutMode === "longitudinal" && !results && !isCalculating && (
              <div className="h-full flex flex-col items-center justify-center text-zinc-500 bg-zinc-900/40 rounded-2xl border border-dashed border-zinc-800 p-12">
                <Scale className="w-16 h-16 mb-4 opacity-50" />
                <p>Insira demandas para calcular.</p>
              </div>
            )}
            {cutMode === "transversal" && !sheetResults && !isCalculating && (
              <div className="h-full flex flex-col items-center justify-center text-zinc-500 bg-zinc-900/40 rounded-2xl border border-dashed border-zinc-800 p-12">
                <Scale className="w-16 h-16 mb-4 opacity-50" />
                <p>Insira pecas para calcular.</p>
              </div>
            )}
          </div>
        </div>

        <footer className="pt-3 border-t border-zinc-800 text-center text-xs text-zinc-500">
          © {new Date().getFullYear()} SmartSlit — {userProfile?.companyName || ""}
        </footer>
      </div>

      {/* MODALS */}
      {showSaveModal && (
        <SavePlanModal
          defaultName={defaultPlanName()}
          onSave={handleSavePlan}
          onClose={() => setShowSaveModal(false)}
        />
      )}

      {showHistory && (
        <PlanHistory
          plans={plans}
          onDeletePlan={deletePlan}
          onLoadPlan={handleLoadPlan}
          onClose={() => setShowHistory(false)}
        />
      )}

      <style>{`
        .bg-repeating-linear-stripes {
          background-image: repeating-linear-gradient(45deg, transparent, transparent 5px, rgba(239,68,68,.18) 5px, rgba(239,68,68,.18) 10px);
        }
        @keyframes fade-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fade-in 0.4s ease-out forwards; }
      `}</style>
    </div>
  );
}
