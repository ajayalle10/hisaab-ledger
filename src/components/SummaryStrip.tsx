export interface SummaryCell {
  num: string;
  lbl: string;
  color?: string;
  sub?: string; // optional small line under the label, e.g. an amount beside a count
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
          {c.sub && <div className="lbl">{c.sub}</div>}
        </div>
      ))}
    </div>
  );
}
