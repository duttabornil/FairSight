import React from 'react';
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import { LayoutDashboard, Database, Activity, ShieldAlert } from 'lucide-react';

import DashboardPage from './pages/DashboardPage';
import DataBiasPage from './pages/DataBiasPage';
import ModelBiasPage from './pages/ModelBiasPage';
import MitigationPage from './pages/MitigationPage';

function App() {
  return (
    <BrowserRouter>
      <div className="app-container">
        <aside className="sidebar">
          <div className="sidebar-logo">
            <ShieldAlert size={28} />
            <span>FairSight</span>
          </div>
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <NavLink to="/" className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}>
              <LayoutDashboard size={20} />
              Dashboard
            </NavLink>
            <NavLink to="/data-bias" className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}>
              <Database size={20} />
              Data Bias
            </NavLink>
            <NavLink to="/model-bias" className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}>
              <Activity size={20} />
              Model Bias
            </NavLink>
            <NavLink to="/mitigation" className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}>
              <ShieldAlert size={20} />
              Mitigation
            </NavLink>
          </nav>
        </aside>
        
        <main className="main-content">
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/data-bias" element={<DataBiasPage />} />
            <Route path="/model-bias" element={<ModelBiasPage />} />
            <Route path="/mitigation" element={<MitigationPage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
