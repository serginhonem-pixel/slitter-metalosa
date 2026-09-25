import { useState } from "react";
import { Plus, Trash2, Calculator, LayoutGrid, AlertTriangle } from "lucide-react";
import { calculateSheetOptimization } from "../utils/optimizationEngine";

const PALETTE = ["#ec3013", "#201e1d", "#8a8683", "#c94a2f", "#4a4744", "#e8846d"];

export default function SheetCuttingPanel() {
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
          <div className="flex flex-wrap gap-6 text-xs font-bold">
            <span>Eficiência: <span className={results.stats.efficiency >= 80 ? "text-ink" : "text-accent-700"}>{results.stats.efficiency}%</span></span>
            <span>Sucata: <span className="text-accent-700">{results.stats.waste}%</span></span>
            <span>Chapas usadas: {results.stats.totalSheets}</span>
            <span>Peças posicionadas: {results.stats.totalPieces}</span>
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
                      {pl.label}
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
