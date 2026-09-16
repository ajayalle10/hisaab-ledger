export interface SummaryCell {
  num: string;
  lbl: string;
  color?: string;
}

export function SummaryStrip({ cells }: { cells: SummaryCell[] }) {
  return (
    <div className="summary">
      {cells.map((c) => (
        <div className="cell" key={c.lbl}>
          <div className="num" style={c.color ? { color: c.color } : undefined}>
            {c.num}
          </div>
          <div className="lbl">{c.lbl}</div>
        </div>
      ))}
    </div>
  );
}
