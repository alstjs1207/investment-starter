import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import { HomePage, SettingsPage, StockDetailPage, RebalancePage, ReturnsPage, StockDirectoryPage, WatchlistPage } from './pages';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/stock/:companyId" element={<StockDetailPage />} />
          <Route path="/rebalance" element={<RebalancePage />} />
          <Route path="/returns" element={<ReturnsPage />} />
          <Route path="/directory" element={<StockDirectoryPage />} />
          <Route path="/watchlist" element={<WatchlistPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
