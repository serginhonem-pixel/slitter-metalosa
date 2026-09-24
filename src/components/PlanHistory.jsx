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
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <div className="bg-paper border border-divider w-full max-w-3xl max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-paper border-b border-divider px-5 py-4 flex items-center justify-between z-10">
            <h3 className="font-bold text-ink">{selected.name}</h3>
            <button onClick={() => setSelected(null)} className="text-ink-faint hover:text-ink transition">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-5 space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-paper-2 p-3 border border-divider">
                <p className="text-xs text-ink-faint uppercase font-bold">Eficiência</p>
                <p className={`text-2xl font-bold ${selected.summary?.efficiency >= 97 ? "text-ink" : "text-accent-700"}`}>
                  {selected.summary?.efficiency}%
                </p>
              </div>
              <div className="bg-paper-2 p-3 border border-divider">
                <p className="text-xs text-ink-faint uppercase font-bold">Bobinas</p>
                <p className="text-2xl font-bold text-ink">{selected.summary?.totalCoils}</p>
              </div>
              <div className="bg-paper-2 p-3 border border-divider">
                <p className="text-xs text-ink-faint uppercase font-bold">Entrada (kg)</p>
                <p className="text-2xl font-bold text-ink">{selected.summary?.totalInputWeight?.toLocaleString("pt-BR")}</p>
              </div>
              <div className="bg-paper-2 p-3 border border-divider">
                <p className="text-xs text-ink-faint uppercase font-bold">Sucata (kg)</p>
                <p className="text-2xl font-bold text-accent-700">{selected.summary?.totalScrapWeight}</p>
              </div>
            </div>

            {selected.machineConfig && (
              <div className="bg-paper-2 border border-divider p-3 text-xs text-ink-soft flex flex-wrap gap-4">
                <span>Largura: <strong className="text-ink">{selected.machineConfig.motherWidth}mm</strong></span>
                <span>Refilo: <strong className="text-ink">{selected.machineConfig.trim}mm</strong></span>
                <span>Material: <strong className="text-ink">{selected.machineConfig.coilType} {selected.machineConfig.coilThickness}mm</strong></span>
                <span>Data: <strong className="text-ink">{formatDate(selected.createdAt)}</strong></span>
              </div>
            )}

            {selected.results?.patterns?.map((pattern, idx) => (
              <div key={idx} className="bg-paper-2 border border-divider overflow-hidden">
                <div className="px-4 py-3 border-b border-divider flex justify-between items-center">
                  <span className="font-bold text-ink">Padrão {String.fromCharCode(65 + idx)}</span>
                  <span className="text-xs text-ink-soft">{pattern.count} bobina(s)</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-paper text-ink-soft">
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
                        <tr key={i} className="border-t border-divider">
                          <td className="p-2 text-center text-ink-faint">{i + 1}</td>
                          <td className="p-2 text-center font-mono text-ink-soft">{s.start}mm</td>
                          <td className="p-2 text-center font-bold text-ink">{s.width}mm</td>
                          <td className="p-2 text-center font-mono text-ink-soft">{s.end}mm</td>
                          <td className="p-2 text-ink-soft truncate max-w-[180px]">{s.desc}</td>
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
                className="btn-primary flex-1 py-2.5 text-sm"
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-paper border border-divider w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <div className="border-b border-divider px-5 py-4 flex items-center justify-between">
          <h3 className="font-bold text-ink flex items-center gap-2">
            <History className="w-4 h-4 text-accent-700" />
            Histórico de Planos
          </h3>
          <button onClick={onClose} className="text-ink-faint hover:text-ink transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-4">
          {plans.length === 0 ? (
            <div className="text-center py-12 text-ink-faint">
              <TrendingUp className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p>Nenhum plano salvo ainda.</p>
              <p className="text-xs mt-1">Gere um plano e clique em "Salvar Plano".</p>
            </div>
          ) : (
            <div className="space-y-2">
              {plans.map((plan) => (
                <div
                  key={plan.id}
                  className="bg-paper-2 border border-divider p-3 flex items-center justify-between hover:border-ink-soft transition"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-semibold text-ink text-sm truncate">{plan.name}</span>
                      <span className="text-[10px] px-1.5 py-0.5 font-bold border border-divider bg-paper text-ink-soft">
                        {plan.mode === "longitudinal" ? "LONG" : "TRANSV"}
                      </span>
                    </div>
                    <div className="text-xs text-ink-faint flex gap-3">
                      <span>{formatDate(plan.createdAt)}</span>
                      <span>Efic: <span className={plan.summary?.efficiency >= 97 ? "text-ink" : "text-accent-700"}>{plan.summary?.efficiency}%</span></span>
                      <span>{plan.summary?.totalCoils} bobinas</span>
                    </div>
                  </div>

                  <div className="flex gap-1 ml-2">
                    <button
                      onClick={() => setSelected(plan)}
                      className="p-2 text-ink-soft hover:text-ink hover:bg-paper transition"
                      title="Ver plano"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDeletePlan(plan.id)}
                      className="p-2 text-accent-700/60 hover:text-accent-700 hover:bg-paper transition"
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
