import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Layout } from './components/Layout';
import { Overview } from './pages/Overview';
import { SecurityEvents } from './pages/SecurityEvents';
import { ThreatDetection } from './pages/ThreatDetection';
import { Alerts } from './pages/Alerts';
import { Incidents } from './pages/Incidents';
import { NetworkAnalytics } from './pages/NetworkAnalytics';
import { MLLab } from './pages/MLLab';
import { AIInvestigator } from './pages/AIInvestigator';
import { AuditLogs } from './pages/AuditLogs';
import { Settings } from './pages/Settings';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 30000,
    },
  },
});

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Overview />} />
            <Route path="/events" element={<SecurityEvents />} />
            <Route path="/detection" element={<ThreatDetection />} />
            <Route path="/alerts" element={<Alerts />} />
            <Route path="/incidents" element={<Incidents />} />
            <Route path="/analytics" element={<NetworkAnalytics />} />
            <Route path="/ml-lab" element={<MLLab />} />
            <Route path="/investigator" element={<AIInvestigator />} />
            <Route path="/audit" element={<AuditLogs />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;
