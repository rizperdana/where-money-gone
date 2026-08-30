import { useEffect, useState } from 'react';
import { attachListener, nextToastId } from './toast-bus';

interface Toast {
  id: number;
  message: string;
}

export default function TerminalToastHost() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    return attachListener((message: string) => {
      const id = nextToastId();
      setToasts((prev) => [...prev, { id, message }]);
      window.setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 3000);
    });
  }, []);

  return (
    <div className="pointer-events-none fixed inset-x-0 top-2 z-50 flex flex-col items-center gap-1">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="wmg-panel pointer-events-auto max-w-md text-sm wmg-cursor"
          role="status"
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}
