import React, { useState } from "react";
import { History, Trash2, Eye, X, TrendingUp } from "lucide-react";

export default function PlanHistory({ plans, onDeletePlan, onLoadPlan, onClose }) {
  const [selected, setSelected] = useState(null);

  const formatDate = (ts) => {
    if (!ts) return "—";
    const d = ts?.toDate ? ts.toDate() : new Date(typeof ts === "number" ? ts : ts);
    return d.toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" });
  };

  if (selected) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl">
          <div className="sticky top-0 bg-zinc-900 border-b border-zinc-800 px-5 py-4 flex items-center justify-between z-10">
            <h3 className="font-bold text-zinc-100">{selected.name}</h3>
            <button onClick={() => setSelected(null)} className="text-zinc-500 hover:text-zinc-300 transition">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-5 space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800">
                <p className="text-xs text-zinc-500 uppercase font-bold">Eficiência</p>
                <p className={`text-2xl font-bold ${selected.summary?.efficiency >= 97 ? "text-emerald-400" : "text-orange-300"}`}>
                  {selected.summary?.efficiency}%
                </p>
              </div>
              <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800">
                <p className="text-xs text-zinc-500 uppercase font-bold">Bobinas</p>
                <p className="text-2xl font-bold text-zinc-100">{selected.summary?.totalCoils}</p>
              </div>
              <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800">
                <p className="text-xs text-zinc-500 uppercase font-bold">Entrada (kg)</p>
                <p className="text-2xl font-bold text-zinc-100">{selected.summary?.totalInputWeight?.toLocaleString("pt-BR")}</p>
              </div>
              <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800">
                <p className="text-xs text-zinc-500 uppercase font-bold">Sucata (kg)</p>
                <p className="text-2xl font-bold text-red-400">{selected.summary?.totalScrapWeight}</p>
              </div>
            </div>

            {selected.machineConfig && (
              <div className="bg-zinc-950/60 border border-zinc-800 rounded-xl p-3 text-xs text-zinc-400 flex flex-wrap gap-4">
                <span>Largura: <strong className="text-zinc-200">{selected.machineConfig.motherWidth}mm</strong></span>
                <span>Refilo: <strong className="text-zinc-200">{selected.machineConfig.trim}mm</strong></span>
                <span>Material: <strong className="text-zinc-200">{selected.machineConfig.coilType} {selected.machineConfig.coilThickness}mm</strong></span>
                <span>Data: <strong className="text-zinc-200">{formatDate(selected.createdAt)}</strong></span>
              </div>
            )}

            {selected.results?.patterns?.map((pattern, idx) => (
              <div key={idx} className="bg-zinc-950/60 border border-zinc-800 rounded-xl overflow-hidden">
                <div className="px-4 py-3 border-b border-zinc-800 flex justify-between items-center">
                  <span className="font-bold text-zinc-200">Padrão {String.fromCharCode(65 + idx)}</span>
                  <span className="text-xs text-zinc-400">{pattern.count} bobina(s)</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-zinc-900 text-zinc-400">
                      <tr>
                        <th className="p-2">#</th>
                        <th className="p-2">Início</th>
                        <th className="p-2">Corte</th>
                        <th className="p-2">Fim</th>
                        <th className="p-2 text-left">Produto</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pattern.setupCoordinates?.map((s, i) => (
                        <tr key={i} className="border-t border-zinc-800">
                          <td className="p-2 text-center text-zinc-500">{i + 1}</td>
                          <td className="p-2 text-center font-mono text-blue-300">{s.start}mm</td>
                          <td className="p-2 text-center font-bold text-zinc-100">{s.width}mm</td>
                          <td className="p-2 text-center font-mono text-zinc-400">{s.end}mm</td>
                          <td className="p-2 text-zinc-300 truncate max-w-[180px]">{s.desc}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => { onLoadPlan(selected); onClose(); }}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm transition"
              >
                Carregar este plano
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden shadow-2xl flex flex-col">
        <div className="border-b border-zinc-800 px-5 py-4 flex items-center justify-between">
          <h3 className="font-bold text-zinc-100 flex items-center gap-2">
            <History className="w-4 h-4 text-emerald-400" />
            Histórico de Planos
          </h3>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-4">
          {plans.length === 0 ? (
            <div className="text-center py-12 text-zinc-500">
              <TrendingUp className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p>Nenhum plano salvo ainda.</p>
              <p className="text-xs mt-1">Gere um plano e clique em "Salvar Plano".</p>
            </div>
          ) : (
            <div className="space-y-2">
              {plans.map((plan) => (
                <div
                  key={plan.id}
                  className="bg-zinc-950/60 border border-zinc-800 rounded-xl p-3 flex items-center justify-between hover:border-zinc-700 transition"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-semibold text-zinc-100 text-sm truncate">{plan.name}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold border ${
                        plan.mode === "longitudinal"
                          ? "bg-emerald-950/50 text-emerald-300 border-emerald-900/60"
                          : "bg-amber-950/50 text-amber-300 border-amber-900/60"
                      }`}>
                        {plan.mode === "longitudinal" ? "LONG" : "TRANSV"}
                      </span>
                    </div>
                    <div className="text-xs text-zinc-500 flex gap-3">
                      <span>{formatDate(plan.createdAt)}</span>
                      <span>Efic: <span className={plan.summary?.efficiency >= 97 ? "text-emerald-400" : "text-orange-300"}>{plan.summary?.efficiency}%</span></span>
                      <span>{plan.summary?.totalCoils} bobinas</span>
                    </div>
                  </div>

                  <div className="flex gap-1 ml-2">
                    <button
                      onClick={() => setSelected(plan)}
                      className="p-2 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition"
                      title="Ver plano"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDeletePlan(plan.id)}
                      className="p-2 rounded-lg text-red-400/60 hover:text-red-400 hover:bg-zinc-800 transition"
                      title="Excluir plano"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
