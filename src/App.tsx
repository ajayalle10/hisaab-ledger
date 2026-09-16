import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { DataProvider, useData } from './data/DataContext';
import { BottomNav } from './components/BottomNav';
import { Home } from './pages/Home';
import { People } from './pages/People';
import { PersonDetail } from './pages/PersonDetail';
import { LoanDetail } from './pages/LoanDetail';
import { AddLoan } from './pages/AddLoan';
import { LogPayment } from './pages/LogPayment';
import { Calendar } from './pages/Calendar';
import { Book } from './pages/Book';
import { AddExpense } from './pages/AddExpense';

const ROOT_TABS = ['/', '/people', '/calendar', '/book'];

function AppRoutes() {
  const location = useLocation();
  const showNav = ROOT_TABS.includes(location.pathname);

  return (
    <>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/people" element={<People />} />
        <Route path="/people/:personId" element={<PersonDetail />} />
        <Route path="/loans/new" element={<AddLoan />} />
        <Route path="/loans/:loanId" element={<LoanDetail />} />
        <Route path="/payments/new" element={<LogPayment />} />
        <Route path="/calendar" element={<Calendar />} />
        <Route path="/book" element={<Book />} />
        <Route path="/expenses/new" element={<AddExpense />} />
      </Routes>
      {showNav && <BottomNav />}
    </>
  );
}

function LoadingAwareRoutes() {
  const { loading, loadError, retryLoad } = useData();
  if (loadError) {
    return (
      <div className="screen" style={{ alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '0 24px' }}>
        <div style={{ color: 'var(--maroon)', fontSize: '0.9rem', marginBottom: 6 }}>Could not load your sheet</div>
        <div style={{ color: 'var(--ink-soft)', fontSize: '0.8rem', marginBottom: 18 }}>{loadError}</div>
        <button className="btn primary" style={{ flex: 'none', padding: '10px 24px' }} onClick={retryLoad}>
          Try again
        </button>
      </div>
    );
  }
  if (loading) {
    return (
      <div className="screen" style={{ alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: 'var(--ink-soft)', fontSize: '0.85rem' }}>Loading your ledger…</div>
      </div>
    );
  }
  return <AppRoutes />;
}

export function App() {
  return (
    <BrowserRouter>
      <div className="app-shell">
        <DataProvider>
          <LoadingAwareRoutes />
        </DataProvider>
      </div>
    </BrowserRouter>
  );
}
