// Painel de instrumento: o padrão de corte como uma fileira de blocos proporcional
// à largura da bobina, no lugar de uma barra multicolorida tipo gráfico de pizza.
// Paleta restrita (tons de ink), o vermelho de destaque fica só pro trecho de sucata/livre.
const TONES = ["#201e1d", "#33302e", "#4a4542", "#5f5955", "#6e6763"];

export default function StepRow({ segments, totalWidth, wasteWidth = 0, height = "h-14", onSegmentClick }) {
  const safeTotal = Number(totalWidth) || 1;
  return (
    <div className={`w-full ${height} bg-paper-2 border border-divider overflow-hidden flex`}>
      {segments.map((seg, i) => {
        const pct = (Number(seg.width) / safeTotal) * 100;
        const tone = TONES[i % TONES.length];
        return (
          <div
            key={i}
            onClick={onSegmentClick ? () => onSegmentClick(seg, i) : undefined}
            className={`h-full border-r border-paper/30 flex items-center justify-center text-paper transition-[filter] ${onSegmentClick ? "cursor-pointer hover:brightness-125" : ""}`}
            style={{ width: `${pct}%`, background: tone }}
            title={`${seg.width}mm${seg.label ? ` — ${seg.label}` : ""}`}
          >
            {pct > 7 && (
              <span className="font-bold text-xs md:text-sm leading-none px-0.5 truncate">
                {seg.width}
              </span>
            )}
          </div>
        );
      })}
      {wasteWidth > 0 && (
        <div
          className="h-full bg-paper flex items-center justify-center flex-shrink-0"
          style={{ width: `${(wasteWidth / safeTotal) * 100}%` }}
        >
          {(wasteWidth / safeTotal) * 100 > 5 && (
            <span className="text-accent-700 text-[10px] md:text-xs font-bold">LIVRE</span>
          )}
        </div>
      )}
    </div>
  );
}
