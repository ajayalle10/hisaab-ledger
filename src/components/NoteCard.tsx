import type { ReactNode } from 'react';

export function NoteCard({ children }: { children: ReactNode }) {
  return <div className="notecard">{children}</div>;
}
