import { useState } from "react";
import { Plus, Trash2, Calculator, LayoutGrid, AlertTriangle, FileDown, Printer } from "lucide-react";
import { calculateSheetOptimization } from "../utils/optimizationEngine";
import { exportSheetPlanToExcel } from "../utils/exportSheetExcel";
import { printBrandHeader, printBrandStyles } from "../utils/printBrand";
import { useAuth } from "../contexts/AuthContext";

const PALETTE = ["#ec3013", "#201e1d", "#8a8683", "#c94a2f", "#4a4744", "#e8846d"];

export default function SheetCuttingPanel() {
  const { userProfile } = useAuth();
  const [sheetWidth, setSheetWidth] = useState(2750);
  const [sheetHeight, setSheetHeight] = useState(1830);
  const [pieces, setPieces] = useState([]);

  const [pieceWidth, setPieceWidth] = useState("");
  const [pieceHeight, setPieceHeight] = useState("");
  const [pieceQty, setPieceQty] = useState("");
  const [pieceDesc, setPieceDesc] = useState("");

  const [results, setResults] = useState(null);

  const addPiece = () => {
    const w = parseFloat(pieceWidth);
    const h = parseFloat(pieceHeight);
    const qty = parseInt(pieceQty, 10);
    if (!w || !h || !qty || qty <= 0) return;
    setPieces((prev) => [
      ...prev,
      { id: Date.now(), width: w, height: h, qty, desc: pieceDesc.trim() || `${w}x${h}mm` },
    ]);
    setPieceWidth("");
    setPieceHeight("");
    setPieceQty("");
    setPieceDesc("");
    setResults(null);
  };

  const removePiece = (id) => {
    setPieces((prev) => prev.filter((p) => p.id !== id));
    setResults(null);
  };

  const generatePlan = () => {
    if (!pieces.length) return;
    const { sheetResults } = calculateSheetOptimization({
      sheetWidth,
      sheetHeight,
      sheetDemands: pieces.map((p) => ({ width: p.width, height: p.height, qty: p.qty, isFiller: false })),
      availableProducts: [],
    });
    setResults(sheetResults);
  };

  const sheetToSvg = (sheet) => {
    const fontSize = Math.max(10, Math.round(sheetWidth / 90));
    const rects = sheet.placements
      .map((p, i) => {
        const cx = p.x + p.width / 2;
        const cy = p.y + p.height / 2;
        const rotateAttr = p.rotated ? ` transform="rotate(-90 ${cx} ${cy})"` : "";
        return `<rect x="${p.x}" y="${p.y}" width="${p.width}" height="${p.height}" fill="${PALETTE[i % PALETTE.length]}" stroke="#fff" stroke-width="4" />` +
          `<text x="${cx}" y="${cy}" fill="#fff" font-size="${fontSize}" font-weight="700" text-anchor="middle" dominant-baseline="middle"${rotateAttr}>${p.label}</text>`;
      })
      .join("");
    return `<svg viewBox="0 0 ${sheetWidth} ${sheetHeight}" style="width:100%;max-width:700px;border:1px solid #d3d1d0;background:#f3f2f2;display:block;margin-bottom:8px">${rects}</svg>`;
  };

  const generateReport = () => {
    if (!results) return;
    const win = window.open("", "_blank");
    if (!win) { alert("Permita pop-ups para gerar o relatório."); return; }

    const styles = `<style>
      body{font-family:Archivo,Arial,sans-serif;padding:40px;color:#201e1d}
      h1{font-size:22px;border-bottom:2px solid #201e1d;padding-bottom:8px;margin-bottom:18px}
      .header-info{display:flex;flex-wrap:wrap;gap:12px;margin-bottom:24px;background:#f3f2f2;padding:12px}
      .header-item{font-size:13px}.header-item strong{display:block;font-size:10px;color:#5f5955;text-transform:uppercase}
      .card{border:1px solid #d3d1d0;margin-bottom:18px;overflow:hidden;padding:12px}
      .card h2{font-size:15px;margin:0 0 8px}
      .total-summary{margin-top:28px;border-top:2px solid #201e1d;padding-top:14px;display:flex;gap:16px}
      .summary-box{text-align:center;min-width:120px}
      .summary-val{font-size:20px;font-weight:800}
      .summary-label{font-size:11px;color:#5f5955;text-transform:uppercase}
      .print-btn{position:fixed;bottom:18px;right:18px;background:#ec3013;color:#fff;padding:10px 18px;text-decoration:none;font-weight:700}
      @media print{.print-btn{display:none}body{padding:0}}
    </style>`;

    const header = `<div class="header-info">
      <div class="header-item"><strong>Data</strong>${new Date().toLocaleString("pt-BR")}</div>
      <div class="header-item"><strong>Empresa</strong>${userProfile?.companyName || ""}</div>
      <div class="header-item"><strong>Chapa</strong>${sheetWidth}x${sheetHeight}mm</div>
    </div>`;

    const cards = results.sheets
      .map((sheet, idx) => `<div class="card"><h2>Chapa ${String.fromCharCode(65 + idx)} — ${sheet.placements.length} peça(s)</h2>${sheetToSvg(sheet)}</div>`)
      .join("");

    const oversizeWarning = results.oversize.length > 0
      ? `<p style="color:#ae1800;font-weight:700">${results.oversize.length} peça(s) não coube(ram) na chapa configurada.</p>`
      : "";

    const summary = `<div class="total-summary">
      <div class="summary-box"><div class="summary-label">Eficiência</div><div class="summary-val">${results.stats.efficiency}%</div></div>
      <div class="summary-box"><div class="summary-label" style="color:#ae1800">Sucata</div><div class="summary-val" style="color:#ae1800">${results.stats.waste}%</div></div>
      <div class="summary-box"><div class="summary-label">Chapas</div><div class="summary-val">${results.stats.totalSheets}</div></div>
      <div class="summary-box"><div class="summary-label">Peças</div><div class="summary-val">${results.stats.totalPieces}</div></div>
    </div>`;

    win.document.write(`<html lang="pt-BR"><head><meta charset="UTF-8">${printBrandStyles}<title>Betini Slitter | Plano de Corte de Chapa</title>${styles}</head><body>${printBrandHeader("Chapa")}<h1>Plano de Corte de Chapa</h1>${header}${oversizeWarning}${cards}${summary}<a href="#" onclick="window.print();return false;" class="print-btn">🖨️ Imprimir / Salvar PDF</a></body></html>`);
    win.document.close();
  };

  return (
    <div className="space-y-5">
      <div className="border border-divider border-t-4 border-t-accent bg-paper">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-divider bg-paper-2">
          <span className="step-badge">1</span>
          <LayoutGrid className="w-4 h-4 text-ink-soft" />
          <h2 className="font-semibold text-ink">Chapa</h2>
        </div>
        <div className="p-4 grid grid-cols-2 gap-4">
          <div>
            <label className="field-label">Largura da chapa (mm)</label>
            <input
              type="number"
              value={sheetWidth}
              onChange={(e) => setSheetWidth(Number(e.target.value) || 0)}
              className="field-input text-sm"
            />
          </div>
          <div>
            <label className="field-label">Altura da chapa (mm)</label>
            <input
              type="number"
              value={sheetHeight}
              onChange={(e) => setSheetHeight(Number(e.target.value) || 0)}
              className="field-input text-sm"
            />
          </div>
        </div>
      </div>

      <div className="border border-divider border-t-4 border-t-accent bg-paper">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-divider bg-paper-2">
          <span className="step-badge">2</span>
          <LayoutGrid className="w-4 h-4 text-ink-soft" />
          <h2 className="font-semibold text-ink">Peças</h2>
        </div>
        <div className="p-4 space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="field-label">Largura (mm)</label>
              <input type="number" placeholder="ex: 600" value={pieceWidth} onChange={(e) => setPieceWidth(e.target.value)} className="field-input text-sm" />
            </div>
            <div>
              <label className="field-label">Altura (mm)</label>
              <input type="number" placeholder="ex: 400" value={pieceHeight} onChange={(e) => setPieceHeight(e.target.value)} className="field-input text-sm" />
            </div>
          </div>
          <div className="flex gap-2 items-end">
            <div className="flex-1">
              <label className="field-label">Quantidade</label>
              <input type="number" min="1" placeholder="ex: 10" value={pieceQty} onChange={(e) => setPieceQty(e.target.value)} className="field-input text-sm" />
            </div>
            <div className="flex-1">
              <label className="field-label">Descrição (opcional)</label>
              <input
                type="text"
                placeholder="ex: Lateral do móvel"
                value={pieceDesc}
                onChange={(e) => setPieceDesc(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addPiece()}
                className="field-input text-sm"
              />
            </div>
            <button onClick={addPiece} className="btn-primary h-[40px] w-12">
              <Plus className="w-5 h-5" />
            </button>
          </div>

          <div className="max-h-[240px] overflow-y-auto space-y-2">
            {pieces.length === 0 && <p className="text-center text-ink-faint text-sm py-3">Nenhuma peça adicionada.</p>}
            {pieces.map((p) => (
              <div key={p.id} className="flex items-center justify-between p-2 bg-paper-2 border border-divider">
                <div>
                  <span className="font-bold text-ink">{p.width}x{p.height}mm</span>{" "}
                  <span className="text-ink-soft text-xs">{p.desc} — Qtd: {p.qty}</span>
                </div>
                <button onClick={() => removePiece(p.id)} className="text-ink-faint hover:text-accent-700 transition">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="border border-divider border-t-4 border-t-accent bg-paper">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-divider bg-paper-2">
          <span className="step-badge">3</span>
          <Calculator className="w-4 h-4 text-ink-soft" />
          <h2 className="font-semibold text-ink">Gerar o plano de corte</h2>
        </div>
        <div className="p-4">
          <button onClick={generatePlan} disabled={!pieces.length} className="btn-primary w-full py-3">
            <Calculator className="w-5 h-5" />
            Gerar Plano
          </button>
        </div>
      </div>

      {results && (
        <div className="border border-divider border-t-4 border-t-accent bg-paper p-4 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-6 text-xs font-bold">
              <span>Eficiência: <span className={results.stats.efficiency >= 80 ? "text-ink" : "text-accent-700"}>{results.stats.efficiency}%</span></span>
              <span>Sucata: <span className="text-accent-700">{results.stats.waste}%</span></span>
              <span>Chapas usadas: {results.stats.totalSheets}</span>
              <span>Peças posicionadas: {results.stats.totalPieces}</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => exportSheetPlanToExcel(results, { sheetWidth, sheetHeight }, userProfile?.companyName)}
                className="btn-quiet text-sm"
              >
                <FileDown className="w-4 h-4" />
                Excel
              </button>
              <button onClick={generateReport} className="btn-quiet text-sm">
                <Printer className="w-4 h-4" />
                PDF
              </button>
            </div>
          </div>

          {results.oversize.length > 0 && (
            <div className="callout-accent text-xs text-ink flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-accent-700" />
              {results.oversize.length} peça(s) não cabem na chapa configurada e ficaram de fora.
            </div>
          )}

          <div className="grid gap-5 md:grid-cols-2">
            {results.sheets.map((sheet, idx) => (
              <div key={sheet.id}>
                <p className="text-xs font-bold text-ink-soft uppercase mb-1">
                  Chapa {String.fromCharCode(65 + idx)}
                </p>
                <div
                  className="relative w-full border border-divider bg-paper-2"
                  style={{ aspectRatio: `${sheetWidth} / ${sheetHeight}` }}
                >
                  {sheet.placements.map((pl, plIdx) => (
                    <div
                      key={plIdx}
                      title={pl.label}
                      className="absolute border border-paper flex items-center justify-center text-[9px] font-bold text-white overflow-hidden"
                      style={{
                        left: `${(pl.x / sheetWidth) * 100}%`,
                        top: `${(pl.y / sheetHeight) * 100}%`,
                        width: `${(pl.width / sheetWidth) * 100}%`,
                        height: `${(pl.height / sheetHeight) * 100}%`,
                        backgroundColor: PALETTE[plIdx % PALETTE.length],
                      }}
                    >
                      <span
                        className="whitespace-nowrap"
                        style={pl.height > pl.width * 1.8 ? { writingMode: "vertical-rl" } : undefined}
                      >
                        {pl.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
