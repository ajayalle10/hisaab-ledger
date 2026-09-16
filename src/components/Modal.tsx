import type { ReactNode } from 'react';

export function Modal({
  title,
  body,
  children,
  actions,
}: {
  title: string;
  body: ReactNode;
  children?: ReactNode;
  actions: ReactNode;
}) {
  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <div className="modal-title">{title}</div>
        <div className="modal-body">{body}</div>
        {children}
        <div className="modal-actions">{actions}</div>
      </div>
    </div>
  );
}
