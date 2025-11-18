import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import HomePage from './pages/HomePage';
import LiquidityPage from './pages/LiquidityPage';
import RemoveLiquidityPage from './pages/RemoveLiquidityPage';
import BurnPage from './pages/BurnPage';

const App: React.FC = () => {
  return (
    <div className="min-h-screen text-brand-text flex flex-col p-8 font-sans bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900">
      <Header />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/liquidity" element={<LiquidityPage />} />
        <Route path="/remove-liquidity" element={<RemoveLiquidityPage />} />
        <Route path="/burn" element={<BurnPage />} />
      </Routes>
    </div>
  );
};

export default App;
