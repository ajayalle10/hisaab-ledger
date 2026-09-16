import type { ReactNode } from 'react';

export function Row({
  name,
  meta,
  flag,
  amt,
  amtClass = 'neutral',
  onClick,
}: {
  name: string;
  meta?: ReactNode;
  flag?: ReactNode;
  amt: ReactNode;
  amtClass?: 'given' | 'taken' | 'neutral';
  onClick?: () => void;
}) {
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag className={`row${onClick ? '' : ' static'}`} onClick={onClick}>
      <div className="left">
        <div className="name">{name}</div>
        {meta && <div className="meta">{meta}</div>}
        {flag}
      </div>
      <div className={`amt ${amtClass}`}>{amt}</div>
    </Tag>
  );
}

export function Rows({ children, empty }: { children: ReactNode; empty?: string }) {
  const hasChildren = Array.isArray(children) ? children.length > 0 : !!children;
  return <div className="rows">{hasChildren ? children : <div className="empty-row">{empty}</div>}</div>;
}
