import { useNavigate } from 'react-router-dom';
import type { ReactNode } from 'react';

export function BackBar({
  title,
  sub,
  fallback = '/',
}: {
  title: string;
  sub?: ReactNode;
  fallback?: string;
}) {
  const navigate = useNavigate();
  const goBack = () => {
    if (window.history.length > 1) navigate(-1);
    else navigate(fallback);
  };
  return (
    <div className="backbar">
      <button className="backbtn" onClick={goBack} aria-label="Back">
        &#8592;
      </button>
      <div>
        <h3>{title}</h3>
        {sub && <div className="sub">{sub}</div>}
      </div>
    </div>
  );
}
