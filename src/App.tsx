import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

// Context providers
import { ThemeProvider as CustomThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import { WebSocketProvider } from './contexts/WebSocketContext';

// Layout
import Layout from './components/layout/Layout';

// Pages
import Dashboard from './pages/dashboard/Dashboard';
import Calls from './pages/calls/Calls';
import CallDetail from './pages/calls/CallDetail';
import VoiceAgent from './pages/voice-agent/VoiceAgent';
import Analytics from './pages/analytics/Analytics';
import Numbers from './pages/numbers/Numbers';

// Theme
import { useTheme } from './contexts/ThemeContext';

function AppContent() {
  const { theme } = useTheme();

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/calls" element={<Calls />} />
            <Route path="/calls/:id" element={<CallDetail />} />
            <Route path="/voice-agent" element={<VoiceAgent />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/numbers" element={<Numbers />} />
          </Routes>
        </Layout>
      </Router>
    </ThemeProvider>
  );
}

function App() {
  return (
    <CustomThemeProvider>
      <AuthProvider>
        <WebSocketProvider>
          <AppContent />
        </WebSocketProvider>
      </AuthProvider>
    </CustomThemeProvider>
  );
}

export default App;
