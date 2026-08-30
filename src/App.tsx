import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import ListScreen from './ui/ListScreen';
import DetailScreen from './ui/DetailScreen';
import CaptureScreen from './capture/CaptureScreen';
import ReviewScreen from './capture/ReviewScreen';

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-900 text-slate-100">
        <Routes>
          <Route path="/" element={<Navigate to="/receipts" replace />} />
          <Route path="/capture" element={<CaptureScreen />} />
          <Route path="/review/:id" element={<ReviewScreen />} />
          <Route path="/receipts" element={<ListScreen />} />
          <Route path="/receipts/:id" element={<DetailScreen />} />
          <Route path="*" element={<Navigate to="/receipts" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
