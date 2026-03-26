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
    <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-4 animate-fade-in">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-3">
        <h3 className="font-bold text-zinc-200 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-emerald-400" />
          Meu Catálogo
          <span className="text-xs font-normal text-zinc-500">
            ({activeDb.length} produtos)
          </span>
          {hasCloudCatalog && (
            <span className="text-[10px] bg-emerald-950/50 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-900/60 font-semibold">
              NUVEM
            </span>
          )}
        </h3>

        <div className="flex flex-wrap gap-2">
          <label className="cursor-pointer inline-flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs font-semibold hover:bg-zinc-800 transition">
            <Upload className="w-4 h-4 text-amber-300" />
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
            className="inline-flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs font-semibold hover:bg-zinc-800 transition"
          >
            Baixar modelo
          </button>

          {hasCloudCatalog && (
            <button
              onClick={clearCatalog}
              className="inline-flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs font-semibold hover:bg-zinc-800 transition text-zinc-400"
            >
              <CloudOff className="w-3 h-3" />
              Usar base padrão
            </button>
          )}
        </div>
      </div>

      {status && (
        <div className="mb-3 text-xs text-amber-200 bg-amber-950/20 border border-amber-900/40 rounded-lg px-3 py-2">
          {status}
        </div>
      )}

      {products === null ? (
        <div className="text-xs text-zinc-500 text-center py-4">Carregando catálogo...</div>
      ) : (
        <div className="overflow-x-auto max-h-60 overflow-y-auto border border-zinc-800 rounded-xl">
          <table className="w-full text-sm text-left">
            <thead className="bg-zinc-950 text-zinc-400 sticky top-0">
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
                <tr key={row.id || i} className="border-t border-zinc-800 hover:bg-zinc-950/60">
                  <td className="p-2 font-mono text-xs">{row.code}</td>
                  <td className="p-2 text-xs">{row.desc}</td>
                  <td className="p-2 font-bold text-blue-400">{row.type}</td>
                  <td className="p-2 font-bold">{Number(row.thickness).toFixed(2)}</td>
                  <td className="p-2">{row.width}</td>
                  <td className="p-2 text-right font-mono text-emerald-300">{row.history}</td>
                  {hasCloudCatalog && (
                    <td className="p-2">
                      <button
                        onClick={() => deleteProduct(row.id)}
                        className="text-red-400/60 hover:text-red-400 transition"
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
