import { useEffect, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import CaptureScreen from './capture/CaptureScreen';
import ReviewScreen from './capture/ReviewScreen';
import AppShell from './ui/AppShell';
import BootScreen from './ui/BootScreen';
import DashboardScreen from './ui/DashboardScreen';
import DetailScreen from './ui/DetailScreen';
import ListScreen from './ui/ListScreen';
import SettingsScreen from './ui/SettingsScreen';
import TerminalToastHost from './ui/TerminalToast';
import { applyTheme, DEFAULT_THEME } from './theme/themes';
import { getSettings, saveSettings } from './db';

export default function App() {
  const [booted, setBooted] = useState(true);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const settings = await getSettings();
      if (cancelled) return;
      applyTheme(settings.theme ?? DEFAULT_THEME);
      if (!settings.bootedAt) {
        await saveSettings({ bootedAt: Date.now() });
        if (cancelled) return;
        setBooted(false);
      }
      setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!ready) return null;

  return (
    <BrowserRouter>
      <div className="min-h-screen">
        <TerminalToastHost />
        {!booted ? (
          <BootScreen onDone={() => setBooted(true)} />
        ) : (
          <Routes>
            <Route element={<AppShell />}>
              <Route path="/dashboard" element={<DashboardScreen />} />
              <Route path="/capture" element={<CaptureScreen />} />
              <Route path="/review/:id" element={<ReviewScreen />} />
              <Route path="/settings" element={<SettingsScreen />} />
              <Route path="/receipts" element={<ListScreen />} />
              <Route path="/receipts/:id" element={<DetailScreen />} />
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Route>
          </Routes>
        )}
      </div>
    </BrowserRouter>
  );
}
