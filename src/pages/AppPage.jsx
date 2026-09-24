import React, { useState, useEffect, useMemo } from "react";
import brandSymbol from "../assets/betini/betini-simbolo.svg";
import brandSymbolSvg from "../assets/betini/betini-simbolo.svg?raw";
import {
  Plus, Trash2, Calculator, Settings, Database,
  TrendingUp, Printer, AlertCircle, Box, Scale,
  Layers, Ruler, AlertTriangle, Save, FileDown, History,
} from "lucide-react";

import { parseCSV, DEFAULT_CSV_DATA } from "../utils/parseCSV";
import { calculateOptimization } from "../utils/optimizationEngine";
import { exportPlanToExcel } from "../utils/exportExcel";

import { useAuth } from "../contexts/AuthContext";
import { useProducts } from "../hooks/useProducts";
import { usePlans } from "../hooks/usePlans";

import UserMenu from "../components/UserMenu";
import CatalogManager from "../components/CatalogManager";
import SavePlanModal from "../components/SavePlanModal";
import PlanHistory from "../components/PlanHistory";
import StepRow from "../components/StepRow";
import RawMaterialStrip from "../components/RawMaterialStrip";

const printBrandHeader = `<header class="print-brand">${brandSymbolSvg}<div><small>BETINI STUDIO / Slitter</small><strong>Betini Slitter</strong></div></header>`;
const printBrandStyles = `<style>
.print-brand{display:flex;align-items:center;gap:14px;border-top:4px solid #ec3013;padding-top:16px;margin-bottom:24px}
.print-brand svg{width:56px;height:56px;flex-shrink:0}
.print-brand small{display:block;font:700 10px Arial,sans-serif;letter-spacing:2px;color:#ae1800}
.print-brand strong{display:block;font-size:26px;letter-spacing:-1px}
@media print{.print-brand,th,[style*="background"]{print-color-adjust:exact;-webkit-print-color-adjust:exact}thead{display:table-header-group}.card{break-inside:avoid}}
</style>`;

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

  const [results, setResults] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [isCalculating, setIsCalculating] = useState(false);
  const [showDb, setShowDb] = useState(false);
  const [weightAlert, setWeightAlert] = useState(null);
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
    if (selectedProductCode) {
      const stillValid = availableProducts.some((p) => p.code === selectedProductCode);
      if (!stillValid) setSelectedProductCode("");
    }
  }, [availableProducts, selectedProductCode]);

  // ---- HELPERS ----
  const totalStockWeight = useMemo(() => stockCoils.reduce((acc, c) => acc + c.weight, 0), [stockCoils]);

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
    setSuggestions([]);
    setWeightAlert(null);
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
      setSelectedPatternOption(res?.patternOptions?.length ? 0 : null);
      setIsCalculating(false);
    }, 600);
  };

  // ---- PRINT PATTERN OPTIONS ----
  const printPatternOptions = () => {
    if (!results?.patternOptions?.length) return;
    const win = window.open("", "_blank");
    if (!win) { alert("Permita pop-ups para imprimir."); return; }

    const PRINT_COLORS = ["#201e1d", "#33302e", "#4a4542", "#5f5955", "#6e6763"];

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
      const wasteBar = opt.waste > 0 ? `<div style="width:${wastePct}%;background:#f3f2f2;height:100%;display:flex;align-items:center;justify-content:center;">
        <span style="color:#ae1800;font-size:9px;font-weight:700;">${opt.waste}mm</span>
      </div>` : "";

      const pills = entries.map(([w, qty], i) =>
        `<span style="display:inline-block;background:${PRINT_COLORS[i % PRINT_COLORS.length]};color:#fff;padding:3px 10px;border-radius:0;font-size:12px;font-weight:700;margin:2px;">${qty}× ${w}mm</span>`
      ).join(" ");

      const effColor = Number(opt.efficiency) >= 97 ? "#201e1d" : Number(opt.efficiency) >= 90 ? "#ae1800" : "#ae1800";

      return `<div style="border:1px solid #d3d1d0;border-radius:0;margin-bottom:16px;overflow:hidden;page-break-inside:avoid;">
        <div style="background:#f3f2f2;padding:10px 14px;display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #d3d1d0;">
          <strong style="font-size:14px;">Opção ${idx + 1}</strong>
          <div style="display:flex;gap:12px;align-items:center;">
            <span style="color:${effColor};font-weight:800;font-size:15px;">${opt.efficiency}%</span>
            <span style="color:#5f5955;font-size:12px;">Sobra: ${opt.waste}mm</span>
          </div>
        </div>
        <div style="padding:12px;">
          <div style="height:36px;width:100%;background:#d3d1d0;border-radius:0;overflow:hidden;display:flex;margin-bottom:10px;">${bars}${wasteBar}</div>
          <div>${pills}</div>
          <table style="width:100%;margin-top:10px;font-size:11px;border-collapse:collapse;">
            <thead><tr style="background:#eae9e9;"><th style="padding:5px 8px;text-align:left;border-bottom:1px solid #d3d1d0;">Largura</th><th style="padding:5px 8px;text-align:left;border-bottom:1px solid #d3d1d0;">Qtd</th><th style="padding:5px 8px;text-align:left;border-bottom:1px solid #d3d1d0;">Ocupação</th></tr></thead>
            <tbody>${entries.map(([w, qty]) => `<tr><td style="padding:5px 8px;border-bottom:1px solid #eae9e9;">${w}mm</td><td style="padding:5px 8px;border-bottom:1px solid #eae9e9;">${qty}</td><td style="padding:5px 8px;border-bottom:1px solid #eae9e9;">${(Number(w) * qty / mw * 100).toFixed(1)}%</td></tr>`).join("")}
            <tr style="background:#f3f2f2;"><td style="padding:5px 8px;font-weight:700;color:#ae1800;">SUCATA</td><td style="padding:5px 8px;">—</td><td style="padding:5px 8px;font-weight:700;color:#ae1800;">${opt.waste}mm (${(opt.waste/mw*100).toFixed(1)}%)</td></tr>
            </tbody>
          </table>
        </div>
      </div>`;
    }).join("");

    const fillerList = fillerWidths.length > 0
      ? `Larguras complementares: ${fillerWidths.map(f => f.width + "mm").join(", ")}`
      : "";

    win.document.write(`<html lang="pt-BR"><head><meta charset="UTF-8">${printBrandStyles}<title>Betini Slitter | Variações de Corte</title>
    <style>
      body{font-family:Archivo,Arial,sans-serif;padding:32px;color:#201e1d;max-width:900px;margin:auto}
      h1{font-size:20px;border-bottom:2px solid #201e1d;padding-bottom:8px;margin-bottom:6px}
      .meta{font-size:12px;color:#5f5955;margin-bottom:20px}
      .print-btn{position:fixed;bottom:18px;right:18px;background:#ec3013;color:#fff;padding:10px 18px;border-radius:0;font-weight:700;text-decoration:none;cursor:pointer;border:none;font-size:14px;}
      @media print{.print-btn{display:none}body{padding:12px}}
    </style>
    </head><body>
      <h1>Betini Slitter — Variações de Padrão de Corte</h1>
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

    const PRINT_COLORS = ["#201e1d", "#33302e", "#4a4542", "#5f5955", "#6e6763"];
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
    const wasteBar = opt.waste > 0 ? `<div style="width:${wastePct}%;background:#f3f2f2;height:100%;display:flex;align-items:center;justify-content:center;"><span style="color:#ae1800;font-size:10px;font-weight:700;">${opt.waste}mm</span></div>` : "";

    const avgCWp = stockCoils.length > 0 ? stockCoils.reduce((a, c) => a + c.weight, 0) / stockCoils.length : 10000;
    const grossWp = Math.max(1, Number(motherWidth));
    const estWp = (w) => Math.round((Number(w) / grossWp) * avgCWp);
    const rows = coords.map((c, i) =>
      `<tr><td>${i+1}</td><td style="color:#201e1d;font-weight:600;">${c.start}mm</td><td style="font-weight:800;font-size:14px;">${c.width}mm</td><td>${c.end}mm</td><td>${c.desc}</td><td style="color:#201e1d;font-weight:600;">~${estWp(c.width).toLocaleString()} kg</td></tr>`
    ).join("");
    const scrapRow = opt.waste > 0
      ? `<tr style="background:#f3f2f2;color:#ae1800;font-weight:700;"><td>Ref</td><td>${pos}mm</td><td>${opt.waste}mm</td><td>${mw}mm</td><td>SUCATA / SOBRA</td><td>~${estWp(opt.waste).toLocaleString()} kg</td></tr>`
      : "";

    const effColor = Number(opt.efficiency) >= 97 ? "#201e1d" : Number(opt.efficiency) >= 90 ? "#ae1800" : "#ae1800";
    win.document.write(`<html lang="pt-BR"><head><meta charset="UTF-8">${printBrandStyles}<title>Betini Slitter | Opção ${idx+1}</title>
    <style>
      body{font-family:Archivo,Arial,sans-serif;padding:32px;color:#201e1d;max-width:800px;margin:auto}
      h1{font-size:20px;border-bottom:2px solid #201e1d;padding-bottom:8px;margin-bottom:6px}
      .meta{font-size:12px;color:#5f5955;margin-bottom:20px}
      table{width:100%;border-collapse:collapse;font-size:13px;margin-top:16px}
      th,td{padding:9px 10px;border-bottom:1px solid #d3d1d0;text-align:left}
      th{background:#eae9e9;font-size:11px;text-transform:uppercase;color:#5f5955}
      .print-btn{position:fixed;bottom:18px;right:18px;background:#ec3013;color:#fff;padding:10px 18px;border-radius:0;font-weight:700;cursor:pointer;border:none;font-size:14px;}
      @media print{.print-btn{display:none}body{padding:12px}}
    </style></head><body>
      <h1>Betini Slitter — Padrão de Corte · Opção ${idx+1}</h1>
      <div class="meta">
        Data: ${new Date().toLocaleString("pt-BR")} &nbsp;|&nbsp;
        Empresa: ${userProfile?.companyName || "—"} &nbsp;|&nbsp;
        Bobina mãe: ${motherWidth}mm &nbsp;|&nbsp;
        Material: ${coilType} ${coilThickness}mm &nbsp;|&nbsp;
        Refilo: ${trim}mm
      </div>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
        <strong style="font-size:16px;">Eficiência: <span style="color:${effColor}">${opt.efficiency}%</span></strong>
        <span style="color:#5f5955;font-size:13px;">Sucata: ${opt.waste}mm</span>
      </div>
      <div style="height:44px;width:100%;background:#d3d1d0;border-radius:0;overflow:hidden;display:flex;margin-bottom:20px;">${bars}${wasteBar}</div>
      <table>
        <thead><tr><th>#</th><th>Início</th><th>Corte</th><th>Fim</th><th>Produto</th><th>Peso est.</th></tr></thead>
        <tbody>${rows}${scrapRow}</tbody>
      </table>
      <button class="print-btn" onclick="window.print()">🖨️ Imprimir / Salvar PDF</button>
    </body></html>`);
    win.document.close();
  };

  // ---- PDF REPORT ----
  const generateReport = () => {
    if (!results) return;
    const reportWindow = window.open("", "_blank");
    if (!reportWindow) { alert("Permita pop-ups para gerar o relatório."); return; }

    const styles = `<style>
      body{font-family:Archivo,Arial,sans-serif;padding:40px;color:#201e1d}
      h1{font-size:22px;border-bottom:2px solid #201e1d;padding-bottom:8px;margin-bottom:18px}
      .header-info{display:flex;flex-wrap:wrap;gap:12px;margin-bottom:24px;background:#f3f2f2;padding:12px;border-radius:0}
      .header-item{font-size:13px}.header-item strong{display:block;font-size:10px;color:#5f5955;text-transform:uppercase}
      .card{border:1px solid #d3d1d0;border-radius:0;margin-bottom:18px;overflow:hidden}
      .card-header{background:#eae9e9;padding:10px 12px;display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #d3d1d0}
      .pattern-title{font-weight:700;font-size:15px}
      table{width:100%;border-collapse:collapse;font-size:12px}
      th,td{padding:8px;border-bottom:1px solid #d3d1d0}
      .scrap-row{color:#ae1800;font-weight:700;background:#f3f2f2}
      .total-summary{margin-top:28px;border-top:2px solid #201e1d;padding-top:14px;display:flex;gap:16px}
      .summary-box{text-align:center;min-width:120px}
      .summary-val{font-size:20px;font-weight:800}
      .summary-label{font-size:11px;color:#5f5955;text-transform:uppercase}
      .print-btn{position:fixed;bottom:18px;right:18px;background:#ec3013;color:#fff;padding:10px 18px;border-radius:0;font-weight:700;text-decoration:none}
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

    const summary = `<div class="total-summary"><div class="summary-box"><div class="summary-label">Total Bobinas</div><div class="summary-val">${results.stats.totalCoils}</div></div><div class="summary-box"><div class="summary-label">Eficiência</div><div class="summary-val">${results.stats.efficiency}%</div></div><div class="summary-box"><div class="summary-label" style="color:#ae1800">Sucata</div><div class="summary-val" style="color:#ae1800">${results.stats.totalScrapWeight}kg</div></div></div>`;

    reportWindow.document.write(`<html lang="pt-BR"><head><meta charset="UTF-8">${printBrandStyles}<title>Betini Slitter | Ordem de Produção</title>${styles}</head><body>${printBrandHeader}<h1>Ordem de Produção</h1>${header}${cards}${summary}<a href="#" onclick="window.print();return false;" class="print-btn">🖨️ Imprimir / Salvar PDF</a></body></html>`);
    reportWindow.document.close();
  };

  // ---- SAVE PLAN (cloud) ----
  const handleSavePlan = async (name) => {
    if (!results) return;
    const machineConfig = { motherWidth, trim, coilThickness, coilType, stockCoils };
    await savePlan(name, "longitudinal", machineConfig, demands, results);
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
  };

  return (
    <div className="min-h-screen bg-paper text-ink p-3 md:p-5 font-sans">
      <div className="max-w-7xl mx-auto space-y-5">

        {/* HEADER */}
        <header className="sticky top-0 z-20 -mx-3 md:-mx-5 bg-paper/95 backdrop-blur border-t-4 border-t-accent border-b border-b-divider">
        <div className="px-4 py-4 md:px-6 md:py-5 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-3">
          <div className="flex items-center gap-3 md:gap-4">
            <img src={brandSymbol} alt="" className="w-14 h-14 md:w-16 md:h-16 shrink-0" />
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-accent-700">Betini Studio / Slitter</p>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Betini Slitter</h1>
              <p className="text-ink-soft mt-1 text-xs md:text-sm">Planejamento de corte longitudinal</p>
            </div>
          </div>

          <div className="flex w-full xl:w-auto gap-2 flex-wrap">
            <button
              onClick={() => setShowDb(!showDb)}
              className="btn-quiet text-sm"
            >
              <Database className="w-4 h-4" />
              {showDb ? "Ocultar Catálogo" : "Ver Catálogo"}
              {cloudProducts && cloudProducts.length > 0 && (
                <span className="w-1.5 h-1.5 rounded-full bg-accent ml-1" title="Catálogo da nuvem ativo" />
              )}
            </button>

            <button
              onClick={() => setShowHistory(true)}
              className="btn-quiet text-sm"
            >
              <History className="w-4 h-4" />
              Histórico
              {plans.length > 0 && (
                <span className="text-xs bg-paper-2 text-ink-soft border border-divider px-1.5 py-0.5 rounded-full">{plans.length}</span>
              )}
            </button>

            {results && (
              <>
                <button
                  onClick={() => setShowSaveModal(true)}
                  className="btn-primary text-sm"
                >
                  <Save className="w-4 h-4" />
                  Salvar Plano
                </button>
                <button
                  onClick={() => exportPlanToExcel(results, { motherWidth, trim, coilThickness, coilType, stockCoils }, userProfile?.companyName)}
                  className="btn-quiet text-sm"
                >
                  <FileDown className="w-4 h-4" />
                  Excel
                </button>
                <button
                  onClick={generateReport}
                  className="btn-quiet text-sm"
                >
                  <Printer className="w-4 h-4" />
                  PDF
                </button>
              </>
            )}

            <UserMenu />
          </div>
        </div>

        {/* INSTRUMENT STRIP — dense readouts, always visible */}
        <div className="px-4 md:px-6 py-2.5 border-t border-divider flex items-center gap-6 md:gap-10 overflow-x-auto">
          <div className="flex items-baseline gap-2 flex-none">
            <span className="text-[10px] text-ink-faint uppercase tracking-wide font-bold">Eficiência</span>
            <span className={`text-lg font-extrabold tabular-nums ${results ? (results.stats.efficiency >= 97 ? "text-ink" : "text-accent-700") : "text-ink-faint"}`}>
              {results ? `${results.stats.efficiency}%` : "—"}
            </span>
          </div>
          <div className="flex items-baseline gap-2 flex-none">
            <span className="text-[10px] text-ink-faint uppercase tracking-wide font-bold">Sucata</span>
            <span className="text-lg font-extrabold tabular-nums text-ink">
              {results ? `${results.stats.totalScrapWeight}kg` : "—"}
            </span>
          </div>
          <div className="flex items-baseline gap-2 flex-none">
            <span className="text-[10px] text-ink-faint uppercase tracking-wide font-bold">Bobinas</span>
            <span className="text-lg font-extrabold tabular-nums text-ink">
              {results ? results.stats.totalCoils : "—"}
            </span>
          </div>
        </div>
        </header>

        {/* SAVE STATUS TOAST */}
        {saveStatus && (
          <div className="callout-ink text-ink text-sm text-center animate-fade-in">
            {saveStatus}
          </div>
        )}

        {/* MIGRATION BANNER */}
        {showMigrationBanner && (
          <div className="callout-ink flex items-start justify-between gap-3">
            <div>
              <p className="text-ink text-sm font-medium">
                Encontramos um preset salvo localmente. Deseja importar suas configurações?
              </p>
            </div>
            <div className="flex gap-2 shrink-0">
              <button
                onClick={() => { loadPreset(); setShowMigrationBanner(false); }}
                className="btn-ink text-xs py-1.5"
              >
                Importar
              </button>
              <button
                onClick={() => { localStorage.removeItem(PRESET_STORAGE_KEY); setShowMigrationBanner(false); }}
                className="btn-quiet text-xs py-1.5"
              >
                Ignorar
              </button>
            </div>
          </div>
        )}

        {/* WEIGHT ALERT */}
        {weightAlert && (
          <div className="callout-accent flex items-start gap-3 animate-fade-in">
            <AlertTriangle className="w-6 h-6 text-accent-700 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-bold text-ink text-lg">Demanda excede estoque</h3>
              <p className="text-ink font-medium">{weightAlert.msg}</p>
              <p className="text-ink-soft text-sm mt-1">{weightAlert.subMsg}</p>
            </div>
          </div>
        )}

        {/* CATALOG MANAGER */}
        {showDb && (
          <CatalogManager companyId={companyId} activeDb={activeDb} />
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

          {/* LEFT PANEL */}
          <div className="lg:col-span-4 space-y-4">

            {/* PASSO 1 — MÁQUINA */}
            <div className="panel">
              <div className="panel-head">
                <span className="step-badge">1</span>
                <Settings className="w-4 h-4 text-ink-soft" />
                <h2 className="font-semibold text-ink">Configuração da Máquina</h2>
              </div>

              <div className="p-4 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="field-label">Largura (mm)</label>
                    <input type="number" value={motherWidth} onChange={(e) => setMotherWidth(e.target.value === "" ? "" : parseFloat(e.target.value))} className="field-input font-mono text-lg" />
                  </div>
                  <div>
                    <label className="field-label">Refilo (mm)</label>
                    <input type="number" value={trim} onChange={(e) => setTrim(e.target.value === "" ? "" : parseFloat(e.target.value))} className="field-input" />
                  </div>
                </div>

                <div className="bg-paper-2 p-3 border border-divider">
                  <div className="flex justify-between items-center mb-2">
                    <label className="field-label mb-0">Estoque de Bobinas (kg)</label>
                    <button onClick={addStockCoil} className="text-accent-700 hover:text-accent text-xs font-bold flex items-center gap-1">
                      <Plus className="w-3 h-3" /> Add Bobina
                    </button>
                  </div>
                  <div className="max-h-[120px] overflow-y-auto space-y-2">
                    {stockCoils.map((coil, idx) => (
                      <div key={coil.id} className="flex items-center gap-2">
                        <span className="text-xs text-ink-faint font-mono w-4">{idx + 1}.</span>
                        <div className="relative flex-1">
                          <input type="number" value={coil.weight} onChange={(e) => updateStockCoil(coil.id, e.target.value)} className="field-input text-sm pr-8" />
                          <span className="absolute right-2 top-2 text-xs text-ink-faint">kg</span>
                        </div>
                        <button onClick={() => removeStockCoil(coil.id)} className="text-accent-700 hover:text-accent p-1"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    ))}
                  </div>
                  <div className="mt-2 text-right text-xs text-ink-soft font-bold">Total: {totalStockWeight.toLocaleString()} kg</div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="field-label">Tipo Material</label>
                    <input
                      list="material-types-list"
                      value={coilType}
                      onChange={(e) => setCoilType(e.target.value.toUpperCase())}
                      placeholder="ex: BQ, BZ..."
                      className="field-input font-bold"
                    />
                    <datalist id="material-types-list">
                      {availableTypes.map((t) => <option key={t} value={t} />)}
                    </datalist>
                  </div>
                  <div>
                    <label className="field-label">Espessura (mm)</label>
                    <input type="number" step="0.01" value={coilThickness} onChange={(e) => setCoilThickness(e.target.value === "" ? "" : parseFloat(e.target.value))} className="field-input font-bold" />
                  </div>
                </div>

                <div className="callout-ink text-xs text-ink text-center">
                  Largura útil: <strong>{(Number(motherWidth) || 0) - (Number(trim) || 0)} mm</strong>
                </div>
              </div>
            </div>

            {/* PASSO 2 — PEDIDOS */}
            <div className="panel">
              <div className="panel-head">
                <span className="step-badge">2</span>
                <Box className="w-4 h-4 text-ink-soft" />
                <h2 className="font-semibold text-ink">Pedidos</h2>
              </div>

              <div className="p-4 space-y-3">
                {/* Toggles numa linha só */}
                <div className="flex gap-2">
                  <div className="segmented flex-1">
                    <button
                      onClick={() => setDemandInputMode("catalog")}
                      className={`segmented-option ${demandInputMode === "catalog" ? "active" : ""}`}
                    >
                      Catálogo
                    </button>
                    <button
                      onClick={() => setDemandInputMode("manual")}
                      className={`segmented-option ${demandInputMode === "manual" ? "active" : ""}`}
                    >
                      Manual
                    </button>
                  </div>
                  <div className="segmented flex-1">
                    <button
                      onClick={() => setDemandWeightMode("kg")}
                      className={`segmented-option ${demandWeightMode === "kg" ? "active" : ""}`}
                    >
                      Por Kg
                    </button>
                    <button
                      onClick={() => setDemandWeightMode("qty")}
                      className={`segmented-option ${demandWeightMode === "qty" ? "active" : ""}`}
                    >
                      Por Qtd
                    </button>
                  </div>
                </div>

                {/* Inputs */}
                <div className="flex flex-col gap-3">
                  {demandInputMode === "catalog" ? (
                    <>
                      <div className="w-full">
                        <label className="field-label">
                          Produto — {coilType} {Number(coilThickness).toFixed(2)}mm
                        </label>
                        <select value={selectedProductCode} onChange={(e) => setSelectedProductCode(e.target.value)} className="field-input text-sm">
                          <option value="">Selecione um produto...</option>
                          {availableProducts.length === 0
                            ? <option disabled>Nenhum produto para {coilType} {coilThickness}mm</option>
                            : availableProducts.map((p) => <option key={p.code} value={p.code}>{p.width}mm — {p.desc}</option>)
                          }
                        </select>
                      </div>
                      <div className="flex gap-2 items-end">
                        <div className="flex-1">
                          {demandWeightMode === "kg" ? (
                            <>
                              <label className="field-label">Peso (kg)</label>
                              <input type="number" placeholder="ex: 3000" value={newWeight} onChange={(e) => setNewWeight(e.target.value)} className="field-input text-sm" />
                            </>
                          ) : (
                            <>
                              <label className="field-label">Qtd. de bobinas filhas</label>
                              <input type="number" min="1" placeholder="ex: 10" value={catalogQty} onChange={(e) => setCatalogQty(e.target.value)} className="field-input text-sm" />
                            </>
                          )}
                        </div>
                        <button
                          onClick={addDemand}
                          disabled={!selectedProductCode || (demandWeightMode === "kg" ? !newWeight : !catalogQty)}
                          className="btn-primary h-[40px] w-12"
                        >
                          <Plus className="w-5 h-5" />
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <label className="field-label">Largura (mm)</label>
                          <input
                            type="number"
                            placeholder="ex: 250"
                            value={manualWidth}
                            onChange={(e) => setManualWidth(e.target.value)}
                            className="field-input text-sm"
                          />
                        </div>
                        <div className="flex-1">
                          {demandWeightMode === "kg" ? (
                            <>
                              <label className="field-label">Peso (kg)</label>
                              <input type="number" placeholder="ex: 3000" value={manualWeight} onChange={(e) => setManualWeight(e.target.value)} className="field-input text-sm" />
                            </>
                          ) : (
                            <>
                              <label className="field-label">Qtd. de bobinas</label>
                              <input type="number" min="1" placeholder="ex: 10" value={manualQty} onChange={(e) => setManualQty(e.target.value)} className="field-input text-sm" />
                            </>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2 items-end">
                        <div className="flex-1">
                          <label className="field-label">Descrição (opcional)</label>
                          <input
                            type="text"
                            placeholder="ex: Tampa lateral"
                            value={manualDesc}
                            onChange={(e) => setManualDesc(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && addManualDemand()}
                            className="field-input text-sm"
                          />
                        </div>
                        <button
                          onClick={addManualDemand}
                          disabled={!manualWidth || (demandWeightMode === "kg" ? !manualWeight : !manualQty)}
                          className="btn-primary h-[40px] w-12"
                        >
                          <Plus className="w-5 h-5" />
                        </button>
                      </div>
                    </>
                  )}
                </div>

                {/* Lista de pedidos */}
                <div className="max-h-[240px] overflow-y-auto space-y-2">
                  {demands.length === 0 && <p className="text-center text-ink-faint text-sm py-3">Nenhum pedido adicionado.</p>}
                  {demands.map((item) => {
                    const isManual = item.code === "MAN";
                    return (
                      <div key={item.id} className="flex items-center justify-between p-2 bg-paper-2 border border-divider">
                        <div className="flex flex-col max-w-[80%]">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-ink">{item.width}mm</span>
                            <span className="text-[10px] px-1 border border-divider bg-paper text-ink-soft truncate">
                              {isManual ? "manual" : item.desc}
                            </span>
                          </div>
                          {isManual && item.desc && item.desc !== `${item.width}mm manual` && (
                            <span className="text-ink-soft text-xs">{item.desc}</span>
                          )}
                          {item.targetQty != null
                            ? <span className="text-ink-soft text-xs font-semibold">Qtd: {item.targetQty} bobina{item.targetQty !== 1 ? "s" : ""}</span>
                            : <span className="text-ink-soft text-xs">Meta: {item.targetWeight?.toFixed(0)} kg</span>
                          }
                        </div>
                        <button onClick={() => removeDemand(item.id)} className="text-accent-700 hover:text-accent p-1"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    );
                  })}
                </div>

                {/* Larguras complementares — dentro do card */}
                <details className="group">
                  <summary className="flex items-center gap-2 cursor-pointer text-xs text-ink-soft hover:text-ink transition select-none py-1">
                    <Ruler className="w-3.5 h-3.5 text-accent-700/70" />
                    <span>Larguras para complementar sobras</span>
                    <span className="ml-auto text-ink-faint group-open:rotate-180 transition-transform">▾</span>
                    {fillerWidths.length > 0 && (
                      <span className="bg-paper-2 text-ink-soft border border-divider text-[10px] px-1.5 py-0.5 rounded-full font-bold">{fillerWidths.length}</span>
                    )}
                  </summary>
                  <div className="mt-2 space-y-2 pt-2 border-t border-divider">
                    <div className="flex gap-2">
                      <input
                        type="number"
                        placeholder="Largura mm"
                        value={newFillerWidth}
                        onChange={(e) => setNewFillerWidth(e.target.value)}
                        className="field-input w-28 text-sm"
                      />
                      <input
                        type="text"
                        placeholder="Descrição (opcional)"
                        value={newFillerDesc}
                        onChange={(e) => setNewFillerDesc(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key !== "Enter") return;
                          const w = parseFloat(newFillerWidth);
                          if (!w) return;
                          setFillerWidths((prev) => [...prev, { id: Date.now(), width: w, desc: newFillerDesc.trim() || `${w}mm` }]);
                          setNewFillerWidth(""); setNewFillerDesc(""); setResults(null);
                        }}
                        className="field-input flex-1 text-sm"
                      />
                      <button
                        onClick={() => {
                          const w = parseFloat(newFillerWidth);
                          if (!w) return;
                          setFillerWidths((prev) => [...prev, { id: Date.now(), width: w, desc: newFillerDesc.trim() || `${w}mm` }]);
                          setNewFillerWidth(""); setNewFillerDesc(""); setResults(null);
                        }}
                        disabled={!newFillerWidth}
                        className="btn-ink h-[40px] w-10"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    {fillerWidths.length === 0 ? (
                      <p className="text-ink-faint text-xs text-center py-1">Nenhuma adicionada ainda.</p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {fillerWidths.map((fw) => (
                          <div key={fw.id} className="flex items-center gap-1 bg-paper-2 border border-divider px-2 py-1">
                            <span className="text-ink-soft text-xs font-bold">{fw.width}mm</span>
                            {fw.desc !== `${fw.width}mm` && <span className="text-ink-faint text-[10px]">{fw.desc}</span>}
                            <button
                              onClick={() => { setFillerWidths((prev) => prev.filter((f) => f.id !== fw.id)); setResults(null); }}
                              className="text-accent-700 hover:text-accent ml-1"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </details>
              </div>

              {/* PASSO 3 — GERAR PLANO */}
              <div className="px-4 pb-4 pt-3 bg-paper-2 border-t border-divider">
                <div className="flex items-center gap-2 mb-2">
                  <span className="step-badge">3</span>
                  <span className="text-xs text-ink-soft font-semibold uppercase tracking-wide">Gerar o plano de corte</span>
                </div>
                <button
                  onClick={runCalculateOptimization}
                  disabled={demands.length === 0 || isCalculating}
                  className="btn-primary w-full py-3 text-lg"
                >
                  {isCalculating ? "Calculando..." : <><Calculator className="w-5 h-5" /> Gerar Plano</>}
                </button>
              </div>
            </div>

            {/* Ações secundárias */}
            <div className="flex items-center gap-4 px-1 text-xs text-ink-faint flex-wrap">
              <button onClick={loadDemoPlan} className="hover:text-ink-soft transition">Carregar demo</button>
              <button onClick={savePreset} className="hover:text-ink-soft transition">Salvar configuração</button>
              {hasSavedPreset && <button onClick={loadPreset} className="hover:text-ink-soft transition">Restaurar</button>}
              <button onClick={clearAll} className="hover:text-accent-700 transition ml-auto">Limpar tudo</button>
              {presetStatus && <span className="text-ink-faint w-full">{presetStatus}</span>}
            </div>

          </div>

          {/* RIGHT PANEL */}
          <div className="lg:col-span-8 space-y-5">

            {/* MATÉRIA-PRIMA — sempre visível, mostra o que tem no estoque e o que já foi usado */}
            <RawMaterialStrip stockCoils={stockCoils} patterns={results?.patterns} />

            {/* LONGITUDINAL SUGGESTIONS */}
            {suggestions.length > 0 && (
              <div className="panel p-5 animate-fade-in">
                <div className="flex items-start gap-4">
                  <div className="bg-paper-2 p-3"><Layers className="w-6 h-6 text-accent-700" /></div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-ink">Sugestões de Combinação (Meta &gt; 97%)</h3>
                    <p className="text-ink-soft text-sm mb-3">Combos pra preencher as sobras e subir eficiência.</p>
                    <div className="space-y-6">
                      {suggestions.map((sug, idx) => (
                        <div key={idx} className="bg-paper-2 p-4 border border-divider">
                          <div className="flex justify-between items-center mb-3 border-b border-divider pb-2">
                            <p className="text-xs font-bold text-ink-soft uppercase">
                              Padrão {String.fromCharCode(65 + sug.patternIndex)} - Sobra: <span className="text-accent-700">{sug.waste}mm</span>
                            </p>
                            <span className="text-xs bg-paper px-2 py-1 text-ink-soft border border-divider">Preenche {sug.patternCount} bobinas</span>
                          </div>
                          <div className="grid grid-cols-1 gap-3">
                            {sug.suggestions.map((combo, cIdx) => (
                              <div key={cIdx} className="flex flex-col bg-paper p-3 border border-divider hover:border-ink-soft transition-colors">
                                <div className="flex justify-between items-center mb-2">
                                  <div className="flex items-center gap-2">
                                    <div className="flex -space-x-2">
                                      {combo.items.map((it, i) => (
                                        <div key={i} className="w-8 h-8 rounded-full bg-ink border-2 border-paper flex items-center justify-center text-[10px] font-bold text-paper z-10" title={it.desc}>{it.width}</div>
                                      ))}
                                    </div>
                                    <span className="text-sm font-bold text-ink ml-2">= {combo.totalWidth}mm</span>
                                    <span className="text-xs text-ink-soft bg-paper-2 px-2 py-0.5 font-medium border border-divider">Resto: {combo.remainingWaste}mm</span>
                                  </div>
                                  <span className={`text-xs px-2 py-1 font-bold border ${combo.projectedEfficiency >= 97 ? "bg-paper-2 text-ink border-divider" : "bg-paper-2 text-accent-700 border-accent/30"}`}>
                                    Eficiência: {combo.projectedEfficiency.toFixed(2)}%
                                  </span>
                                </div>
                                <div className="text-xs text-ink-soft mb-2 space-y-1 pl-2 border-l-2 border-divider">
                                  {combo.items.map((it, i) => (
                                    <div key={i} className="flex justify-between">
                                      <span>1x {it.desc} ({it.width}mm)</span>
                                      <span className="text-ink-faint">+{Math.round(it.weightToAdd)}kg</span>
                                    </div>
                                  ))}
                                </div>
                                <button onClick={() => addComboDemand(combo.items)} className="btn-ink w-full text-xs">
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
            {results && results.stats.efficiency < 97 && suggestions.length === 0 && (
              <div className="panel p-6 text-center animate-fade-in">
                <AlertCircle className="w-8 h-8 text-ink-faint mx-auto mb-2" />
                <p className="text-ink font-medium">Nenhuma sugestão automática encontrada.</p>
                <p className="text-xs text-ink-soft mt-1">Não encontramos produtos com espessura {coilThickness}mm e tipo {coilType}.</p>
              </div>
            )}

            {/* LONGITUDINAL RESULTS */}
            {results && (
              <div className="animate-fade-in space-y-5">
                {/* STATUS PEDIDOS — eficiência/sucata/bobinas já ficam na tira de instrumento do topo */}
                <div className="bg-paper-2 p-4 border border-divider">
                  <p className="text-xs text-ink-soft uppercase font-bold mb-2">Status dos Pedidos</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6">
                    {Object.entries(results.demandAnalysis).map(([demandId, data]) => (
                      <div key={demandId} className="flex justify-between text-xs border-b border-divider py-1.5">
                        <span className="text-ink-soft">{data.width}mm{data.desc ? ` — ${data.desc}` : ""}:</span>
                        {data.isQtyMode
                          ? <span className={data.producedQty >= data.reqQty ? "text-ink font-semibold" : "text-accent-700 font-semibold"}>
                              {data.producedQty}/{data.reqQty} bob.
                            </span>
                          : <span className={data.producedWeight >= data.reqWeight ? "text-ink font-semibold" : "text-accent-700 font-semibold"}>
                              {Math.round(data.producedWeight)}/{data.reqWeight.toFixed(0)}kg
                            </span>
                        }
                      </div>
                    ))}
                  </div>
                </div>

                {/* PATTERN BANKS — instrumento: fileira de abas + uma leitura grande */}
                {results.patternOptions && results.patternOptions.length > 0 && (
                  <div className="panel">
                    <div className="panel-head justify-between">
                      <div className="flex items-center gap-2">
                        <Layers className="w-4 h-4 text-ink-soft" />
                        <h3 className="font-semibold text-ink">Bancos de padrão</h3>
                        <span className="text-[10px] text-ink-faint ml-1 hidden sm:inline">mesma bobina mãe, combinações diferentes</span>
                      </div>
                      <button onClick={printPatternOptions} className="btn-quiet text-xs py-1.5">
                        <Printer className="w-3.5 h-3.5" />
                        Imprimir todas
                      </button>
                    </div>

                    {/* fileira de bancos */}
                    <div className="flex overflow-x-auto border-b border-divider">
                      {results.patternOptions.map((opt, idx) => {
                        const isSelected = selectedPatternOption === idx;
                        return (
                          <button
                            key={idx}
                            onClick={() => setSelectedPatternOption(idx)}
                            className={`flex-none px-4 py-2.5 text-sm font-bold border-r border-divider transition ${isSelected ? "bg-ink text-paper" : "bg-paper text-ink-soft hover:bg-paper-2"}`}
                          >
                            {String.fromCharCode(65 + idx)} <span className={isSelected ? "text-paper/70" : "text-ink-faint"}>·</span>{" "}
                            <span className={Number(opt.efficiency) >= 97 ? "" : isSelected ? "text-accent" : "text-accent-700"}>{opt.efficiency}%</span>
                          </button>
                        );
                      })}
                    </div>

                    {/* leitura do banco selecionado */}
                    {selectedPatternOption !== null && results.patternOptions[selectedPatternOption] && (() => {
                      const opt = results.patternOptions[selectedPatternOption];
                      const entries = Object.entries(opt.counts);
                      const allWidthDescMap = {};
                      demands.forEach((d) => { allWidthDescMap[d.width] = d.desc || `${d.width}mm`; });
                      fillerWidths.forEach((fw) => { allWidthDescMap[fw.width] = fw.desc || `${fw.width}mm`; });
                      let pos = 0;
                      const coords = [];
                      entries.forEach(([w, qty]) => {
                        for (let i = 0; i < qty; i++) {
                          coords.push({ start: pos, width: Number(w), end: pos + Number(w), desc: allWidthDescMap[Number(w)] || `${w}mm` });
                          pos += Number(w);
                        }
                      });
                      const mw = Number(motherWidth);
                      const avgCW = stockCoils.length > 0 ? stockCoils.reduce((a, c) => a + c.weight, 0) / stockCoils.length : 10000;
                      // peso proporcional à largura BRUTA da bobina — o refilo é sucata real, não pode sumir da conta
                      const estWeight = (w) => Math.round((Number(w) / mw) * avgCW);

                      return (
                        <div className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-bold text-ink text-sm">
                              Mapa de Setup — Banco {String.fromCharCode(65 + selectedPatternOption)}
                            </h4>
                            <button
                              onClick={() => printSinglePatternOption(opt, selectedPatternOption)}
                              className="btn-quiet text-xs py-1.5"
                            >
                              <Printer className="w-3.5 h-3.5" /> Imprimir este banco
                            </button>
                          </div>
                          <StepRow segments={entries.map(([w, qty]) => ({ width: Number(w) * Number(qty), label: `${qty}×${w}mm` }))} totalWidth={mw} wasteWidth={opt.waste} height="h-14" />
                          <div className="overflow-x-auto mt-4">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="border-b border-divider">
                                  <th className="text-left py-2 px-3 text-xs text-ink-soft font-bold uppercase">#</th>
                                  <th className="text-left py-2 px-3 text-xs text-ink-soft font-bold uppercase">Início</th>
                                  <th className="text-left py-2 px-3 text-xs text-ink-soft font-bold uppercase">Corte</th>
                                  <th className="text-left py-2 px-3 text-xs text-ink-soft font-bold uppercase">Fim</th>
                                  <th className="text-left py-2 px-3 text-xs text-ink-soft font-bold uppercase">Produto</th>
                                  <th className="text-left py-2 px-3 text-xs text-ink-soft font-bold uppercase">Peso est.</th>
                                </tr>
                              </thead>
                              <tbody>
                                {coords.map((c, i) => (
                                  <tr key={i} className="border-b border-divider/60">
                                    <td className="py-2 px-3 text-ink-soft">{i + 1}</td>
                                    <td className="py-2 px-3 text-ink-soft font-mono text-xs">{c.start}mm</td>
                                    <td className="py-2 px-3 font-bold text-ink">{c.width}mm</td>
                                    <td className="py-2 px-3 text-ink-soft font-mono text-xs">{c.end}mm</td>
                                    <td className="py-2 px-3 text-ink-soft">{c.desc}</td>
                                    <td className="py-2 px-3 text-ink-soft font-semibold text-xs">~{estWeight(c.width).toLocaleString()} kg</td>
                                  </tr>
                                ))}
                                {opt.waste > 0 && (
                                  <tr className="bg-paper-2">
                                    <td className="py-2 px-3 text-accent-700 font-bold">Ref</td>
                                    <td className="py-2 px-3 text-accent-700 font-mono text-xs">{pos}mm</td>
                                    <td className="py-2 px-3 font-bold text-accent-700">{opt.waste}mm</td>
                                    <td className="py-2 px-3 text-accent-700 font-mono text-xs">{mw}mm</td>
                                    <td className="py-2 px-3 text-accent-700 font-bold">SUCATA / SOBRA</td>
                                    <td className="py-2 px-3 text-accent-700 text-xs">~{estWeight(opt.waste).toLocaleString()} kg</td>
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
                  <div className="panel p-4">
                    <p className="text-xs text-ink-soft uppercase font-bold mb-3 flex items-center gap-2">
                      <Ruler className="w-3.5 h-3.5 text-accent-700" /> Larguras complementares — produção estimada
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {Object.entries(results.fillerAnalysis).map(([width, data]) => (
                        <div key={width} className="bg-paper-2 border border-divider p-3">
                          <p className="text-ink font-bold text-lg">{width}mm</p>
                          <p className="text-ink-soft text-sm">{data.desc}</p>
                          <div className="mt-2 space-y-0.5">
                            <p className="text-xs text-ink-faint">Qtd: <span className="text-ink-soft font-semibold">{data.producedQty} bobinas</span></p>
                            <p className="text-xs text-ink-faint">Peso: <span className="text-ink-soft font-semibold">~{Math.round(data.producedWeight)} kg</span></p>
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
                    return (
                      <div key={idx} className="panel">
                        <div className="panel-head justify-between">
                          <div className="flex items-center gap-3">
                            <div className="bg-ink text-paper font-bold w-10 h-10 flex items-center justify-center text-lg">{idx + 1}</div>
                            <div>
                              <h4 className="font-bold text-ink">Padrão {String.fromCharCode(65 + idx)}</h4>
                              <div className="text-sm text-ink-soft">
                                Executar em: <strong>{pattern.count} bobina(s)</strong><br />
                                <span className="text-xs bg-paper px-1 border border-divider">Pesos: {pattern.assignedCoils.map((c) => c.weight + "kg").join(", ")}</span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right flex flex-col items-end">
                            <div className={`text-sm font-bold px-2 py-0.5 mb-1 border ${Number(patternEfficiency) > 90 ? "bg-paper text-ink border-divider" : "bg-paper text-accent-700 border-accent/40"}`}>
                              Efic: {patternEfficiency}%
                            </div>
                            <p className="text-xs text-ink-faint">Perda: {pattern.scrapWeight.toFixed(0)}kg</p>
                          </div>
                        </div>

                        <div className="p-5">
                          <StepRow
                            segments={pattern.cuts.map((cut) => ({ width: cut.width, label: cut.desc }))}
                            totalWidth={visualMotherWidth}
                            wasteWidth={visualMotherWidth - pattern.usedWidth}
                            height="h-16"
                          />

                          <div className="mt-4">
                            <h5 className="text-sm font-bold text-ink mb-2 flex items-center gap-2"><Ruler className="w-4 h-4 text-accent-700" />Mapa de Setup</h5>
                            <div className="overflow-x-auto border border-divider">
                              <table className="w-full text-xs text-left">
                                <thead className="bg-paper-2 text-ink-soft">
                                  <tr>
                                    <th className="p-2 border-r border-divider">#</th>
                                    <th className="p-2 border-r border-divider">Início</th>
                                    <th className="p-2 border-r border-divider">Corte</th>
                                    <th className="p-2 border-r border-divider">Fim</th>
                                    <th className="p-2">Produto</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {pattern.setupCoordinates.map((setup, sIdx) => (
                                    <tr key={sIdx} className="border-t border-divider">
                                      <td className="p-2 border-r border-divider font-bold text-ink-faint">{sIdx + 1}</td>
                                      <td className="p-2 border-r border-divider font-mono text-ink-soft font-bold">{setup.start} mm</td>
                                      <td className="p-2 border-r border-divider font-bold text-base text-ink">{setup.width} mm</td>
                                      <td className="p-2 border-r border-divider font-mono text-ink-soft">{setup.end} mm</td>
                                      <td className="p-2 text-ink-soft truncate max-w-[160px]">{setup.desc}</td>
                                    </tr>
                                  ))}
                                  {visualMotherWidth - pattern.usedWidth > 0 && (
                                    <tr className="border-t border-accent/30 bg-paper-2">
                                      <td className="p-2 border-r border-divider text-accent-700 font-bold">Ref</td>
                                      <td className="p-2 border-r border-divider font-mono text-ink-soft">{pattern.usedWidth} mm</td>
                                      <td className="p-2 border-r border-divider font-bold text-accent-700">{(visualMotherWidth - pattern.usedWidth).toFixed(1)} mm</td>
                                      <td className="p-2 border-r border-divider font-mono text-ink-soft">{visualMotherWidth} mm</td>
                                      <td className="p-2 text-accent-700 font-bold text-xs uppercase">Sucata / Sobra</td>
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
              <section className="border border-divider border-t-4 border-t-accent bg-paper p-5 md:p-8" aria-labelledby="empty-plan-title">
                <div className="flex flex-wrap justify-between gap-3 border-b border-divider pb-5 text-xs">
                  <span className="font-bold uppercase tracking-[0.16em] text-accent-700">Plano de corte</span>
                  <span className="text-ink-soft">{demands.length ? "Pronto para calcular" : "Aguardando pedidos"}</span>
                </div>
                <h2 id="empty-plan-title" className="mt-8 text-2xl md:text-3xl font-extrabold tracking-tight">{demands.length ? "Pedidos definidos. Gere o plano." : "Cada corte come?a na bobina."}</h2>
                <p className="mt-3 max-w-lg text-sm text-ink-soft leading-relaxed">
                  {demands.length ? "Use Gerar Plano para calcular os padr?es de corte, a efici?ncia e a sucata dos pedidos adicionados." : "Confira a bobina m?e e adicione os pedidos por peso ou quantidade. O plano mostrar? as larguras de corte e o refilo de cada padr?o."}
                </p>
                <div className="mt-8 flex flex-wrap justify-between gap-2 text-xs font-bold">
                  <span>Bobina m?e ? {Number(motherWidth) || 0} mm</span>
                  <span className="text-ink-soft">{coilType} ? {Number(coilThickness) || 0} mm</span>
                </div>
                <div className="mt-3 flex h-24 border border-divider bg-paper-2 overflow-hidden" aria-label="Bobina sem plano calculado">
                  <div className="flex-1 flex items-center justify-center border-r border-divider text-ink-soft text-xs font-bold uppercase tracking-wider">Sem cortes definidos</div>
                  <div className="bg-repeating-linear-stripes border-l border-accent/40" style={{ width: Math.min(100, Math.max(0, Number(trim) / (Number(motherWidth) || 1) * 100)) + "%" }} />
                </div>
                <div className="mt-3 flex flex-wrap justify-between gap-2 text-xs">
                  <span className="font-bold">Largura ?til ? {Math.max(0, Number(motherWidth) - Number(trim)) || 0} mm</span>
                  <span className="text-accent-700">Refilo ? {Number(trim) || 0} mm</span>
                </div>
                <ol className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-divider pt-5 text-xs text-ink-soft">
                  <li><strong className="block text-accent-700 mb-1">01 / Bobina</strong>Confira material e estoque</li>
                  <li><strong className="block text-accent-700 mb-1">02 / Pedidos</strong>Defina larguras e demanda</li>
                  <li><strong className="block text-accent-700 mb-1">03 / Corte</strong>Gere e confira o plano</li>
                </ol>
              </section>
            )}
          </div>
        </div>

        <footer className="pt-3 border-t border-divider text-center text-xs text-ink-faint">
          © {new Date().getFullYear()} Betini Slitter — {userProfile?.companyName || ""}
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
          background-image: repeating-linear-gradient(45deg, transparent, transparent 5px, rgba(236,48,19,.14) 5px, rgba(236,48,19,.14) 10px);
        }
        @keyframes fade-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fade-in 0.4s ease-out forwards; }
      `}</style>
    </div>
  );
}
