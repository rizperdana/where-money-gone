import { useEffect, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import CaptureScreen from './capture/CaptureScreen';
import ReviewScreen from './capture/ReviewScreen';
import BootScreen from './ui/BootScreen';
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
            <Route path="/" element={<Navigate to="/receipts" replace />} />
            <Route path="/capture" element={<CaptureScreen />} />
            <Route path="/review/:id" element={<ReviewScreen />} />
            <Route path="/receipts" element={<ListScreen />} />
            <Route path="/receipts/:id" element={<DetailScreen />} />
            <Route path="/settings" element={<SettingsScreen />} />
            <Route path="*" element={<Navigate to="/receipts" replace />} />
          </Routes>
        )}
      </div>
    </BrowserRouter>
  );
}
