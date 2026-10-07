import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import Requests from './pages/Requests';
import Matching from './pages/Matching';
import Reservations from './pages/Reservations';
import Issuance from './pages/Issuance';
import Donors from './pages/Donors';
import Patients from './pages/Patients';
import Alerts from './pages/Alerts';
import Audit from './pages/Audit';
import Analytics from './pages/Analytics';
import AICopilot from './pages/AICopilot';

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        {/* Protected Application Routes wrapped in Layout */}
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="inventory" element={<Inventory />} />
          <Route path="requests" element={<Requests />} />
          <Route path="matching" element={<Matching />} />
          <Route path="reservations" element={<Reservations />} />
          <Route path="issuance" element={<Issuance />} />
          <Route path="donors" element={<Donors />} />
          <Route path="patients" element={<Patients />} />
          <Route path="alerts" element={<Alerts />} />
          <Route path="audit" element={<Audit />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="copilot" element={<AICopilot />} />

          {/* Catch-all Fallback */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;
