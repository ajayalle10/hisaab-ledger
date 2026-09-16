import type { ReactNode } from 'react';

export interface KeyFact {
  k: string;
  v: ReactNode;
  vColor?: string;
}

export function KeyFactsList({ facts }: { facts: KeyFact[] }) {
  return (
    <div className="keyfacts">
      {facts.map((f) => (
        <div className="kf-row" key={f.k}>
          <span className="k">{f.k}</span>
          <span className="v" style={f.vColor ? { color: f.vColor } : undefined}>
            {f.v}
          </span>
        </div>
      ))}
    </div>
  );
}
