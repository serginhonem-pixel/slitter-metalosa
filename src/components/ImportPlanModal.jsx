import React, { useRef, useState } from "react";
import { Upload, Download, X, CheckCircle2, AlertTriangle } from "lucide-react";
import { readBulkImportFile, downloadImportTemplate } from "../utils/parseBulkImport";

export default function ImportPlanModal({ context, onImport, onClose }) {
  const fileInputRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [summary, setSummary] = useState(null);

  const handleFile = async (file) => {
    if (!file) return;
    setLoading(true);
    setError("");
    setSummary(null);

    const { data, error: readError } = await readBulkImportFile(file, context);

    setLoading(false);

    if (readError) {
      setError(readError);
      return;
    }

    onImport(data);
    setSummary({
      coils: data.coils.length,
      demands: data.demands.length,
      skipped: data.skippedStock.length + data.skippedOrders.length,
      skippedReasons: [...data.skippedStock, ...data.skippedOrders].map((s) => s.reason),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-paper border border-divider p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-ink flex items-center gap-2">
            <Upload className="w-4 h-4 text-accent-700" />
            Importar Planilha
          </h3>
          <button onClick={onClose} className="text-ink-faint hover:text-ink transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-sm text-ink-soft mb-4">
          Suba uma planilha .xlsx com as abas <strong>Estoque</strong> e <strong>Pedidos</strong> para
          preencher o plano de uma vez, sem digitar item por item.
        </p>

        <button
          onClick={downloadImportTemplate}
          className="btn-quiet w-full py-2 text-sm mb-3 flex items-center justify-center gap-2"
        >
          <Download className="w-4 h-4" />
          Baixar modelo da planilha
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={loading}
          className="btn-primary w-full py-2 text-sm"
        >
          {loading ? "Lendo planilha..." : "Selecionar planilha preenchida"}
        </button>

        {error && (
          <div className="mt-4 callout-accent text-xs text-ink flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-accent-700" />
            {error}
          </div>
        )}

        {summary && (
          <div className="mt-4 p-3 bg-paper-2 border border-divider text-xs space-y-2">
            <div className="flex items-center gap-2 font-bold text-ink">
              <CheckCircle2 className="w-4 h-4 text-accent-700" />
              {summary.demands} pedido(s) e {summary.coils} bobina(s) de estoque importados
            </div>
            {summary.skipped > 0 && (
              <div>
                <p className="font-bold text-ink-soft mb-1">
                  {summary.skipped} linha(s) ignorada(s):
                </p>
                <ul className="list-disc pl-4 text-ink-soft space-y-0.5">
                  {summary.skippedReasons.map((reason, idx) => (
                    <li key={idx}>{reason}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        <div className="mt-4">
          <button onClick={onClose} className="btn-quiet w-full py-2 text-sm">
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
