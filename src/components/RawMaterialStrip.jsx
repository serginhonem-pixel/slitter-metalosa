import { Box } from "lucide-react";

// Dá peso visual de verdade pra matéria-prima: cada bobina em estoque como uma
// ficha própria, com status (livre / usada) e em qual padrão ela entrou.
export default function RawMaterialStrip({ stockCoils, patterns }) {
  const usageByCoilId = {};
  (patterns || []).forEach((pattern, idx) => {
    pattern.assignedCoils.forEach((coil) => {
      usageByCoilId[coil.id] = String.fromCharCode(65 + idx);
    });
  });

  if (!stockCoils.length) return null;

  return (
    <div className="panel">
      <div className="panel-head">
        <Box className="w-4 h-4 text-ink-soft" />
        <h3 className="font-semibold text-ink">Matéria-prima</h3>
        <span className="text-[10px] text-ink-faint ml-1 hidden sm:inline">bobinas em estoque nesta simulação</span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-px bg-divider">
        {stockCoils.map((coil, idx) => {
          const patternLetter = usageByCoilId[coil.id];
          const isUsed = Boolean(patternLetter);
          return (
            <div key={coil.id} className="bg-paper p-3 flex flex-col gap-1">
              <span className="text-[10px] text-ink-faint uppercase tracking-wide font-bold">
                Bobina {String(idx + 1).padStart(2, "0")}
              </span>
              <span className="text-lg font-extrabold text-ink tabular-nums leading-none">
                {coil.weight.toLocaleString()}<span className="text-xs font-bold text-ink-faint">kg</span>
              </span>
              <span className={`text-[10px] font-bold uppercase mt-1 ${isUsed ? "text-accent-700" : "text-ink-faint"}`}>
                {isUsed ? `Usada — Padrão ${patternLetter}` : "Livre"}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
