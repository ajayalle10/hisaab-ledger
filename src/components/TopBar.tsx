export function TopBar({ kicker, title }: { kicker: string; title?: string }) {
  return (
    <div className="topbar">
      <div className="kicker">{kicker}</div>
      {title && <h2>{title}</h2>}
    </div>
  );
}
