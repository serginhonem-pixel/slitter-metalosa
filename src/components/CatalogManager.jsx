import React from "react";
import { TrendingUp, Upload, Trash2, CloudOff } from "lucide-react";
import { useProducts } from "../hooks/useProducts";
import { parseExcelFile, downloadTemplate } from "../utils/parseExcel";

export default function CatalogManager({ companyId, activeDb }) {
  const { products, status, setStatus, uploadFromExcel, deleteProduct, clearCatalog } =
    useProducts(companyId);

  const hasCloudCatalog = products && products.length > 0;

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    setStatus("Lendo arquivo...");
    const { data, error } = await parseExcelFile(file);
    if (error) {
      setStatus(error);
      return;
    }
    await uploadFromExcel(data);
  };

  return (
    <div className="panel p-4 animate-fade-in">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-3">
        <h3 className="font-bold text-ink flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-accent-700" />
          Meu Catálogo
          <span className="text-xs font-normal text-ink-faint">
            ({activeDb.length} produtos)
          </span>
          {hasCloudCatalog && (
            <span className="text-[10px] bg-paper-2 text-ink-soft px-2 py-0.5 border border-divider font-semibold">
              NUVEM
            </span>
          )}
        </h3>

        <div className="flex flex-wrap gap-2">
          <label className="btn-quiet cursor-pointer text-xs">
            <Upload className="w-4 h-4" />
            Subir Excel
            <input
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={handleUpload}
            />
          </label>

          <button
            onClick={downloadTemplate}
            className="btn-quiet text-xs"
          >
            Baixar modelo
          </button>

          {hasCloudCatalog && (
            <button
              onClick={clearCatalog}
              className="btn-quiet text-xs text-ink-soft"
            >
              <CloudOff className="w-3 h-3" />
              Usar base padrão
            </button>
          )}
        </div>
      </div>

      {status && (
        <div className="mb-3 callout-ink text-xs text-ink">
          {status}
        </div>
      )}

      {products === null ? (
        <div className="text-xs text-ink-faint text-center py-4">Carregando catálogo...</div>
      ) : (
        <div className="overflow-x-auto max-h-60 overflow-y-auto border border-divider">
          <table className="w-full text-sm text-left">
            <thead className="bg-paper-2 text-ink-soft sticky top-0">
              <tr>
                <th className="p-2">Codigo</th>
                <th className="p-2">Descricao</th>
                <th className="p-2">Tipo</th>
                <th className="p-2">Esp.</th>
                <th className="p-2">Larg.</th>
                <th className="p-2 text-right">Hist.</th>
                {hasCloudCatalog && <th className="p-2 w-8" />}
              </tr>
            </thead>
            <tbody>
              {activeDb.map((row, i) => (
                <tr key={row.id || i} className="border-t border-divider hover:bg-paper-2">
                  <td className="p-2 font-mono text-xs text-ink-soft">{row.code}</td>
                  <td className="p-2 text-xs text-ink-soft">{row.desc}</td>
                  <td className="p-2 font-bold text-ink">{row.type}</td>
                  <td className="p-2 font-bold text-ink">{Number(row.thickness).toFixed(2)}</td>
                  <td className="p-2 text-ink-soft">{row.width}</td>
                  <td className="p-2 text-right font-mono text-ink-soft">{row.history}</td>
                  {hasCloudCatalog && (
                    <td className="p-2">
                      <button
                        onClick={() => deleteProduct(row.id)}
                        className="text-accent-700/60 hover:text-accent-700 transition"
                        title="Remover produto"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
